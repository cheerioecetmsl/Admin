"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Camera, Loader2, Image as ImageIcon, Save, RefreshCw, AlertCircle } from "lucide-react";

const TOTAL_SLOTS = 20;

export default function HeroManager() {
  const [heroImages, setHeroImages] = useState<string[]>(new Array(TOTAL_SLOTS).fill(""));
  const [loading, setLoading] = useState(true);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const fetchHeroImages = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, "hero_images", "featured");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data().urls || [];
        const newImages = [...new Array(TOTAL_SLOTS).fill("")];
        data.forEach((url: string, i: number) => {
          if (i < TOTAL_SLOTS) newImages[i] = url;
        });
        setHeroImages(newImages);
      }
    } catch (err) {
      console.error("Fetch Hero Images Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeroImages();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSlot(index);
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "Cheerio-26");
      
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: data }
      );
      
      const resData = await res.json();
      
      if (resData.secure_url) {
        const newImages = [...heroImages];
        newImages[index] = resData.secure_url;
        setHeroImages(newImages);
        setStatus(`Slot ${index + 1} Forge Successful`);
        setTimeout(() => setStatus(null), 3000);
      } else {
        alert("Forge failed. Check console for details.");
      }
    } catch (err) {
      console.error("Upload Error:", err);
      alert("A critical error occurred during the forge.");
    } finally {
      setUploadingSlot(null);
    }
  };

  const saveToLedger = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "hero_images", "featured"), {
        urls: heroImages,
        updatedAt: new Date().toISOString()
      });
      setStatus("Global Hero Ledger Sealed");
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      console.error("Save Ledger Error:", err);
      alert("Failed to seal the ledger.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-10 space-y-10">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold serif text-zinc-100">Hero Gallery Forge</h1>
          <p className="text-zinc-500 italic mt-2">Curate the 20 cinematic frames that introduce the legacy to the world.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={fetchHeroImages}
            className="p-3 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 rounded-xl transition-all"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          <button 
            onClick={saveToLedger}
            disabled={saving || loading}
            className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-ink rounded-xl font-bold uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-lg disabled:opacity-50"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Seal Global Ledger
          </button>
        </div>
      </div>

      {status && (
        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-500 animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={20} />
          <p className="text-xs font-bold uppercase tracking-widest">{status}</p>
        </div>
      )}

      {/* Grid of Slots */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {heroImages.map((url, i) => (
          <div key={i} className="card-blur p-4 rounded-[2rem] space-y-4 group relative overflow-hidden flex flex-col items-center text-center">
            <div className="relative aspect-[3/4] w-full rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900 group-hover:border-amber-500/30 transition-all">
              {url ? (
                <img src={url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={`Slot ${i+1}`} />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-800 space-y-2">
                  <ImageIcon size={32} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Empty Slot {i + 1}</span>
                </div>
              )}
              
              {uploadingSlot === i && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="animate-spin text-amber-500" size={32} />
                </div>
              )}

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4">
                <div className="relative">
                  <input 
                    type="file" 
                    onChange={e => handleImageUpload(e, i)} 
                    className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                    accept="image/*" 
                  />
                  <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-ink rounded-lg font-bold uppercase tracking-widest text-[10px] shadow-xl">
                    <Camera size={14} /> Forge Slot
                  </button>
                </div>
                {url && (
                  <button 
                    onClick={() => {
                      const newImgs = [...heroImages];
                      newImgs[i] = "";
                      setHeroImages(newImgs);
                    }}
                    className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:underline"
                  >
                    Clear Memory
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between w-full px-2">
              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Slot {i + 1}</span>
              {url && <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]" />}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
