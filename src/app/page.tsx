"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, orderBy, limit } from "firebase/firestore";
import { Users, Megaphone, Activity, ArrowUpRight, TrendingUp, Trophy, Scan } from "lucide-react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { format, subDays, startOfDay, isSameDay } from "date-fns";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    joinedToday: 0,
    activeHype: 0,
    topScore: 0
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Users
        const usersSnap = await getDocs(collection(db, "users"));
        const users = usersSnap.docs.map(doc => doc.data());
        
        // 2. Fetch Hype
        const hypeSnap = await getDocs(collection(db, "hype_board"));
        
        // 3. Process Stats
        const today = startOfDay(new Date());
        const joinedTodayCount = users.filter((u: any) => {
          const createdAt = new Date(u.createdAt);
          return isSameDay(createdAt, today);
        }).length;

        setStats({
          totalUsers: usersSnap.size,
          joinedToday: joinedTodayCount,
          activeHype: hypeSnap.size,
          topScore: Math.max(...users.map((u: any) => u.xp || 0), 0)
        });

        // 4. Process Chart Data (Last 7 Days)
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
          const d = subDays(new Date(), 6 - i);
          const dayName = format(d, "EEE");
          const count = users.filter((u: any) => isSameDay(new Date(u.createdAt), d)).length;
          return { name: dayName, users: count };
        });
        setChartData(last7Days);

        // 5. Fetch Recent Users
        const q = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(5));
        const recentSnap = await getDocs(q);
        setRecentUsers(recentSnap.docs.map(doc => doc.data()));

      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0A0A0A] flex items-center justify-center z-[200]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-amber-500 font-bold tracking-widest uppercase text-xs animate-pulse">Synchronizing Data Vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 space-y-10">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold serif text-zinc-100">Command Center</h1>
          <p className="text-zinc-500 italic mt-2">The ledger is live. Every heartbeat of the archive is accounted for.</p>
        </div>
        <div className="flex items-center gap-6">
          <a 
            href="/neural-war-room"
            className="flex items-center gap-3 px-6 py-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-500 hover:bg-amber-500 hover:text-ink transition-all duration-500 group shadow-[0_0_40px_rgba(212,175,55,0.1)]"
          >
            <div className="relative">
              <Scan size={20} />
              <div className="absolute inset-0 bg-amber-500/40 rounded-full animate-ping opacity-0 group-hover:opacity-100" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest">Global Neural Pulse</span>
          </a>
          <div className="text-right hidden md:block border-l border-zinc-800 pl-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-500">Live Ledger Status</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-zinc-300">Synchronized</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          icon={<Users className="text-amber-500" />} 
          label="Total Archivists" 
          value={stats.totalUsers.toString()} 
          trend="Real-time population"
        />
        <StatCard 
          icon={<Activity className="text-blue-500" />} 
          label="Joined Today" 
          value={stats.joinedToday.toString()} 
          trend="New entries today"
        />
        <StatCard 
          icon={<Megaphone className="text-purple-500" />} 
          label="Active Notifications" 
          value={stats.activeHype.toString()} 
          trend="Live broadcasts"
        />
        <StatCard 
          icon={<Trophy className="text-gold" />} 
          label="Top XP Score" 
          value={stats.topScore.toLocaleString()} 
          trend="Batch leading score"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Chart */}
        <div className="lg:col-span-2 card-blur p-8 rounded-3xl space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold serif flex items-center gap-2">
              <TrendingUp size={20} className="text-amber-500" />
              Live Joining Trends
            </h3>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest bg-zinc-900 px-3 py-1 rounded-lg">Last 7 Days</span>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 12 }} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#D4AF37' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#D4AF37" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorUsers)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="card-blur p-8 rounded-3xl space-y-6">
          <h3 className="text-xl font-bold serif">Latest Registry Entries</h3>
          <div className="space-y-6">
            {recentUsers.length === 0 ? (
              <p className="text-center text-zinc-600 italic py-10">No new archivists detected.</p>
            ) : recentUsers.map((u, i) => (
              <div key={i} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden">
                    {u.photoURL ? (
                      <img src={u.photoURL} className="w-full h-full object-cover" alt={u.name} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-amber-500/20">
                        {u.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold truncate w-32">{u.name}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Sec {u.section} • {format(new Date(u.createdAt), "HH:mm")}</p>
                  </div>
                </div>
                <ArrowUpRight size={16} className="text-zinc-700 group-hover:text-amber-500 transition-colors" />
              </div>
            ))}
          </div>
          <button className="w-full py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all">
            Manage Registry
          </button>
        </div>

      </div>

    </div>
  );
}

function StatCard({ icon, label, value, trend }: { icon: React.ReactNode, label: string, value: string, trend: string }) {
  return (
    <div className="card-blur p-6 rounded-3xl space-y-4 hover:border-amber-500/30 transition-all duration-500 group">
      <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">{label}</p>
        <p className="text-3xl font-bold serif text-zinc-100">{value}</p>
      </div>
      <p className="text-[10px] font-medium text-zinc-500 flex items-center gap-1">
        <span className="text-amber-500">●</span> {trend}
      </p>
    </div>
  );
}
