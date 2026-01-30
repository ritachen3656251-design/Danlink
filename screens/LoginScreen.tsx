import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/** 注册页预设头像库（15–18 个），用户点击选择，不上传 */
const PRESET_AVATARS: string[] = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=5',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=6',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=7',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=8',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=9',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=10',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=11',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=12',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=13',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=14',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=15',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=16',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=17',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=18',
];

/** 常见学院选项（可扩展） */
const COLLEGE_OPTIONS = [
  '哲学学院', '法学院', '国际关系与公共事务学院', '中国语言文学系', '外国语言文学学院',
  '新闻学院', '历史学系', '经济学院', '管理学院', '数学科学学院', '物理学系', '化学系',
  '生命科学学院', '计算机科学技术学院', '信息科学与工程学院', '环境科学与工程系',
  '复旦学院', '其他',
];

/** 届数选项（近年） */
const GRADUATION_YEAR_OPTIONS = ['2020届', '2021届', '2022届', '2023届', '2024届', '2025届', '2026届'];

const LoginScreen = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'landing' | 'login' | 'register'>('landing');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // For registration
  const [college, setCollege] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>(PRESET_AVATARS[0]);
  const [loading, setLoading] = useState(false);

  // Initialize mock database in localStorage if not exists
  useEffect(() => {
    const existingDb = localStorage.getItem('user_db');
    if (!existingDb) {
      const MOCK_USERS: Record<string, any> = {
        '21302010001': {
          name: '张伟',
          id: '21302010001',
          password: '1',
          major: '计算机科学技术学院',
          year: '21届',
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC_IEv6aRsK0zxLgHlRxhHnqWQ_kjVVQjNju4tgNbZkfeoHi-s-g9LJjaolyGA3gblPMF-yTA4osLYYzxXGOUjmggwmuOyM6Bik0dzOSDzzEJx9o-78MxlCnTfnh_itoChDZPo3ZmBMbziJ1Evy6k2ZNdSS67i8YzKro5wOx47qKxwKMiX2L5K_p4ZSvHl6dc_X-LicTZJDPNOWJBzLp3G_aCSIsYGcgWHzuw4tI_4tR4acmWcuSVggBB4r03IVYbELxHEO3z-AcxyF'
        },
        '21302010002': {
          name: '李华',
          id: '21302010002',
          password: '1',
          major: '物理学系',
          year: '21届',
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB5CRjpipLhLaAMQhev96yIXWSmU0spV4xuRMLxui2tQ6GV4wLrrf811_Wx8C2gfveNsksm3PDSzUiSeQ369Rq7UNEatsuNCqHsEPiO9SqIkiAL3CSl6U4O0SVQP8Zr4RygCO5V8XBWxdb9a4lsgUgr8VJdlpCqo_SAPkNsBA6jgxKDMp0P_60oixqBjYH7lvX7cfYo_dsXwtdLRe5E1Rc7j3dfoSjUZ9Amb56NWpLldNdZCkzQuUKzMa789RXFS4mycQyjEmv8GTQa'
        },
        '22301010003': {
          name: '林悦',
          id: '22301010003',
          password: '1',
          major: '新闻学院',
          year: '22届',
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAKWAmfDt9PS1X0KbAVTbZFTBLxirLSSnZ2lpQI2jGHF0F9o0_9OFxXBv3EjGj0vByBIrzWdlM968z2CSZwHo9kZ_A2lONczTgnaw7h2XptZ5DKL8In-6HEMw7HBIHXYGN-27ARuhqrQ7FfefGzv5KdlV1J6BgkZOP39displrArJZaiawyEi1at7dOF513bK0cPhRUNsxqlxPTdt2MNq_0pTLDL1pmIoBG7iTYVYXq8KsnajElS30chbtZomvC8cGr4uZd3lF-XXnJ'
        }
      };
      localStorage.setItem('user_db', JSON.stringify(MOCK_USERS));
    }
  }, []);

  // 仅用 profiles 表登录，不使用 Supabase Auth
  const handleLogin = async () => {
    if (!studentId || !password) {
      alert("请输入学号和密码");
      return;
    }

    setLoading(true);

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();

      if (error) throw error;

      if (profile) {
        const user = {
          id: profile.student_id,
          profileId: profile.id,
          name: profile.name,
          major: profile.major,
          year: profile.year,
          college: profile.college ?? '',
          graduation_year: profile.graduation_year ?? '',
          avatar: profile.avatar_url || ''
        };
        localStorage.setItem('current_user', JSON.stringify(user));
        window.dispatchEvent(new Event('current_user_changed'));
        localStorage.removeItem('my_accepted_tasks');
        localStorage.removeItem('my_published_tasks');
        setLoading(false);
        navigate('/card');
        return;
      }
    } catch (_) {}

    const db = JSON.parse(localStorage.getItem('user_db') || '{}');
    const user = db[studentId];
    if (user && user.password === password) {
      localStorage.setItem('current_user', JSON.stringify(user));
      window.dispatchEvent(new Event('current_user_changed'));
      localStorage.removeItem('my_accepted_tasks');
      localStorage.removeItem('my_published_tasks');
      setLoading(false);
      navigate('/card');
      return;
    }

    alert("学号或密码错误");
    setLoading(false);
  };

  // 注册：仅写入 profiles 表，不使用 Supabase Auth
  const handleRegister = async () => {
    if (!studentId || !password || !name) {
      alert("请填写完整信息");
      return;
    }
    if (!college || !graduationYear) {
      alert("请选择学院和届数");
      return;
    }

    setLoading(true);

    try {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('student_id', studentId)
        .maybeSingle();

      if (existing) {
        alert("该学号已注册，请直接登录");
        setLoading(false);
        setStep('login');
        return;
      }

      const { data: newProfile, error } = await supabase
        .from('profiles')
        .insert({
          student_id: studentId,
          name,
          major: college,
          year: graduationYear,
          avatar_url: selectedAvatarUrl || PRESET_AVATARS[0],
          college,
          graduation_year: graduationYear,
        })
        .select()
        .single();

      if (error) {
        setLoading(false);
        alert('注册失败：' + (error.message || '请检查网络或联系管理员'));
        return;
      }

      if (newProfile) {
        const user = {
          id: newProfile.student_id,
          profileId: newProfile.id,
          name: newProfile.name,
          major: newProfile.major,
          year: newProfile.year,
          college: newProfile.college ?? '',
          graduation_year: newProfile.graduation_year ?? '',
          avatar: newProfile.avatar_url || ''
        };
        localStorage.setItem('current_user', JSON.stringify(user));
        window.dispatchEvent(new Event('current_user_changed'));
        localStorage.removeItem('my_accepted_tasks');
        localStorage.removeItem('my_published_tasks');
        setLoading(false);
        alert("注册成功！");
        navigate('/card');
        return;
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
      alert('注册失败，请重试或使用本地账号');
    }

    const db = JSON.parse(localStorage.getItem('user_db') || '{}');
    if (db[studentId]) {
      alert("该学号已注册，请直接登录");
      setLoading(false);
      setStep('login');
      return;
    }
    const newUser = {
      name, id: studentId, password, major: college || '复旦学院', year: graduationYear || '24届',
      college: college || '', graduation_year: graduationYear || '',
      avatar: selectedAvatarUrl || PRESET_AVATARS[0]
    };
    db[studentId] = newUser;
    localStorage.setItem('user_db', JSON.stringify(db));
    localStorage.setItem('current_user', JSON.stringify(newUser));
    window.dispatchEvent(new Event('current_user_changed'));
    setLoading(false);
    alert("注册成功！");
    navigate('/card');
  };

  const renderForm = () => {
    const isRegister = step === 'register';
    const title = isRegister ? "激活账号" : "身份认证";
    const btnText = isRegister ? "注册并登录" : "认证并登录";
    const action = isRegister ? handleRegister : handleLogin;

    return (
      <div className="flex-1 flex flex-col w-full max-w-sm mx-auto animate-fade-in-up">
        <button 
          onClick={() => setStep('landing')}
          className="self-start mb-6 text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm font-medium"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span> 返回
        </button>
        
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">{title}</h2>
        
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">学号 (Student ID)</label>
            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">badge</span>
                <input 
                  type="tel" 
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="请输入学号"
                  className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl pl-12 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 font-mono font-medium"
                />
            </div>
          </div>
          
          {isRegister && (
            <>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">姓名 (Name)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">person</span>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="请输入真实姓名"
                    className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl pl-12 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">学院 (College)</label>
                <select
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl pl-4 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 font-medium appearance-none cursor-pointer"
                >
                  <option value="">请选择学院</option>
                  {COLLEGE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">届数 (Graduation Year)</label>
                <select
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl pl-4 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 font-medium appearance-none cursor-pointer"
                >
                  <option value="">请选择届数</option>
                  {GRADUATION_YEAR_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">头像 (Avatar)</label>
                <div className="grid grid-cols-6 gap-2">
                  {PRESET_AVATARS.map((url) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setSelectedAvatarUrl(url)}
                      className={`aspect-square rounded-xl bg-slate-100 dark:bg-slate-700 overflow-hidden border-2 transition-all flex-shrink-0 ${
                        selectedAvatarUrl === url
                          ? 'border-primary ring-2 ring-primary/30'
                          : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = '/images/avatar-placeholder.svg'; }} />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">密码 (Password)</label>
            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">lock</span>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isRegister ? "设置登录密码" : "请输入UIS密码"}
                  className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl pl-12 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 font-medium"
                />
            </div>
          </div>
        </div>

        <button 
          onClick={action}
          disabled={loading}
          className={`w-full h-14 bg-primary text-white rounded-full font-bold text-lg shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-all ${loading ? 'opacity-80 cursor-wait' : 'hover:bg-primary-dark active:scale-[0.98]'}`}
        >
          {loading ? (
            <>
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
              处理中...
            </>
          ) : (
            btnText
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="font-display antialiased h-screen w-full flex flex-col bg-primary overflow-hidden selection:bg-white/20 selection:text-white">
      <header className={`relative ${step !== 'landing' ? 'h-[30%]' : 'h-[45%]'} shrink-0 w-full flex flex-col items-center justify-center text-white overflow-hidden transition-all duration-500`}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d3aa0] to-primary z-0" aria-hidden />
        <div className="relative z-10 flex flex-col items-center text-center gap-3 px-6 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <span className="material-symbols-outlined text-white text-[28px]">school</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>DanLink</h1>
          </div>
          <p className="text-lg font-medium text-blue-100/90 tracking-wide">连接复旦，共享生活</p>
        </div>
      </header>
      
      <main className={`relative flex-1 w-full bg-background-light dark:bg-background-dark rounded-t-xl shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col px-6 pt-12 pb-8 z-20 transition-all duration-500`}>
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700"></div>
        
        {step === 'landing' ? (
          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm mx-auto gap-6 animate-fade-in">
            <div className="w-full space-y-4">
              <button 
                onClick={() => setStep('login')}
                className="group relative w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary-dark active:scale-[0.98] transition-all duration-200 text-white rounded-full h-14 px-6 shadow-lg shadow-primary/30"
              >
                <span className="absolute left-6 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">badge</span>
                </span>
                <span className="text-base font-bold tracking-wide">UIS 统一身份认证登录</span>
                <span className="absolute right-6 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-200">
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </span>
              </button>

              <button 
                onClick={() => {
                  setStep('register');
                  setCollege('');
                  setGraduationYear('');
                  setSelectedAvatarUrl(PRESET_AVATARS[0]);
                }}
                className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-2 border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-[0.98] transition-all duration-200 rounded-full h-14 px-6 font-bold"
              >
                <span className="material-symbols-outlined text-[22px]">person_add</span>
                新生注册 / 激活账号
              </button>
            </div>
            
            {/* Removed Alumni and Guest links as requested */}
          </div>
        ) : (
          renderForm()
        )}

        <footer className="mt-auto flex flex-col items-center justify-center gap-3 text-center w-full pb-4 pt-4">
          <div className="text-yellow-500/80 dark:text-yellow-400/80 transform -rotate-12 hover:rotate-12 transition-transform duration-500">
            <span className="material-symbols-outlined text-[28px] filled">spa</span>
          </div>
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
            © 2024 旦Link 校园社区
          </p>
        </footer>
      </main>
    </div>
  );
};

export default LoginScreen;
