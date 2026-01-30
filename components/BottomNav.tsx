import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const current = location.pathname;
  const { hasUnread: hasUnreadFromContext, totalUnreadCount } = useNotification();
  const [hasUnreadLocal, setHasUnreadLocal] = useState(() => localStorage.getItem('has_unread') === 'true');

  useEffect(() => {
    const check = () => setHasUnreadLocal(localStorage.getItem('has_unread') === 'true');
    check();
    window.addEventListener('storage', check);
    window.addEventListener('update-unread', check);
    const interval = setInterval(check, 2000);
    return () => {
      window.removeEventListener('storage', check);
      window.removeEventListener('update-unread', check);
      clearInterval(interval);
    };
  }, []);

  const hasUnread = totalUnreadCount > 0 || hasUnreadFromContext || hasUnreadLocal;

  const getIconClass = (path: string) => {
    return current === path 
      ? "text-primary group-hover:text-primary" 
      : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300";
  };

  return (
    <nav className="h-[80px] bg-white dark:bg-surface-dark border-t border-slate-100 dark:border-slate-800 shrink-0 z-40 relative">
      {/* Floating Action Button positioned above the navbar */}
      <button 
        onClick={() => navigate('/publish')}
        className="absolute left-1/2 -translate-x-1/2 -top-8 h-14 w-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-transform flex items-center justify-center z-50 ring-4 ring-background-light dark:ring-background-dark"
      >
        <span className="material-symbols-outlined text-[32px]">add</span>
      </button>

      <div className="grid grid-cols-3 h-full pt-3 pb-8">
        <div className="flex justify-center items-start">
          <button 
            onClick={() => navigate('/home')}
            className="flex flex-col items-center gap-1 w-full group"
          >
            <span className={`material-symbols-outlined text-[26px] transition-colors ${getIconClass('/home')}`}>grid_view</span>
            <span className={`text-[10px] font-medium transition-colors ${getIconClass('/home')}`}>广场</span>
          </button>
        </div>

        <div className="flex justify-center items-start">
          <button 
            onClick={() => navigate('/messages')}
            className="flex flex-col items-center gap-1 w-full group relative"
          >
            <div className="relative inline-flex">
              <span className={`material-symbols-outlined text-[26px] transition-colors ${getIconClass('/messages')}`}>chat_bubble</span>
              {hasUnread && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-surface-dark animate-pulse z-10" aria-label="有未读消息" />
              )}
            </div>
            <span className={`text-[10px] font-medium transition-colors ${getIconClass('/messages')}`}>消息</span>
          </button>
        </div>

        <div className="flex justify-center items-start">
          <button 
            onClick={() => navigate('/profile')}
            className="flex flex-col items-center gap-1 w-full group"
          >
            <span className={`material-symbols-outlined text-[26px] transition-colors ${getIconClass('/profile')}`}>person</span>
            <span className={`text-[10px] font-medium transition-colors ${getIconClass('/profile')}`}>我的</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;