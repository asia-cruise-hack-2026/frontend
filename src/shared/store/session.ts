import { Store, useStore } from "@tanstack/react-store";

type TransportMode = "taxi" | "van" | "gtaxi";

interface SessionState {
  cruiseId: string | null;
  pkgSpotIds: string[];
  transportMode: TransportMode | null;
  cart: string[];
}

const store = new Store<SessionState>({
  cruiseId: null,
  pkgSpotIds: [],
  transportMode: null,
  cart: [],
});

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
  reset: () =>
    store.setState(() => ({ cruiseId: null, pkgSpotIds: [], transportMode: null, cart: [] })),
};

export type { TransportMode };
