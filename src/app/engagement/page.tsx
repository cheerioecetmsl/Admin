"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { Play, Square, Trophy, Trash2, Plus, Clock, Users, Vote, LayoutGrid } from "lucide-react";
import Link from "next/link";

export default function LiveCommand() {
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "engagement_modules"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setModules(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'completed' : 'active';
    await updateDoc(doc(db, "engagement_modules", id), {
      status: nextStatus
    });
  };

  const deleteModule = async (id: string) => {
    if (confirm("Are you sure? This will delete all responses too.")) {
      await deleteDoc(doc(db, "engagement_modules", id));
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto pb-32">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold serif text-amber-500 uppercase tracking-tighter">Engagement Control</h1>
          <p className="text-zinc-500 text-sm uppercase tracking-widest mt-2">Manage live experiences and results.</p>
        </div>
        <Link 
          href="/engagement/forge"
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black font-bold px-6 py-3 rounded-2xl transition-all shadow-xl shadow-amber-500/20 uppercase tracking-widest text-xs"
        >
          <Plus size={18} /> New Module
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-zinc-500 animate-pulse uppercase tracking-[0.3em] text-xs">
          Syncing with neural link...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {modules.map((m) => (
            <div 
              key={m.id} 
              className={`p-6 rounded-3xl border transition-all flex items-center gap-6 ${
                m.status === 'active' 
                  ? "bg-amber-500/5 border-amber-500/50 shadow-lg shadow-amber-500/5" 
                  : "bg-zinc-900/50 border-zinc-800"
              }`}
            >
              <div className={`p-4 rounded-2xl ${
                m.type === 'poll' ? "bg-blue-500/10 text-blue-500" : 
                m.type === 'game' ? "bg-purple-500/10 text-purple-500" : 
                "bg-amber-500/10 text-amber-500"
              }`}>
                {m.type === 'poll' ? <Vote size={24} /> : m.type === 'game' ? <LayoutGrid size={24} /> : <Trophy size={24} />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                    m.status === 'active' ? "bg-amber-500 text-black border-amber-500 animate-pulse" : 
                    m.status === 'completed' ? "text-zinc-500 border-zinc-700" : "text-zinc-400 border-zinc-800"
                  }`}>
                    {m.status}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                    {new Date(m.createdAt?.seconds * 1000).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-zinc-200 serif">{m.title}</h3>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <Users size={12} /> {m.targetAudience.join(', ')}
                  </div>
                  {m.type === 'poll' && (
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      {m.config.options.length} Options
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {m.status !== 'completed' && (
                  <button 
                    onClick={() => toggleStatus(m.id, m.status)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${
                      m.status === 'active' 
                        ? "bg-zinc-800 text-zinc-400 hover:bg-zinc-700" 
                        : "bg-amber-500 text-black hover:bg-amber-600"
                    }`}
                  >
                    {m.status === 'active' ? <><Square size={14} /> Stop</> : <><Play size={14} /> Launch</>}
                  </button>
                )}
                
                {m.status === 'completed' && (
                  <button 
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-500 font-bold text-[10px] uppercase tracking-widest hover:bg-blue-500/20 transition-all"
                  >
                    <Trophy size={14} /> Publish Results
                  </button>
                )}

                <button 
                  onClick={() => deleteModule(m.id)}
                  className="p-3 text-zinc-600 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}

          {modules.length === 0 && (
            <div className="py-20 text-center border-2 border-dashed border-zinc-800 rounded-[3rem]">
              <p className="text-zinc-600 serif italic">The forge is cold. Create your first module to begin.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
