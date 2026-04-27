"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where, orderBy } from "firebase/firestore";
import { Users, ShieldCheck, GraduationCap, Plus, Trash2, Edit2, X, Camera, Loader2, Search, Filter } from "lucide-react";

interface Person {
  id: string;
  name: string;
  role: string;
  description: string;
  category: 'COUNCIL' | 'LEGEND' | 'FACULTY';
  imageURL?: string;
  instagram?: string;
  facebook?: string;
  github?: string;
  linkedin?: string;
  createdAt: any;
}

export default function PeopleManagement() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'COUNCIL' | 'LEGEND' | 'FACULTY'>('COUNCIL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    description: "",
    category: 'COUNCIL' as 'COUNCIL' | 'LEGEND' | 'FACULTY',
    imageURL: "",
    instagram: "",
    facebook: "",
    github: "",
    linkedin: ""
  });

  const fetchPeople = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "people"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Person));
      setPeople(data);
    } catch (err) {
      console.error("Fetch People Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("Starting portrait upload for:", file.name);
    setUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "Cheerio-2026");
      
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: data }
      );
      
      const resData = await res.json();
      
      if (resData.secure_url) {
        console.log("Portrait Forge successful:", resData.secure_url);
        setFormData(prev => ({ ...prev, imageURL: resData.secure_url }));
      } else {
        console.error("Cloudinary Error Response:", resData);
        alert(`Forge Error: ${resData.error?.message || "Unknown error during portrait upload."}`);
      }
    } catch (err) {
      console.error("Critical Upload Error:", err);
      alert("A critical error occurred while communicating with the portrait archives.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, "people", editingId), formData);
      } else {
        await addDoc(collection(db, "people"), {
          ...formData,
          createdAt: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ name: "", role: "", description: "", category: activeCategory, imageURL: "" });
      fetchPeople();
    } catch (err) {
      console.error("Save Person Error:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this individual from the archive directory?")) return;
    try {
      await deleteDoc(doc(db, "people", id));
      fetchPeople();
    } catch (err) {
      console.error("Delete Person Error:", err);
    }
  };

  const filteredPeople = people.filter(p => p.category === activeCategory);

  return (
    <div className="p-10 space-y-10">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold serif text-zinc-100">The Pantheon Forge</h1>
          <p className="text-zinc-500 italic mt-2">Manage the architects, legends, and mentors of the Batch of 2026.</p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({ name: "", role: "", description: "", category: activeCategory, imageURL: "" });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-ink rounded-xl font-bold uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-lg"
        >
          <Plus size={18} />
          Add to Directory
        </button>
      </div>

      {/* Category Navigation */}
      <div className="flex gap-4 p-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl w-fit">
        <CategoryTab 
          active={activeCategory === 'COUNCIL'} 
          label="The Council" 
          icon={<ShieldCheck size={16} />} 
          onClick={() => setActiveCategory('COUNCIL')} 
        />
        <CategoryTab 
          active={activeCategory === 'LEGEND'} 
          label="The Legends" 
          icon={<Users size={16} />} 
          onClick={() => setActiveCategory('LEGEND')} 
        />
        <CategoryTab 
          active={activeCategory === 'FACULTY'} 
          label="The Mentors" 
          icon={<GraduationCap size={16} />} 
          onClick={() => setActiveCategory('FACULTY')} 
        />
      </div>

      {/* Grid of People */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {loading ? (
          <div className="col-span-full py-20 text-center text-zinc-500 italic">Reading the annals of history...</div>
        ) : filteredPeople.length === 0 ? (
          <div className="col-span-full py-20 text-center text-zinc-500 italic border-2 border-dashed border-zinc-800 rounded-3xl">
            No entries found in this category. Begin forging the legacy.
          </div>
        ) : (
          filteredPeople.map((person) => (
            <div key={person.id} className="card-blur p-6 rounded-[2rem] space-y-4 group relative overflow-hidden flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full border-2 border-zinc-800 overflow-hidden bg-zinc-900 group-hover:border-amber-500/30 transition-all">
                {person.imageURL ? (
                  <img src={person.imageURL} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-zinc-800 uppercase">
                    {person.name.charAt(0)}
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="text-xl font-bold serif text-zinc-100">{person.name}</h3>
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-1">{person.role}</p>
                <p className="text-xs text-zinc-500 italic mt-3 line-clamp-2">"{person.description}"</p>
              </div>

              <div className="flex gap-2 w-full pt-4 border-t border-zinc-800/50">
                <button 
                  onClick={() => {
                    setEditingId(person.id);
                    setFormData({
                      name: person.name,
                      role: person.role,
                      description: person.description,
                      category: person.category,
                      imageURL: person.imageURL || ""
                    });
                    setIsModalOpen(true);
                  }}
                  className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(person.id)}
                  className="p-2 bg-zinc-900 hover:bg-red-900/30 text-zinc-600 hover:text-red-400 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Person Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-[2rem] p-10 shadow-2xl space-y-8 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center">
              <h3 className="text-3xl font-bold serif">{editingId ? "Refine Portrait" : "Add to Pantheon"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-zinc-100"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col items-center gap-4 mb-4">
                <div className="relative w-24 h-24 rounded-full border-2 border-zinc-800 overflow-hidden bg-black/40">
                  {formData.imageURL ? (
                    <img src={formData.imageURL} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700">
                      <Users size={32} />
                    </div>
                  )}
                  {uploading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="animate-spin text-amber-500" /></div>}
                </div>
                <div className="relative">
                  <input type="file" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                  <button type="button" className="text-[10px] font-bold text-amber-500 uppercase tracking-widest hover:underline flex items-center gap-2">
                    <Camera size={14} /> Upload Portrait
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Full Name</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Dr. Albus Dumbledore"
                    className="w-full bg-black/40 border border-zinc-800 p-4 rounded-xl outline-none focus:border-amber-500 transition-all text-lg serif"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Role / Designation</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Head of Department"
                    className="w-full bg-black/40 border border-zinc-800 p-4 rounded-xl outline-none focus:border-amber-500 transition-all text-sm font-bold uppercase tracking-widest"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Brief Narrative</label>
                  <textarea 
                    rows={3}
                    placeholder="A brief legacy note..."
                    className="w-full bg-black/40 border border-zinc-800 p-4 rounded-xl outline-none focus:border-amber-500 transition-all text-sm italic serif"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Pantheon Category</label>
                  <select 
                    className="w-full bg-black/40 border border-zinc-800 p-4 rounded-xl outline-none focus:border-amber-500 transition-all text-sm font-bold uppercase tracking-widest appearance-none"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value as any})}
                  >
                    <option value="COUNCIL">THE COUNCIL</option>
                    <option value="LEGEND">THE LEGENDS</option>
                    <option value="FACULTY">THE MENTORS</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800/50">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Instagram URL</label>
                    <input 
                      type="url"
                      placeholder="https://..."
                      className="w-full bg-black/40 border border-zinc-800 p-3 rounded-xl outline-none focus:border-amber-500 transition-all text-xs"
                      value={formData.instagram}
                      onChange={e => setFormData({...formData, instagram: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Facebook URL</label>
                    <input 
                      type="url"
                      placeholder="https://..."
                      className="w-full bg-black/40 border border-zinc-800 p-3 rounded-xl outline-none focus:border-amber-500 transition-all text-xs"
                      value={formData.facebook}
                      onChange={e => setFormData({...formData, facebook: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">GitHub URL</label>
                    <input 
                      type="url"
                      placeholder="https://..."
                      className="w-full bg-black/40 border border-zinc-800 p-3 rounded-xl outline-none focus:border-amber-500 transition-all text-xs"
                      value={formData.github}
                      onChange={e => setFormData({...formData, github: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">LinkedIn URL</label>
                    <input 
                      type="url"
                      placeholder="https://..."
                      className="w-full bg-black/40 border border-zinc-800 p-3 rounded-xl outline-none focus:border-amber-500 transition-all text-xs"
                      value={formData.linkedin}
                      onChange={e => setFormData({...formData, linkedin: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={uploading}
                className="w-full py-5 bg-amber-500 text-ink rounded-2xl font-bold uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-amber-500/10 disabled:opacity-50"
              >
                {editingId ? "Save Legacy" : "Add to Directory"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function CategoryTab({ active, label, icon, onClick }: { active: boolean, label: string, icon: React.ReactNode, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`px-6 py-3 rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-widest transition-all ${
        active 
          ? "bg-amber-500 text-ink shadow-lg shadow-amber-500/20 scale-105" 
          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
