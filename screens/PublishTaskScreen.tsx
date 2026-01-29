import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const PublishTaskScreen = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  
  // Form State
  const [category, setCategory] = useState('外卖');
  const [campus, setCampus] = useState('邯郸');
  const [startLoc, setStartLoc] = useState('');
  const [endLoc, setEndLoc] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(6);

  useEffect(() => {
    const storedUser = localStorage.getItem('current_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Categories definition - Ensuring consistency with Home Filters
  const categories = [
    { id: '外卖', title: '代取外卖', icon: 'lunch_dining', type: 'delivery', color: 'text-red-500 bg-red-50 border-red-200' },
    { id: '二手', title: '闲置交易', icon: 'menu_book', type: 'study', color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { id: '辅导', title: '课业辅导', icon: 'school', type: 'tutor', color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { id: '跑腿', title: '校内跑腿', icon: 'directions_run', type: 'delivery', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  ];

  const campuses = ['邯郸', '江湾', '枫林', '张江'];

  const handlePublish = async () => {
    if (!description || !startLoc || !endLoc) {
      alert("请填写完整信息");
      return;
    }

    const selectedCat = categories.find(c => c.id === category) || categories[0];
    const now = new Date();
    const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    const priceLabel = category === '二手' ? '售价' : category === '辅导' ? '时薪' : '酬劳';

    const newTaskLocal = {
      id: `task_${Date.now()}`,
      type: selectedCat.type,
      title: selectedCat.title,
      price: `¥${price}`,
      priceLabel,
      locationTag: campus,
      categoryTag: `#${category}`,
      distance: '校内',
      timeAgo: `今天 ${timeString}`,
      timestamp: now.getTime(),
      description,
      publisher: {
        name: user ? user.name : '我',
        id: user ? user.id : 'me',
        avatar: user ? user.avatar : '',
        major: user ? user.major : '复旦学生',
        rating: '5.0'
      },
      mapConfig: { startLabel: startLoc, endLabel: endLoc },
      quickReplies: ['📍 具体在哪？', '🕒 什么时候方便？', '💰 价格可议吗？']
    };

    const studentId = user?.id != null ? String(user.id) : '';
    if (studentId) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('student_id', studentId)
          .maybeSingle();

        if (profileError) {
          console.error('Publish profile lookup:', profileError);
          alert('获取用户信息失败：' + (profileError.message || '请重试'));
          return;
        }
        if (!profile?.id) {
          alert('未找到对应用户档案，请使用已注册学号登录后再发布。');
          return;
        }

        const { data: inserted, error } = await supabase
          .from('tasks')
          .insert({
            publisher_id: profile.id,
            type: selectedCat.type,
            title: selectedCat.title,
            price_display: `¥${price}`,
            price_label: priceLabel,
            location_tag: campus,
            category_tag: `#${category}`,
            distance: '校内',
            description,
            start_label: startLoc,
            end_label: endLoc,
            quick_replies: ['📍 具体在哪？', '🕒 什么时候方便？', '💰 价格可议吗？'],
            status: 'active'
          })
          .select('id')
          .single();

        if (error) {
          console.error('Publish task insert:', error);
          alert('发布失败：' + (error.message || '请检查网络或稍后重试'));
          return;
        }
        if (inserted?.id) {
          const existingTasks = JSON.parse(localStorage.getItem('fudan_tasks') || '[]');
          localStorage.setItem('fudan_tasks', JSON.stringify([newTaskLocal, ...existingTasks]));
          const myPublished = JSON.parse(localStorage.getItem('my_published_tasks') || '[]');
          localStorage.setItem('my_published_tasks', JSON.stringify([newTaskLocal, ...myPublished]));
          window.dispatchEvent(new Event('home-refresh-tasks'));
          navigate('/home');
          return;
        }
      } catch (e) {
        console.error('Publish error:', e);
        alert('发布出错，请重试');
        return;
      }
    }

    const existingTasks = JSON.parse(localStorage.getItem('fudan_tasks') || '[]');
    localStorage.setItem('fudan_tasks', JSON.stringify([newTaskLocal, ...existingTasks]));
    const myPublished = JSON.parse(localStorage.getItem('my_published_tasks') || '[]');
    localStorage.setItem('my_published_tasks', JSON.stringify([newTaskLocal, ...myPublished]));
    navigate('/home');
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display antialiased overflow-hidden h-screen w-full relative flex flex-col">
      <div className="h-full w-full flex flex-col opacity-100 transition-opacity duration-300">
        <header className="pt-12 pb-4 px-6 flex justify-between items-center">
          <div onClick={() => navigate('/home')}>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">发布任务</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">填写详情以获取帮助</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
             {user && <img alt="Profile" className="h-full w-full object-cover" src={user.avatar} />}
          </div>
        </header>
        
        {/* Main Form Content */}
        <div className="flex-1 overflow-y-auto pb-32 pt-2 px-6 space-y-6 no-scrollbar">
            
            {/* 1. Category Selection */}
            <section>
                <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">任务类型</label>
                <div className="grid grid-cols-4 gap-3">
                    {categories.map((cat) => (
                        <button 
                            key={cat.id}
                            onClick={() => setCategory(cat.id)}
                            className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200 ${category === cat.id ? `${cat.color} ring-2 ring-offset-1 dark:ring-offset-gray-900` : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-gray-700 text-gray-500'}`}
                        >
                            <span className="material-symbols-outlined mb-1">{cat.icon}</span>
                            <span className="text-xs font-bold">{cat.title}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* 2. Campus Selection */}
            <section>
                <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">所属校区</label>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {campuses.map((c) => (
                        <button 
                            key={c}
                            onClick={() => setCampus(c)}
                            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${campus === c ? 'bg-primary text-white' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700'}`}
                        >
                            {c}校区
                        </button>
                    ))}
                </div>
            </section>

            {/* 3. Location Inputs */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="grid grid-cols-[24px_1fr] gap-x-3 gap-y-4">
                  {/* Start Point */}
                  <div className="flex flex-col items-center pt-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-green-500 ring-4 ring-green-100 dark:ring-green-900/30"></div>
                    <div className="w-0.5 bg-gray-200 dark:bg-gray-700 h-full my-1 rounded-full"></div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 block">起点 / 取货 / 当前位置</label>
                    <input 
                        type="text" 
                        value={startLoc}
                        onChange={(e) => setStartLoc(e.target.value)}
                        placeholder="例如：旦苑食堂"
                        className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-lg py-2 px-3 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* End Point */}
                  <div className="flex flex-col items-center pt-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-primary/20"></div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 block">终点 / 送达 / 目标位置</label>
                    <input 
                        type="text" 
                        value={endLoc}
                        onChange={(e) => setEndLoc(e.target.value)}
                        placeholder="例如：北苑4号楼"
                        className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-lg py-2 px-3 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
            </section>

            {/* 4. Description */}
            <section>
              <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">详细描述</label>
              <div className="relative">
                <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary/20 resize-none text-base" 
                    placeholder="请详细描述你的需求..." 
                    rows={3}
                ></textarea>
              </div>
            </section>

            {/* 5. Price */}
            <section> 
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-gray-900 dark:text-gray-100">{category === '二手' ? '价格' : '酬劳'}</label>
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-lg font-mono">¥{price}</span>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
                <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    value={price} 
                    onChange={(e) => setPrice(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between mt-2 text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                  <span>¥1</span>
                  <span>¥100</span>
                </div>
              </div>
            </section>
        </div>

        {/* Bottom Action Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 z-50">
            <button 
                onClick={handlePublish}
                className="w-full h-14 bg-primary hover:bg-blue-700 text-white rounded-full font-bold text-lg shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
                <span>确认发布</span>
                <span className="font-mono bg-white/20 px-2 rounded text-sm">¥{price}</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
            <div className="h-2"></div>
        </div>
      </div>
    </div>
  );
};

export default PublishTaskScreen;