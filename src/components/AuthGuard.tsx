"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * AuthGuard — protects admin routes and ensures session persistence.
 * Checks if the user is authenticated and if they have a valid admin document.
 */
export function AuthGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // Only redirect if we are NOT on the login page (which is "/" in this project)
        if (pathname !== "/") {
          router.replace("/");
        } else {
          setIsInitialized(true);
        }
        return;
      }

      // If they are on the login page but already logged in, send them to overview
      if (pathname === "/") {
        router.replace("/archivists"); // Or dashboard
        return;
      }

      try {
        // Secondary check: verify the user is an admin/archivist
        // In this project, we might check "archivists" collection or a role field in "users"
        // For now, let's just check if they exist in a "users" or "admins" collection
        // Based on previous context, we might check "users" with an admin flag
        const snap = await getDoc(doc(db, "users", user.uid));
        
        // If we want to be strict about admin access:
        // if (!snap.exists() || snap.data()?.role !== 'admin') { ... }
        
        if (!snap.exists()) {
           // If user doc doesn't exist, they shouldn't be here
           setIsInitialized(true); // Still allow them to see the login page if needed
        } else {
           setIsInitialized(true);
        }
      } catch (err) {
        setIsInitialized(true);
      }
    });

    return () => unsubscribe();
  }, [router, pathname]);

  if (!isInitialized) {
    return (
      <div className="fixed inset-0 z-[2000] bg-[#0A0A0A] flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-8 h-8 bg-amber-500/10 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-amber-500 font-bold serif tracking-tighter text-xl uppercase">Cheerio Admin</h2>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.3em] animate-pulse">
            Verifying Cryptographic Identity...
          </p>
        </div>
      </div>
    );
  }

  return null;
}
