import { Box, FlexBox } from "@wanteddev/wds";
import { IconClose } from "@wanteddev/wds-icon";
import {
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const CLOSE_MS = 280;
const DRAG_CLOSE_PX = 80; // 이만큼 끌어내리면 닫힘/이전 단계

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

interface InlineSheetProps {
  /** 드래그로 임계값 넘게 내렸을 때 — 이전 단계 복귀 등. 시트는 내려갔다 새 콘텐츠로 다시 올라온다 */
  onDismiss?: () => void;
  /** 드래그 허용 (호출 진행 중 등 잠금 구간은 false) */
  dismissible?: boolean;
  title?: string;
  children: ReactNode;
}

/**
 * 인라인 바텀시트 — 지도 위에 겹치는 비모달 시트(디자인 taxi 섹션).
 * BottomSheet와 동일한 진입 슬라이드업·핸들 드래그 동작을 공유하되, 딤·fixed 없이 레이아웃 요소로 동작한다.
 * 부모는 overflow hidden인 세로 flex 컨테이너여야 한다(시트가 flex:1).
 */
export function InlineSheet({
  onDismiss,
  dismissible = onDismiss != null,
  title,
  children,
}: InlineSheetProps) {
  // 진입 슬라이드업
  const [shown, setShown] = useState(false);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    setShown(true);
  }, []);

  const [dragY, setDragY] = useState(0);
  const dragRef = useRef({ startY: 0, dragging: false });
  const leavingRef = useRef(false);

  // 내려간 뒤 onDismiss(단계 복귀) → 새 콘텐츠로 다시 슬라이드업
  const dismiss = useCallback(() => {
    if (leavingRef.current || !onDismiss) return;
    leavingRef.current = true;
    setLeaving(true);
    setTimeout(() => {
      onDismiss();
      leavingRef.current = false;
      setLeaving(false);
      setDragY(0);
    }, CLOSE_MS);
  }, [onDismiss]);

  const onHeaderPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dismissible || leaving) return;
    dragRef.current = { startY: e.clientY, dragging: true };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onHeaderPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.dragging) return;
    setDragY(Math.max(0, e.clientY - dragRef.current.startY));
  };
  const endDrag = () => {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    if (dragY > DRAG_CLOSE_PX) dismiss();
    else setDragY(0);
  };

  const translate = !shown || leaving ? "100%" : `${dragY}px`;

  return (
    <Box
      sx={(theme) => ({
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        background: theme.semantic.background.normal.normal,
        borderRadius: "24px 24px 0 0",
        marginTop: "-18px",
        position: "relative",
        zIndex: 2,
        boxShadow: "0 -6px 20px rgba(0,0,0,.06)",
        transform: `translateY(${translate})`,
        transition: dragRef.current.dragging
          ? "none"
          : `transform ${CLOSE_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      })}
    >
      <Box
        onPointerDown={onHeaderPointerDown}
        onPointerMove={onHeaderPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        sx={{
          flexShrink: 0,
          touchAction: "none",
          cursor: dismissible ? "grab" : undefined,
        }}
      >
        <SheetHandle margin="10px auto 2px" />
        {title != null && (
          <Box
            sx={(theme) => ({
              padding: "10px 20px 0",
              fontWeight: 700,
              fontSize: "19px",
              color: theme.semantic.label.normal,
            })}
          >
            {title}
          </Box>
        )}
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>{children}</Box>
    </Box>
  );
}

interface BottomSheetProps {
  onClose: () => void;
  /** 딤 클릭·드래그·ESC로 닫기 허용 (결제 진행 등 잠금 구간은 false) */
  dimClosable?: boolean;
  /** 디자인 SWAP SPOT SHEET 기본값 74% — 내용 많은 시트는 92dvh 등으로 조절 */
  maxHeight?: string;
  zIndex?: number;
  title?: string;
  subtitle?: string;
  /** 헤더 우측 닫기 버튼 — 기본: title 있으면 노출 */
  showClose?: boolean;
  /** 함수형 children은 애니메이션 경유 닫기(close)를 받는다 — 내부 닫기 버튼용 */
  children: ReactNode | ((close: () => void) => ReactNode);
}

/**
 * 공용 모달 바텀시트 — 디자인 SWAP SPOT SHEET(:1029-1060) 스펙 공통화.
 * 표준 동작: 딤 페이드 인/아웃 · 슬라이드 업/다운 · 핸들 드래그 닫기 · 배경 스크롤 락 · ESC 닫기.
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
  // 진입(슬라이드업+딤 페이드인) — 마운트 후 transform 해제
  const [shown, setShown] = useState(false);
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    setShown(true);
  }, []);

  // 배경 스크롤 락
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // 애니메이션 경유 닫기 — 슬라이드다운+딤 페이드아웃 후 실제 onClose
  const closingRef = useRef(false);
  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    setTimeout(onClose, CLOSE_MS);
  }, [onClose]);

  // ESC 닫기
  useEffect(() => {
    if (!dimClosable) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dimClosable, close]);

  // 핸들(헤더 존) 드래그 닫기 — 따라 내려가다 임계값 넘으면 닫힘, 아니면 복귀
  const [dragY, setDragY] = useState(0);
  const dragRef = useRef({ startY: 0, dragging: false });
  const onHeaderPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dimClosable || closing) return;
    dragRef.current = { startY: e.clientY, dragging: true };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onHeaderPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.dragging) return;
    setDragY(Math.max(0, e.clientY - dragRef.current.startY));
  };
  const endDrag = () => {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    if (dragY > DRAG_CLOSE_PX) close();
    else setDragY(0);
  };

  const translate = !shown || closing ? "100%" : `${dragY}px`;

  return (
    <Box
      onClick={() => dimClosable && close()}
      sx={{
        position: "fixed",
        inset: 0,
        zIndex,
        background: "rgba(0,0,0,.32)",
        opacity: shown && !closing ? 1 : 0,
        transition: `opacity ${CLOSE_MS}ms ease`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
    >
      <Box
        onClick={(e: ReactMouseEvent) => e.stopPropagation()}
        sx={(theme) => ({
          background: theme.semantic.background.normal.normal,
          borderRadius: "24px 24px 0 0",
          maxHeight,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 -8px 30px rgba(0,0,0,.16)",
          paddingBottom: "max(20px, env(safe-area-inset-bottom))",
          transform: `translateY(${translate})`,
          transition: dragRef.current.dragging
            ? "none"
            : `transform ${CLOSE_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
          "@media (prefers-reduced-motion: reduce)": { transition: "none" },
        })}
      >
        <Box
          onPointerDown={onHeaderPointerDown}
          onPointerMove={onHeaderPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          sx={{
            padding: "16px 22px 10px",
            flexShrink: 0,
            touchAction: "none",
            cursor: dimClosable ? "grab" : undefined,
          }}
        >
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
                  onClick={close}
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
        <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          {typeof children === "function" ? children(close) : children}
        </Box>
      </Box>
    </Box>
  );
}
