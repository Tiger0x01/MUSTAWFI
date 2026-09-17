import { Link } from "@tanstack/react-router";
import { motion, useInView, useReducedMotion } from "motion/react";
// تم استبدال الأيقونات القديمة بأيقونات أكثر احترافية ومؤسسية
import { ArrowDown, ArrowUpRight, Activity, FileText, ScanLine, ShieldCheck, FileScan } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { GlassButton, GlassCard, SectionHeader } from "./core";
import { useApplication } from "@/context/ApplicationContext";
import { copy } from "@/lib/i18n";

// دالة لتحويل الأرقام إلى النمط العربي أو الإنجليزي حسب اللغة
const formatNum = (n: number, lang: string) => {
  const val = String(n).padStart(2, "0");
  if (lang !== "ar") return val;
  return val.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]!);
};

function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) { 
  const ref = useRef(null); 
  const seen = useInView(ref, { once: true, margin: "-80px" }); 
  const reduce = useReducedMotion(); 
  return <motion.div ref={ref} initial={reduce ? false : { opacity: 0, y: 28, filter: "blur(8px)" }} animate={seen ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}} transition={{ duration: .7, delay }}>{children}</motion.div>; 
}

function HeroDocument() { 
  const { language } = useApplication();
  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-[400px]">
      <div className="ambient-ring"/>
      <motion.div animate={{ y: [-6, 8, -6], rotate: [-2, 0, -2] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} className="document-glass absolute inset-8 p-7">
        <div className="scan-line"/>
        <div className="mb-8 flex items-center justify-between">
          <div className="brand-mark">م</div>
          <span className="text-[10px] uppercase tracking-[.2em] text-muted-foreground">Application / 2408</span>
        </div>
        <div className="mb-7 h-3 w-3/4 rounded-full bg-foreground/80"/>
        <div className="space-y-3">{[84,58,72,90,64].map((w,i)=><div key={i} className="h-2 rounded-full bg-foreground/10" style={{width:`${w}%`}}/>)}</div>
        <div className="my-7 h-px bg-border"/>
        <div className="grid grid-cols-2 gap-4">
          {["Identity","Income","Credit","Loan"].map((x,i)=>(
            <div key={x} className="border-s border-border ps-3">
              <span className="text-[9px] uppercase text-muted-foreground">{formatNum(i + 1, language)}</span>
              <p className="mt-1 text-xs">{x}</p>
            </div>
          ))}
        </div>
        <div className="absolute bottom-6 inset-x-6 flex items-center gap-2 text-xs text-muted-foreground"><span className="pulse-dot"/>Document ready</div>
      </motion.div>
      <GlassCard className="absolute bottom-2 -start-2 flex items-center gap-3 px-4 py-3 text-xs shadow-2xl"><FileScan className="size-4"/> Structured extraction</GlassCard>
    </div>
  ); 
}

export function Hero() { 
  const { language } = useApplication(); 
  const t = copy[language]; 
  return (
    <section className="hero-bg shell grid items-center gap-14 py-28 lg:grid-cols-[1.15fr_.85fr]">
      <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:.8}}>
        <p className="eyebrow">{t.hero.eyebrow}</p>
        <h1 className="hero-title">{t.hero.title}</h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">{t.hero.body}</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <GlassButton asChild><Link to="/analyze">{t.hero.primary}<ArrowUpRight/></Link></GlassButton>
          <GlassButton asChild variant="outline"><a href="#how">{t.hero.secondary}<ArrowDown/></a></GlassButton>
        </div>
      </motion.div>
      <HeroDocument/>
    </section>
  ); 
}

export function HomeSections() { 
  const { language } = useApplication(); 
  const t = copy[language]; 
  
  // استخدام أيقونات احترافية تعبر عن مسار عمل فعلي بدلاً من أيقونات الذكاء الاصطناعي المستهلكة
  const icons = [FileText, ScanLine, ShieldCheck, Activity]; 
  
  const formatStepCount = (current: number, total: number, lang: string) => {
    const currStr = String(current).padStart(2, "0");
    const totStr = String(total).padStart(2, "0");
    if (lang !== "ar") return `${currStr} / ${totStr}`;
    const convert = (s: string) => s.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]!);
    return `${convert(currStr)} / ${convert(totStr)}`;
  };

  return (
    <>
      <section id="how" className="section shell">
        <Reveal><SectionHeader eyebrow={formatStepCount(1, 4, language)} title={t.home.howTitle} body={t.home.howBody}/></Reveal>
        <div className="timeline-grid mt-16">
          {t.steps.map((step, i)=>{
            const Icon = icons[i] ?? FileScan; 
            return (
              <Reveal key={step} delay={i*.08}>
                <div className="timeline-step">
                  {/* تم تكبير الرقم وجعله بخط رفيع ولون باهت ليعطي طابعاً احترافياً */}
                  <div className="text-4xl font-light text-muted-foreground/40">{formatNum(i + 1, language)}</div>
                  <Icon className="size-6 text-foreground mt-8 mb-4"/>
                  <h3 className="text-xl font-medium">{step}</h3>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

<section className="section border-y border-border">
        <div className="shell">
          <Reveal><SectionHeader eyebrow={formatStepCount(2, 4, language)} title={t.home.pipeline}/></Reveal>
          <div className="pipeline mt-16">
            {(language === "ar" 
              ? ["صورة الطلب", "الرؤية الحاسوبية", "البيانات المستخرجة", "التحقق", "تعلم الآلة", "التوقع"]
              : ["APPLICATION IMAGE", "COMPUTER VISION", "EXTRACTED DATA", "VALIDATION", "MACHINE LEARNING", "PREDICTION"]
            ).map((x, i)=>(
              <Reveal key={x} delay={i*.06}>
                <div className="pipeline-node">
                  <div className="text-4xl font-light text-muted-foreground/30">{formatNum(i + 1, language)}</div>
                  <strong className="mt-8 block text-sm tracking-widest">{x}</strong>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section shell">
        <Reveal><SectionHeader eyebrow={formatStepCount(3, 4, language)} title={t.home.why}/></Reveal>
        <div className="mt-14 grid gap-px overflow-hidden border border-border bg-border md:grid-cols-3">
          {t.home.whyItems.map((x, i)=>(
            <div className="bg-background p-8 md:p-10" key={x}>
               {/* رقم بحجم كبير جداً كـ Watermark للميزات */}
              <div className="text-5xl font-light text-muted-foreground/20">{formatNum(i + 1, language)}</div>
              <h3 className="mt-16 text-xl font-medium">{x}</h3>
            </div>
          ))}
        </div>
      </section>

      <section className="section shell text-center">
        <Reveal>
          <h2 className="section-title mx-auto max-w-4xl">{t.home.final}</h2>
          <p className="mx-auto mt-5 max-w-xl text-muted-foreground">{t.home.finalBody}</p>
          <GlassButton asChild className="mt-9"><Link to="/analyze">{t.hero.primary}<ArrowUpRight/></Link></GlassButton>
        </Reveal>
      </section>
    </>
  ); 
}