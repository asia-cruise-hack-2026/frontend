import { Store, useStore } from "@tanstack/react-store";

type TransportMode = "taxi" | "van" | "gtaxi";

interface SessionState {
  cruiseId: string | null;
  pkgSpotIds: string[];
  transportMode: TransportMode | null;
  cart: string[];
}

const EMPTY: SessionState = { cruiseId: null, pkgSpotIds: [], transportMode: null, cart: [] };

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
  reset: () =>
    store.setState(() => ({ cruiseId: null, pkgSpotIds: [], transportMode: null, cart: [] })),
};

export type { TransportMode };
