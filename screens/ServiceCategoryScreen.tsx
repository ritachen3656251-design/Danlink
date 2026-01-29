import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ServiceCategoryScreen = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('张同学');

  useEffect(() => {
    const storedUser = localStorage.getItem('current_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      // Extract last name or just use full name with "同学"
      setUserName(`${user.name.charAt(0)}同学`);
    }
  }, []);

  return (
    <div className="font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-50 overflow-x-hidden min-h-screen">
      <div className="relative flex min-h-screen w-full flex-col mx-auto bg-[#f8f9fc] dark:bg-background-dark shadow-2xl overflow-hidden">
        <header className="pt-12 px-6 pb-2 bg-white dark:bg-background-dark sticky top-0 z-10">
          <div className="flex flex-col gap-1">
            <h1 className="text-slate-900 dark:text-white text-3xl font-extrabold leading-tight tracking-tight">你好，{userName}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium leading-normal">今天需要什么帮助？</p>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto no-scrollbar px-6 py-6 pb-24">
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div onClick={() => navigate('/publish')} className="group relative flex flex-col justify-between h-48 p-4 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden">
              <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-orange-50 dark:bg-orange-900/20 rounded-full blur-2xl z-0"></div>
              <div className="z-10">
                <h3 className="text-slate-900 dark:text-white text-lg font-bold">代取外卖</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">盒饭、奶茶等</p>
              </div>
              <div className="w-full h-24 mt-2 bg-contain bg-center bg-no-repeat z-10 transform group-hover:scale-105 transition-transform duration-300" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCyYYdcjOiM8PWFPb4StW6r5OCD-g1ew_09hfx8shQlSQ_2rJaU5SPR3GG0qNmF9XLO6ycHeDNtrqWAnbMLeWrkvHHNzQ0k8fqNVhwUxHqyqnPcPwTZgundnxjJndtUAnH3gzklwxxgE3ISjxaBA7bosGqD8tbz0sv930a6zOf_qsA7Z0G2PcCBrXIVxrYoPZUzkYfjm7-Osv1SLRwnU9TzdxXn_YmvIbmibF8uaVzAELgcDJdc_N_m2mHA_ko0W2dGXInwhiod-eof')" }}></div>
            </div>
            
            <div onClick={() => navigate('/publish')} className="group relative flex flex-col justify-between h-48 p-4 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden">
              <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-blue-50 dark:bg-blue-900/20 rounded-full blur-2xl z-0"></div>
              <div className="z-10">
                <h3 className="text-slate-900 dark:text-white text-lg font-bold">快递重物</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">快递代取、大件搬运</p>
              </div>
              <div className="w-full h-24 mt-2 bg-contain bg-center bg-no-repeat z-10 transform group-hover:scale-105 transition-transform duration-300" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCwIlrFitwVH-evcQjgGF-FlwU8hcqXDPpPcQA4pHtvSvT5R3NXSobyLI61XsQ4Plh-s78LK4yrgbIxw64lGDjCrL3c1g1OGCg8GSesqdbN10oxB_5DkOOmbd5NfgPPppaayD_08aR8wu30EwC1rOjThr_VT1n94J0DYRJ6S8vgUJosOHwnHOwBy5fPTi9nwIwctuvx9SnYaWLC2m3_Ig3NgnIPQ7nRV-C4KgRfLkxylFvVi0wbzu0RtuvwmDpJTQOYN2oI8anOTbce')" }}></div>
            </div>
            
            <div onClick={() => navigate('/publish')} className="group relative flex flex-col justify-between h-48 p-4 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden">
              <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-purple-50 dark:bg-purple-900/20 rounded-full blur-2xl z-0"></div>
              <div className="z-10">
                <h3 className="text-slate-900 dark:text-white text-lg font-bold">学习互助</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">图书馆、资料分享</p>
              </div>
              <div className="w-full h-24 mt-2 bg-contain bg-center bg-no-repeat z-10 transform group-hover:scale-105 transition-transform duration-300" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAYC3_GQBvNU3tkHcQaz5VVZ8KGnJvmHGgcHQN_rCX2723L_1JGQouPNYTKFbQicMGOGMyAO5F6es6B9pNHPCK79wYqYDbbbYqpFRwyC-U8qCQ2c_xqehHaB8_JMyaCpXCFU9NR2GNI36Cv99gRi0cpy7fjksbSZlC0dq_Lm0mH5uXOEjWIQiav0rol1fY9BEohItH4N59GOodEP0DCEKK2nV1YjLexlOqvh4CEdWE99nj6dkFSGxauaj5ioJJdHCOQaivTNkydurYL')" }}></div>
            </div>
            
            <div onClick={() => navigate('/publish')} className="group relative flex flex-col justify-between h-48 p-4 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden">
              <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-teal-50 dark:bg-teal-900/20 rounded-full blur-2xl z-0"></div>
              <div className="z-10">
                <h3 className="text-slate-900 dark:text-white text-lg font-bold">校内跑腿</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">代排队、取急件</p>
              </div>
              <div className="w-full h-24 mt-2 bg-contain bg-center bg-no-repeat z-10 transform group-hover:scale-105 transition-transform duration-300" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDVSjdgjdiTKXonOkcYJaF1V63VP7V3tYWMqDE5MdtEMZmYKRsNcBhsk7YdBzcRYwQRgqrq8NSE5CeGU_QlOuzm5u659vzb-bIHtkTqTeW2tgJDFau613s_obNsIQQWyK4MJq59dSlktZqio98XYuaFE6Z_b7sNAUmJrMH40ib5-S62U1AITihJMIbB1P-X0vwsEZXeGOcyMN4y9sCZrH8edtLzwtGx-uVXZymypV9jVgL79y1XkqYV_BXk3S2BBE3MNE9u0GsjvF1d')" }}></div>
            </div>
          </div>
          
          <div onClick={() => navigate('/publish')} className="relative w-full rounded-full p-[1px] bg-gradient-to-r from-red-500/50 via-red-400/30 to-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.25)]">
            <div className="relative flex items-center justify-between gap-4 rounded-full bg-white dark:bg-slate-800 p-4 pl-6 cursor-pointer hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-colors">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500 text-[20px] font-bold">medical_services</span>
                  <p className="text-slate-900 dark:text-white text-base font-bold leading-tight">紧急求助</p>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium pl-[28px]">送药、紧急情况</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mr-2">
                <span className="material-symbols-outlined text-[24px]">arrow_forward_ios</span>
              </div>
            </div>
          </div>
        </main>
        
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 mx-auto max-w-md h-[80px]">
          <button 
            onClick={() => navigate('/publish')} 
            className="absolute left-1/2 -translate-x-1/2 -top-8 h-14 w-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 hover:scale-105 transition-transform flex items-center justify-center z-50 ring-4 ring-background-light dark:ring-background-dark"
          >
             <span className="material-symbols-outlined text-[32px]">add</span>
          </button>
          
          <div className="grid grid-cols-3 h-full pt-3 pb-8">
            <div className="flex justify-center items-start">
              <button onClick={() => navigate('/home')} className="flex flex-col items-center gap-1 w-full group">
                <span className="material-symbols-outlined text-primary group-hover:text-primary transition-colors filled text-[26px]">grid_view</span>
                <span className="text-[10px] font-medium text-primary">广场</span>
              </button>
            </div>
            <div className="flex justify-center items-start">
              <button onClick={() => navigate('/messages')} className="flex flex-col items-center gap-1 w-full group">
                <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors text-[26px]">chat_bubble</span>
                <span className="text-[10px] font-medium text-slate-400 group-hover:text-primary transition-colors">消息</span>
              </button>
            </div>
            <div className="flex justify-center items-start">
              <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-1 w-full group">
                <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors text-[26px]">person</span>
                <span className="text-[10px] font-medium text-slate-400 group-hover:text-primary transition-colors">我的</span>
              </button>
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default ServiceCategoryScreen;