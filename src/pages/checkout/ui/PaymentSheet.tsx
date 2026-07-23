import { Box, FlexBox } from "@wanteddev/wds";
import { useEffect, useState } from "react";

import { useI18n } from "@/shared/i18n";
import { BottomSheet } from "@/shared/ui";

import { ct } from "../model/strings";
import { approxCny, methodsForSegment, type PayMethod, segmentForLocale } from "../model/payment";

interface PaymentSheetProps {
  total: number;
  onClose: () => void;
  onPaid: () => void;
}

type Phase = "select" | "window" | "processing";

const PROCESS_MS = 1700;

export function PaymentSheet({ total, onClose, onPaid }: PaymentSheetProps) {
  const { locale, money } = useI18n();
  const methods = methodsForSegment(segmentForLocale(locale));
  const [selected, setSelected] = useState<PayMethod>(methods[0]);
  const [phase, setPhase] = useState<Phase>("select");

  useEffect(() => {
    if (phase !== "processing") return;
    const id = setTimeout(onPaid, PROCESS_MS);
    return () => clearTimeout(id);
  }, [phase, onPaid]);

  const closable = phase === "select";

  return (
    <BottomSheet onClose={onClose} dimClosable={closable} maxHeight="92dvh">
      {(close) => (
        <>
          {phase === "select" && (
            <MethodSelect
              methods={methods}
              selected={selected}
              onSelect={setSelected}
              onClose={close}
              onNext={() => setPhase("window")}
              payLabel={`${ct("pay_amount", locale)} · ${money(total)}`}
            />
          )}
          {phase === "window" && (
            <PayWindow
              method={selected}
              total={total}
              onBack={() => setPhase("select")}
              onPay={() => setPhase("processing")}
            />
          )}
          {phase === "processing" && <Processing color={selected.brandColor} />}
        </>
      )}
    </BottomSheet>
  );
}

/* ─────────────── 결제수단 선택 ─────────────── */

function MethodSelect({
  methods,
  selected,
  onSelect,
  onClose,
  onNext,
  payLabel,
}: {
  methods: PayMethod[];
  selected: PayMethod;
  onSelect: (m: PayMethod) => void;
  onClose: () => void;
  onNext: () => void;
  payLabel: string;
}) {
  const { locale } = useI18n();
  return (
    <Box sx={{ padding: "0 20px 20px" }}>
      <FlexBox alignItems="center" justifyContent="space-between" sx={{ marginBottom: "4px" }}>
        <Box
          as="h2"
          sx={(theme) => ({
            margin: 0,
            fontSize: "19px",
            fontWeight: 700,
            color: theme.semantic.label.normal,
          })}
        >
          {ct("select_method", locale)}
        </Box>
        <Box
          as="button"
          type="button"
          onClick={onClose}
          aria-label="close"
          sx={(theme) => ({
            width: "34px",
            height: "34px",
            border: "none",
            cursor: "pointer",
            borderRadius: "999px",
            background: theme.semantic.fill.normal,
            color: theme.semantic.label.neutral,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <IconClose />
        </Box>
      </FlexBox>

      <SecureRow />

      <FlexBox flexDirection="column" gap="10px" sx={{ marginTop: "14px" }}>
        {methods.map((m) => {
          const active = m.id === selected.id;
          return (
            <Box
              as="button"
              key={m.id}
              type="button"
              onClick={() => onSelect(m)}
              sx={(theme) => ({
                display: "flex",
                alignItems: "center",
                gap: "13px",
                padding: "13px 14px",
                borderRadius: "14px",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                background: theme.semantic.background.normal.normal,
                boxShadow: active
                  ? `inset 0 0 0 1.5px ${theme.semantic.primary.normal}`
                  : `inset 0 0 0 1px ${theme.semantic.line.normal.neutral}`,
              })}
            >
              <BrandMark method={m} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box
                  as="span"
                  sx={(theme) => ({
                    display: "block",
                    fontWeight: 600,
                    fontSize: "15px",
                    color: theme.semantic.label.normal,
                  })}
                >
                  {m.sub[locale]}
                </Box>
              </Box>
              {m.recommended && (
                <Box
                  as="span"
                  sx={(theme) => ({
                    fontSize: "11px",
                    fontWeight: 700,
                    color: theme.semantic.primary.normal,
                    background: theme.semantic.fill.normal,
                    borderRadius: "6px",
                    padding: "2px 7px",
                  })}
                >
                  {ct("recommended", locale)}
                </Box>
              )}
              <RadioDot active={active} />
            </Box>
          );
        })}
      </FlexBox>

      <Box
        as="button"
        type="button"
        onClick={onNext}
        sx={(theme) => ({
          width: "100%",
          marginTop: "20px",
          height: "54px",
          border: "none",
          cursor: "pointer",
          borderRadius: "14px",
          background: theme.semantic.primary.normal,
          color: theme.semantic.static.white,
          fontSize: "16px",
          fontWeight: 700,
        })}
      >
        {payLabel}
      </Box>
    </Box>
  );
}

/* ─────────────── 브랜드 결제창 (Alipay / WeChat / Card) ─────────────── */

function PayWindow({
  method,
  total,
  onBack,
  onPay,
}: {
  method: PayMethod;
  total: number;
  onBack: () => void;
  onPay: () => void;
}) {
  const { locale, money } = useI18n();
  const branded = method.window === "alipay" || method.window === "wechat";

  return (
    <Box>
      {/* 브랜드 헤더 */}
      <FlexBox
        alignItems="center"
        gap="10px"
        sx={{
          background: method.brandColor,
          color: method.onBrand,
          padding: "16px 18px",
        }}
      >
        <Box
          as="button"
          type="button"
          onClick={onBack}
          aria-label="back"
          sx={{
            width: "30px",
            height: "30px",
            border: "none",
            background: "transparent",
            color: method.onBrand,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginLeft: "-6px",
          }}
        >
          <IconBack />
        </Box>
        <Box as="span" sx={{ fontSize: "17px", fontWeight: 800, letterSpacing: "0.02em" }}>
          {method.wordmark}
          {method.id === "wechat" && "支付"}
          {method.id === "alipay" && ""}
        </Box>
        <Box as="span" sx={{ marginLeft: "auto", display: "inline-flex" }}>
          <IconLock color={method.onBrand} />
        </Box>
      </FlexBox>

      <Box sx={{ padding: "22px 20px 20px" }}>
        {/* 가맹점 */}
        <FlexBox flexDirection="column" alignItems="center" gap="4px" sx={{ marginBottom: "18px" }}>
          <Box
            as="span"
            sx={(theme) => ({
              fontSize: "15px",
              fontWeight: 700,
              color: theme.semantic.label.normal,
            })}
          >
            OMONG
          </Box>
          <Box
            as="span"
            sx={(theme) => ({ fontSize: "12px", color: theme.semantic.label.alternative })}
          >
            {ct("merchant_sub", locale)}
          </Box>
        </FlexBox>

        {/* 금액 */}
        <FlexBox flexDirection="column" alignItems="center" gap="2px" sx={{ marginBottom: "20px" }}>
          {branded ? (
            <>
              <Box as="span" sx={{ fontSize: "34px", fontWeight: 800, color: method.brandColor }}>
                ¥{approxCny(total).toLocaleString()}
              </Box>
              <Box
                as="span"
                sx={(theme) => ({ fontSize: "13px", color: theme.semantic.label.alternative })}
              >
                ≈ {money(total)}
              </Box>
            </>
          ) : (
            <Box
              as="span"
              sx={(theme) => ({
                fontSize: "32px",
                fontWeight: 800,
                color: theme.semantic.label.normal,
              })}
            >
              {money(total)}
            </Box>
          )}
        </FlexBox>

        {/* 카드 입력폼 (card 종류일 때) */}
        {method.window === "card" && <CardForm />}

        {/* 브랜드 안내 (alipay/wechat) */}
        {branded && (
          <Box
            sx={(theme) => ({
              textAlign: "center",
              fontSize: "13px",
              color: theme.semantic.label.neutral,
              marginBottom: "20px",
            })}
          >
            {ct("alipay_hint", locale)}
          </Box>
        )}

        {/* 결제 버튼 */}
        <Box
          as="button"
          type="button"
          onClick={onPay}
          sx={{
            width: "100%",
            height: "54px",
            border: "none",
            cursor: "pointer",
            borderRadius: "14px",
            background: method.id === "googlepay" ? "#000000" : method.brandColor,
            color: method.id === "googlepay" ? "#ffffff" : method.onBrand,
            fontSize: "16px",
            fontWeight: 700,
            boxShadow: `0 6px 18px ${method.brandColor}44`,
          }}
        >
          {ct("pay_amount", locale)}{" "}
          {branded ? `¥${approxCny(total).toLocaleString()}` : money(total)}
        </Box>
      </Box>
    </Box>
  );
}

function CardForm() {
  const { locale } = useI18n();
  return (
    <FlexBox flexDirection="column" gap="12px" sx={{ marginBottom: "20px" }}>
      <Field label={ct("card_number", locale)} defaultValue="4242 4242 4242 4242" />
      <FlexBox gap="12px">
        <Box sx={{ flex: 1 }}>
          <Field label={ct("card_expiry", locale)} defaultValue="12 / 28" />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Field label={ct("card_cvc", locale)} defaultValue="•••" />
        </Box>
      </FlexBox>
    </FlexBox>
  );
}

function Field({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <Box>
      <Box
        as="label"
        sx={(theme) => ({
          display: "block",
          fontSize: "12px",
          fontWeight: 600,
          color: theme.semantic.label.alternative,
          marginBottom: "6px",
        })}
      >
        {label}
      </Box>
      <Box
        as="input"
        type="text"
        defaultValue={defaultValue}
        sx={(theme) => ({
          width: "100%",
          height: "46px",
          padding: "0 14px",
          borderRadius: "11px",
          border: "none",
          boxShadow: `inset 0 0 0 1px ${theme.semantic.line.normal.neutral}`,
          background: theme.semantic.background.normal.alternative,
          fontSize: "15px",
          fontWeight: 600,
          color: theme.semantic.label.normal,
          letterSpacing: "0.04em",
          "&:focus": {
            outline: "none",
            boxShadow: `inset 0 0 0 1.5px ${theme.semantic.primary.normal}`,
          },
        })}
      />
    </Box>
  );
}

/* ─────────────── 처리 중 ─────────────── */

function Processing({ color }: { color: string }) {
  const { locale } = useI18n();
  return (
    <FlexBox
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap="18px"
      sx={{ padding: "64px 20px 72px" }}
    >
      <style>{"@keyframes ck-spin{to{transform:rotate(360deg)}}"}</style>
      <Box
        sx={(theme) => ({
          width: "46px",
          height: "46px",
          borderRadius: "999px",
          border: `4px solid ${theme.semantic.line.normal.neutral}`,
          borderTopColor: color,
          animation: "ck-spin 0.8s linear infinite",
          "@media (prefers-reduced-motion: reduce)": { animation: "none" },
        })}
      />
      <Box
        as="span"
        sx={(theme) => ({ fontSize: "15px", fontWeight: 600, color: theme.semantic.label.neutral })}
      >
        {ct("processing", locale)}
      </Box>
    </FlexBox>
  );
}

/* ─────────────── 소품 ─────────────── */

function SecureRow() {
  const { locale } = useI18n();
  return (
    <FlexBox
      alignItems="center"
      gap="7px"
      sx={(theme) => ({
        marginTop: "10px",
        padding: "9px 12px",
        borderRadius: "10px",
        background: theme.semantic.fill.normal,
        color: theme.semantic.label.neutral,
        fontSize: "12px",
        fontWeight: 600,
      })}
    >
      <IconShield />
      {ct("secure_note", locale)}
    </FlexBox>
  );
}

function BrandMark({ method }: { method: PayMethod }) {
  return (
    <Box
      sx={{
        width: "42px",
        height: "42px",
        flexShrink: 0,
        borderRadius: "11px",
        background: method.brandColor,
        color: method.onBrand,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        fontSize: method.wordmark.length > 2 ? "13px" : "16px",
        boxShadow: method.id === "googlepay" ? "inset 0 0 0 1px #dadce0" : "none",
      }}
    >
      {method.wordmark}
    </Box>
  );
}

function RadioDot({ active }: { active: boolean }) {
  return (
    <Box
      sx={(theme) => ({
        width: "20px",
        height: "20px",
        flexShrink: 0,
        borderRadius: "999px",
        boxShadow: active
          ? `inset 0 0 0 6px ${theme.semantic.primary.normal}`
          : `inset 0 0 0 2px ${theme.semantic.line.normal.normal}`,
      })}
    />
  );
}

/* 인라인 SVG 아이콘 (WDS 아이콘 이름 추측을 피하기 위해 직접 그린다) */

function IconClose() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function IconBack() {
  return (
    <svg
      aria-hidden="true"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

function IconLock({ color }: { color: string }) {
  return (
    <svg
      aria-hidden="true"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg
      aria-hidden="true"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
