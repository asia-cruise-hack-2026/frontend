/**
 * 엔티티 데이터 계층 표준 템플릿 (fateflow-front)
 * 위치: entities/<domain>/api/<domain>.query.ts
 *
 * 핵심 규칙
 * - queryKey 팩토리 + queryOptions 팩토리 + 캐시 서비스 오브젝트를 한 파일에 응집.
 * - queryFn 은 반드시 `@/shared/api` 의 http 래퍼 경유 (직접 fetch 금지).
 * - SSR(Nitro): QueryClient 는 요청마다 만들어 라우터 컨텍스트로 흐른다(전역 싱글턴 금지).
 *   → 캐시 헬퍼는 `qc: QueryClient` 를 인자로 받고, 로더는 `context.queryClient`, 컴포넌트/뮤테이션은 `useQueryClient()`.
 *   배선은 tanstack-integration 스킬. 프리미티브는 tanstack-query, 레이어/배럴은 fsd 스킬.
 */
import {
	type InfiniteData,
	type QueryClient,
	infiniteQueryOptions,
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router"; // ← react-router-dom 아님
import { http } from "@/shared/api";
// 크로스 엔티티 캐시 시딩은 대상 엔티티의 @x 공개 API로만 (배럴 규칙은 fsd 스킬):
// import { ownerService } from "@/entities/owner/@x/profile";
import type { Profile, ProfileFilter, ProfilePage } from "./profile.types";

/** 1) queryKey 팩토리 — 계층형·직렬화 가능 (tanstack-query: qk-array-structure, qk-hierarchical) */
const keys = {
	root: () => ["profile"] as const,
	byId: (id: string) => [...keys.root(), "byId", id] as const,
	list: () => [...keys.root(), "list"] as const,
	listByFilter: (filter: ProfileFilter) =>
		[...keys.list(), "byFilter", filter] as const,
};

/** 2) 단건 서비스 — queryKey/queryOptions 는 순수(클라이언트 불필요),
 *     명령형 캐시 헬퍼는 qc 를 받는다(SSR per-request 안전). */
export const profileService = {
	queryKey: (id: string) => keys.byId(id),

	queryOptions: (id: string, token?: string) =>
		queryOptions({
			queryKey: keys.byId(id),
			queryFn: ({ signal }) =>
				http.get<Profile>(`/v1/manse-profiles/${id}`, { signal, token }),
		}),

	getCache: (qc: QueryClient, id: string) =>
		qc.getQueryData<Profile>(keys.byId(id)),

	setCache: (qc: QueryClient, profile: Profile) =>
		qc.setQueryData(keys.byId(profile.id), profile),

	removeCache: (qc: QueryClient, id: string) =>
		qc.removeQueries({ queryKey: keys.byId(id) }),
};

/** 3) 무한 목록 서비스 — queryOptions 는 순수. 시딩은 queryFn 안이 아니라 로더에서(아래 4). */
export const profileListService = {
	queryKey: (filter: ProfileFilter) => keys.listByFilter(filter),

	queryOptions: (filter: ProfileFilter, token?: string) =>
		infiniteQueryOptions({
			queryKey: keys.listByFilter(filter),
			queryFn: ({ pageParam, signal }) =>
				http.get<ProfilePage>(`/v1/manse-profiles?offset=${pageParam}`, {
					signal,
					token,
				}),
			initialPageParam: 0,
			getNextPageParam: (last, all) =>
				last.items.length < last.limit ? null : all.length * last.limit,
		}),
};

/**
 * 4) 로더에서 prefetch + 단건 캐시 시딩 (context.queryClient 사용 — SSR 안전).
 *    routes/<...>.tsx 예:
 *
 *    export const Route = createFileRoute("/profiles")({
 *      loader: async ({ context: { queryClient } }) => {
 *        const data = await queryClient.ensureQueryData(
 *          profileListService.queryOptions(filter),
 *        );
 *        // 목록 항목을 단건 캐시에 시딩 → 상세 진입 시 즉시 표시(waterfall 제거)
 *        for (const p of data.pages.flatMap((pg) => pg.items)) {
 *          profileService.setCache(queryClient, p);
 *        }
 *      },
 *      component: ProfilesPage, // 화면은 pages/ 슬라이스 (thin route→page)
 *    });
 */

/** 5) 낙관적 업데이트 뮤테이션 — onMutate 스냅샷 → onError 롤백 → onSettled invalidate.
 *     원칙: 뮤테이션은 쿼리와 분리해 사용처(features/<slice>/api)에 둔다. */
export function useRenameProfileMutation(id: string) {
	const qc = useQueryClient();
	const key = profileService.queryKey(id);

	return useMutation({
		mutationFn: (displayName: string) =>
			http.patch<Profile>(`/v1/manse-profiles/${id}`, { displayName }),
		onMutate: async (displayName) => {
			await qc.cancelQueries({ queryKey: key });
			const prev = profileService.getCache(qc, id);
			if (prev) profileService.setCache(qc, { ...prev, displayName });
			return { prev }; // 롤백 컨텍스트
		},
		onError: (_err, _vars, ctx) => {
			if (ctx?.prev) profileService.setCache(qc, ctx.prev);
		},
		onSettled: () => qc.invalidateQueries({ queryKey: key }),
	});
}

/** 6) 네비게이션이 필요한 뮤테이션 — TanStack Router의 타입 세이프 navigate 사용 */
export function useDeleteProfileMutation(id: string) {
	const qc = useQueryClient();
	const navigate = useNavigate();
	return useMutation({
		mutationFn: () => http.delete<void>(`/v1/manse-profiles/${id}`),
		onSuccess: () => {
			profileService.removeCache(qc, id);
			navigate({ to: "/" });
		},
	});
}

// 참고: InfiniteData<ProfilePage> 타입은 useSuspenseInfiniteQuery/HydrationBoundary 소비 지점에서 사용.
export type ProfileInfinite = InfiniteData<ProfilePage>;
