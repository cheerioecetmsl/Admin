"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Settings, Save, Loader2, Globe, CheckCircle2 } from "lucide-react";
import { InstagramIcon, FacebookIcon, GithubIcon, LinkedinIcon } from "@/components/SocialIcons";

export default function SettingsPage() {
  const [links, setLinks] = useState({
    instagram: "",
    facebook: "",
    github: "",
    linkedin: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "global");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setLinks(docSnap.data().socialLinks || {
            instagram: "",
            facebook: "",
            github: "",
            linkedin: ""
          });
        }
      } catch (err) {
        console.error("Fetch Settings Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "global"), {
        socialLinks: links,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setStatus("Global Protocols Updated");
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      console.error("Save Settings Error:", err);
      alert("Failed to update protocols.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-amber-500" size={40} />
      </div>
    );
  }

  return (
    <div className="p-10 space-y-12 max-w-4xl">
      <div>
        <h1 className="text-4xl font-bold serif text-zinc-100 flex items-center gap-4">
          <Settings className="text-amber-500" />
          Global Protocol Forge
        </h1>
        <p className="text-zinc-500 italic mt-2">Manage the foundational links and connections of the Cheerio network.</p>
      </div>

      {status && (
        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-500 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={20} />
          <p className="text-xs font-bold uppercase tracking-widest">{status}</p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Instagram */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-500 flex items-center gap-2">
              <InstagramIcon size={14} /> Instagram Neural Link
            </label>
            <input 
              type="url"
              placeholder="https://instagram.com/..."
              className="w-full bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl outline-none focus:border-amber-500 transition-all text-sm"
              value={links.instagram}
              onChange={e => setLinks({...links, instagram: e.target.value})}
            />
          </div>

          {/* Facebook */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-500 flex items-center gap-2">
              <FacebookIcon size={14} /> Facebook Neural Link
            </label>
            <input 
              type="url"
              placeholder="https://facebook.com/..."
              className="w-full bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl outline-none focus:border-amber-500 transition-all text-sm"
              value={links.facebook}
              onChange={e => setLinks({...links, facebook: e.target.value})}
            />
          </div>

          {/* GitHub */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-500 flex items-center gap-2">
              <GithubIcon size={14} /> GitHub Code Archive
            </label>
            <input 
              type="url"
              placeholder="https://github.com/..."
              className="w-full bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl outline-none focus:border-amber-500 transition-all text-sm"
              value={links.github}
              onChange={e => setLinks({...links, github: e.target.value})}
            />
          </div>

          {/* LinkedIn */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-500 flex items-center gap-2">
              <LinkedinIcon size={14} /> LinkedIn Career Node
            </label>
            <input 
              type="url"
              placeholder="https://linkedin.com/..."
              className="w-full bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl outline-none focus:border-amber-500 transition-all text-sm"
              value={links.linkedin}
              onChange={e => setLinks({...links, linkedin: e.target.value})}
            />
          </div>
        </div>

        <div className="pt-6">
          <button 
            type="submit"
            disabled={saving}
            className="flex items-center gap-3 px-10 py-4 bg-amber-500 text-ink rounded-2xl font-bold uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-amber-500/10 disabled:opacity-50"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Seal Global Protocols
          </button>
        </div>
      </form>

      <div className="p-8 border border-zinc-800 rounded-[2rem] bg-zinc-900/30 space-y-4">
        <div className="flex items-center gap-3 text-zinc-400">
          <Globe size={18} />
          <h4 className="text-xs font-bold uppercase tracking-widest">Network Status</h4>
        </div>
        <p className="text-xs text-zinc-500 leading-relaxed italic serif">
          These links are broadcasted to the footer of the main website. Updating them here will synchronize the entire Cheerio network.
        </p>
      </div>
    </div>
  );
}
