"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
} from "firebase/firestore";
import {
  Radio, Heart, MessageCircle, Trash2, Link2,
  Save, RefreshCw, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Comment {
  id: string;
  text: string;
  authorName: string;
  authorUid: string;
  createdAt: any;
}

// ── Helper: format Firestore timestamp ──────────────────────────────────────
function formatTs(ts: any): string {
  if (!ts?.seconds) return "—";
  return new Date(ts.seconds * 1000).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Extract YouTube ID from full URL or bare ID ──────────────────────────────
function extractYouTubeId(input: string): string {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  const longMatch = trimmed.match(/(?:v=|\/embed\/|\/live\/|\/v\/)([a-zA-Z0-9_-]{11})/);
  if (longMatch) return longMatch[1];
  return trimmed;
}

export default function LivestreamControlPage() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [savedId, setSavedId] = useState("");
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isResettingLikes, setIsResettingLikes] = useState(false);

  // ── Load saved YouTube ID from Firestore ────────────────────────────────
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const snap = await getDoc(doc(db, "livestream_meta", "config"));
        if (snap.exists()) {
          const id = snap.data().youtubeId ?? "";
          setSavedId(id);
          setYoutubeUrl(id);
        }
      } catch (err) {
        console.error("Fetch config error:", err);
      }
    };
    fetchConfig();
  }, []);

  // ── Real-time like count ────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "livestream_meta", "likes"), (snap) => {
      if (snap.exists()) setLikeCount(snap.data().count ?? 0);
    });
    return unsub;
  }, []);

  // ── Real-time comments ──────────────────────────────────────────────────
  useEffect(() => {
    const q = query(
      collection(db, "livestream_comments"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Comment)));
    });
    return unsub;
  }, []);

  // ── Save YouTube URL ────────────────────────────────────────────────────
  const handleSave = async () => {
    const id = extractYouTubeId(youtubeUrl);
    if (!id) return;
    setSaveStatus("saving");
    try {
      await setDoc(doc(db, "livestream_meta", "config"), { youtubeId: id }, { merge: true });
      setSavedId(id);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      console.error("Save error:", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  // ── Delete a comment ────────────────────────────────────────────────────
  const handleDeleteComment = async (id: string) => {
    if (!confirm("Delete this comment permanently?")) return;
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "livestream_comments", id));
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeletingId(null);
    }
  };

  // ── Reset all likes ─────────────────────────────────────────────────────
  const handleResetLikes = async () => {
    if (!confirm("Reset all likes to 0? This cannot be undone.")) return;
    setIsResettingLikes(true);
    try {
      await setDoc(doc(db, "livestream_meta", "likes"), { count: 0 });
      alert("Likes reset. Note: individual user like records were NOT cleared — users won't be able to re-like unless those are manually deleted from the livestream_likes collection.");
    } catch (err) {
      console.error("Reset error:", err);
    } finally {
      setIsResettingLikes(false);
    }
  };

  const currentId = extractYouTubeId(youtubeUrl);
  const isDirty = currentId !== savedId;

  return (
    // Mobile: p-4, tablet: p-6, desktop: p-10
    <div className="p-4 sm:p-6 lg:p-10 space-y-6 lg:space-y-10 max-w-6xl">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-500/10 border border-amber-500/20 flex-shrink-0 flex items-center justify-center">
          <Radio size={20} className="text-amber-500" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold serif text-zinc-100 leading-tight">Livestream Control</h1>
          <p className="text-zinc-500 text-xs sm:text-sm mt-0.5">Manage YouTube stream URL, monitor engagement, moderate comments</p>
        </div>
      </div>

      {/* ── Stats Row: single column on mobile, 3 cols on sm+ ───────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          icon={<Heart size={18} className="text-red-400" />}
          label="Total Likes"
          value={likeCount.toLocaleString()}
          accent="red"
        />
        <StatCard
          icon={<MessageCircle size={18} className="text-blue-400" />}
          label="Total Comments"
          value={comments.length.toLocaleString()}
          accent="blue"
        />
        <StatCard
          icon={<Radio size={18} className="text-amber-400" />}
          label="Active Stream ID"
          value={savedId || "Not set"}
          accent="amber"
          mono
        />
      </div>

      {/* ── YouTube URL Editor ───────────────────────────────────────────── */}
      <section className="card-blur p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-[2rem] space-y-4 sm:space-y-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link2 size={16} className="text-amber-500 flex-shrink-0" />
          <h2 className="text-base sm:text-lg font-bold serif text-zinc-100">YouTube Stream URL</h2>
        </div>

        <p className="text-zinc-500 text-xs sm:text-sm">
          Paste the full YouTube URL or a bare video ID.
          <span className="text-zinc-600 text-[11px] mt-1 block">
            Accepted: <code className="text-amber-500/70">youtu.be/ID</code> · <code className="text-amber-500/70">youtube.com/watch?v=ID</code> · <code className="text-amber-500/70">ID</code>
          </span>
        </p>

        {/* Input stacks vertically on mobile, side-by-side on sm+ */}
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="Paste YouTube URL or video ID..."
            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm placeholder-zinc-600 focus:border-amber-500/60 focus:outline-none transition-colors font-mono"
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            disabled={saveStatus === "saving" || !youtubeUrl.trim()}
            className={`flex items-center justify-center gap-2 w-full sm:w-auto sm:self-start px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
              saveStatus === "saved"
                ? "bg-green-500/20 border border-green-500/40 text-green-400"
                : saveStatus === "error"
                ? "bg-red-500/20 border border-red-500/40 text-red-400"
                : "bg-amber-500 text-zinc-950 hover:bg-amber-400"
            }`}
          >
            {saveStatus === "saving" ? (
              <><RefreshCw size={15} className="animate-spin" /> Saving...</>
            ) : saveStatus === "saved" ? (
              <><CheckCircle2 size={15} /> Saved!</>
            ) : saveStatus === "error" ? (
              <><AlertTriangle size={15} /> Error</>
            ) : (
              <><Save size={15} /> Save URL</>
            )}
          </motion.button>
        </div>

        {/* Live preview — full width, responsive aspect ratio */}
        {currentId && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
              Preview — will embed as:
            </p>
            <div className="aspect-video w-full rounded-xl sm:rounded-2xl overflow-hidden border border-zinc-800">
              <iframe
                src={`https://www.youtube.com/embed/${currentId}?rel=0&modestbranding=1`}
                title="Preview"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            {isDirty && (
              <p className="text-amber-500/70 text-xs flex items-center gap-1.5">
                <AlertTriangle size={11} /> Unsaved changes — press Save URL to apply
              </p>
            )}
          </div>
        )}
      </section>

      {/* ── Engagement / Like Counter ────────────────────────────────────── */}
      <section className="card-blur p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-[2rem] space-y-4 sm:space-y-5">
        {/* Header row: stack on very small, side-by-side on sm+ */}
        <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <Heart size={16} className="text-red-400 flex-shrink-0" />
            <h2 className="text-base sm:text-lg font-bold serif text-zinc-100">Like Counter</h2>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold serif text-red-400">{likeCount.toLocaleString()}</span>
            <span className="text-zinc-600 text-[10px] uppercase tracking-widest">total likes</span>
          </div>
        </div>
        <div className="h-px bg-zinc-800" />
        <button
          onClick={handleResetLikes}
          disabled={isResettingLikes}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs sm:text-sm font-bold uppercase tracking-widest transition-all disabled:opacity-50"
        >
          <RefreshCw size={13} className={isResettingLikes ? "animate-spin" : ""} />
          Reset Like Count
        </button>
      </section>

      {/* ── Comments ────────────────────────────────────────────────────── */}
      <section className="card-blur p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-[2rem] space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <MessageCircle size={16} className="text-blue-400 flex-shrink-0" />
            <h2 className="text-base sm:text-lg font-bold serif text-zinc-100">Live Comments</h2>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-zinc-900 border border-zinc-800 text-zinc-500 flex-shrink-0">
            {comments.length} total
          </span>
        </div>

        {comments.length === 0 ? (
          <div className="py-12 text-center">
            <MessageCircle size={28} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-600 italic text-sm">No comments yet.</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[480px] sm:max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
            <AnimatePresence initial={false}>
              {comments.map((c) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-zinc-900/60 border border-zinc-800"
                >
                  {/* Avatar */}
                  <div
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] sm:text-[11px] font-bold text-zinc-950"
                    style={{ background: stringToColor(c.authorUid) }}
                  >
                    {c.authorName.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-1">
                      <span className="text-[11px] sm:text-xs font-bold text-zinc-200 truncate">{c.authorName}</span>
                      <span className="text-[9px] sm:text-[10px] text-zinc-600 flex-shrink-0">{formatTs(c.createdAt)}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-400 break-words leading-relaxed">{c.text}</p>
                  </div>

                  {/* Delete — always visible on mobile (no hover), hover-reveal on desktop */}
                  <button
                    onClick={() => handleDeleteComment(c.id)}
                    disabled={deletingId === c.id}
                    className="flex-shrink-0 p-1.5 sm:p-2 rounded-lg sm:rounded-xl sm:opacity-0 sm:group-hover:opacity-100 bg-red-500/10 active:bg-red-500/25 hover:bg-red-500/25 text-red-400 transition-all duration-200 disabled:opacity-50"
                    title="Delete comment"
                  >
                    {deletingId === c.id ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
}

// ── Small stat card ──────────────────────────────────────────────────────────
function StatCard({
  icon, label, value, accent, mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: "red" | "blue" | "amber";
  mono?: boolean;
}) {
  const accentMap = {
    red: "border-red-500/20 bg-red-500/5",
    blue: "border-blue-500/20 bg-blue-500/5",
    amber: "border-amber-500/20 bg-amber-500/5",
  };
  return (
    <div className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl border ${accentMap[accent]} space-y-2 sm:space-y-3`}>
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
      </div>
      <p className={`text-xl sm:text-2xl font-bold text-zinc-100 truncate ${mono ? "font-mono text-sm sm:text-base" : "serif"}`}>{value}</p>
    </div>
  );
}

// ── Deterministic color from UID ─────────────────────────────────────────────
function stringToColor(str: string): string {
  const palette = ["#D4AF37", "#60a5fa", "#34d399", "#f87171", "#c084fc", "#fb923c"];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}
