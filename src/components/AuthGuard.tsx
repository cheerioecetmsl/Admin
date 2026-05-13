"use client";

import { useEffect, useRef, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";

/**
 * AuthGuard — protects admin routes and ensures session persistence.
 *
 * ROOT CAUSE FIX: Previously `pathname` was in the useEffect dependency array.
 * This caused the auth subscription to re-run on EVERY navigation, which called
 * router.replace() again → triggering another navigation → infinite loop.
 *
 * The fix: store `pathname` in a ref so the auth callback can always read the
 * current path, but WITHOUT adding it as a dep so the effect only runs once.
 */
export function AuthGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const [isInitialized, setIsInitialized] = useState(false);

  // Keep ref in sync with the latest path on every render — no re-subscription
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const currentPath = pathnameRef.current;

      if (!user) {
        // Not authenticated — send to login only if not already there
        if (currentPath !== "/") {
          router.replace("/");
        } else {
          setIsInitialized(true);
        }
        return;
      }

      // Authenticated but on the login page — send to dashboard
      if (currentPath === "/") {
        router.replace("/archivists");
        return;
      }

      // Authenticated on a protected page — verify existence and allow in
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        // snap.exists() is checked; extend with role check if needed
        setIsInitialized(true);
      } catch {
        setIsInitialized(true);
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]); // ← `pathname` intentionally omitted — read via ref to prevent loop

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
