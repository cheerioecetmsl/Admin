"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, query, where, limit } from "firebase/firestore";
import { Shield, Sparkles, Scan, CheckCircle, AlertCircle, Loader2, Users, Image as ImageIcon, Zap, ArrowLeft, Terminal } from "lucide-react";
import * as faceapi from "face-api.js";
import Link from "next/link";

const MODEL_URL = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/";

export default function NeuralWarRoom() {
  const [status, setStatus] = useState("Standby");
  const [isRunning, setIsRunning] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentUserIdx, setCurrentUserIdx] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-49), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  useEffect(() => {
    const loadModels = async () => {
      try {
        setStatus("Initializing Neural Weights...");
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        setModelsLoaded(true);
        setStatus("Neural Engine Ready");
        addLog("Neural Engine initialized with remote weights.");
      } catch (err) {
        console.error(err);
        setError("Neural initialization failed. Check connection.");
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const initiateGlobalPulse = async () => {
    if (!modelsLoaded || isRunning) return;
    setIsRunning(true);
    setError(null);
    setTotalMatches(0);
    setLogs([]);

    try {
      // 1. Fetch All Users
      addLog("Accessing Archivist Registry...");
      const usersSnap = await getDocs(collection(db, "users"));
      const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTotalUsers(users.length);

      // 2. Fetch All Archive Images from Cloudinary
      addLog("Caching Multimedia Vault from Cloudinary...");
      const response = await fetch('/api/cloudinary/archive');
      const result = await response.json();
      if (!result.success) throw new Error("Failed to load Cloudinary assets.");
      const archiveImages = result.data.filter((d: any) => d.type === "image");
      addLog(`Vault cached: ${archiveImages.length} frames ready for analysis.`);

      // 3. Process Each User
      for (let i = 0; i < users.length; i++) {
        const user: any = users[i];
        setCurrentUserIdx(i + 1);
        setScanProgress(0);
        
        if (!user.photoURL) {
          addLog(`Skipping user ${user.name || user.id}: No profile portrait found.`);
          continue;
        }

        addLog(`Analyzing Identity: ${user.name || user.id}...`);
        
        try {
          // Get Reference
          const refImg = await faceapi.fetchImage(user.photoURL);
          const refDetection = await faceapi.detectSingleFace(refImg).withFaceLandmarks().withFaceDescriptor();
          
          if (!refDetection) {
            addLog(`Identity extraction failed for ${user.name}. Skipping.`);
            continue;
          }
          
          const faceMatcher = new faceapi.FaceMatcher(refDetection);
          const matchesForThisUser = [];

          // Scan Archive
          for (let j = 0; j < archiveImages.length; j++) {
            const item = archiveImages[j];
            setScanProgress(Math.round(((j + 1) / archiveImages.length) * 100));

            const img = await faceapi.fetchImage(item.url);
            const detections = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors();
            
            const results = detections.map(d => faceMatcher.findBestMatch(d.descriptor));
            const isMatch = results.some(r => r.label !== 'unknown' && r.distance < 0.45);

            if (isMatch) {
              matchesForThisUser.push(item);
              setTotalMatches(prev => prev + 1);
            }
          }

          // Save Results to Firestore Subcollection
          if (matchesForThisUser.length > 0) {
            addLog(`Sealing ${matchesForThisUser.length} verified moments into ${user.name}'s ledger.`);
            for (const match of matchesForThisUser) {
              const matchId = btoa(match.url).replace(/[^a-zA-Z0-9]/g, "");
              const memoryRef = doc(db, "users", user.id, "found_memories", matchId);
              await setDoc(memoryRef, {
                ...match,
                detectedAt: new Date().toISOString(),
                isVerified: true
              });
            }
          } else {
            addLog(`No matches detected for ${user.name} in current vault.`);
          }

        } catch (userErr) {
          console.error(`Error processing user ${user.id}:`, userErr);
          addLog(`Neural disruption during ${user.name}'s scan.`);
        }
      }

      setStatus("Global Pulse Complete");
      addLog("Global Neural Pulse finalized. All identities synchronized.");
    } catch (err) {
      console.error(err);
      setError("A critical neural failure occurred.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-zinc-100 p-10 font-sans selection:bg-amber-500/30">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-12">
        <div className="space-y-2">
          <Link href="/" className="flex items-center gap-2 text-zinc-500 hover:text-amber-500 transition-colors text-xs font-bold uppercase tracking-widest mb-4">
            <ArrowLeft size={14} /> Back to Command Center
          </Link>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500">
              <Shield size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-bold serif tracking-tight">Neural War Room</h1>
              <p className="text-zinc-500 italic">Global Biometric Discovery & Identity Synchronization</p>
            </div>
          </div>
        </div>

        <div className="text-right space-y-2">
          <div className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl inline-flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${isRunning ? "bg-amber-500 animate-pulse" : "bg-zinc-700"}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{status}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Controls & Status */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Progress Overview */}
          <div className="card-blur p-8 rounded-[2rem] border-zinc-800 space-y-8">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Batch Discovery Status</p>
                <h3 className="text-2xl font-bold serif">
                  {isRunning ? `Processing Identity ${currentUserIdx} of ${totalUsers}` : "Identity Ledger Ready"}
                </h3>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-amber-500 tabular-nums">{totalMatches}</p>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Moments Reclaimed</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <div 
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-700 shadow-[0_0_20px_rgba(212,175,55,0.3)]" 
                  style={{ width: `${totalUsers ? (currentUserIdx / totalUsers) * 100 : 0}%` }} 
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                <span>Registry Start</span>
                <span>Registry Completion</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800/50 text-center space-y-2">
                <Users size={20} className="mx-auto text-zinc-500" />
                <p className="text-2xl font-bold">{totalUsers}</p>
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Archivists</p>
              </div>
              <div className="p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800/50 text-center space-y-2">
                <ImageIcon size={20} className="mx-auto text-zinc-500" />
                <p className="text-2xl font-bold">{(scanProgress)}%</p>
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Current Scan</p>
              </div>
              <div className="p-6 bg-amber-500/5 rounded-2xl border border-amber-500/10 text-center space-y-2">
                <Zap size={20} className="mx-auto text-amber-500" />
                <p className="text-2xl font-bold text-amber-500">{totalMatches}</p>
                <p className="text-[8px] font-bold text-amber-500 uppercase tracking-widest">Matches Found</p>
              </div>
            </div>
          </div>

          {/* Action Trigger */}
          <button 
            onClick={initiateGlobalPulse}
            disabled={!modelsLoaded || isRunning}
            className="w-full group relative py-10 rounded-[2rem] bg-amber-500 text-ink font-bold uppercase tracking-[0.5em] text-xl shadow-[0_0_80px_rgba(212,175,55,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale overflow-hidden"
          >
            <div className="relative z-10 flex items-center justify-center gap-6">
              {isRunning ? (
                <>
                  <Loader2 className="animate-spin" size={32} />
                  Neural Pulse In Progress...
                </>
              ) : (
                <>
                  <Zap size={32} />
                  Initiate Global Neural Pulse
                </>
              )}
            </div>
            {isRunning && (
              <div className="absolute inset-0 bg-white/10 animate-[pulse_2s_infinite]" />
            )}
          </button>
        </div>

        {/* Neural Log Feed */}
        <div className="card-blur rounded-[2rem] border-zinc-800 flex flex-col overflow-hidden h-[600px]">
          <div className="p-6 border-b border-zinc-800 flex items-center gap-3 bg-zinc-900/50">
            <Terminal size={18} className="text-amber-500" />
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Neural Operations Log</h4>
          </div>
          <div className="flex-1 p-6 overflow-y-auto space-y-3 font-mono text-[10px] leading-relaxed custom-scrollbar bg-black/40">
            {logs.length === 0 && <p className="text-zinc-700 italic">Waiting for command initialization...</p>}
            {logs.map((log, i) => (
              <div key={i} className="flex gap-3 text-zinc-500">
                <span className="text-amber-500/40 shrink-0">›</span>
                <p className={log.includes("Match") || log.includes("Sealing") ? "text-amber-500" : ""}>{log}</p>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>

      </div>

      <style jsx global>{`
        .card-blur {
          background: rgba(18, 18, 18, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 10px;
        }
      `}</style>
    </main>
  );
}
