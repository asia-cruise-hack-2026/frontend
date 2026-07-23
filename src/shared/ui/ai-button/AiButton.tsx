import { Box } from "@wanteddev/wds";
import { IconSparkleFill } from "@wanteddev/wds-icon";
import type { ReactNode } from "react";

// 디자인 핸드오프 "design_handoff_ai_button" 1a(그라데이션 솔리드) — 핵심 AI 액션 전용, 화면당 1개.
// 그라데이션 시작색은 핸드오프의 #0066FF 대신 리브랜드 토큰(--semantic-primary-normal=#2563EB)을 따른다.
const SWEEP_KEYFRAMES =
  "@keyframes aib-sweep{0%,12%{transform:translateX(-160%) skewX(-16deg)}88%,100%{transform:translateX(320%) skewX(-16deg)}}" +
  ".aib-sweep{animation:aib-sweep 2.5s cubic-bezier(0.4,0,0.2,1) infinite}" +
  "@media (prefers-reduced-motion: reduce){.aib-sweep{animation:none}}";

/** AI 전용 그라데이션 버튼 (Large 48px) — 글래스 스윕 상시 반복 + 글로우 + sparkleFill 아이콘. */
export function AiButton({
  children,
  onClick,
  fullWidth = false,
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  fullWidth?: boolean;
  disabled?: boolean;
}) {
  return (
    <Box
      as="button"
      type="button"
      disabled={disabled}
      onClick={onClick}
      sx={(theme) => ({
        position: "relative",
        overflow: "hidden",
        width: fullWidth ? "100%" : "auto",
        height: "48px",
        padding: "0 28px",
        border: "none",
        borderRadius: "12px",
        cursor: disabled ? "default" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        fontWeight: 600,
        fontSize: "16px",
        lineHeight: 1.5,
        letterSpacing: "0.006em",
        color: theme.semantic.static.white,
        background: disabled
          ? theme.semantic.interaction.disable
          : `linear-gradient(96deg, ${theme.semantic.primary.normal} 0%, #6E4DFF 55%, #9747FF 100%)`,
        boxShadow: disabled ? "none" : "0 4px 14px rgba(78,86,255,0.28)",
        transition: "filter .15s ease",
        "&:hover": { filter: disabled ? "none" : "brightness(1.06)" },
        "&:active": { filter: disabled ? "none" : "brightness(0.94)" },
      })}
    >
      <style>{SWEEP_KEYFRAMES}</style>
      {!disabled && (
        <Box
          as="span"
          className="aib-sweep"
          sx={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: "48%",
            pointerEvents: "none",
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.09) 35%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.09) 65%, transparent 100%)",
          }}
        />
      )}
      <IconSparkleFill sx={{ fontSize: "20px", flexShrink: 0 }} />
      {children}
    </Box>
  );
}
