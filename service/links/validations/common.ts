export function isUuidish(input: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    input
  );
}

export function normalizeOptionalText(
  input: FormDataEntryValue | null,
  options: { maxLength: number; label: string }
): { ok: true; value: string | null } | { ok: false; message: string } {
  if (input == null) return { ok: true, value: null };
  if (typeof input !== "string")
    return { ok: false, message: `${options.label} 값이 올바르지 않습니다.` };

  const value = input.trim();
  if (!value) return { ok: true, value: null };
  if (value.length > options.maxLength)
    return {
      ok: false,
      message: `${options.label}은 ${options.maxLength}자 이내로 입력해주세요.`,
    };

  return { ok: true, value };
}
