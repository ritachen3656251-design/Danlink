import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MessageListScreen = () => {
  const navigate = useNavigate();

  // Clear unread indicator on mount
  useEffect(() => {
    localStorage.removeItem('has_unread');
    window.dispatchEvent(new Event('update-unread'));
  }, []);

  // Replicating task data to ensure consistency with HomeScreen
  const tasks = {
    delivery: {
      type: 'delivery',
      title: '代取外卖',
      price: '¥15',
      description: '东门送到北苑4号楼 · 25分钟内',
      publisher: {
        name: '已实名学生', 
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAKWAmfDt9PS1X0KbAVTbZFTBLxirLSSnZ2lpQI2jGHF0F9o0_9OFxXBv3EjGj0vByBIrzWdlM968z2CSZwHo9kZ_A2lONczTgnaw7h2XptZ5DKL8In-6HEMw7HBIHXYGN-27ARuhqrQ7FfefGzv5KdlV1J6BgkZOP39displrArJZaiawyEi1at7dOF513bK0cPhRUNsxqlxPTdt2MNq_0pTLDL1pmIoBG7iTYVYXq8KsnajElS30chbtZomvC8cGr4uZd3lF-XXnJ',
        major: '新闻学院',
        rating: '4.7'
      },
      preview: "不重，就是一份沙拉。", 
      time: "10:22",
      unread: 1,
      quickReplies: ['📦 东西重吗？', '🕒 我10分钟能到']
    },
    study: {
      type: 'study',
      title: '出几何课本',
      price: '¥25',
      description: '出《解析几何》第三版，九成新',
      publisher: {
        name: '已实名学生', 
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB54GvMDPsrWbbi2ezwREMvuQP7Pt48buovFmWVR9AWwwx7-piJ_QqAVX4VX1Dk9tvFKg4igsEuDcM9aFH2x9dPL6470npe3PR6K-mRGXeKg4Js9zxo-1jGc2OKswMSLk_VK8HmCiQOl7nsoWXOWPuFdaiqzlL86KuiDN8Zww7kWSZmyPVfSaYHKZKzSGeTfepYTQmIwY8zPwC5khJx5OJxxYs8O6xsCoD0omVfAqO2SVM3qo5QHP4H8ATtIIdngB8xfxHfG46Pw8IS',
        major: '数学科学学院',
        rating: '5.0'
      },
      preview: "在的，你要的话¥25拿走。", 
      time: "昨天",
      unread: 0,
      quickReplies: ['📚 书还在吗？', '💰 能便宜点吗？']
    },
    tutor: {
      type: 'tutor',
      title: 'Python辅导',
      price: '¥50',
      description: '求辅导数据结构作业',
      publisher: {
        name: '已实名学生',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCfjrHkRrV1cjXpdtQydjp-Ov6OmJztpLXDG-GcvLmsAtbV8KB_gshgyTWBCkCXX71Q4UOumGROFYSWmbsc_QaEnw2PgjiIGBXCanswgt5fPNxT2ll0PHYIAxxSKwQSLJrCobhRw7Ukjv_Kqrq5NJrjQFVHI0fGZK6RK52ZZvNiqctjOMvjsnrSgP1oWmBWMplpBlAAUMI9-qs3jsKP4CV16JvRyncvu3MmRQjc8U-S5U0_r9WA1YoggMe5YElH1Rn4a3yIVSi7MJ9z',
        major: '软件工程',
        rating: '4.8'
      },
      preview: "太好了！你在哪？", 
      time: "周二",
      unread: 0,
      quickReplies: ['💻 线上还是线下？', '🕒 今晚有空']
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-body antialiased selection:bg-primary/20 min-h-screen pb-24">
      <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">消息</h1>
        <div className="flex items-center gap-4">
          <button className="flex items-center justify-center p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300">
            <span className="material-symbols-outlined">search</span>
          </button>
          <button className="flex items-center justify-center p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300">
            <span className="material-symbols-outlined">add_comment</span>
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto no-scrollbar px-4 pt-2">
        <div className="flex flex-col space-y-1">
          {/* Chat 1 - Delivery */}
          <div 
            onClick={() => navigate('/chat', { state: { accepted: false, task: tasks.delivery } })}
            className="group relative flex items-center gap-4 rounded-2xl p-3 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <div className="relative shrink-0">
              <div className="h-14 w-14 rounded-full bg-slate-200 bg-cover bg-center shadow-inner" style={{ backgroundImage: `url('${tasks.delivery.publisher.avatar}')` }}></div>
              <span className="absolute bottom-0.5 right-0.5 block h-3.5 w-3.5 rounded-full ring-2 ring-background-light dark:ring-background-dark bg-green-500"></span>
            </div>
            <div className="flex flex-1 flex-col justify-center min-w-0">
              <div className="flex justify-between items-baseline mb-0.5">
                <h3 className="truncate text-base font-bold text-slate-900 dark:text-white">
                  {tasks.delivery.publisher.name} 
                  <span className="ml-1 text-xs font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-md align-middle">[{tasks.delivery.title}]</span>
                </h3>
                <span className="shrink-0 text-xs font-medium text-slate-400">{tasks.delivery.time}</span>
              </div>
              <p className="truncate font-body text-sm text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                {tasks.delivery.preview}
              </p>
            </div>
          </div>

          {/* Chat 2 - Study */}
          <div 
            onClick={() => navigate('/chat', { state: { accepted: false, task: tasks.study } })}
            className="group relative flex items-center gap-4 rounded-2xl p-3 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <div className="relative shrink-0">
              <div className="h-14 w-14 rounded-full bg-slate-200 bg-cover bg-center shadow-inner" style={{ backgroundImage: `url('${tasks.study.publisher.avatar}')` }}></div>
              <span className="absolute bottom-0.5 right-0.5 block h-3.5 w-3.5 rounded-full ring-2 ring-background-light dark:ring-background-dark bg-green-500"></span>
            </div>
            <div className="flex flex-1 flex-col justify-center min-w-0">
              <div className="flex justify-between items-baseline mb-0.5">
                <h3 className="truncate text-base font-bold text-slate-900 dark:text-white">
                  {tasks.study.publisher.name}
                  <span className="ml-1 text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-md align-middle">[{tasks.study.title}]</span>
                </h3>
                <span className="shrink-0 text-xs font-medium text-slate-400">{tasks.study.time}</span>
              </div>
              <p className="truncate font-body text-sm text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                 {tasks.study.preview}
              </p>
            </div>
          </div>

          {/* Chat 3 - Tutor */}
          <div 
             onClick={() => navigate('/chat', { state: { accepted: false, task: tasks.tutor } })}
             className="group relative flex items-center gap-4 rounded-2xl p-3 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <div className="relative shrink-0">
              <div className="h-14 w-14 rounded-full bg-slate-200 bg-cover bg-center shadow-inner" style={{ backgroundImage: `url('${tasks.tutor.publisher.avatar}')` }}></div>
            </div>
            <div className="flex flex-1 flex-col justify-center min-w-0">
              <div className="flex justify-between items-baseline mb-0.5">
                <h3 className="truncate text-base font-bold text-slate-900 dark:text-white">
                  {tasks.tutor.publisher.name} 
                  <span className="ml-1 text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-md align-middle">[{tasks.tutor.title}]</span>
                </h3>
                <span className="shrink-0 text-xs font-medium text-slate-400">{tasks.tutor.time}</span>
              </div>
              <p className="truncate font-body text-sm text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                 {tasks.tutor.preview}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MessageListScreen;