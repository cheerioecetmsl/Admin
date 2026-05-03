"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot,
  orderBy,
  where
} from "firebase/firestore";
import { 
  Shield, 
  UserX, 
  VolumeX, 
  UserCheck, 
  Plus, 
  Trash2, 
  Search, 
  Loader2,
  AlertCircle,
  MessageSquare
} from "lucide-react";

export default function ModerationPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to admin emails
    const unsubAdmins = onSnapshot(collection(db, "admin_emails"), (snap) => {
      setAdmins(snap.docs.map(doc => ({ email: doc.id, ...doc.data() })));
    });

    // Listen to users for moderation
    const unsubUsers = onSnapshot(query(collection(db, "users"), orderBy("createdAt", "desc")), (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubAdmins();
      unsubUsers();
    };
  }, []);

  const addAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;
    try {
      await setDoc(doc(db, "admin_emails", newAdminEmail.toLowerCase()), {
        addedAt: new Date().toISOString(),
        role: "admin"
      });
      setNewAdminEmail("");
    } catch (error) {
      alert("Failed to add admin");
    }
  };

  const removeAdmin = async (email: string) => {
    if (confirm(`Remove ${email} from admins?`)) {
      await deleteDoc(doc(db, "admin_emails", email));
    }
  };

  const toggleMute = async (userId: string, currentMuted: boolean) => {
    await updateDoc(doc(db, "users", userId), { isMuted: !currentMuted });
  };

  const toggleBan = async (userId: string, currentBanned: boolean) => {
    if (confirm(`${currentBanned ? 'Unban' : 'Ban'} this user?`)) {
      await updateDoc(doc(db, "users", userId), { isBanned: !currentBanned });
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Shield className="text-blue-500" /> Community Moderation
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Admin Management */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-6 card-blur rounded-[2rem] border border-zinc-800/50">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-zinc-100 serif">
              <Shield size={18} className="text-amber-500" /> Admin Access
            </h2>
            <form onSubmit={addAdmin} className="flex gap-2 mb-6">
              <input 
                type="email" 
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="Admin Email"
                className="flex-1 px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-sm text-zinc-200"
              />
              <button type="submit" className="p-2 bg-amber-500 text-black rounded-xl hover:bg-amber-600 transition-colors">
                <Plus size={20} />
              </button>
            </form>

            <div className="space-y-2">
              {admins.map(admin => (
                <div key={admin.email} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/50 group">
                  <span className="text-xs font-medium truncate max-w-[150px] text-zinc-400">{admin.email}</span>
                  <button 
                    onClick={() => removeAdmin(admin.email)}
                    className="text-zinc-600 hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-6 bg-amber-500/5 rounded-[2rem] border border-amber-500/10 space-y-2">
            <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2">
              <AlertCircle size={16} /> Quick Note
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed italic">
              Admins added here can delete any message, mute users, and ban violators from the chat. Changes are instant.
            </p>
          </div>
        </div>

        {/* User Moderation */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 card-blur rounded-[2rem] border border-zinc-800/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2 text-zinc-100 serif">
                <UserX size={18} className="text-red-500" /> User Controls
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search archivists..."
                  className="pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-sm w-64 text-zinc-200"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-slate-300" size={40} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-800/50">
                      <th className="pb-4 pl-2">User</th>
                      <th className="pb-4 text-center">Chat Mute</th>
                      <th className="pb-4 text-center">Status</th>
                      <th className="pb-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/30">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="group">
                        <td className="py-4 pl-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full border border-zinc-800 overflow-hidden bg-zinc-900">
                              {user.photoURL ? (
                                <img src={user.photoURL} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-amber-500/20">
                                  {user.name?.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-zinc-100 serif">{user.name}</div>
                              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <button 
                            onClick={() => toggleMute(user.id, user.isMuted)}
                            className={`p-2 rounded-xl transition-all ${user.isMuted ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-zinc-900 text-zinc-500 hover:text-zinc-200 border border-zinc-800'}`}
                            title={user.isMuted ? "Unmute User" : "Mute User"}
                          >
                            <VolumeX size={18} />
                          </button>
                        </td>
                        <td className="py-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${user.isBanned ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                            {user.isBanned ? 'Banned' : 'Active'}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button 
                            onClick={() => toggleBan(user.id, user.isBanned)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${user.isBanned ? 'bg-green-600 text-black hover:bg-green-700' : 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-black'}`}
                          >
                            {user.isBanned ? 'Unban' : 'Ban User'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
