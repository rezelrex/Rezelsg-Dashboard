import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Circle, Dumbbell, Moon, Code2, Video, Briefcase, ChefHat, 
  Trophy, Target, CalendarDays, Activity, Clock, Sun, Quote, Compass
} from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

const API_URL = 'https://rezelsg-dashboard-production.up.railway.app/api'; 

// --- ISLAMIC MOTIVATIONAL QUOTES ---
const dailyQuotes = [
  "“And He found you lost and guided [you].” – Quran 93:7",
  "“Indeed, with hardship [will be] ease.” – Quran 94:6",
  "“So remember Me; I will remember you.” – Quran 2:152",
  "“And whoever relies upon Allah - then He is sufficient for him.” – Quran 65:3",
  "“The best of people are those that bring most benefit to the rest of mankind.” – Prophet (ﷺ)"
];

const App = () => {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [prayerTimes, setPrayerTimes] = useState(null);
  
  // --- DARK MODE STATE ---
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('rezlsg_theme') === 'dark';
  });

  const defaultHabits = { tahajjud: false, gymOrRun: false, rezlSgDev: false, contentCreation: false, jobApps: false, baking: false };
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

  // --- DARK MODE EFFECT ---
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('rezlsg_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // --- REAL-TIME CLOCK & PRAYER TIMES ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Fetch Singapore Prayer Times
    fetch('https://api.aladhan.com/v1/timingsByCity?city=Singapore&country=Singapore&method=11')
      .then(res => res.json())
      .then(data => setPrayerTimes(data.data.timings))
      .catch(err => console.error("Could not fetch prayer times", err));

    return () => clearInterval(timer);
  }, []);

  // --- INITIAL DATA FETCH ---
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
            const prevCompleted = Object.values(stateData.habits).filter(Boolean).length;
            const prevTotal = Object.keys(stateData.habits).length;
            const prevScore = Math.round((prevCompleted / prevTotal) * 100) || 0;

            await fetch(`${API_URL}/history`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ date: stateData.last_active_date, score: prevScore })
            });

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
      } finally { setLoading(false); }
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
      } catch (error) {}
    };
    saveState();
  }, [habits, metrics, milestones, lastActiveDate, loading]);

  const toggleHabit = (key) => setHabits(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleMilestone = (key) => setMilestones(prev => ({ ...prev, [key]: !prev[key] }));
  const updateMetric = (key, value) => setMetrics(prev => ({ ...prev, [key]: value }));

  const completedHabits = Object.values(habits).filter(Boolean).length;
  const totalHabits = Object.keys(habits).length;
  const habitProgress = Math.round((completedHabits / totalHabits) * 100) || 0;
  const weightProgress = Math.min(100, Math.max(0, ((metrics.weight - 58) / (65 - 58)) * 100));
  const juzProgress = Math.min(100, Math.max(0, (metrics.juz / 5) * 100));
  const currentQuote = dailyQuotes[currentTime.getDay() % dailyQuotes.length];

  // Radar Chart Mock Data Calculation (Using history if available)
  const radarData = [
    { subject: 'Spiritual', A: habits.tahajjud ? 100 : 40, fullMark: 100 },
    { subject: 'Fitness', A: habits.gymOrRun ? 100 : 60, fullMark: 100 },
    { subject: 'Dev', A: habits.rezlSgDev ? 100 : 80, fullMark: 100 },
    { subject: 'Brand', A: habits.contentCreation ? 100 : 30, fullMark: 100 },
    { subject: 'Career', A: habits.jobApps ? 100 : 90, fullMark: 100 },
    { subject: 'Skills', A: habits.baking ? 100 : 20, fullMark: 100 },
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-xl dark:bg-slate-900 dark:text-white">Loading RezlSG Systems...</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans p-4 md:p-8 overflow-x-hidden transition-colors duration-300">
      
      {/* HEADER SECTION */}
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Azfar's 2026 Master Plan</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">SUTD to RezlSG Founder • The Final Sprint</p>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          >
            {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
          
          <div className="bg-white dark:bg-slate-800 px-5 py-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-end">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xl tracking-tight">
              <Clock className="w-5 h-5" />
              {currentTime.toLocaleTimeString('en-SG', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center gap-1.5 mt-1">
              <CalendarDays className="w-4 h-4" />
              {currentTime.toLocaleDateString('en-SG', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'})}
            </div>
          </div>
        </div>
      </header>

      {/* MOTIVATION & PRAYER TIMES WIDGET */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-indigo-600 dark:bg-indigo-900 rounded-3xl p-6 shadow-sm text-white flex items-center gap-4">
          <Quote className="w-10 h-10 text-indigo-300 opacity-50 shrink-0" />
          <p className="text-lg font-medium leading-relaxed">{currentQuote}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold mb-4">
            <Compass className="w-5 h-5 text-emerald-500" /> SG Prayer Times
          </div>
          <div className="flex justify-between items-center text-sm font-medium">
             <PrayerItem name="Fajr" time={prayerTimes?.Fajr || "--:--"} />
             <PrayerItem name="Dhuhr" time={prayerTimes?.Dhuhr || "--:--"} />
             <PrayerItem name="Asr" time={prayerTimes?.Asr || "--:--"} />
             <PrayerItem name="Maghrib" time={prayerTimes?.Maghrib || "--:--"} />
             <PrayerItem name="Isha" time={prayerTimes?.Isha || "--:--"} />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMN 1: HABITS & RADIAL CHART */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <Target className="w-6 h-6 text-indigo-500" /> Daily Execution
            </h2>
            <RadialProgress progress={habitProgress} />
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

        {/* COLUMN 2: METRICS, HEATMAP & RADAR CHART */}
        <section className="flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white mb-6">
              <Trophy className="w-6 h-6 text-emerald-500" /> Core Metrics
            </h2>

            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 mb-4 border border-slate-100 dark:border-slate-700">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white">Physique Goal</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">58kg to 65kg</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{metrics.weight}</span>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400 ml-1">kg</span>
                </div>
              </div>
              <input type="range" min="58" max="65" step="0.1" value={metrics.weight} onChange={(e) => updateMetric('weight', parseFloat(e.target.value))} className="w-full accent-emerald-500 mb-2" />
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${weightProgress}%` }} />
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white">Spiritual Goal</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Memorize 5 Juz</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{metrics.juz}</span>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400 ml-1">Juz</span>
                </div>
              </div>
              <input type="range" min="0" max="5" step="0.1" value={metrics.juz} onChange={(e) => updateMetric('juz', parseFloat(e.target.value))} className="w-full accent-amber-500 mb-2" />
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${juzProgress}%` }} />
              </div>
            </div>
          </div>

          {/* RADAR CHART WIDGET */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 h-72">
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white mb-2">
              <Activity className="w-5 h-5 text-indigo-500" /> Weekly Distribution
            </h2>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke={darkMode ? '#334155' : '#e2e8f0'} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 12 }} />
                <Radar name="Activity" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* COLUMN 3: MILESTONE ROADMAP */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 h-auto overflow-y-auto">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white mb-6">
            <CalendarDays className="w-6 h-6 text-rose-500" /> Milestone Roadmap
          </h2>
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-700 before:to-transparent">
            
            <MilestonePhase title="Phase 1: Launchpad" timeframe="May - Jun">
              <MilestoneItem title="Graduate SUTD (CS & Design)" checked={milestones.p1_graduate} onChange={() => toggleMilestone('p1_graduate')} />
              <MilestoneItem title="Secure $5k+ Fintech/AI Job" checked={milestones.p1_job} onChange={() => toggleMilestone('p1_job')} />
              <MilestoneItem title="Hit 60kg Bodyweight" checked={milestones.p1_60kg} onChange={() => toggleMilestone('p1_60kg')} />
            </MilestonePhase>

            <MilestonePhase title="Phase 2: Optimization" timeframe="Jul - Sep">
              <MilestoneItem title="Hit 62.5kg Bodyweight" checked={milestones.p2_62kg} onChange={() => toggleMilestone('p2_62kg')} />
              <MilestoneItem title="Deploy new RezlSG Webapp" checked={milestones.p2_webapp} onChange={() => toggleMilestone('p2_webapp')} />
              <MilestoneItem title="Master Video Editing Workflow" checked={milestones.p2_video} onChange={() => toggleMilestone('p2_video')} />
            </MilestonePhase>

            <MilestonePhase title="Phase 3: Mastery Peak" timeframe="Oct - Dec">
              <MilestoneItem title="Achieve 65kg Goal" checked={milestones.p3_65kg} onChange={() => toggleMilestone('p3_65kg')} />
              <MilestoneItem title="Monetize RezlSG Service" checked={milestones.p3_monetize} onChange={() => toggleMilestone('p3_monetize')} />
            </MilestonePhase>
          </div>
        </section>

      </main>
    </div>
  );
};

// --- SUBCOMPONENTS ---

const PrayerItem = ({ name, time }) => (
  <div className="flex flex-col items-center">
    <span className="text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider mb-1">{name}</span>
    <span className="text-slate-800 dark:text-slate-200 font-bold">{time}</span>
  </div>
);

const RadialProgress = ({ progress }) => {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg className="transform -rotate-90 w-16 h-16">
        <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-100 dark:text-slate-700" />
        <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} className="text-indigo-500 transition-all duration-1000 ease-out" />
      </svg>
      <span className="absolute text-sm font-bold text-indigo-600 dark:text-indigo-400">{progress}%</span>
    </div>
  );
};

const HabitItem = ({ icon, title, subtitle, checked, onChange }) => (
  <button onClick={onChange} className={`w-full flex items-center p-3 md:p-4 rounded-xl border-2 transition-all ${checked ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
    <div className={`mr-4 p-2 rounded-lg ${checked ? 'bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>{icon}</div>
    <div className="text-left flex-1">
      <div className={`font-bold text-sm md:text-base ${checked ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>{title}</div>
      {subtitle && <div className={`text-xs md:text-sm ${checked ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-500'}`}>{subtitle}</div>}
    </div>
    <div className="ml-auto">{checked ? <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-indigo-600 dark:text-indigo-400" /> : <Circle className="w-5 h-5 md:w-6 md:h-6 text-slate-300 dark:text-slate-600" />}</div>
  </button>
);

const MilestonePhase = ({ title, timeframe, children }) => (
  <div className="relative z-10">
    <div className="bg-slate-800 dark:bg-slate-700 text-white text-xs md:text-sm font-bold px-4 py-1.5 rounded-full inline-block mb-4 shadow-sm">
      {title} <span className="text-slate-400 dark:text-slate-300 font-normal ml-2">{timeframe}</span>
    </div>
    <div className="space-y-3 pl-2">
      {children}
    </div>
  </div>
);

const MilestoneItem = ({ title, checked, onChange }) => (
  <label className="flex items-start gap-3 p-2 md:p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
    <div className="mt-0.5">
      <input type="checkbox" checked={checked} onChange={onChange} className="w-4 h-4 md:w-5 md:h-5 rounded border-slate-300 dark:border-slate-600 text-rose-500 focus:ring-rose-500 bg-transparent cursor-pointer" />
    </div>
    <span className={`text-sm md:text-base font-medium select-none ${checked ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-300'}`}>
      {title}
    </span>
  </label>
);

export default App;