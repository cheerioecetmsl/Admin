"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Users, Megaphone, Trophy, BarChart3, Settings, LogOut, ShieldCheck, Star, GraduationCap, Vote, Activity } from "lucide-react";

export function Sidebar({ onSelect }: { onSelect?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="w-72 border-r border-zinc-800 bg-black/50 backdrop-blur-xl flex flex-col h-full">
      <div className="p-8 border-b border-zinc-800">
        <h1 className="text-xl font-bold tracking-tighter serif text-amber-500">
          CHEERIO <span className="text-zinc-500">ADMIN</span>
        </h1>
      </div>

      <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
        <NavItem href="/" icon={<LayoutDashboard size={20} />} label="Overview" active={pathname === "/"} onClick={onSelect} />
        <NavItem href="/online" icon={<Activity size={20} />} label="Live Status" active={pathname === "/online"} onClick={onSelect} />
        <NavItem href="/archivists" icon={<Users size={20} />} label="Archivists" active={pathname === "/archivists"} onClick={onSelect} />
        
        <div className="pt-4 pb-2 px-4">
          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em]">Approvals</span>
        </div>
        <NavItem href="/approvals/seniors" icon={<Star size={20} />} label="Seniors" active={pathname === "/approvals/seniors"} />
        <NavItem href="/approvals/faculty" icon={<GraduationCap size={20} />} label="Faculty" active={pathname === "/approvals/faculty"} />
        
        <div className="pt-4 pb-2 px-4">
          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em]">Management</span>
        </div>
        <NavItem href="/people" icon={<ShieldCheck size={20} />} label="The Pantheon" active={pathname === "/people"} />
        <NavItem href="/legacy" icon={<GraduationCap size={20} />} label="Legacy Management" active={pathname === "/legacy"} />
        <NavItem href="/hero-manager" icon={<BarChart3 size={20} />} label="Hero Manager" active={pathname === "/hero-manager"} />
        <NavItem href="/hype" icon={<Megaphone size={20} />} label="Notification Bar" active={pathname === "/hype"} />
        <NavItem href="/engagement" icon={<Vote size={20} />} label="Engagement Control" active={pathname === "/engagement"} />
        <NavItem href="/leaderboard" icon={<Trophy size={20} />} label="Leaderboard" active={pathname === "/leaderboard"} />
        <NavItem href="/analytics" icon={<BarChart3 size={20} />} label="Analytics" active={pathname === "/analytics"} />
      </nav>

      <div className="p-6 border-t border-zinc-800">
        <NavItem href="/settings" icon={<Settings size={20} />} label="Settings" active={pathname === "/settings"} />
        <button className="flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-red-400 transition-colors w-full">
          <LogOut size={20} />
          <span className="text-sm font-medium">Log Out</span>
        </button>
      </div>
    </aside>
  );
}

function NavItem({ href, icon, label, active, onClick }: { href: string, icon: React.ReactNode, label: string, active: boolean, onClick?: () => void }) {
  return (
    <Link 
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
        active 
          ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" 
          : "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-200"
      }`}
    >
      {icon}
      <span className="text-sm font-medium uppercase tracking-widest">{label}</span>
    </Link>
  );
}

