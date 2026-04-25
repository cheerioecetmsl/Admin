"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc, query, orderBy, limit } from "firebase/firestore";
import { Users, Search, Trash2, Filter, MoreVertical, Mail, Hash, Calendar } from "lucide-react";

interface Archivist {
  uid: string;
  name: string;
  email: string;
  year: string;
  section: string;
  xp: number;
  photoCount: number;
  createdAt: string;
  photoURL?: string;
}

export default function ArchivistsRegistry() {
  const [users, setUsers] = useState<Archivist[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Archivist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ ...doc.data() } as Archivist));
      setUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      console.error("Fetch Users Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(u => 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const handleDelete = async (uid: string) => {
    if (!confirm("Remove this archivist from the ledger? This action is permanent.")) return;
    try {
      await deleteDoc(doc(db, "users", uid));
      fetchUsers();
    } catch (err) {
      console.error("Delete User Error:", err);
    }
  };

  return (
    <div className="p-10 space-y-10">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold serif text-zinc-100">Archivist Registry</h1>
          <p className="text-zinc-500 italic mt-2">Manage the identities and legacies of the Batch of 2026.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text"
              placeholder="Search by name or email..."
              className="bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-12 pr-6 outline-none focus:border-amber-500 transition-all text-sm w-80"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-100 transition-all">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* User Table */}
      <div className="card-blur rounded-3xl overflow-hidden border border-zinc-800/50 shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-900/50 border-b border-zinc-800/50">
              <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Archivist</th>
              <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Contact</th>
              <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Identity</th>
              <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-center">Status</th>
              <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-20 text-center text-zinc-500 italic">Reading the registry entries...</td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-20 text-center text-zinc-500 italic">No archivists found in this ledger segment.</td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.uid} className="border-b border-zinc-800/30 hover:bg-zinc-900/20 transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full border border-zinc-800 overflow-hidden bg-zinc-900 shadow-inner">
                        {u.photoURL ? (
                          <img src={u.photoURL} className="w-full h-full object-cover" alt={u.name} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg font-bold text-amber-500/20">
                            {u.name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-100 serif text-lg">{u.name}</p>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Signed on {new Date(u.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <Mail size={12} className="text-zinc-600" />
                        {u.email}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                        <Hash size={10} className="text-zinc-700" />
                        {u.uid.slice(0, 8)}...
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex gap-2">
                      <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                        {u.year}
                      </span>
                      <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        Sec {u.section}
                      </span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-lg font-bold serif text-zinc-100">{u.xp}</span>
                      <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Total XP</span>
                    </div>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleDelete(u.uid)}
                        className="p-3 bg-zinc-900 hover:bg-red-900/30 text-zinc-500 hover:text-red-400 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button className="p-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 rounded-xl transition-all">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
