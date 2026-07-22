---
name: tanstack-form
description: TanStack Form(v1) + Zod로 폼을 작성·리뷰할 때 사용한다. useForm/form.Field/form.Subscribe, Zod를 Standard Schema로 validators에 연결, 폼 타입 추론, 필드/폼 레벨 검증, 비동기 검증, 제출 처리에 트리거. 트리거 키워드: TanStack Form, useForm, form.Field, form.Subscribe, 폼, 입력 폼, 검증, validators, onChange 검증, Zod 폼, defaultValues, z.input, z.output, handleSubmit, 폼 타입. 캐시/쿼리는 tanstack-query, 엔티티 데이터 계층은 fsd-query-service, 배치는 fsd 스킬.
---

# TanStack Form v1 + Zod 4 (fateflow-front)

폼 상태·검증 표준. 사주 입력·프로필 등 폼은 이 패턴을 따른다. 정본 코드는 [`templates/entity-form.tsx`](templates/entity-form.tsx).

## 타입 규칙 (가장 중요 — 여기서 실수 잦음)

TanStack Form의 철학: **"제네릭을 주입하지 말고 defaultValues에서 추론한다."** ([공식 Philosophy](https://tanstack.com/form/latest/docs/philosophy))

1. **`useForm`에 제네릭 주입 금지.** useForm은 제네릭이 **9개**(TFormData + validator/submit 8개)라 하나만 주면 나머지 추론이 깨진다([#1175](https://github.com/TanStack/form/issues/1175)). `TFormData`는 `defaultValues`에서 추론된다 — 타입 유지보수의 단일 지점.
2. **폼 값 = 원시 문자열 = `z.input`.** `defaultValues`는 `satisfies z.input<typeof schema>`로 **정렬만 검증**한다.
3. **`as` 금지.** `z.infer`(=`z.output`, 파싱 후)로 `defaultValues`를 캐스팅하는 건 input/output 혼동이다. `as`가 필요하면 모델이 틀린 것.
   - `z.input` = 검증 전(폼 원시값), `z.output`(=`z.infer`) = 검증/변환/default 적용 후. `transform`/`default`가 있으면 갈라진다.
4. **폼 스키마엔 `transform`/`default`를 넣지 않는다.** 넣으면 input≠output이 되어 복잡해짐. 숫자 변환·`"" → undefined`·서버 DTO 매핑은 **`onSubmit`에서**(또는 별도 DTO 스키마).
5. **타입 공유가 필요하면 제네릭이 아니라 `formOptions()`** + `InferFormType`을 쓴다(여전히 추론 기반).

```ts
const schema = z.object({ name: z.string().min(1), age: z.string() }); // 폼은 원시 string
const defaultValues = { name: "", age: "" } satisfies z.input<typeof schema>; // as 아님
const form = useForm({ defaultValues, validators: { onChange: schema }, onSubmit });
```

## 기본 사용 (v1 API)

- `useForm({ defaultValues, validators, onSubmit })` — **Zod 스키마를 `validators.onChange`(또는 onBlur/onSubmit)에 Standard Schema로 직접 전달**한다(별도 어댑터 불필요, Zod 4는 standard-schema 네이티브).
- `<form.Field name="...">{(field) => ...}</form.Field>` — `field.state.value`, `field.handleChange`, `field.handleBlur`, `field.state.meta.errors`, `field.state.meta.isValid`.
- 제출: `<form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>`.
- 버튼 상태: `<form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>` — 필드 리렌더와 분리.

## 검증 레벨 · 비동기

- **필드 레벨**: `<form.Field validators={{ onChange: ... }}>` — 개별 필드.
- **폼 레벨**: `useForm({ validators: { onChange: schema } })` — 폼 전체·교차 필드.
- **비동기**: `onChangeAsync`/`onBlurAsync`/`onSubmitAsync` + `asyncDebounceMs`. 동기 검증이 먼저 통과해야 비동기 실행(`asyncAlways`로 강제 가능).

## 이 프로젝트 적용 (FSD)

- **배치**: 폼 컴포넌트는 `features/<slice>/ui/`. 폼 스키마는 `features/<slice>/model` 또는 재사용 시 entity. 제출 뮤테이션은 `features/<slice>/api`([fsd-query-service](../fsd-query-service/SKILL.md)).
- **UI**: 필드는 Astryx 입력 컴포넌트(`@astryxdesign/core/*` — `DateInput`·`TimeInput`·`SegmentedControl` 등) + StyleX. 에러 색은 `var(--color-error)`. (컴포넌트 선택은 [astryx-stylex] STEP 0.)
- **제출**: `onSubmit`에서 fsd-query-service 뮤테이션 훅 호출. 폼값 → 서버 DTO 매핑(`"" → undefined` 등)도 여기. 제출 중엔 `form.Subscribe`의 `isSubmitting`(또는 mutation `isPending`)으로 버튼 비활성.

## 에러 2층 분리

필드 에러와 서버/제출 에러를 **섞지 않는다**.
- **필드 에러**(`field.state.meta.errors`) → 해당 입력 아래.
- **서버·제출 에러**(mutation `error`) → 폼 상단 또는 토스트.

## 검색·필터 폼 (입력 = 실행)

검색어 같은 단일 입력도 폼 상태(`useForm`)로 둔다. 검증 규칙이 없으면 스키마·resolver 없이 `useForm`만.
- **디바운스는 TanStack Form 네이티브 `listeners`를 쓴다.** 검증 디바운스(`asyncDebounceMs`)가 아니라 **부수효과(검색 실행) 디바운스**는 `listeners`의 `onChangeDebounceMs`/`onBlurDebounceMs`. react-simplikit `useDebounce`로 감싸지 말 것 — 폼 안이면 네이티브가 정답이다([공식 listeners 가이드](https://tanstack.com/form/latest/docs/framework/react/guides/listeners)).
  ```tsx
  <form.Field
    name="query"
    listeners={{ onChangeDebounceMs: 300, onChange: ({ value }) => runSearch(value) }}
  >
    {(field) => (
      <input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
    )}
  </form.Field>
  ```
  제출·칩 클릭 같은 즉시 실행 경로는 디바운스 없이 직접 커밋.
- **커밋된 값은 URL search params를 단일 진실원**으로 둔다([tanstack-router]의 search-validation).

## Zod는 폼 밖에서도 쓰인다 (참고)

- 라우터 **search params 검증** → `tanstack-router`의 `search-validation`.
- **API 응답 스키마** → entity의 데이터 계층(fsd-query-service). 단, 응답 스키마엔 transform이 들어갈 수 있음(폼 스키마와 달리).

---

> 근거: [TanStack Form Philosophy](https://tanstack.com/form/latest/docs/philosophy) · [validation 가이드](https://tanstack.com/form/latest/docs/framework/react/guides/validation) · [Zod input/output](https://github.com/colinhacks/zod/issues/5801). 커스텀 작성(3rd party 스킬 없음).
