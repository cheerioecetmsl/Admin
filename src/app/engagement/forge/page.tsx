"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { LayoutGrid, Vote, Trophy, Users, Plus, Trash2, Save, Send, Loader2, Camera, CheckCircle, Check } from "lucide-react";
import { useRouter } from "next/navigation";

type ModuleType = 'poll' | 'game' | 'result';

export default function EngagementForge() {
  const router = useRouter();
  const [type, setType] = useState<ModuleType>('poll');
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState<string[]>(['STUDENT']);
  
  // Poll State
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState([{ text: "", imageUrl: "" }, { text: "", imageUrl: "" }]);

  // Game State
  const [gameType, setGameType] = useState<'guess-senior' | 'memory-match' | 'reaction-speed'>('guess-senior');
  const [gameAssets, setGameAssets] = useState<string[]>([]);
  const [targetSenior, setTargetSenior] = useState({ name: "", imageUrl: "" });

  const [isSuccess, setIsSuccess] = useState(false);
  const [createdData, setCreatedData] = useState<any>(null);

  const handleAddOption = () => setPollOptions([...pollOptions, { text: "", imageUrl: "" }]);
  const handleRemoveOption = (index: number) => setPollOptions(pollOptions.filter((_, i) => i !== index));
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const onImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, id: string, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(id);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "Cheerio-2026");

    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      if (data.secure_url) {
        callback(data.secure_url);
      } else {
        alert("Upload failed: " + (data.error?.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Error uploading image.");
    } finally {
      setUploadingId(null);
    }
  };

  const handleOptionChange = (index: number, field: 'text' | 'imageUrl', value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setPollOptions(newOptions);
  };

  const handleAddAsset = (url: string) => {
    if (!url) return;
    setGameAssets([...gameAssets, url]);
  };

  const handleRemoveAsset = (index: number) => {
    setGameAssets(gameAssets.filter((_, i) => i !== index));
  };

  const handleToggleAudience = (cat: string) => {
    if (targetAudience.includes(cat)) {
      setTargetAudience(targetAudience.filter(a => a !== cat));
    } else {
      setTargetAudience([...targetAudience, cat]);
    }
  };

  const handleCreate = async (launchImmediately = false) => {
    if (!title) return alert("Title is required");

    let config: any = {};
    
    if (type === 'poll') {
      config = {
        question: pollQuestion || title,
        options: pollOptions.filter(o => o.text.trim() !== "").map(o => ({
          text: o.text,
          imageUrl: o.imageUrl
        })),
        votes: {},
        voters: []
      };
      // Initialize votes
      config.options.forEach((opt: any) => {
        config.votes[opt.text] = 0;
      });
    } else if (type === 'game') {
      config = {
        gameType,
        gameAssets,
        targetSenior: gameType === 'guess-senior' ? targetSenior : null
      };
    }

    const dataToSave = {
      type,
      title,
      description,
      status: launchImmediately ? 'active' : 'draft',
      targetAudience,
      config,
      createdAt: serverTimestamp(),
      createdBy: "admin",
    };

    try {
      await addDoc(collection(db, "engagement_modules"), dataToSave);
      setCreatedData(dataToSave);
      setIsSuccess(true);
    } catch (error) {
      console.error("Error creating module:", error);
      alert("Failed to create module.");
    }
  };

  const resetForge = () => {
    setIsSuccess(false);
    setTitle("");
    setDescription("");
    setPollQuestion("");
    setPollOptions([{ text: "", imageUrl: "" }, { text: "", imageUrl: "" }]);
    setGameAssets([]);
    setTargetSenior({ name: "", imageUrl: "" });
    setCreatedData(null);
  };

  if (isSuccess && createdData) {
    return (
      <div className="p-8 space-y-8 max-w-4xl mx-auto pb-32 animate-in fade-in zoom-in duration-500">
        <div className="bg-zinc-900/50 border-2 border-amber-500/50 rounded-[3rem] p-12 text-center space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 pointer-events-none">
             <CheckCircle className="text-amber-500 opacity-10" size={160} />
          </div>
          
          <div className="space-y-4 relative z-10">
            <div className="w-24 h-24 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-amber-500/40">
              <Check size={48} className="text-black stroke-[3]" />
            </div>
            <h1 className="text-4xl font-bold serif text-zinc-100 uppercase tracking-tighter">Forge Successful</h1>
            <p className="text-zinc-500 uppercase tracking-widest text-[10px] font-bold">
              The module is now {createdData.status === 'active' ? 'live on the dashboard' : 'saved in your drafts'}.
            </p>
          </div>

          <div className="bg-black/60 rounded-[2rem] p-8 border border-zinc-800/50 text-left space-y-6 relative z-10">
             <div className="flex justify-between items-start">
               <div>
                 <h2 className="text-2xl font-bold serif text-amber-500">{createdData.title}</h2>
                 <p className="text-zinc-400 text-sm mt-1">{createdData.description || 'No description provided.'}</p>
               </div>
               <div className="px-3 py-1 bg-zinc-800 rounded-full text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                 {createdData.type}
               </div>
             </div>

             <div className="pt-6 border-t border-zinc-800/50 grid grid-cols-2 gap-8">
                <div>
                  <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">Target Audience</p>
                  <div className="flex flex-wrap gap-2">
                    {createdData.targetAudience.map((a: string) => (
                      <span key={a} className="text-[9px] font-bold text-zinc-300 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full">{a}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">Module Content</p>
                  <p className="text-xs text-zinc-400 font-medium">
                    {createdData.type === 'poll' ? `${createdData.config.options.length} Poll Options` : 
                     createdData.config.gameType === 'memory-match' ? `${createdData.config.gameAssets.length} Grid Assets` : 
                     'Targeted Senior Guess'}
                  </p>
                </div>
             </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4 relative z-10">
            <button 
              onClick={() => router.push("/engagement")}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold py-5 rounded-2xl transition-all uppercase tracking-widest text-[10px] border border-zinc-700"
            >
              Return to Forge Gallery
            </button>
            <button 
              onClick={resetForge}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-bold py-5 rounded-2xl transition-all shadow-xl shadow-amber-500/20 uppercase tracking-widest text-[10px]"
            >
              Forge Another Module
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto pb-32">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold serif text-amber-500">ENGAGEMENT FORGE</h1>
          <p className="text-zinc-500 text-sm uppercase tracking-widest mt-2">Design interactive experiences for the batch.</p>
        </div>
      </div>

      {/* Module Type Selection */}
      <div className="grid grid-cols-3 gap-4">
        <TypeCard 
          icon={<Vote size={24} />} 
          label="POLL" 
          active={type === 'poll'} 
          onClick={() => setType('poll')} 
        />
        <TypeCard 
          icon={<LayoutGrid size={24} />} 
          label="MINI-GAME" 
          active={type === 'game'} 
          onClick={() => setType('game')} 
        />
        <TypeCard 
          icon={<Trophy size={24} />} 
          label="RESULT" 
          active={type === 'result'} 
          onClick={() => setType('result')} 
        />
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Module Title</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Most Likely to Become Famous"
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200 focus:border-amber-500/50 outline-none transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Description (Optional)</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Give some context..."
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200 focus:border-amber-500/50 outline-none transition-all h-24"
            />
          </div>
        </div>

        {/* Dynamic Config */}
        {type === 'poll' && (
          <div className="pt-6 border-t border-zinc-800 space-y-6">
            <h2 className="text-lg font-bold serif text-zinc-300">Poll Configuration</h2>
            <div className="space-y-6">
              {pollOptions.map((opt, i) => (
                <div key={i} className="space-y-3 p-4 bg-black/40 rounded-2xl border border-zinc-800/50">
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={opt.text}
                          onChange={(e) => handleOptionChange(i, 'text', e.target.value)}
                          placeholder={`Option ${i + 1} Text`}
                          className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200 focus:border-amber-500/50 outline-none transition-all"
                        />
                        {pollOptions.length > 2 && (
                          <button 
                            onClick={() => handleRemoveOption(i)}
                            className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors"
                          >
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <label className="p-3 bg-zinc-800 rounded-xl text-zinc-500 cursor-pointer hover:bg-zinc-700 transition-colors relative shrink-0">
                          {uploadingId === `poll-opt-${i}` ? (
                            <Loader2 size={20} className="animate-spin text-amber-500" />
                          ) : (
                            <Plus size={20} />
                          )}
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={(e) => onImageUpload(e, `poll-opt-${i}`, (url) => handleOptionChange(i, 'imageUrl', url))}
                          />
                        </label>
                        <input 
                          type="text" 
                          value={opt.imageUrl}
                          onChange={(e) => handleOptionChange(i, 'imageUrl', e.target.value)}
                          placeholder="Option Image URL (Optional)"
                          className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200 focus:border-amber-500/50 outline-none transition-all text-xs"
                        />
                      </div>
                    </div>
                    {opt.imageUrl && (
                      <div className="w-24 h-24 rounded-xl border border-zinc-800 overflow-hidden bg-black shrink-0">
                        <img src={opt.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <button 
                onClick={handleAddOption}
                className="flex items-center gap-2 text-xs font-bold text-amber-500 hover:text-amber-400 transition-colors uppercase tracking-widest"
              >
                <Plus size={16} /> Add Option
              </button>
            </div>
          </div>
        )}

        {type === 'game' && (
          <div className="pt-6 border-t border-zinc-800 space-y-8">
            <div className="space-y-4">
              <h2 className="text-lg font-bold serif text-zinc-300">Game Type</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SelectCard 
                  label="Guess Senior" 
                  active={gameType === 'guess-senior'} 
                  onClick={() => setGameType('guess-senior')} 
                />
                <SelectCard 
                  label="Memory Match" 
                  active={gameType === 'memory-match'} 
                  onClick={() => setGameType('memory-match')} 
                />
                <SelectCard 
                  label="Reaction Time" 
                  active={gameType === 'reaction-speed'} 
                  onClick={() => setGameType('reaction-speed')} 
                />
              </div>
            </div>

            {gameType === 'guess-senior' && (
              <div className="space-y-4 p-6 bg-amber-500/5 border border-amber-500/20 rounded-3xl">
                <h3 className="text-sm font-bold text-amber-500 uppercase tracking-widest">Target Senior Config</h3>
                <div className="flex gap-4">
                  <div className="flex-1 grid grid-cols-1 gap-4">
                    <input 
                      type="text" 
                      value={targetSenior.name}
                      onChange={(e) => setTargetSenior({...targetSenior, name: e.target.value})}
                      placeholder="Senior Name"
                      className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200 outline-none focus:border-amber-500/50 transition-all"
                    />
                    <div className="flex gap-2">
                      <label className="p-3 bg-zinc-800 rounded-xl text-zinc-500 cursor-pointer hover:bg-zinc-700 transition-colors relative shrink-0">
                        {uploadingId === 'target-senior' ? (
                          <Loader2 size={20} className="animate-spin text-amber-500" />
                        ) : (
                          <Camera size={20} />
                        )}
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*" 
                          onChange={(e) => onImageUpload(e, 'target-senior', (url) => setTargetSenior({...targetSenior, imageUrl: url}))}
                        />
                      </label>
                      <input 
                        type="text" 
                        value={targetSenior.imageUrl}
                        onChange={(e) => setTargetSenior({...targetSenior, imageUrl: e.target.value})}
                        placeholder="Portrait Image URL"
                        className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200 outline-none focus:border-amber-500/50 transition-all text-xs"
                      />
                    </div>
                  </div>
                  {targetSenior.imageUrl && (
                    <div className="w-28 h-28 rounded-2xl border border-zinc-800 overflow-hidden bg-black shrink-0">
                      <img src={targetSenior.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {gameType === 'memory-match' && (
              <div className="space-y-4 p-6 bg-zinc-800/20 border border-zinc-800 rounded-3xl">
                <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-widest">Memory Grid Assets (6-8 recommended)</h3>
                <div className="flex flex-wrap gap-2">
                  {gameAssets.map((url, i) => (
                    <div key={i} className="relative group w-20 h-20 bg-black rounded-lg overflow-hidden border border-zinc-800">
                      <img src={url} className="w-full h-full object-cover" alt="" />
                      <button 
                        onClick={() => handleRemoveAsset(i)}
                        className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <label className="w-20 h-20 border-2 border-dashed border-zinc-800 rounded-lg flex flex-col items-center justify-center text-zinc-600 hover:border-amber-500/50 hover:text-amber-500 transition-all cursor-pointer">
                    {uploadingId === 'game-asset' ? (
                      <Loader2 size={24} className="animate-spin text-amber-500" />
                    ) : (
                      <>
                        <Plus size={24} />
                        <span className="text-[8px] mt-1 uppercase font-bold">Upload</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => onImageUpload(e, 'game-asset', (url) => handleAddAsset(url))}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Targeting */}
        <div className="pt-6 border-t border-zinc-800 space-y-4">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Target Audience</label>
          <div className="flex flex-wrap gap-3">
            {['STUDENT', 'LEGEND', 'FACULTY'].map(cat => (
              <button
                key={cat}
                onClick={() => handleToggleAudience(cat)}
                className={`px-4 py-2 rounded-full text-[10px] font-bold border transition-all ${
                  targetAudience.includes(cat) 
                    ? "bg-amber-500 text-black border-amber-500" 
                    : "bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-600"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          {type === 'poll' && targetAudience.includes('LEGEND') && (
            <p className="text-[10px] text-red-400 italic">Note: Seniors (LEGENDs) are typically blocked from polls per system rules.</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button 
          onClick={() => handleCreate(false)}
          className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold py-4 rounded-2xl transition-all uppercase tracking-widest text-xs"
        >
          <Save size={18} /> Save as Draft
        </button>
        <button 
          onClick={() => handleCreate(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-black font-bold py-4 rounded-2xl transition-all shadow-xl shadow-amber-500/20 uppercase tracking-widest text-xs"
        >
          <Send size={18} /> Launch Now
        </button>
      </div>
    </div>
  );
}

function TypeCard({ icon, label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`p-6 rounded-[2rem] border transition-all flex flex-col items-center gap-3 ${
        active 
          ? "bg-amber-500/10 border-amber-500 text-amber-500" 
          : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
      }`}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}

function SelectCard({ label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`p-4 rounded-2xl border transition-all text-center ${
        active 
          ? "bg-amber-500/20 border-amber-500 text-amber-500" 
          : "bg-black border-zinc-800 text-zinc-500 hover:border-zinc-700"
      }`}
    >
      <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}
