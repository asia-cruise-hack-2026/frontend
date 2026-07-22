---
name: typescript
description: TypeScript(6, strict)로 타입을 작성·리뷰할 때의 컨벤션. 이 repo는 Biome(ESLint 아님)이라 타입 인지(type-aware) 린트가 없어 에이전트가 직접 지켜야 한다. any/as 회피·unknown 경계·satisfies·판별 유니온·ComponentPropsWithoutRef·React.FC 금지·추론 우선 등. Use when writing or reviewing TS types, component props, generics, unions, or type assertions. 트리거 키워드 — any, as 캐스팅, unknown, satisfies, as const, 판별 유니온, discriminated union, ComponentProps, React.FC, 타입 좁히기, 제네릭, 타입 단언, non-null, readonly, 브랜디드 타입, 타입 추론.
---

# typescript — 타입 컨벤션 (Biome shop)

이 repo는 **Biome**(ESLint 아님)이라 **타입 인지 린트가 없다.** ts-eslint가 잡아주는 `no-floating-promises`·`no-unnecessary-condition`·`no-unsafe-*`·`no-unnecessary-type-assertion`·`prefer-nullish-coalescing`·`switch-exhaustiveness` 류는 **아무 도구도 안 잡는다 → 에이전트가 직접 지킨다.** 아래는 그 self-check 목록이자 컨벤션이다.

## 이미 자동 강제되는 것 (따로 신경 X)
- **Biome**: `noExplicitAny`(warn), `noUnusedImports`(error·자동삭제).
- **tsconfig**: `strict`, `verbatimModuleSyntax`(→ `import type` 강제), `noUnusedLocals`/`noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`.
- **그 외는 전부 디스크립린(self-check).**

## 이스케이프 해치 — 가장 중요
1. **`any` 금지 → 미지의 경계값은 `unknown`.** `unknown`은 쓰기 전 좁히기를 강제한다. 불가피하면 `any`를 **한 식/한 줄로 가둔다**(변수·반환 타입으로 새면 전염).
2. **`as` 캐스팅 = 오류 신호**(팀 규칙: 타입은 소스 확인 후 작성, `as` 지양). 선언·좁히기로 해결. 허용은 **딱 둘** — `as const`, 그리고 잘 타입된 함수 **내부에 숨긴** `as unknown as T`(불가피한 동적 생성만).
3. **non-null `!` 금지 → 좁히기**(guard·early return·`??`). `!`는 위장한 `as`다.
4. **`catch (e)`의 `e`는 `unknown`** — 좁힌 뒤 쓴다(`strict`가 이미 unknown으로 준다).
5. **외부 데이터(fetch·`JSON.parse`·`localStorage`)는 경계에서 Zod 검증.** TS는 이들을 `any`로 줘 가짜 안전을 준다. → [tanstack-form]·엔티티 스키마.

## 추론 우선 — 불필요한 애너테이션 금지
6. **TS가 아는 건 안 적는다** — 지역 `const`/`let`, 자명한 반환. 중복 애너테이션은 노이즈·드리프트 원인(좋은 추론을 넓혀버리기도).
7. **설정·상수 객체는 `: T` 대신 `satisfies T`** — 검사는 하되 좁은 리터럴 유지(키·리터럴 안 잃음). 라우트옵션·variant맵·토큰맵에 특히.
8. **리터럴·튜플 상수는 `as const`** — `"KRW"`가 `string`으로 넓어지지 않게.
9. **경계엔 애너테이트** — 함수 파라미터, export/공개 API. 여기가 추론을 멈출 지점.

## 모델링
10. **불법 상태를 표현 불가능하게** — 옵셔널+불리언 잔뜩보다 유효 shape들의 유니온. `{data} | {error} | {loading}` > `{data?, error?, loading?}`.
11. **상호배타 상태 = 판별 유니온**(리터럴 `kind`/`type` 태그) + `switch` 기본 분기에 `never` 소진 체크.
12. **유한 집합엔 `string`/`number` 대신 리터럴 유니온**(`"木"|"火"|"土"|"金"|"水"`).
13. **안 바꾸는 데이터는 `readonly`/`ReadonlyArray<T>`** 기본.
14. **중복 대신 파생**(`Pick`·`Omit`·`ReturnType`·`typeof`·인덱스 접근). 진실은 하나.
15. **헷갈리는 원시값은 브랜디드 타입** — 단 실제로 섞이는 것(ID·검증된 값)만, 남발 X.

## React
16. **래퍼 컴포넌트 props = `ComponentPropsWithoutRef<'button'>` + 추가 프롭.** ref를 실제 넘길 때만 `ComponentPropsWithRef`. **단일 요소 래퍼에만** — 섹션 합성물(여러 클릭 타깃)엔 억지로 상속하지 말고 각 요소가 자기 책임을 갖게(예: 순수 네비 CTA는 `<Link to>`).
17. **`React.FC` 금지** — 일반 함수 + 명시 props. `children` 쓸 때만 `children: ReactNode`.
18. **상호배타 프롭 = 판별 유니온**(또는 `prop?: never`). 런타임 체크 대신 컴파일 에러.
19. **이벤트는 구체 타입**(`React.ChangeEvent<HTMLInputElement>`·`MouseEventHandler`), `any`/`Function` 금지.
20. **훅은 초기값으로 충분하면 추론에 맡긴다** — 부족할 때만 제네릭(`useState<User | null>(null)`).

## 스탠스 (논쟁적 — 이 repo는 이렇게)
- **반환 타입 명시**: export/공개 API·훅형 함수엔 붙인다(계약 고정). 내부·지역은 추론.
- **`interface` vs `type`**: 확장 가능한 객체·props shape = `interface`, 유니온·파생·매핑 = `type`. 일관되게.
- **`satisfies` 남발 금지**: 좁은 타입+검사 둘 다 필요할 때만. 나중에 넓은 타입 담을 변수는 `: T`가 맞다.
- **`ts-reset`**: 도입 안 함 — 경계 Zod 검증으로 대부분의 `unknown` 이득을 얻는다.

## 하지 말 것
- `any`·`as`·`!`를 "일단 되게" 용도로 쓰기(1~3).
- 추론되는 걸 애너테이트(6).
- 섹션/합성 컴포넌트에 `ComponentProps` 억지 상속(16 — 진짜 단일 요소 래퍼에만).

관련: 폼·Zod는 [tanstack-form], 데이터 계층 타입은 [fsd-query-service], 파일 네이밍은 [file-naming], 배치는 [fsd].

## (선택) tsconfig 강화 후보 — 켜면 기존 코드에 새 에러 가능, 별도 결정
- `noUncheckedIndexedAccess` — 배열/레코드 접근을 `T | undefined`로(off-by-one·미존재 키 방지). 이 데이터 가공 많은 앱에 값어치 큼.
- `exactOptionalPropertyTypes` — `x?: T`에 명시적 `undefined` 차단(DTO 정확도). 3rd-party와 마찰 가능.
- `noImplicitOverride` — override 키워드 강제(베이스 리네임 후 stale override 방지).
- Biome 추가 활성 고려: `noNonNullAssertion`(위 3을 자동 강제), `useAsConstAssertion`, `useImportType`.
