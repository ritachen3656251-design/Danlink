import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// Define task types for type safety and clarity
interface TaskData {
  id: string;
  type: 'delivery' | 'study' | 'tutor';
  title: string;
  price: string;
  priceLabel: string;
  locationTag: string;
  categoryTag: string;
  distance: string;
  timeAgo: string;
  description: string;
  publisher: {
    id?: string;
    name: string;
    avatar: string;
    major: string;
    rating: string;
  };
  mapConfig: {
    bgImage: string;
    startLabel: string;
    endLabel: string;
  };
  quickReplies: string[];
}

const SlideButton = ({ onAccept, price }: { onAccept: () => void, price: string }) => {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonWidth = 48; // Width of the circle button

  const handleStart = () => setIsDragging(true);

  const handleEnd = () => {
    setIsDragging(false);
    if (containerRef.current) {
      const threshold = containerRef.current.clientWidth - buttonWidth - 20;
      if (dragX > threshold) {
        onAccept();
      }
    }
    setDragX(0);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    
    let newX = clientX - rect.left - buttonWidth / 2;
    const maxDrag = rect.width - buttonWidth - 8; // 4px padding on each side
    
    if (newX < 0) newX = 0;
    if (newX > maxDrag) newX = maxDrag;
    
    setDragX(newX);
  };

  return (
    <div 
        ref={containerRef}
        className="relative h-14 bg-primary flex-1 rounded-full overflow-hidden shadow-lg shadow-primary/30 select-none touch-none"
        onMouseMove={handleMove}
        onTouchMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchEnd={handleEnd}
    >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-white font-bold tracking-wide pl-8 opacity-90 flex items-center gap-2">
                滑动接单 <span className="font-mono bg-white/20 px-1.5 py-0.5 rounded text-xs">{price}</span>
            </span>
            <div className="absolute right-4 flex opacity-50">
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                <span className="material-symbols-outlined text-[16px] -ml-2">chevron_right</span>
            </div>
        </div>
        <div 
            className="absolute top-1 left-1 h-12 w-12 bg-white rounded-full shadow-md flex items-center justify-center text-primary z-10 cursor-grab active:cursor-grabbing"
            style={{ transform: `translateX(${dragX}px)`, transition: isDragging ? 'none' : 'transform 0.3s ease-out' }}
            onMouseDown={handleStart}
            onTouchStart={handleStart}
        >
            <span className="material-symbols-outlined">arrow_forward</span>
        </div>
    </div>
  );
};

const HomeScreen = () => {
  const navigate = useNavigate();
  const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [taskList, setTaskList] = useState<TaskData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [refreshKey, setRefreshKey] = useState(0);

  const categories = ['全部', '外卖', '二手', '辅导', '跑腿'];

  // Default tasks
  const defaultTasks: TaskData[] = [
    {
      id: 'task_delivery_01',
      type: 'delivery',
      title: '代取外卖',
      price: '¥15',
      priceLabel: '酬劳',
      locationTag: '邯郸',
      categoryTag: '#外卖',
      distance: '2.5km',
      timeAgo: '20分钟前',
      description: '因为要去图书馆赶论文，实在来不及去东门拿外卖了。帮忙拿一下送到北苑4号楼楼下即可，外卖是一份沙拉，不重。',
      publisher: {
        name: '已实名学生',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmUMJQsXcWH-VdjV36g17sma1WnRp3I6AFCMb5t9E_b7GLrfMpuxn-BUQyKmtxYj5DXRbkpEu8-UWLi9qgXjOCxGzZrEyg8KUk8Svqk3fdv65pddZ6TDYBV1TIKqC4bKVSp9JSmNpR7f9Ze5mRlu0NBfImD-97eaW_vbIRxugWH-uzJNx3kSWGj0AR3LwCcGUceD1MjU_7xlwbo4wvzmcAM6zVMmSdbQZPQhz84mpqGR-q0cEdAXUJmQdm4FpCO6VAr0tP0XnVnNjB',
        major: '物理学系',
        rating: '4.9'
      },
      mapConfig: {
        bgImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDqsh_wWu3PQgYgqjkGXXQjFlmAoZtzXYlCRcCThodc3JTaxNr_fUyuju5kKQ_sJ8QuN8bAN1OAnrsDSwJi86GhqrWwA_BuBdP4tiA7inEVitXcCvqhiZmw1uf5ojdRcF_bcwDjoFrTBy_92bXmGitGxzmcfrvxfDTQpDL0Buf7D3t0-zxTcxSf1kawsrPX-UFFXqYJPxG8oFDos5HYdMA9yeimVo_t-D-bc638mj32bJ1lVkXzVoC4E6CrAsVpt_0oOKk01LtFLWit')",
        startLabel: '东门取货点',
        endLabel: '北苑4号楼'
      },
      quickReplies: ['📦 东西重吗？', '🕒 我10分钟能到', '📍 具体位置在哪？']
    },
    {
      id: 'task_study_01',
      type: 'study',
      title: '闲置交易', // Updated to match "二手" category title in Publish
      price: '¥25',
      priceLabel: '售价',
      locationTag: '北区',
      categoryTag: '#二手',
      distance: '校内',
      timeAgo: '2小时前',
      description: '考完试了，出《解析几何》第三版。九成新，只有少量铅笔笔记，不影响阅读。期末复习必备！北区或者三教面交。',
      publisher: {
        name: '已实名学生',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB54GvMDPsrWbbi2ezwREMvuQP7Pt48buovFmWVR9AWwwx7-piJ_QqAVX4VX1Dk9tvFKg4igsEuDcM9aFH2x9dPL6470npe3PR6K-mRGXeKg4Js9zxo-1jGc2OKswMSLk_VK8HmCiQOl7nsoWXOWPuFdaiqzlL86KuiDN8Zww7kWSZmyPVfSaYHKZKzSGeTfepYTQmIwY8zPwC5khJx5OJxxYs8O6xsCoD0omVfAqO2SVM3qo5QHP4H8ATtIIdngB8xfxHfG46Pw8IS',
        major: '数学科学学院',
        rating: '5.0'
      },
      mapConfig: {
        bgImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAnZ1z1ZUWE9Oez4W7Zbrc6b-vmXMQ7AQin0XWQ8jKS5eEoF36P_7KZPlLpGdq9MU15ykyr98HlnVBmgwQIp2jN7Pu_h5eKifi_p6YKFCEZ_YOO1hA1ZYSqalXtQwUC3v_sXM-eWqcnyS-TCDXY10e4Fi3oIaah9a-KLgSTdVYIxRTu95jscuMnyyBlw-1Oqf7ef9mBLxaNX7ekKlGjuTYhubi3stieHtYEAQQ-WYscD9dRJldOafkEAen1kXeIGOroKoiCmXAhJiuV')",
        startLabel: '北区宿舍',
        endLabel: '三教'
      },
      quickReplies: ['📚 书还在吗？', '💰 能便宜点吗？', '📍 哪里自提？']
    },
    {
      id: 'task_tutor_01',
      type: 'tutor',
      title: '课业辅导', // Updated to match "辅导" category title
      price: '¥50',
      priceLabel: '时薪',
      locationTag: '张江',
      categoryTag: '#辅导',
      distance: '校内',
      timeAgo: '刚刚',
      description: '大一新生求助！数据结构的大作业卡住了，关于二叉树遍历的部分报错修不好。希望有学长学姐能当面指导一下，大概1小时。地点在食堂或咖啡厅都行。',
      publisher: {
        name: '已实名学生',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbdz1z5LLpMwX7IJ-RooOZtqtkFpYjmPyxPUDemFHjCuhS_9EhRjGpOu3sds9MVOF5kwvU7-kxkWdhg4z6lebak0ChiFq_g9HWmfft2nJH9yLD483hTiGiMpN9xJ4rxwj5bfKIPzRWzW6cxLqJzLt6nktoE0xgMVguiHqu3D1uujS0m6IcO5Tn0wDDmNl5b1xsnk9hs8pskIvqFQzK6Boh6QAIhz4nIy7skQe24ib1jIG9HPLh-plkSGK6N3A7XIIVIPRh-L0EoIpN',
        major: '软件工程',
        rating: '4.8'
      },
      mapConfig: {
        bgImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDqsh_wWu3PQgYgqjkGXXQjFlmAoZtzXYlCRcCThodc3JTaxNr_fUyuju5kKQ_sJ8QuN8bAN1OAnrsDSwJi86GhqrWwA_BuBdP4tiA7inEVitXcCvqhiZmw1uf5ojdRcF_bcwDjoFrTBy_92bXmGitGxzmcfrvxfDTQpDL0Buf7D3t0-zxTcxSf1kawsrPX-UFFXqYJPxG8oFDos5HYdMA9yeimVo_t-D-bc638mj32bJ1lVkXzVoC4E6CrAsVpt_0oOKk01LtFLWit')",
        startLabel: '张江食堂',
        endLabel: '咖啡厅'
      },
      quickReplies: ['💻 线上还是线下？', '🐍 具体哪个报错？', '🕒 今晚有空']
    }
  ];

  // Map Supabase row (with publisher join) to TaskData
  const mapRowToTaskData = (row: any): TaskData => {
    const p = row.publisher || row.profiles || {};
    const created = row.created_at ? new Date(row.created_at).getTime() : Date.now();
    const diff = Date.now() - created;
    let timeAgo = '刚刚';
    if (diff > 24 * 3600 * 1000) timeAgo = `${Math.floor(diff / (24 * 3600 * 1000))}天前`;
    else if (diff > 3600 * 1000) timeAgo = `${Math.floor(diff / (3600 * 1000))}小时前`;
    else if (diff > 60 * 1000) timeAgo = `${Math.floor(diff / (60 * 1000))}分钟前`;
    return {
      id: String(row.id),
      type: row.type || 'delivery',
      title: row.title || '',
      price: row.price_display || '',
      priceLabel: row.price_label || '酬劳',
      locationTag: row.location_tag || '',
      categoryTag: row.category_tag || '',
      distance: row.distance || '校内',
      timeAgo,
      description: row.description || '',
      publisher: {
        id: p.student_id || p.id,
        name: p.name || '已实名学生',
        avatar: p.avatar_url || '',
        major: p.major || '',
        rating: String(p.rating ?? '5.0')
      },
      mapConfig: {
        bgImage: row.map_bg_image_url ? `url('${row.map_bg_image_url}')` : '',
        startLabel: row.start_label || '',
        endLabel: row.end_label || ''
      },
      quickReplies: Array.isArray(row.quick_replies) ? row.quick_replies : (row.quick_replies ? JSON.parse(row.quick_replies) : [])
    };
  };

  // Refetch when returning from publish (or other triggers)
  useEffect(() => {
    const onRefresh = () => setRefreshKey((k) => k + 1);
    window.addEventListener('home-refresh-tasks', onRefresh);
    return () => window.removeEventListener('home-refresh-tasks', onRefresh);
  }, []);

  // Load tasks: Supabase first (status=active), exclude already-accepted tasks so 广场 only shows 未接单
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const completedTasks = JSON.parse(localStorage.getItem('completed_tasks') || '[]');
      const revokedTasks = JSON.parse(localStorage.getItem('revoked_tasks') || '[]');

      try {
        const [tasksRes, acceptancesRes] = await Promise.all([
          supabase
            .from('tasks')
            .select('*, publisher:profiles!publisher_id(id, student_id, name, major, avatar_url, rating)')
            .eq('status', 'active')
            .order('created_at', { ascending: false }),
          supabase.from('task_acceptances').select('task_id'),
        ]);

        const rows = tasksRes.data;
        const error = tasksRes.error;
        const acceptedTaskIds = new Set(
          (acceptancesRes.data || []).map((r: { task_id: string }) => r.task_id)
        );

        if (!cancelled && !error && rows && rows.length > 0) {
          const fromDb = rows.map(mapRowToTaskData);
          const openTasks = fromDb.filter((t) => !acceptedTaskIds.has(t.id));
          const activeTasks = openTasks.filter(
            (t) => !completedTasks.includes(t.id) && !revokedTasks.includes(t.id)
          );
          const filtered = activeTasks.filter((task) => {
            if (selectedCategory === '全部') return true;
            return task.categoryTag.includes(selectedCategory) || task.title.includes(selectedCategory);
          });
          setTaskList(filtered);
          return;
        }
      } catch (_) {}

      if (cancelled) return;
      const storedTasks = JSON.parse(localStorage.getItem('fudan_tasks') || '[]');
      const allTasks = [...storedTasks, ...defaultTasks];
      const activeTasks = allTasks.filter(
        (task) => !completedTasks.includes(task.id) && !revokedTasks.includes(task.id)
      );
      const filteredTasks = activeTasks.filter((task) => {
        if (selectedCategory === '全部') return true;
        return task.categoryTag.includes(selectedCategory) || task.title.includes(selectedCategory);
      });
      setTaskList(filteredTasks);
    };

    load();
    return () => { cancelled = true; };
  }, [selectedCategory, refreshKey]);

  // Bottom Sheet Logic
  const openTask = (taskData: TaskData) => {
    setSelectedTask(taskData);
    setTimeout(() => setIsAnimating(true), 10);
  };

  const closeTask = () => {
    setIsAnimating(false);
    setTimeout(() => setSelectedTask(null), 300);
  };

  const handleAcceptTask = async (task: TaskData) => {
    const currentAccepted = JSON.parse(localStorage.getItem('my_accepted_tasks') || '[]');
    const storedUser = localStorage.getItem('current_user');
    const user = storedUser ? JSON.parse(storedUser) : null;
    const taskIdUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(task.id));

    if (user?.id && taskIdUuid) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('student_id', user.id)
          .maybeSingle();
        if (profile?.id) {
          const { error } = await supabase.from('task_acceptances').insert({
            task_id: task.id,
            acceptor_id: profile.id,
            status: 'active',
          });
          if (!error) {
            if (!currentAccepted.some((t: any) => t.id === task.id)) {
              localStorage.setItem('my_accepted_tasks', JSON.stringify([...currentAccepted, task]));
            }
            navigate('/chat', { state: { accepted: true, task: task } });
            return;
          }
        }
      } catch (_) {}
    }
    if (!currentAccepted.some((t: any) => t.id === task.id)) {
      localStorage.setItem('my_accepted_tasks', JSON.stringify([...currentAccepted, task]));
    }
    navigate('/chat', { state: { accepted: true, task: task } });
  };

  const getCardStyle = (type: string) => {
    switch(type) {
        case 'study': return {
            priceBg: 'bg-amber-50 border-amber-100',
            priceText: 'text-amber-600',
            priceLabel: 'text-amber-600/80',
            tagBg: 'bg-amber-50 text-amber-600 border-amber-100',
            btnBg: 'bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white',
            btnIcon: 'chat_bubble'
        };
        case 'tutor': return {
            priceBg: 'bg-secondary/10 border-secondary/20',
            priceText: 'text-secondary',
            priceLabel: 'text-secondary/80',
            tagBg: 'bg-purple-50 text-purple-600 border-purple-100',
            btnBg: 'bg-primary text-white shadow-lg shadow-primary/30',
            btnIcon: 'bolt'
        };
        default: return {
            priceBg: 'bg-secondary/10 border-secondary/20',
            priceText: 'text-secondary',
            priceLabel: 'text-secondary/80',
            tagBg: 'bg-red-50 text-red-600 border-red-100',
            btnBg: 'bg-primary text-white shadow-lg shadow-primary/30',
            btnIcon: 'bolt'
        };
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display antialiased min-h-screen flex flex-col relative overflow-x-hidden">
      <header className="bg-primary pt-12 pb-4 px-4 rounded-b-[2rem] shadow-soft z-10 sticky top-0 transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-lg">school</span>
            </div>
            <h1 className="text-white text-xl font-bold tracking-tight">校园广场</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative text-white/90 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full border border-primary"></span>
            </button>
          </div>
        </div>
        
        {/* Search Bar Removed as per request */}

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {categories.map(cat => (
                <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                        selectedCategory === cat 
                        ? 'bg-white text-primary shadow-sm' 
                        : 'bg-white/20 text-white/80 hover:bg-white/30'
                    }`}
                >
                    {cat}
                </button>
            ))}
        </div>
      </header>
      
      <main className="flex-1 px-4 py-4 pb-24 overflow-y-auto">
        <div className="flex items-center justify-between mt-2 mb-3">
          <h2 className="text-slate-800 dark:text-slate-100 font-bold text-lg">
             {selectedCategory === '全部' ? '最新发布' : `${selectedCategory}任务`}
          </h2>
          {selectedCategory !== '全部' && (
              <button 
                onClick={() => setSelectedCategory('全部')}
                className="text-primary text-sm font-semibold"
              >
                  查看全部
              </button>
          )}
        </div>
        
        <div className="flex flex-col gap-4">
          {taskList.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
                <p>暂无此类任务</p>
             </div>
          ) : (
            taskList.map((task) => {
                const style = getCardStyle(task.type);
                return (
                    <div key={task.id} onClick={() => openTask(task)} className="group bg-surface-light dark:bg-surface-dark rounded-xl p-4 shadow-card hover:shadow-soft transition-all duration-300 relative border border-slate-100 dark:border-slate-800 cursor-pointer">
                        <div className="flex items-center gap-4">
                        <div className={`shrink-0 flex flex-col items-center justify-center size-14 rounded-2xl ${style.priceBg}`}>
                            <span className={`font-mono font-bold text-xl ${style.priceText}`}>{task.price}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-wide ${style.priceLabel}`}>{task.priceLabel}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-slate-800 dark:text-white truncate">{task.title}</h3>
                            <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-blue-100">{task.locationTag}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${style.tagBg}`}>{task.categoryTag}</span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs mb-2 truncate">{task.description}</p>
                            <div className="flex items-center gap-2">
                            <div className="size-5 rounded-full bg-slate-200 overflow-hidden">
                                <img alt="User avatar" className="w-full h-full object-cover" src={task.publisher.avatar} />
                            </div>
                            {/* Anonymized Name in Square */}
                            <span className="text-xs text-slate-400 font-medium">已实名学生</span>
                            <span className="material-symbols-outlined text-[14px] text-primary">verified</span>
                            <span className="mx-1 text-slate-300">•</span>
                            <span className="text-xs text-slate-400 font-mono font-medium">{task.timeAgo}</span>
                            </div>
                        </div>
                        <div className="shrink-0">
                            <button className={`size-12 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 ${style.btnBg}`}>
                            <span className="material-symbols-outlined">{style.btnIcon}</span>
                            </button>
                        </div>
                        </div>
                    </div>
                );
            })
          )}
        </div>
        
        <div className="flex flex-col items-center justify-center py-8 text-center opacity-60">
          <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">check_circle</span>
          <p className="text-sm text-slate-400">就这么多啦！</p>
        </div>
      </main>

      {/* Task Details Bottom Sheet */}
      {selectedTask && (
        <div className="fixed inset-0 z-50">
           {/* Overlay */}
           <div 
             className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`} 
             onClick={closeTask}
           ></div>
           
           {/* Sheet */}
           <div 
             className={`absolute bottom-0 left-0 right-0 h-[85vh] bg-white dark:bg-slate-900 rounded-t-[2rem] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${isAnimating ? 'translate-y-0' : 'translate-y-full'}`}
           >
              {/* Drag Handle */}
              <div className="w-full flex justify-center pt-3 pb-1" onClick={closeTask}>
                 <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700"></div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 pt-2 pb-28">
                 {/* Route Visualization (Replaced Map) */}
                 <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 mb-6">
                    <div className="flex flex-col gap-6 relative">
                        {/* Connecting Line */}
                        <div className="absolute left-[15px] top-8 bottom-8 w-0.5 bg-slate-200 dark:bg-slate-600 border-l border-dashed border-slate-300"></div>

                        {/* Start Point */}
                        <div className="flex items-start gap-4 relative z-10">
                           <div className="w-8 h-8 rounded-full bg-green-500 border-4 border-white dark:border-slate-800 shadow-sm shrink-0 flex items-center justify-center">
                              <span className="w-2.5 h-2.5 bg-white rounded-full"></span>
                           </div>
                           <div className="flex-1">
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-0.5">起点 / 取货 / 所在位置</p>
                              <p className="text-slate-900 dark:text-white font-bold text-lg leading-tight">{selectedTask.mapConfig.startLabel}</p>
                           </div>
                        </div>

                        {/* End Point */}
                        <div className="flex items-start gap-4 relative z-10">
                           <div className="w-8 h-8 rounded-full bg-primary border-4 border-white dark:border-slate-800 shadow-sm shrink-0 flex items-center justify-center">
                              <span className="material-symbols-outlined text-white text-[14px]">flag</span>
                           </div>
                           <div className="flex-1">
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-0.5">终点 / 送达 / 目标位置</p>
                              <p className="text-slate-900 dark:text-white font-bold text-lg leading-tight">{selectedTask.mapConfig.endLabel}</p>
                           </div>
                        </div>
                    </div>
                 </div>

                 {/* Title & Info */}
                 <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{selectedTask.title}</h1>
                      <div className="flex items-center gap-2">
                        {/* Removed Distance Tag, kept time */}
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs rounded-md">{selectedTask.timeAgo}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className="text-2xl font-mono font-bold text-primary">{selectedTask.price}</span>
                       <span className="text-[10px] text-slate-400 font-bold uppercase">{selectedTask.priceLabel}</span>
                    </div>
                 </div>

                 <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">
                    {selectedTask.description}
                 </p>

                 {/* Publisher Info (Semi-Anonymous) */}
                 <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 flex items-center gap-3 border border-slate-100 dark:border-slate-700 mb-6">
                    <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden">
                       <img src={selectedTask.publisher.avatar} className="w-full h-full object-cover grayscale opacity-80" alt="Anon" />
                    </div>
                    <div className="flex-1">
                       {/* Anonymized Name in Detail Modal */}
                       <h3 className="font-bold text-slate-900 dark:text-white text-sm">已实名学生</h3>
                       <p className="text-xs text-slate-500 flex items-center gap-1">
                          已实名 · {selectedTask.publisher.major} 
                          <span className="w-0.5 h-3 bg-slate-300"></span> 
                          <span className="text-amber-500 font-bold flex items-center">{selectedTask.publisher.rating} <span className="material-symbols-outlined text-[10px] filled">star</span></span>
                       </p>
                    </div>
                    <span className="material-symbols-outlined text-slate-300 text-xl">shield</span>
                 </div>
              </div>

              {/* Action Bar */}
              <div className="absolute bottom-0 left-0 right-0 p-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 z-20">
                 {/* Chat Inquiry Button */}
                 <button 
                   onClick={() => navigate('/chat', { state: { accepted: false, task: selectedTask } })}
                   className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-700 px-2"
                 >
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                       <span className="material-symbols-outlined text-xl">chat</span>
                    </div>
                    <span className="text-[10px] font-bold">先问问</span>
                 </button>

                 {/* Slide to Accept Button */}
                 <SlideButton onAccept={() => handleAcceptTask(selectedTask)} price={selectedTask.price} />
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default HomeScreen;