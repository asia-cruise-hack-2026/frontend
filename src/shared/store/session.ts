import { Store, useStore } from "@tanstack/react-store";

type TransportMode = "taxi" | "van" | "gtaxi";

interface SessionState {
  cruiseId: string | null;
  pkgSpotIds: string[];
  // 디자인 state routeConfirmed — 패키지에서 확정해야 홈에 "현재 경로"로 노출(미확정 초안은 숨김)
  routeConfirmed: boolean;
  // 디자인 state taxiCalled — 기사 매칭 완료 후 경로 잠금·홈 택시 플로팅 노출
  taxiCalled: boolean;
  transportMode: TransportMode | null;
  cart: string[];
}

const EMPTY: SessionState = {
  cruiseId: null,
  pkgSpotIds: [],
  routeConfirmed: false,
  taxiCalled: false,
  transportMode: null,
  cart: [],
};

const STORAGE_KEY = "omong.session.v1";

// SPA prerender(node)에서도 모듈이 평가되므로 window 가드 필수
const load = (): SessionState => {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const p: unknown = JSON.parse(raw);
    if (typeof p !== "object" || p === null) return EMPTY;
    const s = p as Partial<SessionState>;
    return {
      cruiseId: typeof s.cruiseId === "string" ? s.cruiseId : null,
      pkgSpotIds: Array.isArray(s.pkgSpotIds)
        ? s.pkgSpotIds.filter((x): x is string => typeof x === "string")
        : [],
      routeConfirmed: s.routeConfirmed === true,
      taxiCalled: s.taxiCalled === true,
      transportMode:
        s.transportMode === "taxi" || s.transportMode === "van" || s.transportMode === "gtaxi"
          ? s.transportMode
          : null,
      cart: Array.isArray(s.cart) ? s.cart.filter((x): x is string => typeof x === "string") : [],
    };
  } catch {
    return EMPTY;
  }
};

const store = new Store<SessionState>(load());

store.subscribe(() => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store.state));
  } catch {
    // 저장 실패(용량·프라이버시 모드)는 무시 — 세션은 메모리로 계속 동작
  }
});

/** 라우터 beforeLoad 등 훅 밖에서 읽는 스냅샷 */
export const getSessionCruiseId = (): string | null => store.state.cruiseId;

export const useCruiseId = () => useStore(store, (s) => s.cruiseId);
export const usePkgSpotIds = () => useStore(store, (s) => s.pkgSpotIds);
export const useRouteConfirmed = () => useStore(store, (s) => s.routeConfirmed);
export const useTaxiCalled = () => useStore(store, (s) => s.taxiCalled);
export const useTransportMode = () => useStore(store, (s) => s.transportMode);
export const useCart = () => useStore(store, (s) => s.cart);

export const sessionActions = {
  setCruiseId: (id: string) => store.setState((s) => ({ ...s, cruiseId: id })),
  togglePkgSpot: (id: string) =>
    store.setState((s) => ({
      ...s,
      pkgSpotIds: s.pkgSpotIds.includes(id)
        ? s.pkgSpotIds.filter((x) => x !== id)
        : [...s.pkgSpotIds, id],
    })),
  setPkgSpots: (ids: string[]) => store.setState((s) => ({ ...s, pkgSpotIds: ids })),
  setRouteConfirmed: (v: boolean) => store.setState((s) => ({ ...s, routeConfirmed: v })),
  setTaxiCalled: (v: boolean) => store.setState((s) => ({ ...s, taxiCalled: v })),
  // 실 스팟 목록에 없는 잔여 id(과거 mock 등) 제거 — 픽커/패키지 카운트 오염 방지
  prunePkgSpots: (validIds: string[]) =>
    store.setState((s) => {
      const pruned = s.pkgSpotIds.filter((id) => validIds.includes(id));
      return pruned.length === s.pkgSpotIds.length ? s : { ...s, pkgSpotIds: pruned };
    }),
  movePkgSpot: (id: string, dir: -1 | 1) =>
    store.setState((s) => {
      const a = [...s.pkgSpotIds];
      const i = a.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= a.length) return s;
      const tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
      return { ...s, pkgSpotIds: a };
    }),
  swapPkgSpot: (oldId: string, newId: string) =>
    store.setState((s) => {
      if (s.pkgSpotIds.includes(newId)) return s;
      const i = s.pkgSpotIds.indexOf(oldId);
      if (i < 0) return s;
      const a = [...s.pkgSpotIds];
      a[i] = newId;
      return { ...s, pkgSpotIds: a };
    }),
  setTransportMode: (mode: TransportMode) => store.setState((s) => ({ ...s, transportMode: mode })),
  addToCart: (id: string) =>
    store.setState((s) => ({
      ...s,
      cart: s.cart.includes(id) ? s.cart : [...s.cart, id],
    })),
  removeFromCart: (id: string) =>
    store.setState((s) => ({ ...s, cart: s.cart.filter((x) => x !== id) })),
  clearCart: () => store.setState((s) => ({ ...s, cart: [] })),
  reset: () => store.setState(() => ({ ...EMPTY })),
};

export type { TransportMode };
