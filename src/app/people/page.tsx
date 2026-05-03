"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy, writeBatch, where } from "firebase/firestore";
import { Users, ShieldCheck, GraduationCap, Plus, Trash2, X, Camera, Loader2, ChevronUp, ChevronDown, GripVertical, Save } from "lucide-react";
import { Reorder, useDragControls } from "framer-motion";

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
  order?: number;
  sourceCollection?: 'people' | 'users';
  status?: string;
  lastSeen?: any;
}

export default function PeopleManagement() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'COUNCIL' | 'LEGEND' | 'FACULTY'>('COUNCIL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [orderDirty, setOrderDirty] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  
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
    setFetchError(null);
    try {
      const q = query(collection(db, "people"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const peopleData = snap.docs.map(doc => ({ id: doc.id, ...doc.data(), sourceCollection: 'people' } as Person));
      
      // Fetch without status to avoid composite index requirements, then filter in-memory
      const qLegend = query(collection(db, "users"), where("category", "==", "LEGEND"));
      const qFaculty = query(collection(db, "users"), where("category", "==", "FACULTY"));
      
      const [legendSnap, facultySnap] = await Promise.all([getDocs(qLegend), getDocs(qFaculty)]);
      
      const formatUser = (doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || "Unknown",
          role: data.role || (data.category === 'LEGEND' ? 'Senior' : 'Faculty'),
          description: data.narrative || data.description || "Member of the Pantheon",
          category: data.category as 'LEGEND' | 'FACULTY',
          imageURL: data.photoURL || data.imageURL || "",
          instagram: data.instagram || "",
          facebook: data.facebook || "",
          github: data.github || "",
          linkedin: data.linkedin || "",
          createdAt: data.createdAt || new Date().toISOString(),
          order: data.order,
          sourceCollection: 'users',
          status: data.status,
          lastSeen: data.lastSeen
        } as Person;
      };

      const usersData = [...legendSnap.docs, ...facultySnap.docs]
        .filter(doc => doc.data().status === "approved")
        .map(formatUser);

      setPeople([...peopleData, ...usersData]);
    } catch (err: any) {
      console.error("Fetch People Error:", err);
      setFetchError(err.message || "Unknown error fetching data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  /** Sort filtered people: use `order` field if available, otherwise fall back to createdAt (first in = first shown) */
  const getSortedFiltered = useCallback((allPeople: Person[], category: 'COUNCIL' | 'LEGEND' | 'FACULTY') => {
    const filtered = allPeople.filter(p => p.category === category);
    return filtered.sort((a, b) => {
      const aOrder = a.order ?? Infinity;
      const bOrder = b.order ?? Infinity;
      if (aOrder !== Infinity || bOrder !== Infinity) {
        return aOrder - bOrder;
      }
      // Fallback: createdAt ascending (first uploaded = first shown)
      const aDate = a.createdAt || "";
      const bDate = b.createdAt || "";
      return aDate.localeCompare(bDate);
    });
  }, []);

  const filteredPeople = getSortedFiltered(people, activeCategory);

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
        const targetPerson = people.find(p => p.id === editingId);
        const targetCollection = targetPerson?.sourceCollection || 'people';
        if (targetCollection === 'users') {
          await updateDoc(doc(db, "users", editingId), {
            name: formData.name,
            role: formData.role,
            narrative: formData.description,
            category: formData.category,
            photoURL: formData.imageURL,
            instagram: formData.instagram,
            facebook: formData.facebook,
            github: formData.github,
            linkedin: formData.linkedin,
          });
        } else {
          await updateDoc(doc(db, "people", editingId), formData);
        }
      } else {
        // New entries get an order value at the end of their category
        const categoryPeople = people.filter(p => p.category === formData.category);
        const maxOrder = categoryPeople.reduce((max, p) => Math.max(max, p.order ?? 0), 0);
        await addDoc(collection(db, "people"), {
          ...formData,
          createdAt: new Date().toISOString(),
          order: maxOrder + 1
        });
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ name: "", role: "", description: "", category: activeCategory, imageURL: "", instagram: "", facebook: "", github: "", linkedin: "" });
      fetchPeople();
    } catch (err) {
      console.error("Save Person Error:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this individual from the archive directory?")) return;
    try {
      const targetPerson = people.find(p => p.id === id);
      const targetCollection = targetPerson?.sourceCollection || 'people';
      
      if (targetCollection === 'users') {
        // For users, we reject them instead of fully deleting from users collection
        // so they can potentially re-apply or just be hidden from the active directory.
        await updateDoc(doc(db, "users", id), { status: "rejected" });
      } else {
        await deleteDoc(doc(db, "people", id));
      }
      
      fetchPeople();
    } catch (err) {
      console.error("Delete Person Error:", err);
    }
  };

  /* ======================================== */
  /* REORDER LOGIC                            */
  /* ======================================== */

  /** Move a person up or down in the list by 1 position */
  const moveItem = (index: number, direction: 'up' | 'down') => {
    const list = [...filteredPeople];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    // Swap
    [list[index], list[targetIndex]] = [list[targetIndex], list[index]];

    // Assign new order values
    const updatedAll = people.map(p => {
      const idxInList = list.findIndex(l => l.id === p.id);
      if (idxInList !== -1) {
        return { ...p, order: idxInList };
      }
      return p;
    });

    setPeople(updatedAll);
    setOrderDirty(true);
  };

  /** Handle drag reorder from framer-motion */
  const handleReorder = (newOrder: Person[]) => {
    // Assign sequential order values
    const reorderedIds = new Set(newOrder.map(p => p.id));
    const updatedAll = people.map(p => {
      const idxInNew = newOrder.findIndex(n => n.id === p.id);
      if (idxInNew !== -1) {
        return { ...p, order: idxInNew };
      }
      return p;
    });

    setPeople(updatedAll);
    setOrderDirty(true);
  };

  /** Persist order to Firestore using batch write */
  const saveOrder = async () => {
    setSavingOrder(true);
    try {
      const batch = writeBatch(db);
      const currentFiltered = getSortedFiltered(people, activeCategory);
      currentFiltered.forEach((person, index) => {
        const coll = person.sourceCollection || 'people';
        const ref = doc(db, coll, person.id);
        batch.update(ref, { order: index });
      });
      await batch.commit();
      setOrderDirty(false);
    } catch (err) {
      console.error("Save Order Error:", err);
      alert("Failed to save order. Please try again.");
    } finally {
      setSavingOrder(false);
    }
  };

  return (
    <div className="p-10 space-y-10">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold serif text-zinc-100">The Pantheon Forge</h1>
          <p className="text-zinc-500 italic mt-2">Manage the architects, legends, and mentors of the Batch of 2026.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Save Order Button — only visible when order has changed */}
          {orderDirty && (
            <button 
              onClick={saveOrder}
              disabled={savingOrder}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-black rounded-xl font-bold uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {savingOrder ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Order
            </button>
          )}
          {activeCategory === 'COUNCIL' && (
            <button 
              onClick={() => {
                setEditingId(null);
                setFormData({ name: "", role: "", description: "", category: activeCategory, imageURL: "", instagram: "", facebook: "", github: "", linkedin: "" });
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-ink rounded-xl font-bold uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-lg"
            >
              <Plus size={18} />
              Add to Directory
            </button>
          )}
        </div>
      </div>

      {/* Category Navigation */}
      <div className="flex gap-4 p-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl w-fit">
        <CategoryTab 
          active={activeCategory === 'COUNCIL'} 
          label="The Council" 
          icon={<ShieldCheck size={16} />} 
          onClick={() => { setActiveCategory('COUNCIL'); setOrderDirty(false); }} 
        />
        <CategoryTab 
          active={activeCategory === 'LEGEND'} 
          label="The Legends" 
          icon={<Users size={16} />} 
          onClick={() => { setActiveCategory('LEGEND'); setOrderDirty(false); }} 
        />
        <CategoryTab 
          active={activeCategory === 'FACULTY'} 
          label="The Mentors" 
          icon={<GraduationCap size={16} />} 
          onClick={() => { setActiveCategory('FACULTY'); setOrderDirty(false); }} 
        />
      </div>

      {fetchError && (
        <div className="p-6 bg-red-900/20 border border-red-500/50 rounded-2xl text-red-400">
          <h3 className="font-bold text-lg mb-2">Error Loading Data</h3>
          <p className="font-mono text-xs break-all">{fetchError}</p>
        </div>
      )}

      {/* Reorderable List of People */}
      {loading ? (
        <div className="py-20 text-center text-zinc-500 italic">Reading the annals of history...</div>
      ) : filteredPeople.length === 0 ? (
        <div className="py-20 text-center text-zinc-500 italic border-2 border-dashed border-zinc-800 rounded-3xl">
          No entries found in this category. Begin forging the legacy.
        </div>
      ) : (
        <Reorder.Group
          axis="y"
          values={filteredPeople}
          onReorder={handleReorder}
          className="space-y-3"
        >
          {filteredPeople.map((person, index) => (
            <ReorderableCard
              key={person.id}
              person={person}
              index={index}
              total={filteredPeople.length}
              onMoveUp={() => moveItem(index, 'up')}
              onMoveDown={() => moveItem(index, 'down')}
              onEdit={() => {
                setEditingId(person.id);
                setFormData({
                  name: person.name,
                  role: person.role,
                  description: person.description,
                  category: person.category,
                  imageURL: person.imageURL || "",
                  instagram: person.instagram || "",
                  facebook: person.facebook || "",
                  github: person.github || "",
                  linkedin: person.linkedin || ""
                });
                setIsModalOpen(true);
              }}
              onDelete={() => handleDelete(person.id)}
            />
          ))}
        </Reorder.Group>
      )}

      {/* Person Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-[2rem] p-10 shadow-2xl space-y-8 animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
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
                    disabled={!editingId && activeCategory !== 'COUNCIL'}
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

/* ======================================== */
/* REORDERABLE CARD COMPONENT              */
/* ======================================== */
interface ReorderableCardProps {
  person: Person;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function ReorderableCard({ person, index, total, onMoveUp, onMoveDown, onEdit, onDelete }: ReorderableCardProps) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={person}
      dragListener={false}
      dragControls={dragControls}
      className="flex items-center gap-4 card-blur rounded-2xl border border-zinc-800/50 p-4 group hover:border-amber-500/20 transition-all"
      whileDrag={{
        scale: 1.02,
        boxShadow: "0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(245,158,11,0.3)",
        zIndex: 50,
      }}
    >
      {/* Order Number */}
      <div className="w-8 text-center text-zinc-600 text-xs font-bold tabular-nums select-none">
        #{index + 1}
      </div>

      {/* Drag Handle */}
      <div
        onPointerDown={(e) => dragControls.start(e)}
        className="cursor-grab active:cursor-grabbing p-2 rounded-lg hover:bg-zinc-800 text-zinc-600 hover:text-amber-500 transition-all touch-none select-none"
        title="Drag to reorder"
      >
        <GripVertical size={20} />
      </div>

      {/* Up / Down Arrows */}
      <div className="flex flex-col gap-0.5">
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          className="p-1 rounded hover:bg-zinc-800 text-zinc-600 hover:text-amber-500 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          title="Move up"
        >
          <ChevronUp size={16} />
        </button>
        <button
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="p-1 rounded hover:bg-zinc-800 text-zinc-600 hover:text-amber-500 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          title="Move down"
        >
          <ChevronDown size={16} />
        </button>
      </div>

      {/* Avatar */}
      <div className="relative">
        <div className="w-14 h-14 rounded-full border-2 border-zinc-800 overflow-hidden bg-zinc-900 flex-shrink-0 group-hover:border-amber-500/30 transition-all">
          {person.imageURL ? (
            <img src={person.imageURL} className="w-full h-full object-cover" alt={person.name} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg font-bold text-zinc-700 uppercase">
              {person.name.charAt(0)}
            </div>
          )}
        </div>
        {person.status === 'online' && (
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-[3px] border-[#0A0A0A] rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-bold serif text-zinc-100 truncate">{person.name}</h3>
        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-0.5">{person.role}</p>
        <p className="text-xs text-zinc-500 italic mt-1 line-clamp-1 max-w-md">"{person.description}"</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-shrink-0">
        <button 
          onClick={onEdit}
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
        >
          Edit
        </button>
        <button 
          onClick={onDelete}
          className="p-2 bg-zinc-900 hover:bg-red-900/30 text-zinc-600 hover:text-red-400 rounded-lg transition-all"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </Reorder.Item>
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