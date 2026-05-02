import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Circle, Dumbbell, Moon, Code2, Video, Briefcase, ChefHat, 
  Trophy, Target, CalendarDays, Activity, Clock
} from 'lucide-react';

const API_URL = 'http://192.168.1.15:8000/api';

const App = () => {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const defaultHabits = {
    tahajjud: false, gymOrRun: false, rezlSgDev: false, contentCreation: false, jobApps: false, baking: false
  };

  const defaultMetrics = { weight: 58, juz: 0 };
  
  const defaultMilestones = {
    p1_graduate: false, p1_job: false, p1_60kg: false, p1_routine: false,
    p2_62kg: false, p2_webapp: false, p2_video: false, p2_3juz: false,
    p3_65kg: false, p3_5juz: false, p3_monetize: false, p3_review: false,
  };

  const [habits, setHabits] = useState(defaultHabits);
  const [metrics, setMetrics] = useState(defaultMetrics);
  const [milestones, setMilestones] = useState(defaultMilestones);
  const [lastActiveDate, setLastActiveDate] = useState(new Date().toLocaleDateString('en-CA'));

  // --- REAL-TIME CLOCK LOGIC ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- INITIAL DATA FETCH & MIDNIGHT RESET LOGIC ---
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const stateRes = await fetch(`${API_URL}/state`);
        const historyRes = await fetch(`${API_URL}/history`);
        const historyData = await historyRes.json();
        setHistory(historyData);

        const stateData = await stateRes.json();
        
        if (stateData.status !== 'no_data') {
          const today = new Date().toLocaleDateString('en-CA');
          
          if (stateData.last_active_date !== today) {
            // Push yesterday's score
            const prevCompleted = Object.values(stateData.habits).filter(Boolean).length;
            const prevTotal = Object.keys(stateData.habits).length;
            const prevScore = Math.round((prevCompleted / prevTotal) * 100) || 0;

            await fetch(`${API_URL}/history`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ date: stateData.last_active_date, score: prevScore })
            });

            // Reset habits but KEEP metrics and milestones
            setHabits(defaultHabits);
            setMetrics(stateData.metrics);
            setMilestones(stateData.milestones);
            setLastActiveDate(today);
            
            const newHistoryRes = await fetch(`${API_URL}/history`);
            setHistory(await newHistoryRes.json());
          } else {
            setHabits(stateData.habits);
            setMetrics(stateData.metrics);
            setMilestones(stateData.milestones);
            setLastActiveDate(stateData.last_active_date);
          }
        }
      } catch (error) {
        console.error("Backend offline, waiting...", error);
      } finally {
        setLoading(false);
      }
    };
    initializeApp();
  }, []);

  // --- SAVE TO FASTAPI ON STATE CHANGE ---
  useEffect(() => {
    if (loading) return;
    const saveState = async () => {
      try {
        await fetch(`${API_URL}/state`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ habits, metrics, milestones, last_active_date: lastActiveDate })
        });
      } catch (error) {
        console.error("Failed to save state to backend", error);
      }
    };
    saveState();
  }, [habits, metrics, milestones, lastActiveDate, loading]);

  // --- HANDLERS ---
  const toggleHabit = (key) => setHabits(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleMilestone = (key) => setMilestones(prev => ({ ...prev, [key]: !prev[key] }));
  const updateMetric = (key, value) => setMetrics(prev => ({ ...prev, [key]: value }));

  // --- CALCULATIONS ---
  const completedHabits = Object.values(habits).filter(Boolean).length;
  const totalHabits = Object.keys(habits).length;
  const habitProgress = Math.round((completedHabits / totalHabits) * 100) || 0;
  
  const weightProgress = Math.min(100, Math.max(0, ((metrics.weight - 58) / (65 - 58)) * 100));
  const juzProgress = Math.min(100, Math.max(0, (metrics.juz / 5) * 100));

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-xl">Loading RezlSG Systems...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8 overflow-x-hidden">
      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Azfar's 2026 Master Plan</h1>
          <p className="text-slate-500 mt-1">SUTD to RezlSG Founder • The Final Sprint</p>
        </div>
        
        {/* REAL-TIME CLOCK WIDGET */}
        <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:items-end">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl tracking-tight">
            <Clock className="w-5 h-5 text-indigo-500" />
            {currentTime.toLocaleTimeString('en-SG', { 
              hour12: true, 
              hour: '2-digit', 
              minute: '2-digit', 
              second: '2-digit' 
            })}
          </div>
          <div className="text-slate-500 text-sm font-medium flex items-center gap-1.5 mt-1">
            <CalendarDays className="w-4 h-4" />
            {currentTime.toLocaleDateString('en-SG', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMN 1: HABITS */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
              <Target className="w-6 h-6 text-indigo-500" /> Daily Execution
            </h2>
            <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{habitProgress}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full mb-6">
            <div className="h-full bg-indigo-500 transition-all duration-500 rounded-full" style={{ width: `${habitProgress}%` }} />
          </div>
          <div className="space-y-3">
             <HabitItem icon={<Moon/>} title="Tahajjud & Fajr" subtitle="5:00 AM" checked={habits.tahajjud} onChange={() => toggleHabit('tahajjud')} />
             <HabitItem icon={<Dumbbell/>} title="Fitness System" subtitle="Gym or HIIT Run" checked={habits.gymOrRun} onChange={() => toggleHabit('gymOrRun')} />
             <HabitItem icon={<Code2/>} title="RezlSG Dev" subtitle="Webapp Building" checked={habits.rezlSgDev} onChange={() => toggleHabit('rezlSgDev')} />
             <HabitItem icon={<Video/>} title="Brand Content" subtitle="Edit/Post" checked={habits.contentCreation} onChange={() => toggleHabit('contentCreation')} />
             <HabitItem icon={<Briefcase/>} title="Career Acceleration" subtitle="Job Apps & Networking" checked={habits.jobApps} onChange={() => toggleHabit('jobApps')} />
             <HabitItem icon={<ChefHat/>} title="Skill Building" subtitle="Baking Prep" checked={habits.baking} onChange={() => toggleHabit('baking')} />
          </div>
        </section>

        {/* COLUMN 2: METRICS & HEATMAP */}
        <section className="flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 mb-6">
              <Trophy className="w-6 h-6 text-emerald-500" /> Core Metrics
            </h2>

            {/* WEIGHT TRACKER */}
            <div className="bg-slate-50 rounded-2xl p-5 mb-4 border border-slate-100">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h3 className="font-bold text-slate-800">Physique Goal</h3>
                  <p className="text-sm text-slate-500">58kg to 65kg</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-600">{metrics.weight}</span>
                  <span className="text-sm font-medium text-slate-500 ml-1">kg</span>
                </div>
              </div>
              <input 
                type="range" min="58" max="65" step="0.1" value={metrics.weight}
                onChange={(e) => updateMetric('weight', parseFloat(e.target.value))}
                className="w-full accent-emerald-500 mb-2"
              />
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${weightProgress}%` }} />
              </div>
            </div>

            {/* QURAN TRACKER */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h3 className="font-bold text-slate-800">Spiritual Goal</h3>
                  <p className="text-sm text-slate-500">Memorize 5 Juz</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-amber-600">{metrics.juz}</span>
                  <span className="text-sm font-medium text-slate-500 ml-1">Juz</span>
                </div>
              </div>
              <input 
                type="range" min="0" max="5" step="0.1" value={metrics.juz}
                onChange={(e) => updateMetric('juz', parseFloat(e.target.value))}
                className="w-full accent-amber-500 mb-2"
              />
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${juzProgress}%` }} />
              </div>
            </div>
          </div>

          {/* HEATMAP */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900 mb-4">
              <Activity className="w-5 h-5 text-emerald-500" /> Consistency Graph
            </h2>
            <ContributionGraph history={history} />
          </div>
        </section>

        {/* COLUMN 3: MILESTONE ROADMAP */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-auto overflow-y-auto">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 mb-6">
            <CalendarDays className="w-6 h-6 text-rose-500" /> Milestone Roadmap
          </h2>

          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
            
            <MilestonePhase title="Phase 1: Launchpad" timeframe="May - Jun">
              <MilestoneItem title="Graduate SUTD (CS & Design)" checked={milestones.p1_graduate} onChange={() => toggleMilestone('p1_graduate')} />
              <MilestoneItem title="Secure $5k+ Fintech/AI Job" checked={milestones.p1_job} onChange={() => toggleMilestone('p1_job')} />
              <MilestoneItem title="Hit 60kg Bodyweight" checked={milestones.p1_60kg} onChange={() => toggleMilestone('p1_60kg')} />
              <MilestoneItem title="Establish 5:00 AM Routine" checked={milestones.p1_routine} onChange={() => toggleMilestone('p1_routine')} />
            </MilestonePhase>

            <MilestonePhase title="Phase 2: Optimization" timeframe="Jul - Sep">
              <MilestoneItem title="Hit 62.5kg Bodyweight" checked={milestones.p2_62kg} onChange={() => toggleMilestone('p2_62kg')} />
              <MilestoneItem title="Deploy new RezlSG Webapp" checked={milestones.p2_webapp} onChange={() => toggleMilestone('p2_webapp')} />
              <MilestoneItem title="Master Video Editing Workflow" checked={milestones.p2_video} onChange={() => toggleMilestone('p2_video')} />
              <MilestoneItem title="Reach 3.5 Juz Memorization" checked={milestones.p2_3juz} onChange={() => toggleMilestone('p2_3juz')} />
            </MilestonePhase>

            <MilestonePhase title="Phase 3: Mastery Peak" timeframe="Oct - Dec">
              <MilestoneItem title="Achieve 65kg Goal Physique" checked={milestones.p3_65kg} onChange={() => toggleMilestone('p3_65kg')} />
              <MilestoneItem title="Complete 5 Juz Memorization" checked={milestones.p3_5juz} onChange={() => toggleMilestone('p3_5juz')} />
              <MilestoneItem title="Monetize RezlSG Service/Brand" checked={milestones.p3_monetize} onChange={() => toggleMilestone('p3_monetize')} />
              <MilestoneItem title="Publish 2026 Year-in-Review Video" checked={milestones.p3_review} onChange={() => toggleMilestone('p3_review')} />
            </MilestonePhase>
          </div>
        </section>

      </main>
    </div>
  );
};

// --- SUBCOMPONENTS ---

const HabitItem = ({ icon, title, subtitle, checked, onChange }) => (
  <button onClick={onChange} className={`w-full flex items-center p-3 md:p-4 rounded-xl border-2 transition-all ${checked ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:bg-slate-50'}`}>
    <div className={`mr-4 p-2 rounded-lg ${checked ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>{icon}</div>
    <div className="text-left flex-1">
      <div className={`font-bold text-sm md:text-base ${checked ? 'text-indigo-900' : 'text-slate-700'}`}>{title}</div>
      {subtitle && <div className={`text-xs md:text-sm ${checked ? 'text-indigo-600' : 'text-slate-500'}`}>{subtitle}</div>}
    </div>
    <div className="ml-auto">{checked ? <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" /> : <Circle className="w-5 h-5 md:w-6 md:h-6 text-slate-300" />}</div>
  </button>
);

const ContributionGraph = ({ history }) => {
  const days = Array.from({length: 30}).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toLocaleDateString('en-CA');
  });

  const getStyleForScore = (score) => {
    if (score === undefined || score === 0) return 'bg-slate-100';
    if (score <= 33) return 'bg-emerald-200';
    if (score <= 66) return 'bg-emerald-400';
    if (score <= 99) return 'bg-emerald-500';
    return 'bg-emerald-600 shadow-sm shadow-emerald-300';
  };

  return (
    <div className="flex flex-wrap gap-2">
      {days.map(dateStr => {
        const record = history.find(h => h.date === dateStr);
        return (
          <div key={dateStr} title={`${dateStr}: ${record ? record.score : 0}%`} className={`w-5 h-5 rounded-sm ${getStyleForScore(record?.score)}`} />
        );
      })}
    </div>
  );
};

const MilestonePhase = ({ title, timeframe, children }) => (
  <div className="relative z-10">
    <div className="bg-slate-800 text-white text-xs md:text-sm font-bold px-4 py-1.5 rounded-full inline-block mb-4 shadow-sm">
      {title} <span className="text-slate-400 font-normal ml-2">{timeframe}</span>
    </div>
    <div className="space-y-3 pl-2">
      {children}
    </div>
  </div>
);

const MilestoneItem = ({ title, checked, onChange }) => (
  <label className="flex items-start gap-3 p-2 md:p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-100">
    <div className="mt-0.5">
      <input type="checkbox" checked={checked} onChange={onChange} className="w-4 h-4 md:w-5 md:h-5 rounded border-slate-300 text-rose-500 focus:ring-rose-500 cursor-pointer" />
    </div>
    <span className={`text-sm md:text-base font-medium select-none ${checked ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
      {title}
    </span>
  </label>
);

export default App;