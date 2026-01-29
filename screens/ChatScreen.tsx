import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const ChatScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Fallback task data
  const defaultTask = {
     id: 'temp_id',
     type: 'delivery',
     title: '代取外卖',
     price: '¥15',
     description: '东门送到北苑4号楼 · 25分钟内',
     publisher: {
        id: 'other',
        name: '已实名学生',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmUMJQsXcWH-VdjV36g17sma1WnRp3I6AFCMb5t9E_b7GLrfMpuxn-BUQyKmtxYj5DXRbkpEu8-UWLi9qgXjOCxGzZrEyg8KUk8Svqk3fdv65pddZ6TDYBV1TIKqC4bKVSp9JSmNpR7f9Ze5mRlu0NBfImD-97eaW_vbIRxugWH-uzJNx3kSWGj0AR3LwCcGUceD1MjU_7xlwbo4wvzmcAM6zVMmSdbQZPQhz84mpqGR-q0cEdAXUJmQdm4FpCO6VAr0tP0XnVnNjB',
        major: '物理学系',
        rating: '4.9'
     },
     quickReplies: ['📦 东西重吗？', '🕒 我10分钟能到', '📍 具体位置在哪？']
  };

  const { accepted = false, task = defaultTask } = location.state || {};
  
  const [isAccepted, setIsAccepted] = useState(accepted);
  const [messages, setMessages] = useState<any[]>([]);
  // active: In progress
  // waiting_confirmation: Worker delivered, waiting for Publisher
  // waiting_receipt: Publisher paid, waiting for Worker receipt
  // completed: Done
  const [taskStatus, setTaskStatus] = useState<'active' | 'waiting_confirmation' | 'waiting_receipt' | 'completed'>('active');
  const [inputValue, setInputValue] = useState("");
  const [showPublisherPayModal, setShowPublisherPayModal] = useState(false); // For Publisher (A)
  const [showWaitingModal, setShowWaitingModal] = useState(false); // Generic waiting modal

  useEffect(() => {
    const u = localStorage.getItem('current_user');
    if (u) setCurrentUser(JSON.parse(u));
  }, []);

  // Determine Role
  const isPublisher = currentUser && (task.publisher.id === currentUser.id || task.publisher.name === currentUser.name);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Check initial status from storage
  useEffect(() => {
     const completedTasks = JSON.parse(localStorage.getItem('completed_tasks') || '[]');
     if (completedTasks.includes(task.id)) {
         setTaskStatus('completed');
     }
  }, [task.id]);

  // Load "已接单" from Supabase so publisher sees it when someone accepted
  useEffect(() => {
    const taskIdStr = String(task.id);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(taskIdStr)) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from('task_acceptances').select('id').eq('task_id', taskIdStr).limit(1);
      if (!cancelled && data && data.length > 0) setIsAccepted(true);
    })();
    return () => { cancelled = true; };
  }, [task.id]);

  // Initialize messages
  useEffect(() => {
     if (!messages.length) {
         if (task.type === 'study') {
             setMessages([
                 { id: 1, text: "同学你好，这本书还在吗？", sender: isPublisher ? "other" : "me", time: "昨天 14:30" },
                 { id: 2, text: "在的，你要的话¥25拿走。", sender: isPublisher ? "me" : "other", time: "昨天 14:35" }
             ]);
         } else {
             setMessages([
                 { id: 1, text: "你好，请问这个外卖大概有多重？", sender: isPublisher ? "other" : "me", time: "10:20" },
                 { id: 2, text: "不重，就是一份沙拉。", sender: isPublisher ? "me" : "other", time: "10:22" }
             ]);
         }
     }
  }, [task.type, isPublisher]);

  // Privacy Reveal Logic
  const displayName = isAccepted ? "已实名学生" : "已实名学生";
  const displayAvatar = isAccepted ? task.publisher.avatar : task.publisher.avatar;

  const handleAccept = async () => {
    const storedUser = localStorage.getItem('current_user');
    const user = storedUser ? JSON.parse(storedUser) : null;
    const isTaskUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(task.id));
    if (user?.id && isTaskUuid) {
      try {
        const { data: profile } = await supabase.from('profiles').select('id').eq('student_id', user.id).maybeSingle();
        if (profile?.id) {
          const { error } = await supabase.from('task_acceptances').insert({
            task_id: task.id,
            acceptor_id: profile.id,
            status: 'active',
          });
          if (!error) {
            setIsAccepted(true);
            setMessages(prev => [...prev, { id: 99, text: "我已接单，马上出发！", sender: "me", time: "刚刚" }]);
            const currentTasks = JSON.parse(localStorage.getItem('my_accepted_tasks') || '[]');
            if (!currentTasks.some((t: any) => t.id === task.id)) {
              localStorage.setItem('my_accepted_tasks', JSON.stringify([...currentTasks, task]));
            }
            return;
          }
        }
      } catch (_) {}
    }
    setIsAccepted(true);
    setMessages(prev => [...prev, { id: 99, text: "我已接单，马上出发！", sender: "me", time: "刚刚" }]);
    const currentTasks = JSON.parse(localStorage.getItem('my_accepted_tasks') || '[]');
    if (!currentTasks.some((t: any) => t.id === task.id)) {
      localStorage.setItem('my_accepted_tasks', JSON.stringify([...currentTasks, task]));
    }
  };

  // --- Logic for Worker (B) ---
  const handleDelivery = () => {
    if (window.confirm("确认已送达？将通知发布者验收。")) {
        setTaskStatus('waiting_confirmation');
        setShowWaitingModal(true); // Worker waits for Publisher A to confirm
        
        setMessages(prev => [...prev, { 
            id: Date.now(), 
            text: "我已送达，请确认。", 
            sender: "me", 
            time: "刚刚" 
        }]);

        // SIMULATION: If we are in Worker view, we simulate Publisher confirming after delay
        if (!isPublisher) {
             setTimeout(() => {
                 setShowWaitingModal(false);
                 setTaskStatus('waiting_receipt');
                 setMessages(prev => [...prev, { 
                    id: Date.now() + 1, 
                    text: "发布者已确认验收并转账，请查收。", 
                    sender: "other", 
                    time: "刚刚" 
                }]);
             }, 3000);
        }
    }
  };

  const handleConfirmReceipt = () => {
      // Worker confirms they got the money
      const priceVal = parseInt(task.price.replace(/[^\d]/g, ''));
      updateBalance(currentUser.id, priceVal); // Add money to Worker
      
      setTaskStatus('completed');
      completeTaskPersistence();
      
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        text: "已确认收款，交易完成！", 
        sender: "me", 
        time: "刚刚" 
      }]);
  };

  // --- Logic for Publisher (A) ---
  const handleConfirmCompletion = () => {
     // Publisher clicks "Confirm Completion"
     setShowPublisherPayModal(true);
  };

  const handleTransferConfirmed = () => {
      setShowPublisherPayModal(false);
      setTaskStatus('waiting_receipt'); // Waiting for B to confirm receipt
      
      const priceVal = parseInt(task.price.replace(/[^\d]/g, ''));
      updateBalance(currentUser.id, -priceVal); // Subtract money from Publisher immediately upon sending
      
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        text: "我已确认验收并转账。", 
        sender: "me", 
        time: "刚刚" 
      }]);

      // SIMULATION: If we are Publisher, simulate Worker confirming receipt
      if (isPublisher) {
          setTimeout(() => {
             setTaskStatus('completed');
             completeTaskPersistence();
             setMessages(prev => [...prev, { 
                id: Date.now() + 1, 
                text: "对方已确认收款，订单结束。", 
                sender: "other", 
                time: "刚刚" 
            }]);
          }, 3000);
      }
  };

  // --- Helper Functions ---
  const updateBalance = (userId: string, amount: number) => {
      // Update local state
      const newBalance = (currentUser.balance || 0) + amount;
      const updatedUser = { ...currentUser, balance: newBalance };
      setCurrentUser(updatedUser);
      localStorage.setItem('current_user', JSON.stringify(updatedUser));

      // Update 'DB'
      const db = JSON.parse(localStorage.getItem('user_db') || '{}');
      if (db[userId]) {
          db[userId].balance = (db[userId].balance || 0) + amount;
          localStorage.setItem('user_db', JSON.stringify(db));
      }
      
      // Dispatch event for Profile Screen
      window.dispatchEvent(new Event('storage'));
  };

  const completeTaskPersistence = () => {
     const completedTasks = JSON.parse(localStorage.getItem('completed_tasks') || '[]');
     if (!completedTasks.includes(task.id)) {
         localStorage.setItem('completed_tasks', JSON.stringify([...completedTasks, task.id]));
     }
  };

  const handleSendMessage = (text = inputValue) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), text: text, sender: "me", time: "刚刚" }]);
    setInputValue("");
    
    // Simple echo if needed, or silent for this demo
    setTimeout(() => {
         // Only echo if status is active to simulate negotiation
         if (taskStatus === 'active') {
             // localStorage.setItem('has_unread', 'true');
             // window.dispatchEvent(new Event('update-unread'));
         }
    }, 1500);
  };

  const getTaskIcon = (type: string) => {
      switch(type) {
          case 'study': return 'menu_book';
          case 'tutor': return 'terminal';
          default: return 'lunch_dining';
      }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 font-display relative">
      {/* Header */}
      <header className="bg-white dark:bg-surface-dark border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden">
                <img src={displayAvatar} className={`w-full h-full object-cover ${!isAccepted ? 'grayscale opacity-80' : ''}`} alt="Avatar" />
              </div>
              {isAccepted && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>}
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1">
                {displayName}
                {!isAccepted && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 rounded">未接单</span>}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                 {isPublisher ? "接单者" : task.publisher.major} · 已实名学生
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Task Context / Console */}
      <div className="bg-white dark:bg-surface-dark border-b border-slate-100 dark:border-slate-800 p-4 z-10">
        {!isAccepted && !isPublisher ? (
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 flex items-center gap-3 border border-slate-100 dark:border-slate-700">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${task.type === 'study' ? 'bg-amber-100 text-amber-600' : task.type === 'tutor' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>
               <span className="material-symbols-outlined">{getTaskIcon(task.type)}</span>
            </div>
            <div className="flex-1 min-w-0">
               <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 dark:text-white text-sm">{task.title}</h3>
                  <span className="text-primary font-bold">{task.price}</span>
               </div>
               <p className="text-xs text-slate-500 truncate">{task.description}</p>
            </div>
            <button onClick={handleAccept} className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-full shadow-sm">
              接单
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
             {/* Progress Steps */}
             <div className="flex items-center justify-between px-2">
                <div className="flex flex-col items-center gap-1">
                   <div className="w-2 h-2 rounded-full bg-primary"></div>
                   <span className="text-[10px] font-bold text-primary">已接单</span>
                </div>
                <div className="flex-1 h-0.5 bg-slate-100 mx-2 relative">
                   <div className="absolute left-0 top-0 h-full w-full bg-primary"></div>
                </div>
                <div className="flex flex-col items-center gap-1">
                   <div className={`w-2 h-2 rounded-full bg-primary`}></div>
                   <span className="text-[10px] font-bold text-primary">进行中</span>
                </div>
                <div className="flex-1 h-0.5 bg-slate-100 mx-2 relative">
                    <div className={`absolute left-0 top-0 h-full ${taskStatus !== 'active' ? 'w-full' : 'w-0'} bg-primary transition-all duration-500`}></div>
                </div>
                <div className="flex flex-col items-center gap-1">
                   <div className={`w-2 h-2 rounded-full ${taskStatus === 'completed' ? 'bg-primary' : 'bg-slate-300'}`}></div>
                   <span className={`text-[10px] ${taskStatus === 'completed' ? 'text-primary font-bold' : 'text-slate-400'}`}>
                       {taskStatus === 'completed' ? '已完成' : '待完成'}
                   </span>
                </div>
             </div>

             {/* OTP & Actions */}
             <div className="bg-primary/5 rounded-xl p-3 flex justify-between items-center border border-primary/10">
                <div>
                   <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-0.5">核销码</p>
                   <p className="text-2xl font-mono font-black text-primary tracking-widest">8 8 2 4</p>
                   <p className="text-[10px] text-slate-400">见面请核对</p>
                </div>
                
                {/* Status Logic Handling */}
                {taskStatus === 'completed' ? (
                     <button disabled className="h-10 px-4 bg-green-500 text-white rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 opacity-90 cursor-default">
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        订单结束
                     </button>
                ) : isPublisher ? (
                    /* PUBLISHER BUTTONS */
                    taskStatus === 'waiting_confirmation' ? (
                        <button 
                            onClick={handleConfirmCompletion}
                            className="h-10 px-4 bg-primary text-white rounded-lg text-sm font-bold shadow-lg flex items-center gap-2"
                        >
                           <span className="material-symbols-outlined text-[18px]">verified</span>
                           确认验收
                        </button>
                    ) : taskStatus === 'waiting_receipt' ? (
                        <button disabled className="h-10 px-4 bg-amber-500 text-white rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 opacity-90">
                           <span className="material-symbols-outlined text-[18px] animate-spin">hourglass_top</span>
                           等待收款...
                        </button>
                    ) : (
                        <button disabled className="h-10 px-4 bg-slate-300 text-white rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 cursor-default">
                           等待送达...
                        </button>
                    )
                ) : (
                    /* WORKER BUTTONS */
                    taskStatus === 'active' ? (
                        <button 
                          onClick={handleDelivery}
                          className="h-10 px-4 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 flex items-center gap-2 active:scale-95 transition-transform"
                        >
                           <span className="material-symbols-outlined text-[18px]">{task.type === 'delivery' ? 'location_on' : 'check_circle'}</span>
                           我已送达
                        </button>
                    ) : taskStatus === 'waiting_receipt' ? (
                         <button 
                          onClick={handleConfirmReceipt}
                          className="h-10 px-4 bg-green-600 text-white rounded-lg text-sm font-bold shadow-lg flex items-center gap-2 active:scale-95 transition-transform animate-pulse"
                        >
                           <span className="material-symbols-outlined text-[18px]">payments</span>
                           确认收款
                        </button>
                    ) : (
                        <button disabled className="h-10 px-4 bg-amber-500 text-white rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 opacity-90 cursor-default">
                           <span className="material-symbols-outlined text-[18px] animate-spin">hourglass_top</span>
                           等待确认...
                        </button>
                    )
                )}
             </div>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
             <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm text-sm ${
               msg.sender === 'me' 
                 ? 'bg-primary text-white rounded-tr-none' 
                 : 'bg-white dark:bg-surface-dark text-slate-800 dark:text-white rounded-tl-none border border-slate-100 dark:border-slate-800'
             }`}>
               {msg.text}
             </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-surface-dark border-t border-slate-100 dark:border-slate-800 p-3 pb-6 sticky bottom-0 z-20">
         <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400 hover:text-primary transition-colors">
               <span className="material-symbols-outlined">add_circle</span>
            </button>
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="发送消息..." 
              className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-full h-10 px-4 text-sm focus:ring-2 focus:ring-primary/50"
            />
            <button 
                onClick={() => handleSendMessage()}
                className="p-2 text-primary hover:text-primary-dark transition-colors"
            >
               <span className="material-symbols-outlined filled">send</span>
            </button>
         </div>
      </div>

      {/* Generic Waiting Modal (Worker) */}
      {showWaitingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-surface-dark rounded-3xl p-8 flex flex-col items-center shadow-2xl max-w-xs w-full mx-6 animate-float-up">
             <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
               <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
             </div>
             <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">等待验收</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 text-center leading-relaxed">
               已通知发布者，<br/>对方验收转账后您将收到通知。
             </p>
          </div>
        </div>
      )}

      {/* Publisher Payment Instruction Modal */}
      {showPublisherPayModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 flex flex-col items-center shadow-2xl max-w-sm w-full mx-6 animate-float-up">
               <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                 <span className="material-symbols-outlined text-3xl text-primary">currency_yen</span>
               </div>
               <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">请支付 {task.price}</h3>
               <p className="text-xs text-slate-500 mb-4">任务完成，请私下支付给对方</p>
               
               <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-5 border border-slate-100 dark:border-slate-700">
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mb-3 text-center">
                      请通过以下方式私下转账
                  </p>
                  <div className="flex justify-center gap-4">
                      <div className="flex flex-col items-center gap-1">
                          <div className="w-10 h-10 rounded-lg bg-[#00C800] flex items-center justify-center text-white">
                              <span className="text-xs font-bold">微信</span>
                          </div>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                          <div className="w-10 h-10 rounded-lg bg-[#1677FF] flex items-center justify-center text-white">
                              <span className="text-xs font-bold">支付宝</span>
                          </div>
                      </div>
                  </div>
               </div>

               <button 
                  onClick={handleTransferConfirmed}
                  className="w-full h-12 bg-primary text-white rounded-xl font-bold shadow-lg"
               >
                  我已转账
               </button>
               <button 
                  onClick={() => setShowPublisherPayModal(false)}
                  className="mt-3 text-sm text-slate-400 hover:text-slate-600"
               >
                  稍后再付
               </button>
            </div>
          </div>
      )}
    </div>
  );
};

export default ChatScreen;