import { Store, useStore } from "@tanstack/react-store";

interface SessionState {
  cruiseId: string | null;
  pkgSpotIds: string[];
}

const store = new Store<SessionState>({ cruiseId: null, pkgSpotIds: [] });

export const useCruiseId = () => useStore(store, (s) => s.cruiseId);
export const usePkgSpotIds = () => useStore(store, (s) => s.pkgSpotIds);

export const sessionActions = {
  setCruiseId: (id: string) => store.setState((s) => ({ ...s, cruiseId: id })),
  togglePkgSpot: (id: string) =>
    store.setState((s) => ({
      ...s,
      pkgSpotIds: s.pkgSpotIds.includes(id)
        ? s.pkgSpotIds.filter((x) => x !== id)
        : [...s.pkgSpotIds, id],
    })),
  reset: () => store.setState(() => ({ cruiseId: null, pkgSpotIds: [] })),
};
