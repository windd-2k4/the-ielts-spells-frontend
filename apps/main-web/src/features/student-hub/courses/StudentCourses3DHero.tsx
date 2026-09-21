"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Sparkle,
  BookOpen,
  ArrowRight,
  ArrowDown,
  GraduationCap,
  Target,
  Scroll,
  Headphones,
  Article,
  PenNib,
  Microphone,
} from "@phosphor-icons/react";
import styles from "./StudentCourses3D.module.css";

interface StudentCourses3DHeroProps {
  targetBand?: number | null;
  enrolledCount?: number;
  availableCount?: number;
  onExploreClick?: () => void;
}

export function StudentCourses3DHero({
  targetBand,
  enrolledCount = 0,
  availableCount = 0,
  onExploreClick,
}: StudentCourses3DHeroProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isAutoOpening, setIsAutoOpening] = useState(false);

  // Smooth lerp loop using requestAnimationFrame (damping 0.08)
  useEffect(() => {
    let animFrameId: number;
    let targetProgress = 0;
    let currentProgress = 0;

    const handleScroll = () => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const maxScroll = rect.height - window.innerHeight;
      if (maxScroll <= 0) return;
      const raw = -rect.top / maxScroll;
      targetProgress = Math.max(0, Math.min(1, raw));
    };

    const loop = () => {
      currentProgress += (targetProgress - currentProgress) * 0.08;
      if (Math.abs(targetProgress - currentProgress) > 0.001) {
        setScrollProgress(currentProgress);
      }
      animFrameId = requestAnimationFrame(loop);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    loop();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  // Jump smoothly to the courses catalog below
  const scrollToCatalog = useCallback(() => {
    if (onExploreClick) {
      onExploreClick();
      return;
    }
    const target = document.getElementById("courses-catalog");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  }, [onExploreClick]);

  // Click on book or CTA to play opening sequence
  const handleOpenBook = useCallback(() => {
    setIsAutoOpening(true);
    if (trackRef.current) {
      const rect = trackRef.current.getBoundingClientRect();
      const targetY = window.scrollY + rect.top + rect.height * 0.72;
      window.scrollTo({ top: targetY, behavior: "smooth" });
      setTimeout(() => {
        setIsAutoOpening(false);
      }, 1200);
    }
  }, []);

  // Calculate 3D transformation values from progress
  const effectiveProgress = isAutoOpening ? Math.max(scrollProgress, 0.75) : scrollProgress;
  const coverProgress = Math.min(1, effectiveProgress / 0.62);
  const coverAngle = -180 * Math.sin((coverProgress * Math.PI) / 2);

  // Page leaves fanning open
  const leaf1Angle = -165 * Math.min(1, Math.max(0, (effectiveProgress - 0.1) / 0.52));
  const leaf2Angle = -140 * Math.min(1, Math.max(0, (effectiveProgress - 0.2) / 0.45));

  // Camera zoom in
  const zoomFactor =
    effectiveProgress > 0.45
      ? 1 + Math.pow((effectiveProgress - 0.45) / 0.55, 1.8) * 1.6
      : 1;

  // Parallax translation for floating cards
  const uiParallax = effectiveProgress * -60;

  // Golden portal bloom opacity
  const bloomOpacity = effectiveProgress > 0.75 ? Math.min(1, (effectiveProgress - 0.75) * 4) : 0;

  return (
    <div ref={trackRef} className={styles.heroTrack}>
      <div className={styles.heroSticky}>
        {/* Ambient Glows */}
        <div className={styles.ambientGlow} />

        {/* Ambient floating dust particles */}
        <div className={styles.particleLayer}>
          {[...Array(16)].map((_, i) => (
            <div
              key={i}
              className={styles.particle}
              style={{
                top: `${(i * 19) % 95}%`,
                left: `${(i * 27) % 92}%`,
                width: `${4 + (i % 4) * 2}px`,
                height: `${4 + (i % 4) * 2}px`,
                animationDelay: `${(i * 0.6) % 5}s`,
                animationDuration: `${6 + (i % 5)}s`,
              }}
            />
          ))}
        </div>

        {/* Top Overlay Headline (Fades out gracefully as book opens) */}
        <div
          className={styles.heroOverlayTop}
          style={{
            opacity: Math.max(0, 1 - effectiveProgress * 2.2),
            transform: `translateY(${effectiveProgress * -40}px)`,
            pointerEvents: effectiveProgress > 0.35 ? "none" : "auto",
          }}
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#894C5B]/40 border border-[#F4C430]/40 text-[#FDE047] text-xs font-semibold tracking-wider uppercase mb-3 backdrop-blur-md">
            <Sparkle size={13} weight="fill" className="text-[#F4C430]" />
            <span>The IELTS Spells · Grimoire of Academic Mastery</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight font-serif">
            Khám Phá Kho Tàng Khóa Học
          </h1>

          <p className="mt-2 text-xs sm:text-sm text-amber-100/75 max-w-xl mx-auto font-sans font-light">
            Cuộn xuống hoặc nhấp vào quyển sách phép để lật mở lộ trình học thuật và bứt phá Band điểm mục tiêu.
          </p>
        </div>

        {/* Floating Parallax Spell Pills (Left & Right) */}
        <div
          className={styles.floatingCardLeft}
          style={{ transform: `translateY(${uiParallax * 1.3}px)` }}
        >
          <div className="space-y-4">
            <div className={styles.spellCardPill}>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                <Headphones size={18} weight="bold" />
              </div>
              <div className="text-left">
                <div className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">
                  Listening Oracle
                </div>
                <div className="text-xs font-semibold text-white/90">
                  Phép Định Vị Âm Bản
                </div>
              </div>
            </div>

            <div className={styles.spellCardPill}>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <Article size={18} weight="bold" />
              </div>
              <div className="text-left">
                <div className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
                  Reading Codex
                </div>
                <div className="text-xs font-semibold text-white/90">
                  Mật Mã Giải Đề Skimming
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className={styles.floatingCardRight}
          style={{ transform: `translateY(${uiParallax * 0.9}px)` }}
        >
          <div className="space-y-4">
            <div className={styles.spellCardPill}>
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                <PenNib size={18} weight="bold" />
              </div>
              <div className="text-left">
                <div className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">
                  Writing Alchemy
                </div>
                <div className="text-xs font-semibold text-white/90">
                  Giả Kim Luận Điểm Chuẩn 7.0+
                </div>
              </div>
            </div>

            <div className={styles.spellCardPill}>
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300">
                <Microphone size={18} weight="bold" />
              </div>
              <div className="text-left">
                <div className="text-[10px] uppercase font-bold text-rose-300 tracking-wider">
                  Speaking Spells
                </div>
                <div className="text-xs font-semibold text-white/90">
                  Phản Xạ Xướng Âm Bản Xứ
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3D Scene */}
        <div
          className={styles.scene3D}
          style={{
            transform: `scale(${zoomFactor}) translateZ(${effectiveProgress * 100}px)`,
          }}
        >
          {/* THE 3D BOOK */}
          <div
            className={styles.bookStage}
            onClick={handleOpenBook}
            title="Nhấp để mở sách khóa học"
            style={{
              transform: `rotateX(12deg) rotateY(${5 - effectiveProgress * 10}deg) translateY(${Math.sin(effectiveProgress * Math.PI) * -12}px)`,
            }}
          >
            {/* Spine */}
            <div className={styles.bookSpine} />

            {/* Back Cover */}
            <div className={styles.bookBackCover} />

            {/* Page Stack Edge */}
            <div className={styles.pageStackEdge} />

            {/* Base Stationary Right Page */}
            <div className={styles.rightPageInterior}>
              <div>
                <div className="flex items-center justify-between border-b border-[#c8baa5] pb-2 text-[10px] font-bold text-[#68303d] uppercase tracking-wider">
                  <span>Học Viện The IELTS Spells</span>
                  <span>Mục Tiêu Đào Tạo</span>
                </div>

                <div className="mt-3 text-center">
                  <h4 className="font-serif font-black text-sm text-[#1E1B18]">
                    Lộ Trình Bứt Phá Điểm Số
                  </h4>
                  <p className="mt-1 text-[11px] text-[#554B50] italic">
                    “Cast the Spells, Claim the Band.”
                  </p>
                </div>

                <div className="mt-4 space-y-2 text-[11px] text-[#292528]">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/70 border border-[#ded3be]">
                    <span className="text-[#6F676C]">Band mục tiêu:</span>
                    <strong className="text-[#894C5B] font-bold">
                      {targetBand != null ? `Band ${targetBand.toFixed(1)}` : "Linh hoạt"}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/70 border border-[#ded3be]">
                    <span className="text-[#6F676C]">Lớp đang theo:</span>
                    <strong className="text-emerald-800 font-bold">{enrolledCount} lớp</strong>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/70 border border-[#ded3be]">
                    <span className="text-[#6F676C]">Khóa đang mở:</span>
                    <strong className="text-amber-800 font-bold">{availableCount} khóa</strong>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#c8baa5] text-center text-[10px] text-[#6F676C]">
                Khảo thí quốc tế Computer-Delivered
              </div>
            </div>

            {/* Leaf 2 (Middle) */}
            <div
              className={styles.pageLeaf}
              style={{
                transform: `rotateY(${leaf2Angle}deg)`,
                zIndex: 6,
              }}
            />

            {/* Leaf 1 (Top interior page) */}
            <div
              className={styles.pageLeaf}
              style={{
                transform: `rotateY(${leaf1Angle}deg)`,
                zIndex: 7,
              }}
            />

            {/* Crease Glow */}
            <div className={styles.creaseGlow} />

            {/* Front Cover (3D Flipping) */}
            <div
              className={styles.frontCover}
              style={{
                transform: `rotateY(${coverAngle}deg)`,
                zIndex: 8,
              }}
            >
              <div className={styles.goldCornerTL} />
              <div className={styles.goldCornerTR} />
              <div className={styles.goldCornerBL} />
              <div className={styles.goldCornerBR} />

              <div className="text-center pt-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FDE047]/90">
                  Grimoire of
                </span>
                <h3 className="mt-0.5 text-base sm:text-lg font-serif font-black tracking-wide text-white">
                  The IELTS Spells
                </h3>
              </div>

              {/* Rotating Gold Crest */}
              <div className={styles.sealCrest}>
                <Sparkle size={36} weight="fill" />
              </div>

              <div className="text-center pb-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-[#F4C430]/40 text-[#FDE047] text-[10px] font-bold tracking-wide uppercase">
                  <span>Nhấp hoặc cuộn để mở</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Golden Portal Bloom Overlay */}
        {bloomOpacity > 0 && (
          <div
            className={styles.portalBloom}
            style={{ opacity: bloomOpacity }}
          />
        )}

        {/* Bottom CTA Action Overlays */}
        <div
          className={styles.heroOverlayBottom}
          style={{
            opacity: Math.max(0, 1 - effectiveProgress * 2.8),
            transform: `translateY(${effectiveProgress * 30}px)`,
          }}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleOpenBook}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#F4C430] to-[#E5A817] text-[#241a20] text-xs font-extrabold shadow-lg hover:brightness-110 active:scale-95 transition-all"
            >
              <BookOpen size={16} weight="bold" />
              <span>Mở Sách Khóa Học</span>
            </button>

            <button
              type="button"
              onClick={scrollToCatalog}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold backdrop-blur-md transition-all"
            >
              <span>Xem danh sách ngay</span>
              <ArrowDown size={14} weight="bold" />
            </button>
          </div>
          <span className="text-[11px] text-amber-100/60 font-light flex items-center gap-1">
            <ArrowDown size={11} className="animate-bounce" />
            <span>Cuộn chuột xuống để trải nghiệm mở sách 3D</span>
          </span>
        </div>

        {/* Bottom Fade Mask into #f7f5f1 */}
        <div className={styles.bottomFade} />
      </div>
    </div>
  );
}
