"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { Check, X, User, Star, GraduationCap, Clock } from "lucide-react";

export default function ApprovalPage({ type }: { type: "LEGEND" | "FACULTY" }) {
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "users"), 
      where("category", "==", type),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [type]);

  const handleAction = async (uid: string, status: "approved" | "rejected") => {
    try {
      await updateDoc(doc(db, "users", uid), { status });
    } catch (err) {
      console.error(err);
      alert("Action failed");
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-1000">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-gold">
            {type === "LEGEND" ? <Star size={20} /> : <GraduationCap size={20} />}
            <span className="text-[10px] font-bold uppercase tracking-[0.4em]">Archival Approvals</span>
          </div>
          <h1 className="text-4xl font-bold text-zinc-100 serif">
            Pending {type === "LEGEND" ? "Seniors" : "Faculty"}
          </h1>
        </div>
        <div className="px-4 py-2 bg-zinc-900 border border-gold/10 rounded-full">
          <span className="text-[10px] font-bold text-gold uppercase tracking-widest flex items-center gap-2">
            <Clock size={12} /> {pendingUsers.length} Pending
          </span>
        </div>
      </div>

      {loading ? (
        <div className="p-20 text-center text-gold/20 animate-pulse serif italic text-2xl">Consulting the Registry...</div>
      ) : pendingUsers.length === 0 ? (
        <div className="p-32 text-center glass-card rounded-[3rem] border-dashed border-gold/10">
          <div className="w-20 h-20 bg-gold/5 rounded-full flex items-center justify-center mx-auto mb-6 text-gold/20">
             <Check size={40} />
          </div>
          <p className="text-zinc-500 italic serif text-xl">The ledger is clean. No pending approvals.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingUsers.map(user => (
            <div key={user.id} className="glass-card overflow-hidden group border-gold/10 hover:border-gold/30 transition-all duration-500">
              <div className="h-48 relative">
                <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-4 left-6">
                  <h3 className="text-xl font-bold text-zinc-100 serif uppercase tracking-widest">{user.name}</h3>
                  <p className="text-[10px] text-gold font-bold uppercase tracking-widest">{user.role || user.year || "Station Undefined"}</p>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-gold/40 uppercase tracking-widest">Narrative</span>
                    <p className="text-zinc-400 text-sm italic serif line-clamp-3">"{user.narrative || "No legacy note provided."}"</p>
                  </div>
                  {user.univRollNo && (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      <span>Roll No:</span>
                      <span className="text-zinc-300">{user.univRollNo}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-6 border-t border-gold/5">
                  <button 
                    onClick={() => handleAction(user.id, "approved")}
                    className="flex-1 py-3 bg-gold text-ink rounded-xl font-bold uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <Check size={14} /> Approve
                  </button>
                  <button 
                    onClick={() => handleAction(user.id, "rejected")}
                    className="flex-1 py-3 bg-zinc-900 text-zinc-500 border border-gold/10 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-red-900/20 hover:text-red-400 hover:border-red-900/50 transition-all flex items-center justify-center gap-2"
                  >
                    <X size={14} /> Deny
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
