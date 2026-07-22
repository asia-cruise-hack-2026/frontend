/**
 * 폼 표준 템플릿 (fateflow-front) — TanStack Form v1 + Zod 4 + shadcn/ui
 * 위치: features/<slice>/ui/<slice>-form.tsx  (스키마는 features/<slice>/model 또는 entity)
 *
 * 타입 규칙 (중요)
 * - useForm 에 제네릭을 주입하지 않는다. useForm 은 제네릭 9개라 하나만 주면 나머지 추론이 깨진다.
 *   타입은 defaultValues 에서 추론된다(라이브러리 철학). 타입 유지보수의 단일 지점 = defaultValues.
 * - 폼 값 = 원시 문자열 = 스키마의 z.input. defaultValues 는 `satisfies z.input<typeof schema>` 로
 *   정렬만 검증한다. `as`(= z.infer/output 억지 캐스팅) 금지.
 * - 폼 스키마엔 transform/default 를 넣지 않는다(input≠output 되어 복잡). 숫자 변환·"" → undefined·
 *   서버 DTO 매핑은 onSubmit 에서(또는 별도 DTO 스키마).
 * - 제출은 fsd-query-service 의 뮤테이션 훅을 호출(직접 http 금지).
 * - 타입을 다른 컴포넌트와 공유해야 하면 제네릭이 아니라 formOptions() 를 쓴다.
 */
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
// import { useCreateProfileMutation } from "../api/create-profile.mutation";

/** 폼 스키마 — 필드는 원시 문자열. transform/default 없음 → z.input === z.output. */
const profileFormSchema = z.object({
	displayName: z.string().min(1, "이름을 입력하세요").max(20),
	birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식"),
	// 선택 입력이지만 컨트롤드라 항상 string("" 허용). 옵셔널화는 onSubmit 에서.
	birthTime: z
		.string()
		.regex(/^\d{2}:\d{2}$/, "HH:mm 형식")
		.or(z.literal("")),
});

/** defaultValues = 스키마의 input. `as` 아님 — `satisfies` 로 정렬만 검증(타입은 리터럴 그대로). */
const defaultValues = {
	displayName: "",
	birthDate: "",
	birthTime: "",
} satisfies z.input<typeof profileFormSchema>;

export function ProfileCreateForm() {
	// const createProfile = useCreateProfileMutation();

	const form = useForm({
		defaultValues, // ← 여기서 TFormData 추론. 제네릭 주입 안 함.
		validators: {
			onChange: profileFormSchema, // Zod 스키마를 Standard Schema 로 직접 전달
		},
		onSubmit: async ({ value }) => {
			// value 는 폼 데이터(원시 문자열). 서버 DTO 매핑을 여기서:
			//   birthTime "" → undefined 등
			// await createProfile.mutateAsync({
			//   ...value,
			//   birthTime: value.birthTime || undefined,
			// });
			console.log(value);
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
			className="space-y-4"
		>
			<form.Field name="displayName">
				{(field) => (
					<div className="space-y-1">
						<Label htmlFor={field.name}>이름</Label>
						<Input
							id={field.name}
							name={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
						/>
						<FieldErrors errors={field.state.meta.errors} />
					</div>
				)}
			</form.Field>

			<form.Field name="birthDate">
				{(field) => (
					<div className="space-y-1">
						<Label htmlFor={field.name}>생년월일</Label>
						<Input
							id={field.name}
							placeholder="1994-03-21"
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
						/>
						<FieldErrors errors={field.state.meta.errors} />
					</div>
				)}
			</form.Field>

			{/* 제출 버튼 상태는 form.Subscribe 로 (필드 리렌더와 분리) */}
			<form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
				{([canSubmit, isSubmitting]) => (
					<Button type="submit" disabled={!canSubmit}>
						{isSubmitting ? "저장 중…" : "저장"}
					</Button>
				)}
			</form.Subscribe>
		</form>
	);
}

/** Standard Schema(Zod) 에러는 {message} 객체, 커스텀 검증은 string — 둘 다 안전 처리. */
function FieldErrors({
	errors,
}: {
	errors: ReadonlyArray<{ message?: string } | string | undefined>;
}) {
	if (errors.length === 0) return null;
	const text = errors
		.map((e) => (typeof e === "string" ? e : e?.message))
		.filter(Boolean)
		.join(", ");
	if (!text) return null;
	return <p className="text-sm text-destructive">{text}</p>;
}
