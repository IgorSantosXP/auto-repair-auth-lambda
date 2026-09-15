const REPEATED = new Set([
  "00000000000", "11111111111", "22222222222", "33333333333", "44444444444",
  "55555555555", "66666666666", "77777777777", "88888888888", "99999999999"
]);

export function normalizeCpf(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function checkDigit(digits, weightStart) {
  const sum = digits
    .split("")
    .reduce((acc, digit, index) => acc + Number(digit) * (weightStart - index), 0);

  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

export function isValidCpf(value) {
  const cpf = normalizeCpf(value);

  if (cpf.length !== 11) return false;
  if (REPEATED.has(cpf)) return false;

  return (
    checkDigit(cpf.slice(0, 9), 10) === Number(cpf[9]) &&
    checkDigit(cpf.slice(0, 10), 11) === Number(cpf[10])
  );
}
