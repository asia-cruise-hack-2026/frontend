import { Box } from "@wanteddev/wds";
import { type PointerEvent, useEffect, useRef, useState } from "react";

import { useI18n } from "@/shared/i18n";

// 디자인 "Splash Interactive(최종).dc.html" 이식 — 차오르는 바다 인터랙티브 스플래시.
// 그라데이션은 리브랜드 규칙(#0066FF→#2563EB)에 맞춰 #1D4ED8→#2563EB→#60A5FA로 매핑.
// 원본의 sp-amb 키프레임은 파일에 누락돼 있어 은은한 펄스로 보완.
const KEYFRAMES = `
@keyframes sp-wave{from{transform:translateX(0)}to{transform:translateX(-390px)}}
@keyframes sp-hint{0%,100%{opacity:.55}50%{opacity:1}}
@keyframes sp-ring{from{transform:translate(-50%,-50%) scale(0);opacity:.8}to{transform:translate(-50%,-50%) scale(1);opacity:0}}
@keyframes sp-fillr{from{transform:translate(-50%,-50%) scale(.05);opacity:.4}to{transform:translate(-50%,-50%) scale(1);opacity:0}}
@keyframes sp-bubble{from{transform:translate(-50%,-50%) scale(1);opacity:.85}to{transform:translate(calc(-50% + var(--dx)),calc(-50% - 175px)) scale(.25);opacity:0}}
@keyframes sp-bubrise{0%{transform:translateY(0) translateX(0);opacity:0}12%{opacity:.5}88%{opacity:.5}100%{transform:translateY(-780px) translateX(var(--wobble,10px));opacity:0}}
@keyframes sp-pop{0%{opacity:0;transform:scale(.72)}60%{opacity:1;transform:scale(1.06)}100%{opacity:1;transform:scale(1)}}
@keyframes sp-glow{0%,100%{opacity:.65;transform:translate(-50%,-58%) scale(1)}50%{opacity:1;transform:translate(-50%,-58%) scale(1.08)}}
@keyframes sp-refl{0%,100%{transform:scaleY(-1) translateX(-4px) skewX(-2deg)}50%{transform:scaleY(-1) translateX(4px) skewX(2deg)}}
@keyframes sp-amb{0%,100%{opacity:.25}50%{opacity:.9}}
@media (prefers-reduced-motion: reduce){.sp-anim{animation:none !important}}
`;

interface Ripple {
  id: number;
  x: number;
  y: number;
  bubbles: { k: number; dx: number; size: number; dur: number; delay: number }[];
}

const AMBIENT = [
  { left: "16%", top: "20%", size: 6, dur: 6.5, delay: 0 },
  { left: "78%", top: "16%", size: 9, dur: 8, delay: 1.2 },
  { left: "48%", top: "12%", size: 4, dur: 6, delay: 3 },
  { left: "86%", top: "30%", size: 6, dur: 8.5, delay: 1.8 },
  { left: "10%", top: "34%", size: 5, dur: 7.5, delay: 3.6 },
];

const WATER_BUBBLES = [
  { left: "18%", size: 12, wobble: 12, dur: 12, delay: 0 },
  { left: "34%", size: 7, wobble: -10, dur: 10, delay: 2.5 },
  { left: "52%", size: 16, wobble: 9, dur: 14, delay: 1.4 },
  { left: "68%", size: 9, wobble: -13, dur: 11, delay: 4 },
  { left: "82%", size: 11, wobble: 10, dur: 13, delay: 6 },
  { left: "44%", size: 6, wobble: -8, dur: 9.5, delay: 7.5 },
];

const WAVE_PATH_FILL =
  "M0,40 C65,85 130,85 195,40 S325,-5 390,40 S520,85 585,40 S715,-5 780,40 L780,120 L0,120 Z";
const WAVE_PATH_LINE = "M0,40 C65,85 130,85 195,40 S325,-5 390,40 S520,85 585,40 S715,-5 780,40";

/** 앱 첫 진입(콜드 로드) 스플래시 — 로딩 진행에 따라 물이 차오르고, 탭하면 물결이 인다. */
export function Splash({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const [pct, setPct] = useState(0);
  const [surge, setSurge] = useState(0);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [leaving, setLeaving] = useState(false);
  const ridRef = useRef(0);
  const surgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 로딩 진행 — 디자인 로직: 50ms마다 +3.2(70 미만)/+1.8, 100 도달 시 정지
  useEffect(() => {
    const id = setInterval(() => {
      setPct((p) => {
        const n = Math.min(100, p + (p < 70 ? 3.2 : 1.8));
        if (n >= 100) clearInterval(id);
        return n;
      });
    }, 50);
    return () => clearInterval(id);
  }, []);

  // 완료: 100 도달 → 350ms 여유 → 350ms 페이드아웃 → 언마운트
  useEffect(() => {
    if (pct < 100) return;
    const beat = setTimeout(() => setLeaving(true), 350);
    return () => clearTimeout(beat);
  }, [pct]);
  useEffect(() => {
    if (!leaving) return;
    const id = setTimeout(onDone, 380);
    return () => clearTimeout(id);
  }, [leaving, onDone]);

  const onTap = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const id = ++ridRef.current;
    const cnt = 5 + Math.floor(Math.random() * 3);
    const bubbles = Array.from({ length: cnt }, (_, k) => ({
      k,
      dx: Math.round((Math.random() * 2 - 1) * 70),
      size: 6 + Math.round(Math.random() * 11),
      dur: +(0.9 + Math.random() * 0.6).toFixed(2),
      delay: +(Math.random() * 0.12).toFixed(2),
    }));
    setRipples((rs) => [...rs, { id, x, y, bubbles }]);
    setSurge(6);
    if (surgeTimer.current) clearTimeout(surgeTimer.current);
    surgeTimer.current = setTimeout(() => setSurge(0), 360);
    setTimeout(() => setRipples((rs) => rs.filter((rp) => rp.id !== id)), 1000);
  };

  const waterH = Math.round(Math.min(48, Math.min(42, pct * 0.42) + surge));

  return (
    <Box
      onPointerDown={onTap}
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        overflow: "hidden",
        background: "linear-gradient(168deg,#1D4ED8 0%,#2563EB 52%,#60A5FA 100%)",
        userSelect: "none",
        cursor: "pointer",
        touchAction: "none",
        opacity: leaving ? 0 : 1,
        transition: "opacity .35s ease",
      }}
    >
      <style>{KEYFRAMES}</style>

      {/* 상단 광원 */}
      <Box
        sx={{
          position: "absolute",
          top: "-80px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "120%",
          height: "44%",
          background: "radial-gradient(closest-side,rgba(255,255,255,.30),rgba(255,255,255,0) 70%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* ambient 점광 */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 2,
          overflow: "hidden",
        }}
      >
        {AMBIENT.map((a) => (
          <span
            key={`${a.left}-${a.top}`}
            className="sp-anim"
            style={{
              position: "absolute",
              left: a.left,
              top: a.top,
              width: a.size,
              height: a.size,
              borderRadius: 999,
              background: "rgba(255,255,255,.65)",
              filter: "blur(.4px)",
              animation: `sp-amb ${a.dur}s ease-in-out infinite ${a.delay}s`,
            }}
          />
        ))}
      </Box>

      {/* 중앙 로고 + 글로우 + 수면 반사 */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 5,
          pointerEvents: "none",
        }}
      >
        <Box
          sx={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <span
            className="sp-anim"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 340,
              height: 240,
              background:
                "radial-gradient(closest-side,rgba(255,255,255,.34),rgba(255,255,255,0) 70%)",
              animation: "sp-glow 3.6s ease-in-out infinite",
            }}
          />
          <img
            src="/brand/logo-omong-white.svg"
            alt="OMONG"
            className="sp-anim"
            style={{
              position: "relative",
              height: 84,
              width: "auto",
              display: "block",
              filter: "drop-shadow(0 6px 18px rgba(2,20,70,.35))",
              animation: "sp-pop .85s cubic-bezier(.2,.9,.3,1.2) both",
            }}
          />
          <img
            src="/brand/logo-omong-white.svg"
            alt=""
            aria-hidden="true"
            className="sp-anim"
            style={{
              position: "absolute",
              top: "100%",
              marginTop: 12,
              height: 84,
              width: "auto",
              display: "block",
              opacity: 0.18,
              WebkitMaskImage: "linear-gradient(to bottom,#000,transparent 82%)",
              maskImage: "linear-gradient(to bottom,#000,transparent 82%)",
              animation: "sp-refl 4.2s ease-in-out infinite",
            }}
          />
        </Box>
      </Box>

      {/* 차오르는 물 */}
      <Box
        sx={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: `${waterH}%`,
          zIndex: 4,
          pointerEvents: "none",
          transition: "height .55s cubic-bezier(.34,1.1,.4,1)",
          background: "linear-gradient(180deg,rgba(6,45,120,.30) 0%,rgba(4,28,92,.52) 100%)",
          boxShadow: "0 -8px 30px rgba(3,25,80,.25)",
        }}
      >
        <svg
          viewBox="0 0 780 120"
          preserveAspectRatio="none"
          className="sp-anim"
          style={{
            position: "absolute",
            top: -16,
            left: 0,
            width: 780,
            height: 32,
            fill: "rgba(6,45,120,.30)",
            animation: "sp-wave 8s linear infinite",
          }}
          aria-hidden="true"
        >
          <path d={WAVE_PATH_FILL} />
        </svg>
        <svg
          viewBox="0 0 780 120"
          preserveAspectRatio="none"
          className="sp-anim"
          style={{
            position: "absolute",
            top: -16,
            left: 0,
            width: 780,
            height: 32,
            fill: "none",
            stroke: "rgba(255,255,255,.5)",
            strokeWidth: 2.5,
            animation: "sp-wave 8s linear infinite",
          }}
          aria-hidden="true"
        >
          <path d={WAVE_PATH_LINE} />
        </svg>
        <svg
          viewBox="0 0 780 120"
          preserveAspectRatio="none"
          className="sp-anim"
          style={{
            position: "absolute",
            top: -10,
            left: 0,
            width: 780,
            height: 32,
            fill: "none",
            stroke: "rgba(255,255,255,.22)",
            strokeWidth: 2,
            animation: "sp-wave 5.5s linear infinite",
          }}
          aria-hidden="true"
        >
          <path d={WAVE_PATH_LINE} />
        </svg>
        {WATER_BUBBLES.map((b) => (
          <span
            key={b.left}
            className="sp-anim"
            style={
              {
                position: "absolute",
                left: b.left,
                bottom: 0,
                width: b.size,
                height: b.size,
                borderRadius: 999,
                boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,.28)",
                "--wobble": `${b.wobble}px`,
                animation: `sp-bubrise ${b.dur}s linear infinite ${b.delay}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </Box>

      {/* 탭 리플 레이어 */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 6,
          overflow: "hidden",
        }}
      >
        {ripples.map((rp) => (
          <span key={rp.id}>
            <span
              style={{
                position: "absolute",
                left: rp.x,
                top: rp.y,
                width: 560,
                height: 560,
                borderRadius: 999,
                background:
                  "radial-gradient(closest-side,rgba(255,255,255,.26),rgba(255,255,255,0) 70%)",
                animation: "sp-fillr .95s ease-out forwards",
              }}
            />
            <span
              style={{
                position: "absolute",
                left: rp.x,
                top: rp.y,
                width: 520,
                height: 520,
                borderRadius: 999,
                boxShadow: "inset 0 0 0 3px rgba(255,255,255,.5)",
                animation: "sp-ring .95s cubic-bezier(.2,.6,.3,1) forwards",
              }}
            />
            <span
              style={{
                position: "absolute",
                left: rp.x,
                top: rp.y,
                width: 300,
                height: 300,
                borderRadius: 999,
                boxShadow: "inset 0 0 0 2px rgba(255,255,255,.38)",
                animation: "sp-ring .95s cubic-bezier(.2,.6,.3,1) .08s forwards",
              }}
            />
            {rp.bubbles.map((b) => (
              <span
                key={b.k}
                style={
                  {
                    position: "absolute",
                    left: rp.x,
                    top: rp.y,
                    width: b.size,
                    height: b.size,
                    borderRadius: 999,
                    background: "rgba(255,255,255,.85)",
                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,.5)",
                    "--dx": `${b.dx}px`,
                    animation: `sp-bubble ${b.dur}s ease-out ${b.delay}s forwards`,
                  } as React.CSSProperties
                }
              />
            ))}
          </span>
        ))}
      </Box>

      {/* 하단 힌트 */}
      <Box
        sx={{
          position: "absolute",
          left: "44px",
          right: "44px",
          bottom: "62px",
          zIndex: 7,
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <span
          className="sp-anim"
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "rgba(255,255,255,.9)",
            animation: "sp-hint 2.2s ease-in-out infinite",
          }}
        >
          {t("splash_tap_hint")}
        </span>
      </Box>
    </Box>
  );
}
