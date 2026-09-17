import { Link, useRouterState } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Check, ChevronDown, FileText, Languages, Menu, Moon, Sun, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useApplication } from "@/context/ApplicationContext";
import { copy } from "@/lib/i18n";
import { cn, toArabicDigits } from "@/lib/utils";

export function GlassCard({ children, className = "" }: { children: ReactNode; className?: string }) { return <div className={cn("glass", className)}>{children}</div>; }
export function GlassButton({ children, className, ...props }: ButtonProps) { return <Button className={cn("h-12 rounded-full px-6 text-[0.83rem] font-semibold transition-all duration-300 hover:-translate-y-0.5", className)} {...props}>{children}</Button>; }
export function Page({ children }: { children: ReactNode }) { const reduce = useReducedMotion(); return <motion.main initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }} className="min-h-screen pt-28">{children}</motion.main>; }
export function SectionHeader({ eyebrow, title, body, centered = false }: { eyebrow?: string; title: string; body?: string; centered?: boolean }) { return <div className={cn("max-w-3xl", centered && "mx-auto text-center")}><p className="eyebrow">{eyebrow}</p><h2 className="section-title">{title}</h2>{body && <p className="mt-5 text-lg leading-8 text-muted-foreground">{body}</p>}</div>; }

export function Navbar() {
  const { language, setLanguage, theme, toggleTheme } = useApplication(); const t = copy[language]; const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const nav = [{ to: "/", label: t.nav.how }, { to: "/analyze", label: t.nav.analyze }, { to: "/about", label: t.nav.about }] as const;
  return <header className="fixed inset-x-0 top-4 z-50 px-4"><nav aria-label="Primary navigation" className="nav-glass mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
    <Link to="/" className="flex items-center gap-3 font-semibold">
  <span>{language === "ar" ? "مُســـــتوفٍ" : "MUSTAWFI"}</span>
</Link>
    <div className="hidden items-center gap-1 md:flex">{nav.map((item) => <Link key={item.to} to={item.to} className={cn("nav-link", path === item.to && "nav-link-active")}>{item.label}</Link>)}</div>
    <div className="flex items-center gap-1"><button className="icon-control" aria-label="Change language" onClick={() => setLanguage(language === "en" ? "ar" : "en")}><Languages/><span className="hidden sm:inline">{language === "en" ? "العربية" : "English"}</span></button><button className="icon-control" aria-label="Change color theme" onClick={toggleTheme}>{theme === "dark" ? <Sun/> : <Moon/>}</button><button className="icon-control md:hidden" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button></div>
    {open && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="glass absolute inset-x-4 top-20 grid gap-1 p-3 md:hidden">{nav.map((item) => <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className="rounded-md p-4 font-medium">{item.label}</Link>)}</motion.div>}
  </nav></header>;
}
export function JourneyBar() { 
  const { language } = useApplication(); 
  const t = copy[language]; 
  const path = useRouterState({ select: s => s.location.pathname }); 
  const active = path.includes("result") ? 4 : path.includes("review") ? 3 : path.includes("processing") ? 2 : 1; 
  
  return (
    <div className="mx-auto mb-12 flex max-w-xl items-center justify-center gap-2 px-4" aria-label="Application progress">
      {t.steps.map((s, i) => {
        const stepNum = i + 1;
        return (
          <div key={s} className="flex flex-1 items-center gap-2">
            <span className={cn(
              "grid size-7 shrink-0 place-items-center rounded-full border text-xs", 
              i < active ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"
            )}>
              {i + 1 < active ? <Check className="size-3.5"/> : toArabicDigits(stepNum, language)}
            </span>
            <span className="hidden text-xs text-muted-foreground sm:block">{s}</span>
            {i < 3 && <span className="h-px flex-1 bg-border"/>}
          </div>
        );
      })}
    </div>
  ); 
}

export function Footer() { 
  const { language } = useApplication();

  return (
    <footer className="border-t border-border py-8">
      <div className="shell flex flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        {/* الجزء الخاص باسم المشروع ووصفه */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <span className="font-semibold text-foreground">مُستوفِي · MUSTAWFI</span>
          <span className="hidden sm:block h-1.5 w-1.5 rounded-full bg-border"></span>
          <span>Smart Loan Eligibility Intelligence</span>
        </div>
        
        {/* الجزء الخاص بالحقوق واسم المطور */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <span>
            {language === "ar" ? "تطوير " : "Developed by "}
            <a
              href="https://www.linkedin.com/in/tiger0x01/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground transition-all hover:text-primary hover:underline decoration-muted-foreground/50 underline-offset-4"
            >
              {language === "ar" ? "محمـد النمـر" : "Mohamed Elnemr"}
            </a>
          </span>
          <span className="hidden sm:block h-4 w-px bg-border"></span>
          <span>&copy; 2026</span>
        </div>
      </div>
    </footer>
  );
}
export function EmptyState({ title, action }: { title: string; action: string }) { return <GlassCard className="mx-auto max-w-lg p-10 text-center"><FileText className="mx-auto mb-5 size-8"/><h1 className="text-2xl font-semibold">{title}</h1><Button asChild className="mt-7 rounded-full"><Link to="/analyze">{action}<ArrowUpRight/></Link></Button></GlassCard> }
export function Expandable({ title, children }: { title: string; children: ReactNode }) { const [open, setOpen] = useState(false); return <GlassCard className="overflow-hidden"><button className="flex w-full items-center justify-between p-6 text-start font-semibold" onClick={() => setOpen(!open)} aria-expanded={open}>{title}<ChevronDown className={cn("transition-transform", open && "rotate-180")}/></button>{open && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="border-t border-border p-6">{children}</motion.div>}</GlassCard> }