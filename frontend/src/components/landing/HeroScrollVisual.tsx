import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { FileText, Layers, AlertCircle, ArrowUpRight, Search, CheckCircle2 } from 'lucide-react';
import { useInvestigation } from '../../context/InvestigationContext';

interface HeroScrollVisualProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export const HeroScrollVisual: React.FC<HeroScrollVisualProps> = ({ containerRef }) => {
  const { topic } = useInvestigation();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 120 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { currentTarget, clientX, clientY } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = (clientX - left) / width - 0.5;
    const y = (clientY - top) / height - 0.5;
    mouseX.set(x * 12);
    mouseY.set(y * 12);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const artifact1X = useTransform(scrollYProgress, [0, 0.3, 0.6, 1], [-80, -20, 20, 40]);
  const artifact1Y = useTransform(scrollYProgress, [0, 0.3, 0.6, 1], [-60, -10, 30, 60]);
  const artifact1Rotate = useTransform(scrollYProgress, [0, 0.5, 1], [-4, -1, 2]);

  const artifact2X = useTransform(scrollYProgress, [0, 0.3, 0.6, 1], [90, 40, -10, -40]);
  const artifact2Y = useTransform(scrollYProgress, [0, 0.3, 0.6, 1], [-100, -30, 10, 40]);
  const artifact2Rotate = useTransform(scrollYProgress, [0, 0.5, 1], [3, 1, -2]);

  const artifact3X = useTransform(scrollYProgress, [0, 0.3, 0.6, 1], [-110, -40, 15, 30]);
  const artifact3Y = useTransform(scrollYProgress, [0, 0.3, 0.6, 1], [100, 30, -20, -50]);
  const artifact3Rotate = useTransform(scrollYProgress, [0, 0.5, 1], [2, 0, -3]);

  const artifact4X = useTransform(scrollYProgress, [0, 0.3, 0.6, 1], [100, 30, -25, -50]);
  const artifact4Y = useTransform(scrollYProgress, [0, 0.3, 0.6, 1], [120, 40, -15, -45]);
  const artifact4Rotate = useTransform(scrollYProgress, [0, 0.5, 1], [-3, -1, 1]);

  const gapScale = useTransform(scrollYProgress, [0, 0.5, 0.75, 1], [0.85, 0.9, 1, 1.05]);
  const gapOpacity = useTransform(scrollYProgress, [0, 0.6, 0.8, 1], [0, 0.2, 0.85, 1]);
  const gapShadow = useTransform(
    scrollYProgress,
    [0.7, 1],
    ['0px 8px 24px rgba(27,107,117,0.1)', '0px 24px 50px rgba(27,107,117,0.25)']
  );

  const overlapDarkness = useTransform(scrollYProgress, [0.4, 0.85], [1, 0.92]);

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-[620px] lg:h-[720px] flex items-center justify-center select-none"
    >
      {/* Artifact 1: Primary Literature */}
      <motion.div
        style={{
          x: artifact1X,
          y: artifact1Y,
          rotate: artifact1Rotate,
          opacity: overlapDarkness,
          zIndex: 10,
        }}
        className="absolute top-10 left-4 md:left-12 w-[270px] md:w-[320px] bg-white border border-scilens-border rounded-lg shadow-artifact p-5 font-sans"
      >
        <div className="flex items-center justify-between border-b border-scilens-border/70 pb-2 mb-3">
          <span className="text-[10px] font-mono tracking-wider text-scilens-teal uppercase font-semibold">
            01 / PRIMARY LITERATURE
          </span>
          <span className="text-[10px] font-mono text-scilens-muted">Benchmark Study</span>
        </div>
        <div className="space-y-2">
          <h4 className="font-serif text-sm md:text-base font-semibold text-scilens-navy leading-snug line-clamp-2">
            {topic ? `${topic}: Empirical Telemetry & Validation` : "High-Dimensional Empirical Benchmark Telemetry"}
          </h4>
          <p className="text-[11px] text-scilens-muted leading-relaxed font-light line-clamp-3">
            Examining multi-institution observational cohorts across standardized telemetry sequences. Monitored laboratory cohorts demonstrate 91.4% predictive accuracy.
          </p>
          <div className="pt-2 flex items-center gap-2 text-[10px] font-mono text-scilens-lightmuted border-t border-scilens-border/40">
            <span>Indexed in SciLens</span>
            <span>•</span>
            <span className="text-scilens-teal font-medium">Peer-Reviewed Foundation</span>
          </div>
        </div>
      </motion.div>

      {/* Artifact 2: Methodological Paradigm */}
      <motion.div
        style={{
          x: artifact2X,
          y: artifact2Y,
          rotate: artifact2Rotate,
          zIndex: 15,
        }}
        className="absolute top-14 right-2 md:right-10 w-[260px] md:w-[300px] bg-scilens-parchment border border-scilens-border rounded-lg shadow-artifact p-5 font-sans"
      >
        <div className="flex items-center justify-between border-b border-scilens-border/70 pb-2 mb-3">
          <span className="text-[10px] font-mono tracking-wider text-scilens-navy uppercase font-semibold">
            02 / METHODOLOGICAL PARADIGM
          </span>
          <span className="text-[10px] font-mono text-scilens-teal">HIGH-DIMENSIONAL</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-[11px] font-mono text-scilens-slate">
            <span>ARCHITECTURE</span>
            <span className="font-semibold text-scilens-navy">Multimodal Transformer</span>
          </div>
          <div className="flex justify-between text-[11px] font-mono text-scilens-slate">
            <span>TOKENIZATION</span>
            <span className="font-semibold text-scilens-navy">Latent Embeddings</span>
          </div>
          <div className="flex justify-between text-[11px] font-mono text-scilens-slate">
            <span>COHORT SIZE</span>
            <span className="font-semibold text-scilens-navy">n=450 controlled subjects</span>
          </div>
          <div className="mt-3 p-2 bg-white/80 rounded border border-scilens-border/50 text-[10px] text-scilens-muted font-mono leading-relaxed">
            Assumption: Invariant feature distributions across disparate real-world deployment contexts.
          </div>
        </div>
      </motion.div>

      {/* Artifact 3: Empirical Findings */}
      <motion.div
        style={{
          x: artifact3X,
          y: artifact3Y,
          rotate: artifact3Rotate,
          zIndex: 20,
        }}
        className="absolute bottom-20 left-2 md:left-8 w-[280px] md:w-[320px] bg-white border border-scilens-border rounded-lg shadow-layer p-5 font-sans"
      >
        <div className="flex items-center justify-between border-b border-scilens-border/70 pb-2 mb-3">
          <span className="text-[10px] font-mono tracking-wider text-scilens-crimson uppercase font-semibold">
            03 / EMPIRICAL FINDINGS
          </span>
          <span className="text-[10px] font-mono text-scilens-crimson font-medium">-27.8% DEGRADE</span>
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-center my-2">
            <div className="p-2 bg-scilens-warmgray/50 rounded">
              <span className="block text-[10px] font-mono text-scilens-muted">Controlled Cohort</span>
              <span className="text-base font-serif font-bold text-scilens-navy">91.4% F1</span>
            </div>
            <div className="p-2 bg-scilens-lightcrimson rounded border border-red-200">
              <span className="block text-[10px] font-mono text-scilens-crimson">Unseen Cohort</span>
              <span className="text-base font-serif font-bold text-scilens-crimson">63.6% F1</span>
            </div>
          </div>
          <p className="text-[11px] text-scilens-muted leading-relaxed font-light">
            Dramatic performance collapse occurs when tested outside the primary training cohort. Spatial attention mechanisms systematically fail to generalize.
          </p>
        </div>
      </motion.div>

      {/* Artifact 4: Declared Limitations */}
      <motion.div
        style={{
          x: artifact4X,
          y: artifact4Y,
          rotate: artifact4Rotate,
          zIndex: 25,
        }}
        className="absolute bottom-12 right-4 md:right-12 w-[270px] md:w-[310px] bg-scilens-ivory border border-scilens-border rounded-lg shadow-artifact p-5 font-sans"
      >
        <div className="flex items-center justify-between border-b border-scilens-border/70 pb-2 mb-2">
          <span className="text-[10px] font-mono tracking-wider text-scilens-muted uppercase font-semibold">
            04 / DECLARED LIMITATIONS
          </span>
          <span className="text-[10px] font-mono text-scilens-muted">PAGE 14</span>
        </div>
        <div className="space-y-1.5 text-[11px] text-scilens-slate">
          <p className="italic font-serif text-xs text-scilens-navy border-l-2 border-scilens-teal pl-2 my-2">
            "High-dimensional feature correlations degrade rapidly under out-of-distribution demographic and sensor calibration shifts."
          </p>
          <div className="text-[10px] font-mono text-scilens-lightmuted">
            Independent replication trials confirm pervasive calibration drift across external observational centers.
          </div>
        </div>
      </motion.div>

      {/* Central Revealed Gap Card */}
      <motion.div
        style={{
          scale: gapScale,
          opacity: gapOpacity,
          boxShadow: gapShadow,
          zIndex: 35,
        }}
        className="absolute inset-x-4 md:inset-x-auto md:w-[420px] bg-white border-2 border-scilens-teal rounded-xl p-6 font-sans text-center transition-all duration-300"
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-scilens-lightteal text-scilens-teal text-[10px] font-mono font-bold tracking-wider uppercase mb-3 border border-scilens-borderteal">
          <AlertCircle className="w-3 h-3" />
          POTENTIAL RESEARCH GAP DETECTED
        </div>

        <h3 className="font-serif text-lg md:text-xl font-semibold text-scilens-navy leading-snug">
          Empirical Generalization Deficit in {topic || "Multimodal Foundation Models"} Under Out-of-Distribution Shift
        </h3>

        <p className="mt-2 text-xs text-scilens-muted font-light leading-relaxed">
          The literature reveals a critical systemic blindspot: cross-modal representations exhibit severe calibration drift and unmodeled covariate divergence across real-world cohort domains.
        </p>

        <div className="mt-4 pt-3 border-t border-scilens-border/60 flex items-center justify-between text-[11px] font-mono">
          <span className="text-scilens-teal font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Adversarial Scrutiny: PASSED
          </span>
          <span className="text-scilens-muted">Confidence: 92%</span>
        </div>
      </motion.div>
    </div>
  );
};
