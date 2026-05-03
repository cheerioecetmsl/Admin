"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Activity, Users, Clock, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActiveUser {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  onlineSince?: any;
  status: string;
}

export default function LiveStatusPage() {
  const [onlineUsers, setOnlineUsers] = useState<ActiveUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "users"),
      where("status", "==", "online")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      } as ActiveUser));
      setOnlineUsers(users);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="p-10 space-y-10 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold serif text-zinc-100 flex items-center gap-4">
            Live Status
            <span className="flex h-3 w-3 rounded-full bg-green-500 animate-pulse" />
          </h1>
          <p className="text-zinc-500 italic mt-2">
            Monitoring active sessions on the main website in real-time.
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-3 flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Active Now</span>
            <span className="text-2xl font-bold text-green-500">{onlineUsers.length}</span>
          </div>
          <div className="w-px h-8 bg-zinc-800" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Platform</span>
            <span className="text-xs font-bold text-zinc-300">Production Main</span>
          </div>
        </div>
      </div>

      {/* Main Display Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-amber-500 border-r-2 border-transparent" />
            <p className="text-zinc-500 mt-4 italic">Synchronizing with production heartbeat...</p>
          </div>
        ) : onlineUsers.length === 0 ? (
          <div className="col-span-full card-blur border border-zinc-800/50 rounded-3xl p-20 text-center space-y-4">
            <Activity size={48} className="mx-auto text-zinc-700" />
            <div>
              <p className="text-zinc-400 font-medium">No users are currently on display.</p>
              <p className="text-zinc-600 text-sm italic">The network is currently quiet. Offline users will not appear here.</p>
            </div>
          </div>
        ) : (
          onlineUsers.map((user) => (
            <div 
              key={user.uid}
              className="card-blur border border-zinc-800/50 rounded-3xl p-6 hover:border-green-500/30 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                <div className="flex h-2 w-2 rounded-full bg-green-500" />
              </div>

              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-950 shadow-inner flex-shrink-0">
                  {user.photoURL ? (
                    <img src={user.photoURL} className="w-full h-full object-cover" alt={user.name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl font-bold text-amber-500/20">
                      {user.name?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-zinc-100 truncate serif">{user.name}</h3>
                  <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-zinc-800/50 space-y-3">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-zinc-600 flex items-center gap-2">
                    <Clock size={12} />
                    Live Since
                  </span>
                  <span className="text-green-500">
                    {user.onlineSince ? formatDistanceToNow(user.onlineSince.toDate ? user.onlineSince.toDate() : new Date(user.onlineSince), { addSuffix: false }) : "Just now"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-zinc-600 flex items-center gap-2">
                    <Users size={12} />
                    Status
                  </span>
                  <span className="text-zinc-400">On Display</span>
                </div>
              </div>
              
              <div className="mt-6 flex gap-2">
                <button className="flex-1 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-[9px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-all">
                  Profile
                </button>
                <button className="px-3 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-all">
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx global>{`
        .card-blur {
          background: rgba(10, 10, 10, 0.4);
          backdrop-filter: blur(20px);
        }
      `}</style>
    </div>
  );
}
