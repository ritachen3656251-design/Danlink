import React from 'react';
import { useNavigate } from 'react-router-dom';

const OrderTrackingScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-background-light dark:bg-background-dark font-display overflow-hidden h-screen flex flex-col">
      <main className="flex-1 relative flex flex-col h-full w-full overflow-hidden">
        <div className="absolute top-0 left-0 w-full z-20 pt-2 px-4 pb-2">
          <div className="flex items-center justify-between mt-2">
            <button onClick={() => navigate('/home')} className="bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md text-slate-800 dark:text-white flex size-10 items-center justify-center rounded-full shadow-sm hover:bg-white transition-colors">
              <span className="material-symbols-outlined text-xl">arrow_back_ios_new</span>
            </button>
            <div className="bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md px-6 py-2 rounded-full shadow-sm">
              <h2 className="text-slate-900 dark:text-white text-base font-bold tracking-tight">订单追踪</h2>
            </div>
            <div className="size-10"></div> 
          </div>
        </div>
        
        {/* Map Area */}
        <div className="relative w-full h-[55%] bg-slate-200 dark:bg-slate-800 shrink-0">
          <div className="absolute inset-0 w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA-7Bslz6o6dkNzh9ASB5HI-SKnfVTUwh6TzyjseUXVQtNDqGo5puu2DhGU7XWy30sIyi-XKwvtyualpOb44xrIXAHyCpPenoq8IeUAempmd9WnxSHya7AktoaQsqZXxTXHiZGVNS_YQ5QbOdGk2oNVboAYroRE6o628rJ-sBgoxPc7IJY3gpFzYUDRAbi_s5I5YBURglItilYekezesJuh_fBOCYzdNAwHZT1cKnniEEPQJYH1Rou8h4l1guJGCxXZeDW71K6-gZUT')" }}></div>
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/5 pointer-events-none"></div>
          
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ filter: "drop-shadow(0px 2px 2px rgba(0,0,0,0.1))" }}>
            <path d="M 120 150 Q 200 250 280 350" fill="none" stroke="#1152d4" strokeDasharray="8 4" strokeLinecap="round" strokeWidth="4"></path>
            <circle cx="280" cy="350" fill="#1152d4" r="8"></circle>
            <circle cx="280" cy="350" fill="#1152d4" fillOpacity="0.2" r="16"></circle>
          </svg>
          
          {/* Helper Marker */}
          <div className="absolute top-[28%] left-[35%] transform -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
            <div className="mb-2 bg-surface-light dark:bg-surface-dark px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 animate-bounce">
              <span className="text-primary text-xs font-bold whitespace-nowrap">距离 200米</span>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-surface-light dark:bg-surface-dark rotate-45"></div>
            </div>
            <div className="relative">
              <div className="block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full border-2 border-[#1152d4] animate-[pulse-ring_2s_cubic-bezier(0.215,0.61,0.355,1)_infinite]"></div>
              <div className="relative w-12 h-12 rounded-full border-4 border-white dark:border-slate-800 overflow-hidden shadow-md bg-white">
                <img alt="Portrait of helper Li" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB5CRjpipLhLaAMQhev96yIXWSmU0spV4xuRMLxui2tQ6GV4wLrrf811_Wx8C2gfveNsksm3PDSzUiSeQ369Rq7UNEatsuNCqHsEPiO9SqIkiAL3CSl6U4O0SVQP8Zr4RygCO5V8XBWxdb9a4lsgUgr8VJdlpCqo_SAPkNsBA6jgxKDMp0P_60oixqBjYH7lvX7cfYo_dsXwtdLRe5E1Rc7j3dfoSjUZ9Amb56NWpLldNdZCkzQuUKzMa789RXFS4mycQyjEmv8GTQa" />
              </div>
            </div>
          </div>
          
          <div className="absolute top-[18%] left-[20%] bg-surface-light/90 dark:bg-surface-dark/90 px-2 py-1 rounded text-[10px] font-semibold text-slate-600 dark:text-slate-300 shadow-sm border border-slate-100 dark:border-slate-700">
            物理学系
          </div>
          <div className="absolute top-[52%] left-[65%] bg-primary text-white px-2 py-1 rounded text-[10px] font-bold shadow-md z-10">
            东区18宿舍
          </div>
        </div>

        {/* Bottom Sheet Details */}
        <div className="absolute bottom-[80px] left-0 w-full h-[55%] flex flex-col justify-end z-30 pointer-events-none">
          <div className="w-full h-full bg-surface-light dark:bg-surface-dark rounded-t-[2.5rem] shadow-up px-6 pt-3 pb-6 flex flex-col pointer-events-auto overflow-y-auto no-scrollbar">
            <div className="w-full flex justify-center pb-4 pt-1">
              <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700"></div>
            </div>
            <div className="text-center mb-6">
              <div className="text-slate-400 dark:text-slate-500 text-sm font-medium mb-1">订单号 #3920</div>
              <h2 className="text-slate-900 dark:text-white text-2xl font-bold">预计 5 分钟后送达</h2>
            </div>
            
            {/* Steps */}
            <div className="relative flex justify-between items-center mb-8 px-2">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 dark:bg-slate-700 -z-10 transform -translate-y-1/2"></div>
              <div className="absolute top-1/2 left-0 w-3/4 h-0.5 bg-primary/20 -z-10 transform -translate-y-1/2"></div>
              
              <div className="flex flex-col items-center gap-1">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                </div>
                <span className="text-[10px] font-medium text-primary">已接单</span>
              </div>
              
              <div className="flex flex-col items-center gap-1">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                </div>
                <span className="text-[10px] font-medium text-primary">配送中</span>
              </div>
              
              <div className="flex flex-col items-center gap-1 relative">
                <div className="absolute w-6 h-6 rounded-full bg-primary/30 animate-ping"></div>
                <div className="w-6 h-6 rounded-full bg-white dark:bg-surface-dark border-[5px] border-primary z-10 box-border"></div>
                <span className="text-[10px] font-bold text-slate-900 dark:text-white">即将到达</span>
              </div>
              
              <div className="flex flex-col items-center gap-1">
                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600"></div>
                <span className="text-[10px] font-medium text-slate-400">已送达</span>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl mb-6 border border-slate-100 dark:border-slate-700/50">
              <img alt="Helper Li" className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-slate-600" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxa3AgvitCywNlgp_BrBG_378llVuINr9EcySsTAilqj79XYn2WNSKu20Y1Za-r6g3KqIznepIvzVyTo4UOSoNaZOtvr56u6On1xAx_bQuYij8UaQWVQhgVIEwgjrRs6nqAs8buBAionzaFOpFQO1pjlPq5v5A5Lt_WM7xEOjppoixRbq5gTZT5gSA-RJzx6EW8U7DpNQE70hQMlcfyL0ryltWlvHcLC1ac2wCtuLUXV3xcW_VGwiqYLXCkuKlIdF5S4afWrQRjWfN" />
              <div className="flex-1">
                <h3 className="text-slate-900 dark:text-white font-bold text-lg leading-tight">已实名学生</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-1">
                  物理学系 
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                  <span className="text-amber-500 flex items-center gap-0.5 font-semibold">4.9 <span className="material-symbols-outlined text-[10px] filled">star</span></span>
                </p>
              </div>
              <div className="flex gap-2">
                <button className="size-10 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors">
                  <span className="material-symbols-outlined text-xl">chat_bubble</span>
                </button>
                <button className="size-10 rounded-full bg-primary text-white flex items-center justify-center shadow-md shadow-primary/30 hover:bg-primary/90 transition-colors">
                  <span className="material-symbols-outlined text-xl">call</span>
                </button>
              </div>
            </div>
            
            <div className="mt-auto">
              <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-5 border border-primary/10 text-center">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">取货码</p>
                <div className="flex justify-center items-center gap-4">
                  <span className="text-4xl font-extrabold text-primary tracking-widest font-mono bg-white dark:bg-slate-800 px-6 py-3 rounded-xl shadow-sm border border-primary/10 w-full max-w-[240px]">8 4 9 2</span>
                </div>
                <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-3">请在对方送达后告知此码</p>
              </div>
            </div>
            <div className="h-4"></div>
          </div>
        </div>
      </main>
      
      <nav className="h-[80px] bg-white dark:bg-surface-dark border-t border-slate-100 dark:border-slate-800 shrink-0 z-40 relative">
        <button 
          onClick={() => navigate('/publish')} 
          className="absolute left-1/2 -translate-x-1/2 -top-8 h-14 w-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 hover:scale-105 transition-transform flex items-center justify-center z-50 ring-4 ring-background-light dark:ring-background-dark"
        >
           <span className="material-symbols-outlined text-[32px]">add</span>
        </button>

        <div className="grid grid-cols-3 h-full pt-3 pb-8">
            <div className="flex justify-center items-start">
              <button onClick={() => navigate('/home')} className="flex flex-col items-center gap-1 w-full group">
                <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors text-[26px]">grid_view</span>
                <span className="text-[10px] font-medium text-slate-400 group-hover:text-primary transition-colors">广场</span>
              </button>
            </div>
            <div className="flex justify-center items-start">
              <button onClick={() => navigate('/messages')} className="flex flex-col items-center gap-1 w-full group relative">
                <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors text-[26px]">chat_bubble</span>
                 <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-surface-dark"></div>
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
  );
};

export default OrderTrackingScreen;