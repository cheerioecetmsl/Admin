"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { Megaphone, Plus, Trash2, Edit2, X, Calendar, Tag, Image as ImageIcon, Film, Music, Upload, Loader2, Play, Check, Camera, Layers } from "lucide-react";
import { uploadBatch } from "@/lib/uploadHelper";
import { getAssetSources } from "@/lib/imageStorage";

interface MediaAsset {
  url: string;
  type: 'image' | 'video' | 'audio';
}

interface HypeItem {
  id: string;
  title: string;
  content: string;
  date: string;
  tag: string;
  mediaGallery?: MediaAsset[];
  mediaURL?: string; // Legacy support
  mediaType?: 'image' | 'video' | 'audio'; // Legacy support
  createdAt: any;
}

export default function HypeForge() {
  const [items, setItems] = useState<HypeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    tag: "NEWS",
    mediaGallery: [] as MediaAsset[]
  });

  const fetchHype = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "hype_board"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as HypeItem));
      setItems(data);
    } catch (err) {
      console.error("Fetch Hype Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHype();
  }, []);

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'audio') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadedAssets = await uploadBatch(files, type, "Images");
      setFormData(prev => ({ 
        ...prev, 
        mediaGallery: [...prev.mediaGallery, ...uploadedAssets as any]
      }));
    } catch (err) {
      console.error("Upload Error:", err);
      alert("Sequential upload failed. Check your Cloudinary connection.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, "hype_board", editingId), formData);
      } else {
        await addDoc(collection(db, "hype_board"), {
          ...formData,
          createdAt: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ 
        title: "", 
        content: "", 
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), 
        tag: "NEWS", 
        mediaGallery: [] 
      });
      fetchHype();
    } catch (err) {
      console.error("Save Hype Error:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("This will permanently remove the update from the Batch broadcast. Proceed?")) return;
    try {
      await deleteDoc(doc(db, "hype_board", id));
      fetchHype();
    } catch (err) {
      console.error("Delete Hype Error:", err);
    }
  };

  const removeAsset = (index: number) => {
    setFormData(prev => ({
      ...prev,
      mediaGallery: prev.mediaGallery.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="p-10 space-y-10">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold serif text-zinc-100">Notification Bar Forge</h1>
          <p className="text-zinc-500 italic mt-2">Forge multimedia milestones and broadcast updates to the batch.</p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({ 
              title: "", 
              content: "", 
              date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), 
              tag: "NEWS", 
              mediaGallery: [] 
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-ink rounded-xl font-bold uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-lg"
        >
          <Plus size={18} />
          Create Multimedia Update
        </button>
      </div>

      {/* Grid of Hype Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <Loader2 className="animate-spin mx-auto text-amber-500 mb-4" size={32} />
            <p className="text-zinc-500 italic">Syncing with the broadcast ledger...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="col-span-full py-20 text-center text-zinc-500 italic border-2 border-dashed border-zinc-800 rounded-3xl">
            The board is silent. Forge your first multimedia update.
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="card-blur p-8 rounded-3xl space-y-6 relative group overflow-hidden flex flex-col">
              
              {/* Media Preview in Card */}
              {(item.mediaGallery && item.mediaGallery.length > 0) ? (
                <div className="grid grid-cols-2 gap-2 w-full rounded-2xl overflow-hidden mb-4 border border-zinc-800 bg-black/40 group-hover:border-amber-500/30 transition-all">
                  {item.mediaGallery.slice(0, 4).map((asset, idx) => (
                    <div key={idx} className="relative aspect-square w-full overflow-hidden">
                      {asset.type === 'image' && <img src={getAssetSources(asset.url).webp} className="w-full h-full object-cover" />}
                      {asset.type === 'video' && <div className="w-full h-full flex items-center justify-center bg-zinc-900"><Film size={20} className="text-zinc-700" /></div>}
                      {asset.type === 'audio' && <div className="w-full h-full flex items-center justify-center bg-zinc-900"><Music size={20} className="text-zinc-700" /></div>}
                      {idx === 3 && item.mediaGallery!.length > 4 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-xs">
                          +{item.mediaGallery!.length - 4} More
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : item.mediaURL ? (
                <div className="w-full rounded-2xl overflow-hidden mb-4 border border-zinc-800 bg-black/40 group-hover:border-amber-500/30 transition-all">
                  {item.mediaType === 'image' && <img src={item.mediaURL} className="w-full h-auto object-contain" />}
                  {item.mediaType === 'video' && <div className="w-full aspect-video flex items-center justify-center bg-zinc-900"><Film size={32} className="text-zinc-700" /></div>}
                  {item.mediaType === 'audio' && <div className="w-full aspect-video flex items-center justify-center bg-zinc-900"><Music size={32} className="text-zinc-700" /></div>}
                </div>
              ) : null}

              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.3em]">{item.tag}</span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => {
                      setEditingId(item.id);
                      setFormData({ 
                        title: item.title, 
                        content: item.content, 
                        date: item.date, 
                        tag: item.tag, 
                        mediaGallery: item.mediaGallery || (item.mediaURL ? [{url: item.mediaURL, type: item.mediaType as any}] : [])
                      });
                      setIsModalOpen(true);
                    }}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-100 transition-all"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-2 bg-zinc-800 hover:bg-red-900/30 rounded-lg text-zinc-400 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-4 flex-1">
                <h2 className="text-2xl font-bold serif text-zinc-100 leading-tight">{item.title}</h2>
                <p className="text-zinc-500 italic text-sm leading-relaxed">"{item.content}"</p>
              </div>

              <div className="flex items-center gap-2 text-zinc-600 text-[10px] font-bold uppercase pt-4 border-t border-zinc-800/50">
                <Calendar size={12} />
                {item.date}
                {(item.mediaGallery && item.mediaGallery.length > 0) && (
                  <>
                    <span className="mx-2">•</span>
                    <span className="text-amber-500/50 flex items-center gap-1">
                      <Layers size={10} />
                      {item.mediaGallery.length} ASSETS ATTACHED
                    </span>
                  </>
                )}
              </div>

              <button 
                onClick={() => handleDelete(item.id)}
                className="mt-6 w-full py-3 bg-red-900/10 border border-red-900/20 text-red-500 rounded-xl text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 hover:bg-red-900/30 transition-all"
              >
                Permanently Delete
              </button>
            </div>
          ))
        )}
      </div>

      {/* Forge Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-[2rem] p-10 shadow-2xl space-y-8 animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center">
              <h3 className="text-3xl font-bold serif">{editingId ? "Refine Milestone" : "Forge Multimedia Update"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-zinc-100"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Update Title</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Cinematic Premiere"
                    className="w-full bg-black/40 border border-zinc-800 p-4 rounded-xl outline-none focus:border-amber-500 transition-all text-lg serif"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Tag / Category</label>
                  <select 
                    className="w-full bg-black/40 border border-zinc-800 p-4 rounded-xl outline-none focus:border-amber-500 transition-all text-sm appearance-none"
                    value={formData.tag}
                    onChange={e => setFormData({...formData, tag: e.target.value})}
                  >
                    <option>NEWS</option>
                    <option>VENUE</option>
                    <option>MILESTONE</option>
                    <option>THEME</option>
                    <option>TRAILER</option>
                    <option>AUDIO</option>
                  </select>
                </div>
              </div>

              {/* Multimedia Upload Section */}
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Attach Media Assets (Select Multiple)</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <MediaUploadButton 
                    icon={<ImageIcon size={20} />} 
                    label="Imgs" 
                    type="image" 
                    multiple
                    onUpload={(e) => handleMediaUpload(e, 'image')}
                  />
                  <MediaUploadButton 
                    icon={<Camera size={20} />} 
                    label="Snap" 
                    type="image" 
                    capture="environment"
                    onUpload={(e) => handleMediaUpload(e, 'image')}
                  />
                  <MediaUploadButton 
                    icon={<Film size={20} />} 
                    label="Vids" 
                    type="video" 
                    multiple
                    onUpload={(e) => handleMediaUpload(e, 'video')}
                  />
                  <MediaUploadButton 
                    icon={<Play size={20} />} 
                    label="Live" 
                    type="video" 
                    capture="environment"
                    onUpload={(e) => handleMediaUpload(e, 'video')}
                  />
                  <MediaUploadButton 
                    icon={<Music size={20} />} 
                    label="Audio" 
                    type="audio" 
                    multiple
                    onUpload={(e) => handleMediaUpload(e, 'audio')}
                  />
                </div>
                
                {uploading && (
                  <div className="flex items-center gap-3 text-amber-500 text-xs italic animate-pulse">
                    <Loader2 size={14} className="animate-spin" />
                    Uploading batch of memories to the cloud ledger...
                  </div>
                )}

                {/* Gallery Preview in Modal */}
                {formData.mediaGallery.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 p-4 bg-zinc-800/50 rounded-2xl border border-zinc-800">
                    {formData.mediaGallery.map((asset, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden group/asset border border-zinc-700 bg-black">
                        {asset.type === 'image' ? (
                          <img src={asset.url} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {asset.type === 'video' ? <Film size={16} /> : <Music size={16} />}
                          </div>
                        )}
                        <button 
                          type="button"
                          onClick={() => removeAsset(index)}
                          className="absolute inset-0 bg-red-900/80 opacity-0 group-hover/asset:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <Trash2 size={16} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Milestone Narrative</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Share the cinematic details with the batch..."
                  className="w-full bg-black/40 border border-zinc-800 p-4 rounded-xl outline-none focus:border-amber-500 transition-all text-sm italic serif"
                  value={formData.content}
                  onChange={e => setFormData({...formData, content: e.target.value})}
                />
              </div>

              <button 
                type="submit"
                disabled={uploading}
                className="w-full py-5 bg-amber-500 text-ink rounded-2xl font-bold uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-amber-500/10 disabled:opacity-50"
              >
                {editingId ? "Save Refinements" : "Broadcast Multimedia Update"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function MediaUploadButton({ icon, label, type, capture, multiple, onUpload }: { icon: React.ReactNode, label: string, type: string, capture?: string, multiple?: boolean, onUpload: (e: any) => void }) {
  const accept = type === 'image' ? 'image/*' : (type === 'video' ? 'video/*' : 'audio/*');
  return (
    <div className="relative group">
      <input 
        type="file" 
        onChange={onUpload}
        multiple={multiple}
        className="absolute inset-0 opacity-0 cursor-pointer z-10"
        accept={accept}
        capture={capture as any}
      />
      <div className={`p-4 rounded-xl border bg-zinc-900 border-zinc-800 text-zinc-500 group-hover:border-zinc-700 group-hover:text-zinc-300 transition-all flex flex-col items-center gap-2`}>
        <div className="relative">
          {icon}
          {capture && <Camera size={10} className="absolute -top-1 -right-1 text-amber-500" />}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      </div>
    </div>
  );
}
