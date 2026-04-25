"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit, doc, updateDoc } from "firebase/firestore";
import { Trophy, Star, ChevronUp, ChevronDown, TrendingUp } from "lucide-react";

interface LeaderboardEntry {
  uid: string;
  name: string;
  xp: number;
  photoCount: number;
  section: string;
  photoURL?: string;
}

export default function LeaderboardOversight() {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [summary, setSummary] = useState({
    totalXP: 0,
    activeCount: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      // 1. Fetch Summary Stats
      const allUsersSnap = await getDocs(collection(db, "users"));
      const allUsers = allUsersSnap.docs.map(doc => doc.data());
      const totalXP = allUsers.reduce((acc, u) => acc + (u.xp || 0), 0);
      
      setSummary({
        totalXP,
        activeCount: allUsersSnap.size
      });

      // 2. Fetch Top 20 for List
      const q = query(collection(db, "users"), orderBy("xp", "desc"), limit(20));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ ...doc.data() } as LeaderboardEntry));
      setLeaders(data);
    } catch (err) {
      console.error("Leaderboard Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const handleAdjustXP = async (uid: string, currentXP: number, amount: number) => {
    try {
      await updateDoc(doc(db, "users", uid), {
        xp: Math.max(0, (currentXP || 0) + amount)
      });
      fetchLeaderboard();
    } catch (err) {
      console.error("XP Adjust Error:", err);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0A0A0A] flex items-center justify-center z-[200]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-amber-500 font-bold tracking-widest uppercase text-xs animate-pulse">Consulting the Leaderboard Scrolls...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 space-y-10">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold serif text-zinc-100">Leaderboard Oversight</h1>
          <p className="text-zinc-500 italic mt-2">Oversee the ranks and rewards of the batch leaders. Data is 100% live.</p>
        </div>
        <div className="flex items-center gap-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl px-6 py-3">
          <div className="flex flex-col items-center border-r border-zinc-800 pr-6">
            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Active archivists</span>
            <span className="text-xl font-bold text-amber-500">{summary.activeCount}</span>
          </div>
          <div className="flex flex-col items-center pl-6">
            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Total XP Awarded</span>
            <span className="text-xl font-bold text-zinc-100">{summary.totalXP.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Top 3 Spotlight */}
      {leaders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10">
          {leaders.slice(0, 3).map((u, i) => (
            <div key={u.uid} className={`card-blur p-8 rounded-[2.5rem] relative overflow-hidden flex flex-col items-center text-center space-y-4 border-2 ${
              i === 0 ? "border-amber-500/30 scale-105 z-10" : "border-zinc-800/50"
            }`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center absolute top-6 left-6 font-bold text-xl ${
                i === 0 ? "bg-amber-500 text-ink" : "bg-zinc-800 text-zinc-400"
              }`}>
                {i + 1}
              </div>
              
              <div className={`w-24 h-24 rounded-full border-4 p-1 ${
                i === 0 ? "border-amber-500 shadow-2xl shadow-amber-500/20" : "border-zinc-800"
              }`}>
                <div className="w-full h-full rounded-full bg-zinc-900 overflow-hidden">
                  {u.photoURL ? (
                    <img src={u.photoURL} className="w-full h-full object-cover" alt={u.name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-zinc-800">
                      {u.name?.charAt(0)}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold serif text-zinc-100 truncate w-48">{u.name}</h2>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Section {u.section}</p>
              </div>

              <div className="flex items-center gap-2 px-6 py-2 bg-zinc-900 rounded-full border border-zinc-800">
                <Star size={14} className="text-amber-500 fill-amber-500" />
                <span className="font-bold text-amber-500 text-lg">{u.xp || 0}</span>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest ml-1">XP</span>
              </div>

              <div className="pt-4 flex gap-2 w-full">
                <button 
                  onClick={() => handleAdjustXP(u.uid, u.xp || 0, 100)}
                  className="flex-1 py-2 bg-zinc-800 hover:bg-amber-500/10 text-zinc-400 hover:text-amber-500 border border-transparent hover:border-amber-500/20 rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest"
                >
                  Award +100
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* The Rest of the Ranks */}
      <div className="card-blur rounded-3xl overflow-hidden border border-zinc-800/50">
        <div className="p-8 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/30">
          <h3 className="text-xl font-bold serif flex items-center gap-2">
            <TrendingUp size={20} className="text-amber-500" />
            Rank Progress
          </h3>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Showing top 20 archivists</span>
        </div>
        
        <div className="divide-y divide-zinc-800/30">
          {leaders.length === 0 ? (
            <div className="p-20 text-center text-zinc-500 italic">No rankings have been established in the registry yet.</div>
          ) : leaders.slice(3).map((u, i) => (
            <div key={u.uid} className="p-6 flex items-center justify-between group hover:bg-zinc-900/20 transition-all">
              <div className="flex items-center gap-6">
                <span className="w-8 text-xl font-bold text-zinc-700 italic serif group-hover:text-amber-500/50 transition-colors">
                  {i + 4}
                </span>
                <div className="w-10 h-10 rounded-full border border-zinc-800 overflow-hidden bg-zinc-900">
                  {u.photoURL ? (
                    <img src={u.photoURL} className="w-full h-full object-cover" alt={u.name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-bold text-zinc-800">
                      {u.name?.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-zinc-200 serif">{u.name}</p>
                  <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Section {u.section}</p>
                </div>
              </div>

              <div className="flex items-center gap-12">
                <div className="text-center">
                  <p className="text-lg font-bold text-zinc-400 group-hover:text-amber-500 transition-colors">{u.xp || 0}</p>
                  <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">XP Score</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleAdjustXP(u.uid, u.xp || 0, 50)}
                    className="p-3 bg-zinc-900 hover:bg-amber-500/10 text-zinc-600 hover:text-amber-500 rounded-xl border border-transparent hover:border-amber-500/20 transition-all"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button 
                    onClick={() => handleAdjustXP(u.uid, u.xp || 0, -50)}
                    className="p-3 bg-zinc-900 hover:bg-red-900/10 text-zinc-600 hover:text-red-400 rounded-xl border border-transparent hover:border-red-900/20 transition-all"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
