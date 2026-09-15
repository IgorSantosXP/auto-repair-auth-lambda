import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeCpf, isValidCpf } from "../src/cpf.mjs";

test("normalizeCpf strips every non-digit character", () => {
  assert.equal(normalizeCpf("111.444.777-35"), "11144477735");
  assert.equal(normalizeCpf(" 111 444 777 35 "), "11144477735");
  assert.equal(normalizeCpf(null), "");
  assert.equal(normalizeCpf(undefined), "");
});

test("isValidCpf accepts a well-formed CPF with or without punctuation", () => {
  assert.equal(isValidCpf("11144477735"), true);
  assert.equal(isValidCpf("111.444.777-35"), true);
});

test("isValidCpf rejects wrong check digits", () => {
  assert.equal(isValidCpf("11144477734"), false);
  assert.equal(isValidCpf("11144477700"), false);
});

test("isValidCpf rejects the wrong number of digits", () => {
  assert.equal(isValidCpf("1114447773"), false);
  assert.equal(isValidCpf("111444777350"), false);
  assert.equal(isValidCpf(""), false);
});

test("isValidCpf rejects sequences of a single repeated digit", () => {
  for (const digit of "0123456789") {
    assert.equal(isValidCpf(digit.repeat(11)), false, `${digit.repeat(11)} should be rejected`);
  }
});
