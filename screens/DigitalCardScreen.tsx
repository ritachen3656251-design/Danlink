import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DigitalCardScreen = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    name: '张伟',
    id: '21302010001',
    major: '计算机科学技术学院',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC_IEv6aRsK0zxLgHlRxhHnqWQ_kjVVQjNju4tgNbZkfeoHi-s-g9LJjaolyGA3gblPMF-yTA4osLYYzxXGOUjmggwmuOyM6Bik0dzOSDzzEJx9o-78MxlCnTfnh_itoChDZPo3ZmBMbziJ1Evy6k2ZNdSS67i8YzKro5wOx47qKxwKMiX2L5K_p4ZSvHl6dc_X-LicTZJDPNOWJBzLp3G_aCSIsYGcgWHzuw4tI_4tR4acmWcuSVggBB4r03IVYbELxHEO3z-AcxyF'
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('current_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Format ID for display
  const displayId = user.id.length > 4 
    ? `${user.id.slice(0, 4)}••••${user.id.slice(-2)}`
    : user.id;

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-[#0d121b] dark:text-[#f8f9fc] antialiased overflow-hidden h-screen flex flex-col">
      <div className="relative flex h-full w-full flex-col group/design-root">
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center blur-xl scale-110 opacity-60 dark:opacity-40" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCvNrXEvIRRj2_zZq7RBWxK5pUI4iuzUFm1Ez_FF4_UIsklk5Wqt1786mQDpBfI4bAvq7wKFhgHUYAFAaIiiImikav4eqkvBDQb8E2ZOHnHbNg9nb9M6PBV0inrMYE1emElms46T1D7P73lefmAEnEl82ko1j5QS6Tirq4GQTFN1h6ia2S__U7T14SCPHisEYiC7q68IzWpfJIhqoKZvV6M7_FyZYvnxIBy2pCYOU85gcW7u2m9EsOUjMso9dSJKwVRDBl4viZmnUBo")' }}></div>
          <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/60 to-background-light dark:from-background-dark/80 dark:via-background-dark/60 dark:to-background-dark"></div>
        </div>
        
        <div className="relative z-10 flex flex-col h-full min-h-screen p-6">
          <div onClick={() => navigate('/home')} className="absolute top-6 left-6 p-2 rounded-full bg-white/50 dark:bg-black/20 cursor-pointer hover:bg-white/70 dark:hover:bg-black/30 transition-colors">
             <span className="material-symbols-outlined">close</span>
          </div>

          <div className="flex flex-col items-center pt-12 pb-8 animate-fade-in-down">
            <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full p-4 mb-4 shadow-sm">
              <span className="material-symbols-outlined text-4xl filled">check_circle</span>
            </div>
            <h1 className="text-[#0d121b] dark:text-white tracking-tight text-[28px] font-bold leading-tight text-center">认证成功</h1>
            <p className="text-slate-600 dark:text-slate-400 text-base font-medium leading-normal mt-2 text-center max-w-xs">
              欢迎回到复旦，<br/><span className="text-primary dark:text-blue-400">{user.name}同学！</span>
            </p>
          </div>
          
          <div className="flex-1 flex items-center justify-center py-4 perspective-1000">
            <div className="relative w-full max-w-[360px] aspect-[1.586/1] transition-transform duration-500 hover:scale-[1.02]">
              <div className="absolute inset-4 bg-primary rounded-[1.5rem] blur-2xl opacity-40 dark:opacity-50 translate-y-4"></div>
              <div className="relative h-full w-full rounded-[1.5rem] overflow-hidden bg-gradient-to-br from-[#1152d4] to-[#0a3588] shadow-card-float border border-white/10 flex flex-col justify-between p-6 group" style={{ backgroundImage: "url(https://lh3.googleusercontent.com/aida-public/AB6AXuCBOcbki-8EeOPlb5Zi0sXeJhdyoDYcV54I--sjq-mL3OzHMbfBA_klDM2vYcqPmJuIBqZgprDFyRb6Zf6wEG8pmPPCgH8Ll0ddjlU0df0C-3nB4aDV82BVhZ_8ek83fQVLjIig_R0fcHCAKL3caStEGQwOwLTGNVqHigjByhHEK5cU0zCBJs2Kwt4B_xKKcUXKX0XaokpICbJk12Ibu5LmFeVYkVU4_ET9nq7roM7pIPHV2sbUMZtzpyz5PnZcC8B9lrbrd5IbbH99)" }}>
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>
                <div className="absolute inset-0 opacity-30" style={{ background: 'linear-gradient(105deg, transparent 20%, rgba(255, 255, 255, 0.1) 25%, transparent 30%)', backgroundSize: '200% 100%', animation: 'shine 3s infinite linear' }}></div>
                
                <div className="relative flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-white/60 text-[10px] font-bold tracking-widest uppercase mb-1">复旦大学</span>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-white text-xl">school</span>
                      <span className="text-white text-lg font-bold tracking-tight">校园电子卡</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-200/40 to-blue-200/40 border border-white/30 backdrop-blur-sm flex items-center justify-center">
                    <span className="material-symbols-outlined text-white/90 text-sm">verified_user</span>
                  </div>
                </div>
                
                <div className="relative flex items-center gap-4 mt-2">
                  <div className="relative group-hover:scale-105 transition-transform duration-300">
                    <div className="w-[72px] h-[72px] rounded-full p-[2px] bg-white/20">
                      <img alt="Student Portrait" className="w-full h-full rounded-full object-cover border-2 border-white bg-slate-200" src={user.avatar} />
                    </div>
                  </div>
                  <div className="flex flex-col text-white">
                    <h2 className="text-2xl font-bold leading-tight">{user.name}</h2>
                    <p className="text-blue-100/90 text-sm font-medium">{user.major}</p>
                  </div>
                </div>
                
                <div className="relative mt-auto pt-4 flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-blue-200/70 text-[10px] uppercase tracking-wider font-semibold">学号</span>
                    <span className="text-white font-mono text-lg tracking-wider font-medium shadow-black/10 drop-shadow-md">{displayId}</span>
                  </div>
                  <div className="h-6 w-16 bg-white/90 rounded-sm opacity-80 mix-blend-overlay"></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="w-full pt-8 pb-6 safe-area-pb">
            <button onClick={() => navigate('/home')} className="relative w-full h-14 bg-primary hover:bg-blue-700 active:scale-[0.98] transition-all duration-200 rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center overflow-hidden group">
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></span>
              <span className="text-white text-lg font-bold tracking-wide flex items-center gap-2">
                进入校园
                <span className="material-symbols-outlined text-xl transition-transform group-hover:translate-x-1">arrow_forward</span>
              </span>
            </button>
            <p className="text-center text-xs text-slate-400 mt-4 dark:text-slate-600">
              复旦社区提供安全认证技术支持
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalCardScreen;