---
name: tanstack-query
description: TanStack Query(React Query)로 데이터 페칭·캐싱·뮤테이션·서버 상태를 다룰 때 사용한다. useQuery/useMutation/useQueries/useInfiniteQuery, queryKey·queryOptions 설계, staleTime·gcTime, invalidate·optimistic update, prefetch, SSR dehydrate/hydrate 관련 작업에 트리거. 트리거 키워드: TanStack Query, React Query, useQuery, useMutation, queryKey, queryOptions, 쿼리키, 캐시, 무효화, invalidate, staleTime, gcTime, optimistic, 낙관적 업데이트, prefetch, 무한스크롤, HydrationBoundary. 순수 UI·스타일·FSD 배치 판단에는 쓰지 않는다(그건 fsd 스킬).
---

# TanStack Query 베스트 프랙티스

데이터 페칭·캐싱·뮤테이션·서버 상태 동기화를 위한 TanStack Query(React Query) 규칙. 상세 규칙은 `rules/`의 개별 파일에 있고, 필요한 것만 골라 읽는다.

## 이 프로젝트 적용 (fateflow-front)

원본은 TanStack Start 풀스택(서버함수+DB) 전제로 쓰였지만, **우리는 외부 NestJS REST API를 소비하는 클라이언트**다. 아래로 치환해 적용한다:

- **데이터 출처**: 외부 API (`/v1/**` — 개발은 Vite dev 프록시로 `VITE_API_ORIGIN`에 전달). DB·서버함수 없음. `queryFn`은 반드시 `shared/api`의 `http` 래퍼로 호출한다(직접 fetch 금지).
- **배치(FSD)**: 쿼리 훅·`queryKey` 팩토리·`queryOptions`는 해당 도메인 `entities/<domain>/api/`(또는 소비하는 `features/*`)에 둔다. `QueryClient` 프로바이더는 `integrations/`(프레임워크 위치). 규칙 예제의 `@/lib/*` 경로는 **예시일 뿐**이니 우리 FSD 경로로 대체해 읽는다.
- **엔티티 데이터 계층 패턴**: entity마다 `queryOptions`/`queryKey` 팩토리 + 캐시 서비스 오브젝트로 묶는 것이 이 프로젝트 표준이다 → [`fsd-query-service` 스킬](../fsd-query-service/SKILL.md) 참조(이 스킬은 그 하위 프리미티브를 다룸).
- **버전**: `@tanstack/react-query` v5 계열(백엔드 무관, 클라이언트 캐시 규칙이라 버전 민감도 낮음).
- **SSR**: Nitro SSR을 쓰므로 `ssr-*` 규칙(dehydrate/hydrate, `HydrationBoundary`, request별 QueryClient) 유효.
- **적용 축소**: 인증은 외부 서버 OAuth라 mutation의 CSRF/세션류는 서버 스킬 대상 아님. 오프라인(`network-mode`·`persist-queries`)은 현재 우선순위 낮음.

## 언제 적용

- 새 데이터 페칭 로직 작성 / 쿼리 설정
- 뮤테이션·낙관적 업데이트 구현
- 캐싱 전략(staleTime·gcTime·무효화) 설계
- SSR 하이드레이션 연동
- 기존 데이터 페칭 리팩터링

## 규칙 카테고리 (우선순위)

| 우선순위 | 카테고리 | 프리픽스 | 요지 |
|---|---|---|---|
| CRITICAL | 쿼리 키 | `qk-` | 배열 구조·의존성 포함·계층화·팩토리·직렬화 가능 |
| CRITICAL | 캐싱 | `cache-` | staleTime/gcTime·기본값·표적 무효화·placeholder vs initial |
| HIGH | 뮤테이션 | `mut-` | 무효화·낙관적 업데이트·롤백·에러·isPending·useMutationState |
| HIGH | 에러 | `err-` | 에러 바운더리·retry·fallback |
| MEDIUM | 프리페치 | `pf-` | 인텐트 프리페치·ensureQueryData·staleTime |
| MEDIUM | 병렬 | `parallel-`,`query-` | useQueries·쿼리 취소 |
| MEDIUM | 무한 쿼리 | `inf-` | getNextPageParam·로딩 가드·maxPages |
| MEDIUM | SSR | `ssr-` | dehydrate/hydrate·request별 client·HydrationBoundary |
| LOW | 성능 | `perf-` | select 변환·구조 공유·notifyOnChangeProps·placeholderData |
| LOW | 오프라인 | `network-`,`persist-` | 네트워크 모드·영속화 (현재 후순위) |

## 사용법

1. **CRITICAL(쿼리 키·캐싱) 먼저** — 캐시 버그·데이터 불일치 예방
2. **HIGH(뮤테이션·에러)** — 무결성·UX
3. MEDIUM/LOW는 필요 시. 각 규칙 파일은 `설명 → Bad → Good → Context` 구성.

전체 목록·코드 예제는 `rules/` 참조.

---

> 출처: [DeckardGer/tanstack-agent-skills](https://github.com/DeckardGer/tanstack-agent-skills) (MIT). 규칙 본문은 원본을 따르되 프론트(fateflow-front)의 FSD·외부 API 구조에 맞게 위 "적용" 노트로 각색.
