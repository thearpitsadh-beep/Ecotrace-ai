import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { ActivityLog } from './components/ActivityLog';
import { AIAgent } from './components/AIAgent';
import { Challenges } from './components/Challenges';
import { DataSync } from './components/DataSync';
import { CarbonActivity } from './types';
import { Leaf, BarChart3, PlusCircle, Wind, Zap, Award, Database, Smile, X, Flame, Sun, Moon, Bell } from 'lucide-react';
import { useTheme } from './components/ThemeProvider';

export default function App() {
  const [activities, setActivities] = useState<CarbonActivity[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'log' | 'challenges' | 'data'>('dashboard');
  const [greenPoints, setGreenPoints] = useState(0);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [streak, setStreak] = useState(0);
  const [lastLogDate, setLastLogDate] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';

  // Load initial data
  useEffect(() => {
    const saved = localStorage.getItem('eco_activities');
    const savedPoints = localStorage.getItem('eco_points');
    const savedStreak = localStorage.getItem('eco_streak');
    const savedLastLogDate = localStorage.getItem('eco_last_log_date');

    if (saved) {
      try {
        setActivities(JSON.parse(saved));
        if (savedPoints) setGreenPoints(parseInt(savedPoints));
        if (savedStreak) setStreak(parseInt(savedStreak));
        if (savedLastLogDate) setLastLogDate(savedLastLogDate);
      } catch (e) {
        console.error('Failed to parse saved activities', e);
      }
    } else {
      // Seed some demo data to show immediately
      const seedData: CarbonActivity[] = [
        { id: '1', type: 'transport', title: 'Vehicle usage (Monthly)', co2ImpactKg: 45, date: new Date().toISOString() },
        { id: '2', type: 'energy', title: 'Electricity bill (Monthly)', co2ImpactKg: 25, date: new Date().toISOString() },
        { id: '3', type: 'diet', title: 'Food habits (Monthly)', co2ImpactKg: 20, date: new Date().toISOString() },
        { id: '4', type: 'shopping', title: 'Online shopping', co2ImpactKg: 10, date: new Date().toISOString() },
      ];
      setActivities(seedData);
      setGreenPoints(120);
      setStreak(1);
      setLastLogDate(new Date().toISOString().split('T')[0]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('eco_activities', JSON.stringify(activities));
    localStorage.setItem('eco_points', greenPoints.toString());
    localStorage.setItem('eco_streak', streak.toString());
    if (lastLogDate) localStorage.setItem('eco_last_log_date', lastLogDate);
  }, [activities, greenPoints, streak, lastLogDate]);

  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
      const today = new Date().toISOString().split('T')[0];
      if (lastLogDate && lastLogDate !== today && Notification.permission === 'granted') {
        const hasNotifiedToday = localStorage.getItem(`eco_notified_${today}`);
        if (!hasNotifiedToday) {
           const timer = setTimeout(() => {
             new Notification("EcoBuddy Reminder 🌱", {
               body: "You haven't logged your eco-activities today! Log now to keep your streak.",
             });
             localStorage.setItem(`eco_notified_${today}`, 'true');
           }, 5000);
           return () => clearTimeout(timer);
        }
      }
    }
  }, [lastLogDate]);

  const totalFootprint = activities.reduce((sum, act) => sum + act.co2ImpactKg, 0);

  const handleAddActivity = (newActivity: Omit<CarbonActivity, 'id' | 'date'>) => {
    const today = new Date().toISOString().split('T')[0];
    if (lastLogDate === null) {
      setStreak(1);
    } else {
      const last = new Date(lastLogDate);
      const now = new Date(today);
      const diffTime = Math.abs(now.getTime() - last.getTime());
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        setStreak(prev => prev + 1);
      } else if (diffDays > 1) {
        setStreak(1);
      }
    }
    setLastLogDate(today);

    const activity: CarbonActivity = {
      ...newActivity,
      id: crypto.randomUUID(),
      date: new Date().toISOString()
    };
    setActivities(prev => [activity, ...prev]);
    // Encourage logging by awarding a small amount of points
    handleAwardPoints(5);
    setActiveTab('dashboard'); // return to dashboard to see impact
    
    // Auto-close mobile chat if open
    if (isMobileChatOpen) {
      setIsMobileChatOpen(false);
    }
  };

  const handleImportData = (importedActivities: CarbonActivity[], points: number) => {
    setActivities(importedActivities);
    setGreenPoints(points);
    setActiveTab('dashboard');
  };

  const handleAwardPoints = (points: number) => {
    setGreenPoints(prev => prev + points);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] selection:bg-emerald-200 pb-20 md:pb-0 relative">
      {/* Modern Background Pattern */}
      <div className="fixed inset-0 z-0 h-full w-full bg-[#f8fafc] bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-60" />
      <div className="fixed inset-0 z-0 bg-gradient-to-tr from-emerald-50/40 via-transparent to-blue-50/40 pointer-events-none" />
      
      <nav className="relative z-20 border-b bg-white/80 backdrop-blur-md sticky top-0 w-full">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 p-1.5 md:p-2 rounded-lg text-white shadow-sm flex items-center justify-center">
              <Leaf className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" />
            </div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 line-clamp-1">EcoTrace AI</h1>
          </div>
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 md:gap-2 text-xs md:text-sm font-medium overflow-x-auto no-scrollbar pb-1 sm:pb-0">
             <button
               onClick={() => setActiveTab('dashboard')}
               aria-label="Dashboard Analytics"
               className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full transition-colors flex items-center gap-1.5 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-emerald-500 ${activeTab === 'dashboard' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}
             >
               <BarChart3 size={16}/> Analytics
             </button>
             <button
               onClick={() => setActiveTab('log')}
               aria-label="Log Action"
               className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full transition-colors flex items-center gap-1.5 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-emerald-500 ${activeTab === 'log' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}
             >
               <PlusCircle size={16}/> Log Action
             </button>
             <button
               onClick={() => setActiveTab('challenges')}
               aria-label="Challenges"
               className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full transition-colors flex items-center gap-1.5 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-emerald-500 ${activeTab === 'challenges' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}
             >
               <Award size={16}/> Challenges
             </button>
             <button
               onClick={() => setActiveTab('data')}
               aria-label="Data Sync"
               className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full transition-colors flex items-center gap-1.5 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-emerald-500 ${activeTab === 'data' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}
             >
               <Database size={16}/> Data
             </button>
          </div>
          <div className="hidden sm:flex items-center gap-3 min-w-max">
             <button
               onClick={toggleTheme}
               className="p-1.5 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
               aria-label="Toggle dark mode"
             >
               {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
             </button>
             <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1 rounded-full border border-orange-100 text-sm">
                <Flame size={14} className="text-orange-500" fill="currentColor" />
                <span className="font-bold text-orange-700">{streak} Day{streak !== 1 ? 's' : ''}</span>
             </div>
             <div className="flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 text-sm">
                <Leaf size={14} className="text-emerald-500" />
                <span className="font-bold text-emerald-700">{greenPoints} pts</span>
             </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 flex-1 max-w-6xl mx-auto w-full p-4 sm:p-6 space-y-6">
        {/* Mobile Points Display */}
        <div className="sm:hidden flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
           <div className="flex items-center gap-3">
             <span className="text-slate-500 font-medium text-sm">Your Progress</span>
             <button
               onClick={toggleTheme}
               className="p-1 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
               aria-label="Toggle dark mode"
             >
               {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
             </button>
           </div>
           <div className="flex items-center gap-2">
             <div className="flex items-center gap-1.5 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100">
               <Flame size={14} className="text-orange-500" fill="currentColor" />
               <span className="font-bold text-orange-700 text-sm">{streak}</span>
             </div>
             <div className="flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
               <Leaf size={14} className="text-emerald-500" />
               <span className="font-bold text-emerald-700 text-sm">{greenPoints}</span>
             </div>
           </div>
        </div>

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             {/* Left Column: Stats & Progress */}
             <div className="md:col-span-5 lg:col-span-5 space-y-6 flex flex-col">
                <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                  <h2 className="text-slate-500 text-sm font-semibold mb-4 uppercase tracking-wider">Your Impact</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-4xl font-bold text-slate-900">{totalFootprint.toFixed(1)}<span className="text-xl text-slate-400">kg</span></p>
                        <p className="text-sm text-slate-500 font-medium mt-1">Total CO₂ Footprint</p>
                      </div>
                      <BarChart3 className="text-emerald-500" size={36} />
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                     <p className="text-sm text-slate-600 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        Save <strong>150 kg of CO2</strong> this year goal: {(totalFootprint > 150 ? 0 : 150 - totalFootprint).toFixed(0)}kg left
                     </p>
                     <p className="text-sm text-slate-600 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                        Plant <strong>7 trees</strong> eq. (Taking car off road for 15 days)
                     </p>
                  </div>
                </section>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div className="mb-4">
                      <div className="p-2 bg-amber-50 text-amber-500 w-max rounded-lg mb-2">
                        <Zap size={20} />
                      </div>
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Energy Grade</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{totalFootprint < 50 ? 'A+' : 'B-'}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div className="mb-4">
                      <div className="p-2 bg-blue-50 text-blue-500 w-max rounded-lg mb-2">
                        <Wind size={20} />
                      </div>
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Air Offset</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{Math.floor(12 + (activities.length * 0.5))} Trees</p>
                  </div>
                </div>

                <div className="flex-1">
                   <Dashboard activities={activities} totalFootprint={totalFootprint} streak={streak} greenPoints={greenPoints} hideTopCard />
                </div>
             </div>

             {/* Right Column: AI Agent Chat (Hidden on Mobile) */}
             <div className="hidden md:flex md:col-span-7 lg:col-span-7 flex-col min-h-[500px]">
                <AIAgent onLogActivity={handleAddActivity} activities={activities} />
             </div>
          </div>
        )}
        
        {activeTab === 'log' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="max-w-2xl mx-auto space-y-6">
               <div className="text-center mb-8 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full w-max mx-auto mb-4">
                     <PlusCircle size={28} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">Log an Action</h2>
                  <p className="text-slate-500 mt-2">Track emissions for transport, flights, electricity, water, diet, and shopping.</p>
               </div>
               <ActivityLog onAddActivity={handleAddActivity} />
             </div>
          </div>
        )}

        {activeTab === 'challenges' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
             <Challenges greenPoints={greenPoints} onAward={handleAwardPoints} />
          </div>
        )}

        {activeTab === 'data' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
             <DataSync activities={activities} points={greenPoints} onImport={handleImportData} />
          </div>
        )}
      </main>

      {/* Mobile Floating Chat Bubble */}
      <div className="md:hidden fixed bottom-24 right-4 z-40 flex flex-col items-end gap-3 pointer-events-none">
        {!isMobileChatOpen && (
           <button 
             onClick={() => setIsMobileChatOpen(true)}
             className="bg-white px-4 py-2.5 rounded-2xl rounded-br-sm shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-slate-100 text-[13px] font-bold text-slate-700 animate-bounce cursor-pointer pointer-events-auto text-left"
           >
             Tell me about your day <span className="text-base ml-1">👋</span>
           </button>
        )}
        <button 
           aria-label="Open Chat"
           onClick={() => setIsMobileChatOpen(true)} 
           className={`pointer-events-auto w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-[0_8px_30px_rgba(16,185,129,0.3)] border-[3px] border-emerald-100/50 transition-transform active:scale-95 ${isMobileChatOpen ? 'scale-0' : 'scale-100'}`}
        >
           <Smile size={28} />
        </button>
      </div>

      {/* Mobile Chat Full-Screen Modal */}
      {isMobileChatOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-50 flex flex-col animate-in slide-in-from-bottom-full duration-300">
          <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center shadow-sm relative z-10 pt-safe">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-sm">
                 <Smile size={20} />
               </div>
               <div>
                  <h2 className="font-bold text-slate-800 leading-tight">EcoBuddy</h2>
                  <span className="text-[11px] font-medium text-emerald-600 uppercase tracking-widest">Online</span>
               </div>
            </div>
            <button 
              aria-label="Close Chat"
              onClick={() => setIsMobileChatOpen(false)} 
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
            >
              <X size={20}/>
            </button>
          </div>
          <div className="flex-1 overflow-hidden relative">
            <AIAgent onLogActivity={handleAddActivity} activities={activities} />
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 pb-safe z-30">
         <div className="flex justify-around items-center h-16">
            <button
              onClick={() => setActiveTab('dashboard')}
              aria-current={activeTab === 'dashboard' ? 'page' : undefined}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors focus:outline-none focus:text-emerald-500 ${activeTab === 'dashboard' ? 'text-emerald-600' : 'text-slate-400'}`}
            >
              <BarChart3 size={20} strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} />
              <span className="text-[10px] font-semibold">Dash</span>
            </button>
            <button
              onClick={() => setActiveTab('log')}
              aria-current={activeTab === 'log' ? 'page' : undefined}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors focus:outline-none focus:text-emerald-500 ${activeTab === 'log' ? 'text-emerald-600' : 'text-slate-400'}`}
            >
              <PlusCircle size={20} strokeWidth={activeTab === 'log' ? 2.5 : 2} />
              <span className="text-[10px] font-semibold">Log</span>
            </button>
            <button
              onClick={() => setActiveTab('challenges')}
              aria-current={activeTab === 'challenges' ? 'page' : undefined}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors focus:outline-none focus:text-emerald-500 ${activeTab === 'challenges' ? 'text-emerald-600' : 'text-slate-400'}`}
            >
              <Award size={20} strokeWidth={activeTab === 'challenges' ? 2.5 : 2} />
              <span className="text-[10px] font-semibold">Targets</span>
            </button>
            <button
              onClick={() => setActiveTab('data')}
              aria-current={activeTab === 'data' ? 'page' : undefined}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors focus:outline-none focus:text-emerald-500 ${activeTab === 'data' ? 'text-emerald-600' : 'text-slate-400'}`}
            >
              <Database size={20} strokeWidth={activeTab === 'data' ? 2.5 : 2} />
              <span className="text-[10px] font-semibold">Data</span>
            </button>
         </div>
      </nav>
    </div>
  );
}


