import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const ProfileScreen = () => {
  const navigate = useNavigate();
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [showPublishedModal, setShowPublishedModal] = useState(false);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [myPublishedTasks, setMyPublishedTasks] = useState<any[]>([]);
  const [user, setUser] = useState({
    name: '张伟',
    id: '21302010001',
    major: '计算机科学技术学院',
    year: '21届',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC_IEv6aRsK0zxLgHlRxhHnqWQ_kjVVQjNju4tgNbZkfeoHi-s-g9LJjaolyGA3gblPMF-yTA4osLYYzxXGOUjmggwmuOyM6Bik0dzOSDzzEJx9o-78MxlCnTfnh_itoChDZPo3ZmBMbziJ1Evy6k2ZNdSS67i8YzKro5wOx47qKxwKMiX2L5K_p4ZSvHl6dc_X-LicTZJDPNOWJBzLp3G_aCSIsYGcgWHzuw4tI_4tR4acmWcuSVggBB4r03IVYbELxHEO3z-AcxyF'
  });

  // Load User Info
  useEffect(() => {
    const loadUser = () => {
      const storedUser = localStorage.getItem('current_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    };
    loadUser();
    window.addEventListener('storage', loadUser);
    return () => window.removeEventListener('storage', loadUser);
  }, []);

  // Map task row to modal format (id, title, price, description, type, timeAgo, publisher, ...)
  const mapRowToTask = (row: any): any => {
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
      price: row.price_display || row.price || '',
      priceLabel: row.price_label || '酬劳',
      description: row.description || '',
      publisher: { id: p.student_id || p.id, name: p.name || '已实名学生', avatar: p.avatar_url || '', major: p.major || '' },
      mapConfig: { startLabel: row.start_label || '', endLabel: row.end_label || '' },
      quickReplies: Array.isArray(row.quick_replies) ? row.quick_replies : [],
      timeAgo,
    };
  };

  // Load accepted tasks: from Supabase by current user (acceptor_id), fallback localStorage
  useEffect(() => {
    if (!showTasksModal) return;
    const storedUser = localStorage.getItem('current_user');
    const currentUser = storedUser ? JSON.parse(storedUser) : null;
    if (!currentUser?.id) {
      setMyTasks((JSON.parse(localStorage.getItem('my_accepted_tasks') || '[]') as any[]).reverse());
      return;
    }
    (async () => {
      const { data: profile } = await supabase.from('profiles').select('id').eq('student_id', currentUser.id).maybeSingle();
      if (profile?.id) {
        const { data: rows } = await supabase
          .from('task_acceptances')
          .select('task_id')
          .eq('acceptor_id', profile.id);
        if (rows?.length) {
          const taskIds = rows.map((r: { task_id: string }) => r.task_id);
          const { data: tasks } = await supabase
            .from('tasks')
            .select('*, publisher:profiles!publisher_id(id, student_id, name, major, avatar_url)')
            .in('id', taskIds)
            .order('created_at', { ascending: false });
          if (tasks?.length) {
            setMyTasks(tasks.map(mapRowToTask));
            return;
          }
        }
        setMyTasks([]);
        return;
      }
      setMyTasks((JSON.parse(localStorage.getItem('my_accepted_tasks') || '[]') as any[]).reverse());
    })();
  }, [showTasksModal, user.id]);

  // Load published tasks: from Supabase by current user (publisher_id), fallback localStorage
  useEffect(() => {
    if (!showPublishedModal) return;
    const storedUser = localStorage.getItem('current_user');
    const currentUser = storedUser ? JSON.parse(storedUser) : null;
    const revokedIds = JSON.parse(localStorage.getItem('revoked_tasks') || '[]');
    if (!currentUser?.id) {
      const saved = JSON.parse(localStorage.getItem('my_published_tasks') || '[]');
      setMyPublishedTasks(saved.filter((t: any) => !revokedIds.includes(t.id)).reverse());
      return;
    }
    (async () => {
      const { data: profile } = await supabase.from('profiles').select('id').eq('student_id', currentUser.id).maybeSingle();
      if (profile?.id) {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('*, publisher:profiles!publisher_id(id, student_id, name, major, avatar_url)')
          .eq('publisher_id', profile.id)
          .order('created_at', { ascending: false });
        if (tasks?.length) {
          const active = tasks.filter((t: any) => !revokedIds.includes(t.id));
          setMyPublishedTasks(active.map(mapRowToTask));
          return;
        }
        setMyPublishedTasks([]);
        return;
      }
      const saved = JSON.parse(localStorage.getItem('my_published_tasks') || '[]');
      setMyPublishedTasks(saved.filter((t: any) => !revokedIds.includes(t.id)).reverse());
    })();
  }, [showPublishedModal, user.id]);

  const handleRevokeTask = (taskId: string) => {
    if (window.confirm("确定要撤销此任务吗？撤销后任务将从广场移除。")) {
        const revoked = JSON.parse(localStorage.getItem('revoked_tasks') || '[]');
        localStorage.setItem('revoked_tasks', JSON.stringify([...revoked, taskId]));
        setMyPublishedTasks(prev => prev.filter(t => t.id !== taskId));
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white antialiased selection:bg-primary selection:text-white min-h-screen pb-24">
      <div className="relative min-h-screen w-full flex flex-col pb-24 overflow-x-hidden">
        <div className="relative bg-primary w-full pb-8 pt-4 rounded-b-xl shadow-lg">
          <div className="flex items-center justify-between px-6 mb-6">
            <h2 className="text-white text-xl font-bold tracking-tight">我的</h2>
            <button onClick={() => navigate('/card')} className="flex items-center justify-center h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 transition text-white backdrop-blur-sm">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>badge</span>
            </button>
          </div>
          <div className="flex flex-col items-center px-4 gap-4">
            <div className="relative group cursor-pointer" onClick={() => navigate('/card')}>
              <div className="h-28 w-28 rounded-full border-4 border-white/20 bg-center bg-cover shadow-xl" style={{ backgroundImage: `url('${user.avatar}')` }}></div>
              <div className="absolute bottom-0 right-0 h-8 w-8 bg-green-400 rounded-full border-4 border-primary flex items-center justify-center">
                <span className="block h-2.5 w-2.5 bg-white rounded-full"></span>
              </div>
            </div>
            <div className="flex flex-col items-center text-center gap-1">
              <h1 className="text-white text-2xl font-bold leading-tight">{user.name}</h1>
              <p className="text-blue-100 text-sm font-medium">{user.major} {user.year}</p>
              <div className="mt-2 flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                <span className="material-symbols-outlined text-green-300 filled" style={{ fontSize: '16px' }}>verified</span>
                <span className="text-white text-xs font-bold tracking-wide">已实名学生</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 px-4 flex flex-col gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-sm border border-slate-100 dark:border-gray-700">
            {/* My Accepted Tasks */}
            <button 
              onClick={() => setShowTasksModal(true)}
              className="w-full flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <span className="material-symbols-outlined">assignment</span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-slate-900 dark:text-white font-semibold text-sm">我接受的任务</p>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-lg">chevron_right</span>
            </button>

            {/* My Published Tasks */}
            <button 
              onClick={() => setShowPublishedModal(true)}
              className="w-full flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              <div className="h-10 w-10 rounded-full bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <span className="material-symbols-outlined">campaign</span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-slate-900 dark:text-white font-semibold text-sm">我发布的任务</p>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-lg">chevron_right</span>
            </button>

          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-sm border border-slate-100 dark:border-gray-700">
             <button 
                onClick={() => {
                   localStorage.removeItem('current_user');
                   navigate('/');
                }}
                className="w-full flex items-center gap-4 p-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors text-red-600"
             >
                <div className="h-10 w-10 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center">
                  <span className="material-symbols-outlined">logout</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-sm">退出登录</p>
                </div>
             </button>
          </div>
        </div>
        <div className="h-8"></div>
      </div>

      {/* My Accepted Tasks Modal */}
      {showTasksModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowTasksModal(false)}></div>
          <div className="absolute bottom-0 left-0 right-0 h-[70vh] bg-white dark:bg-slate-900 rounded-t-[2rem] shadow-2xl flex flex-col animate-float-up">
            <div className="w-full flex justify-center pt-3 pb-1" onClick={() => setShowTasksModal(false)}>
                <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700"></div>
            </div>
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
               <h2 className="text-xl font-bold text-slate-900 dark:text-white">我接受的任务</h2>
               <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">{myTasks.length} 进行中</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-10">
              {myTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <span className="material-symbols-outlined text-4xl mb-2">inbox</span>
                  <p className="text-sm">暂无进行中的任务</p>
                </div>
              ) : (
                myTasks.map((task: any, index: number) => (
                  <div key={index} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex gap-3">
                     <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm shrink-0">
                       <span className="material-symbols-outlined text-primary text-xl">
                         {task.type === 'study' ? 'menu_book' : task.type === 'tutor' ? 'school' : 'lunch_dining'}
                       </span>
                     </div>
                     <div className="flex-1 min-w-0">
                       <div className="flex justify-between items-start mb-1">
                         <h3 className="font-bold text-slate-900 dark:text-white truncate">{task.title}</h3>
                         <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{task.price}</span>
                       </div>
                       <p className="text-xs text-slate-500 dark:text-slate-400 truncate mb-2">{task.description}</p>
                       <div className="flex items-center gap-2">
                         <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded text-[10px] text-green-700 dark:text-green-400 font-bold">
                           <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                           进行中
                         </div>
                         <button 
                            onClick={() => {
                              setShowTasksModal(false);
                              navigate('/chat', { state: { taskId: task.id, accepted: true, task } });
                            }}
                            className="ml-auto text-xs text-slate-500 hover:text-primary font-medium"
                          >
                           查看详情 &gt;
                         </button>
                       </div>
                     </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* My Published Tasks Modal */}
      {showPublishedModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPublishedModal(false)}></div>
          <div className="absolute bottom-0 left-0 right-0 h-[70vh] bg-white dark:bg-slate-900 rounded-t-[2rem] shadow-2xl flex flex-col animate-float-up">
            <div className="w-full flex justify-center pt-3 pb-1" onClick={() => setShowPublishedModal(false)}>
                <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700"></div>
            </div>
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
               <h2 className="text-xl font-bold text-slate-900 dark:text-white">我发布的任务</h2>
               <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">{myPublishedTasks.length} 个</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-10">
              {myPublishedTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <span className="material-symbols-outlined text-4xl mb-2">campaign</span>
                  <p className="text-sm">暂无发布的任务</p>
                </div>
              ) : (
                myPublishedTasks.map((task: any, index: number) => (
                  <div key={index} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex gap-3">
                     <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm shrink-0">
                       <span className="material-symbols-outlined text-orange-500 text-xl">
                         {task.type === 'study' ? 'menu_book' : task.type === 'tutor' ? 'school' : 'lunch_dining'}
                       </span>
                     </div>
                     <div className="flex-1 min-w-0">
                       <div className="flex justify-between items-start mb-1">
                         <h3 className="font-bold text-slate-900 dark:text-white truncate">{task.title}</h3>
                         <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{task.price}</span>
                       </div>
                       <p className="text-xs text-slate-500 dark:text-slate-400 truncate mb-2">{task.description}</p>
                       <div className="flex items-center justify-between mt-2">
                         <span className="text-[10px] text-slate-400">{task.timeAgo}</span>
                         <button 
                            onClick={() => handleRevokeTask(task.id)}
                            className="px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full hover:bg-red-100 transition-colors"
                          >
                           撤销任务
                         </button>
                       </div>
                     </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileScreen;