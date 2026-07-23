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

const PEEK_PX = 62; // 접힘(peek) 상태에서 보이는 높이 — 핸들 + 타이틀

interface OverlaySheetProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  /** 접기/펼치기 허용 (호출 진행 중 등 잠금 구간은 false) */
  collapsible?: boolean;
  title?: string;
  maxHeight?: string; // 기본 "70%" — 뒤 지도가 항상 보이게
  children: ReactNode;
}

/**
 * 전면 지도 페이지 위 오버레이 바텀시트 — 핸들을 끌어내리면 접혀서 peek(핸들+타이틀)만 남고
 * 페이지(지도)는 그대로 유지된다. peek을 탭하거나 위로 스와이프하면 다시 펼쳐진다.
 * BottomSheet와 동일한 슬라이드업 진입·드래그 모션을 공유한다.
 */
export function OverlaySheet({
  collapsed,
  onCollapsedChange,
  collapsible = true,
  title,
  maxHeight = "70%",
  children,
}: OverlaySheetProps) {
  // 진입 슬라이드업
  const [shown, setShown] = useState(false);
  useEffect(() => {
    setShown(true);
  }, []);

  const [dragY, setDragY] = useState(0);
  const dragRef = useRef({ startY: 0, dragging: false, moved: false, lastDy: 0 });

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!collapsible) return;
    dragRef.current = { startY: e.clientY, dragging: true, moved: false, lastDy: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d.dragging) return;
    const dy = e.clientY - d.startY;
    d.lastDy = dy;
    if (Math.abs(dy) > 6) d.moved = true;
    if (!collapsed) setDragY(Math.max(0, dy));
  };
  const endDrag = () => {
    const d = dragRef.current;
    if (!d.dragging) return;
    d.dragging = false;
    if (!collapsed) {
      if (dragY > DRAG_CLOSE_PX) onCollapsedChange(true);
      setDragY(0);
    } else if (!d.moved || d.lastDy < -40) {
      // peek 탭 또는 위로 스와이프 → 재출현
      onCollapsedChange(false);
    }
  };

  const translate = !shown ? "100%" : collapsed ? `calc(100% - ${PEEK_PX}px)` : `${dragY}px`;

  return (
    <Box
      sx={(theme) => ({
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 5,
        maxHeight,
        display: "flex",
        flexDirection: "column",
        background: theme.semantic.background.normal.normal,
        borderRadius: "24px 24px 0 0",
        boxShadow: "0 -6px 20px rgba(0,0,0,.12)",
        transform: `translateY(${translate})`,
        transition: dragRef.current.dragging
          ? "none"
          : `transform ${CLOSE_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      })}
    >
      <Box
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        sx={{
          flexShrink: 0,
          touchAction: "none",
          cursor: collapsible ? "grab" : undefined,
        }}
      >
        <SheetHandle margin="10px auto 2px" />
        {title != null && (
          <Box
            sx={(theme) => ({
              padding: "6px 20px 8px",
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
          // 앱 컬럼(620px — __root와 동일)을 넘지 않게 — 넓은 뷰포트에서도 컬럼 폭 유지
          width: "100%",
          maxWidth: "620px",
          margin: "0 auto",
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
