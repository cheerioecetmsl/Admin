"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { GraduationCap, Plus, Trash2, Edit2, X, Camera, Loader2, Search, Filter, History, Trophy, Image as ImageIcon } from "lucide-react";

interface LegacyItem {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  imageURL: string;
  createdAt: any;
}

export default function LegacyManagement() {
  const [items, setItems] = useState<LegacyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    fullDescription: "",
    imageURL: ""
  });

  const fetchLegacy = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "legacy_content"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as LegacyItem));
      setItems(data);
    } catch (err) {
      console.error("Fetch Legacy Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLegacy();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", "Cheerio-2026");
      
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: data }
      );
      
      const resData = await res.json();
      
      if (resData.secure_url) {
        setFormData(prev => ({ ...prev, imageURL: resData.secure_url }));
      } else {
        alert("Forge Error: Failed to upload image.");
      }
    } catch (err) {
      console.error("Upload Error:", err);
      alert("A critical error occurred while communicating with the archives.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, "legacy_content", editingId), formData);
      } else {
        await addDoc(collection(db, "legacy_content"), {
          ...formData,
          createdAt: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ title: "", shortDescription: "", fullDescription: "", imageURL: "" });
      fetchLegacy();
    } catch (err) {
      console.error("Save Legacy Error:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this entry from the legacy archive?")) return;
    try {
      await deleteDoc(doc(db, "legacy_content", id));
      fetchLegacy();
    } catch (err) {
      console.error("Delete Legacy Error:", err);
    }
  };

  return (
    <div className="p-10 space-y-10">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold serif text-zinc-100">Legacy Forge</h1>
          <p className="text-zinc-500 italic mt-2">Document the achievements and milestones of the Department.</p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({ title: "", shortDescription: "", fullDescription: "", imageURL: "" });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-ink rounded-xl font-bold uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-lg"
        >
          <Plus size={18} />
          New Achievement
        </button>
      </div>

      {/* Grid of Legacy Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-20 text-center text-zinc-500 italic">Reading the annals of history...</div>
        ) : items.length === 0 ? (
          <div className="col-span-full py-20 text-center text-zinc-500 italic border-2 border-dashed border-zinc-800 rounded-3xl">
            The legacy vault is currently empty. Begin the documentation.
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="card-blur p-6 rounded-[2.5rem] space-y-4 group relative overflow-hidden flex flex-col">
              <div className="aspect-video rounded-[1.5rem] overflow-hidden bg-zinc-900 border border-zinc-800 relative group-hover:border-amber-500/30 transition-all">
                {item.imageURL ? (
                  <img src={item.imageURL} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-800">
                    <ImageIcon size={48} strokeWidth={1} />
                  </div>
                )}
              </div>
              
              <div className="flex-1 space-y-2">
                <h3 className="text-xl font-bold serif text-zinc-100 leading-tight">{item.title}</h3>
                <p className="text-xs text-zinc-500 italic line-clamp-2">"{item.shortDescription}"</p>
              </div>

              <div className="flex gap-2 w-full pt-4 border-t border-zinc-800/50">
                <button 
                  onClick={() => {
                    setEditingId(item.id);
                    setFormData({
                      title: item.title,
                      shortDescription: item.shortDescription,
                      fullDescription: item.fullDescription,
                      imageURL: item.imageURL
                    });
                    setIsModalOpen(true);
                  }}
                  className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                >
                  Edit Entry
                </button>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="p-3 bg-zinc-900 hover:bg-red-900/30 text-zinc-600 hover:text-red-400 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Legacy Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-[3rem] p-12 shadow-2xl space-y-8 animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-3xl font-bold serif">{editingId ? "Refine History" : "Record Achievement"}</h3>
                <p className="text-zinc-500 text-xs italic mt-1">Every detail matters for the archives.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-zinc-100"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Feature Image</label>
                  <div className="aspect-video w-full rounded-2xl border-2 border-dashed border-zinc-800 overflow-hidden bg-black/20 relative group">
                    {formData.imageURL ? (
                      <img src={formData.imageURL} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700 gap-2">
                        <ImageIcon size={40} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">No Image Uploaded</span>
                      </div>
                    )}
                    {uploading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="animate-spin text-amber-500" /></div>}
                    <input type="file" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                  </div>
                  <p className="text-[9px] text-zinc-600 italic">Click to upload or replace the visual evidence.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Achievement Title</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. National Championship 2025"
                    className="w-full bg-black/40 border border-zinc-800 p-4 rounded-xl outline-none focus:border-amber-500 transition-all text-xl serif"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Short Summary (Card View)</label>
                  <input 
                    type="text"
                    required
                    placeholder="Brief 1-sentence summary..."
                    className="w-full bg-black/40 border border-zinc-800 p-4 rounded-xl outline-none focus:border-amber-500 transition-all text-sm italic serif"
                    value={formData.shortDescription}
                    onChange={e => setFormData({...formData, shortDescription: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Detailed Narrative (Popup View)</label>
                  <textarea 
                    rows={6}
                    required
                    placeholder="Describe the achievement in detail. Mention names, impact, and significance..."
                    className="w-full bg-black/40 border border-zinc-800 p-4 rounded-xl outline-none focus:border-amber-500 transition-all text-sm leading-relaxed serif"
                    value={formData.fullDescription}
                    onChange={e => setFormData({...formData, fullDescription: e.target.value})}
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={uploading || !formData.imageURL}
                className="w-full py-5 bg-amber-500 text-ink rounded-2xl font-bold uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-amber-500/10 disabled:opacity-50"
              >
                {editingId ? "Seal the Archive" : "Forging History"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
