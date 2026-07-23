import { Box, FlexBox } from "@wanteddev/wds";
import { IconClose } from "@wanteddev/wds-icon";
import { type MouseEvent, type ReactNode, useEffect, useState } from "react";

/** 시트 상단 드래그 핸들 — 인라인 시트(이동 탭 등)에서 단독 사용 가능 */
export function SheetHandle({ margin = "0 auto 14px" }: { margin?: string }) {
  return (
    <Box
      sx={(theme) => ({
        width: "38px",
        height: "4px",
        borderRadius: "999px",
        background: theme.semantic.line.normal.normal,
        margin,
      })}
    />
  );
}

interface BottomSheetProps {
  onClose: () => void;
  /** 딤 클릭으로 닫기 허용 (결제 진행 등 잠금 구간은 false) */
  dimClosable?: boolean;
  /** 디자인 SWAP SPOT SHEET 기본값 74% — 내용 많은 시트는 92dvh 등으로 조절 */
  maxHeight?: string;
  zIndex?: number;
  title?: string;
  subtitle?: string;
  /** 헤더 우측 닫기 버튼 — 기본: title 있으면 노출 */
  showClose?: boolean;
  children: ReactNode;
}

/**
 * 공용 모달 바텀시트 — 디자인 SWAP SPOT SHEET(:1029-1060) 스펙 공통화.
 * 딤(rgba .32) + 라운드 24 + 핸들 + 슬라이드업(0.28s) + safe-area. 본문은 내부 스크롤.
 */
export function BottomSheet({
  onClose,
  dimClosable = true,
  maxHeight = "74%",
  zIndex = 200,
  title,
  subtitle,
  showClose = title != null,
  children,
}: BottomSheetProps) {
  // 슬라이드업 진입 — 마운트 후 transform 해제 (기존 PaymentSheet 패턴)
  const [shown, setShown] = useState(false);
  useEffect(() => {
    setShown(true);
  }, []);

  return (
    <Box
      onClick={() => dimClosable && onClose()}
      sx={{
        position: "fixed",
        inset: 0,
        zIndex,
        background: "rgba(0,0,0,.32)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
    >
      <Box
        onClick={(e: MouseEvent) => e.stopPropagation()}
        sx={(theme) => ({
          background: theme.semantic.background.normal.normal,
          borderRadius: "24px 24px 0 0",
          maxHeight,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 -8px 30px rgba(0,0,0,.16)",
          paddingBottom: "max(20px, env(safe-area-inset-bottom))",
          transform: shown ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)",
          "@media (prefers-reduced-motion: reduce)": { transition: "none" },
        })}
      >
        <Box sx={{ padding: "16px 22px 10px", flexShrink: 0 }}>
          <SheetHandle />
          {title != null && (
            <FlexBox alignItems="flex-start" justifyContent="space-between" gap="10px">
              <Box sx={{ minWidth: 0 }}>
                <Box
                  as="span"
                  sx={(theme) => ({
                    display: "block",
                    fontWeight: 700,
                    fontSize: "18px",
                    color: theme.semantic.label.normal,
                  })}
                >
                  {title}
                </Box>
                {subtitle && (
                  <Box
                    as="span"
                    sx={(theme) => ({
                      display: "block",
                      fontSize: "13px",
                      color: theme.semantic.label.alternative,
                      marginTop: "3px",
                      lineHeight: 1.45,
                    })}
                  >
                    {subtitle}
                  </Box>
                )}
              </Box>
              {showClose && (
                <Box
                  as="button"
                  type="button"
                  aria-label="close"
                  onClick={onClose}
                  sx={(theme) => ({
                    width: "34px",
                    height: "34px",
                    border: "none",
                    background: theme.semantic.fill.normal,
                    borderRadius: "999px",
                    cursor: "pointer",
                    color: theme.semantic.label.neutral,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  })}
                >
                  <IconClose sx={{ fontSize: "18px" }} />
                </Box>
              )}
            </FlexBox>
          )}
        </Box>
        <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>{children}</Box>
      </Box>
    </Box>
  );
}
