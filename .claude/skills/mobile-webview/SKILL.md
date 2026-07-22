---
name: mobile-webview
description: 모바일 웹뷰에서 앱처럼 동작하게 만드는 작업(키보드 회피·safe-area·스크롤 락·스크롤 방향·페이지 가시성 등)에 사용한다. 사주세요는 앱 출시는 안 하나 모바일 브라우저에서 앱처럼 동작해야 한다(ADR-0003). react-simplikit(+mobile) 훅을 화면별로 적용하고 CSS 폴백을 병행하는 규칙. 트리거 키워드: 웹뷰, 모바일 최적화, 앱처럼, 키보드 가림, useAvoidKeyboard, safe-area, useSafeAreaInset, 스크롤 락, useBodyScrollLock, 스크롤 방향, useScrollDirection, dvh, 100vh 잘림, 인풋 줌, react-simplikit, 페이지 가시성. 순수 쿼리/캐시는 tanstack-query, 레이어 배치는 fsd 스킬, 컴포넌트·StyleX는 astryx-stylex.
---

# 모바일 웹뷰 앱-라이크 (fateflow-front)

앱 출시는 안 하지만 모바일 브라우저에서 앱처럼 동작해야 한다([ADR-0003](../../../docs/adr/0003-webview-app-like.md)). 수단은 `react-simplikit`(+`@react-simplikit/mobile`)([ADR-0002](../../../docs/adr/0002-react-simplikit-adoption.md)).

## 화면별 훅 매핑 (유입 핸드오프 기준)

| 증상 / 요소 | 훅 | 프로토타입 CSS 폴백 |
|---|---|---|
| 하단 입력 도크 키보드 가림 (사주 입력) | `useAvoidKeyboard`·`useKeyboardHeight` | `height:100dvh` + safe-area padding |
| 인풋 15/14px iOS 자동 줌 | (CSS만) | `font-size:16px` 상향 |
| 노치 상단 물림 (전 화면) | `useSafeAreaInset` | `env(safe-area-inset-top)` |
| 바텀시트 열려도 뒤 본문 스크롤 | `useBodyScrollLock` | `overscroll-behavior` + overflow 잠금 |
| 스크롤 시 헤더 blur | `useScrollDirection` | scroll state |
| 로딩 탭 백그라운드 이탈 시 타이머/3D 계속 | `usePageVisibility` | `visibilitychange` 구독 |
| 통신 지연 상태 | `useNetworkStatus` | timeout 시뮬 |
| 테마 localStorage | `useStorageState`(core) | localStorage 직접 |
| 바깥 클릭 닫기·토글 | `useOutsideClickEffect`·`useToggle`(core) | overlay onClick |
| 토스트/로딩 타이머 | `useTimeout`·`useInterval`(core) | setTimeout + unmount clear |

## 규칙

- **`@react-simplikit/mobile`(v0.0.2, 초기)은 얇게 감싼다** — `shared/lib/mobile`에 어댑터를 두고 화면은 어댑터를 쓴다(교체 여지 확보). `react-simplikit`(core, 안정)는 직접 써도 된다.
- **CSS 폴백은 훅과 별개로 항상 병행** — `100dvh`, `env(safe-area-inset-*)`, 인풋 `font-size:16px`, `overscroll-behavior:none`(웹뷰 전역 리셋). 첫 페인트/SSR은 폴백이 잡는다.
- 핸드오프의 "Astryx useListFocus·hasEscapeDismiss·useTypeahead"는 react-simplikit이 아니라 **Astryx 컴포넌트 기능/WAI-ARIA APG 패턴**이다 → [astryx-stylex 스킬].
