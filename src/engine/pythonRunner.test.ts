import test from 'node:test';
import assert from 'node:assert/strict';
import { runPythonCode } from './pythonRunner';
import { CURRICULUM_MODULES } from '../data/curriculum';

test('evaluates variables, primitive types, arithmetic, and f-strings', () => {
  const code = `
nama = "Budi"
nilai = 87
rata = nilai / 2
lulus = nilai >= 75
print(f"{nama}: {rata:.1f} - {lulus}")
`;
  const res = runPythonCode(code);
  assert.equal(res.success, true);
  assert.deepEqual(res.output, ['Budi: 43.5 - True']);
  const namaVar = res.variables.find((v) => v.name === 'nama');
  const lulusVar = res.variables.find((v) => v.name === 'lulus');
  assert.equal(namaVar?.pyType, 'str');
  assert.equal(lulusVar?.pyType, 'bool');
});

test('supports control flow, loops, functions, lambda, and recursion', () => {
  const code = `
def faktorial(n):
    if n <= 1:
        return 1
    return n * faktorial(n - 1)

kuadrat = lambda x: x ** 2
hasil = [kuadrat(i) for i in range(1, 5) if i % 2 == 0]
print(faktorial(5))
print(hasil)
`;
  const res = runPythonCode(code);
  assert.equal(res.success, true);
  assert.deepEqual(res.output, ['120', '[4, 16]']);
});

test('supports collections: list, tuple immutability, dict, set operations', () => {
  const code = `
buah = ["apel", "mangga"]
buah.append("jeruk")
koordinat = (10, 20)
nilai = {"andi": 90, "siti": 95}
a = {1, 2, 3}
b = {3, 4}
print(buah[-1])
print(koordinat[0])
print(nilai["siti"])
print(len(a | b))
print(len(a & b))
`;
  const res = runPythonCode(code);
  assert.equal(res.success, true);
  assert.deepEqual(res.output, ['jeruk', '10', '95', '4', '1']);
  assert.equal(res.variables.find((v) => v.name === 'koordinat')?.pyType, 'tuple');
});

test('supports OOP classes, inheritance, super(), polymorphism, and try/except', () => {
  const code = `
class Hewan:
    def __init__(self, nama):
        self.nama = nama
    def suara(self):
        return "..."

class Kucing(Hewan):
    def __init__(self, nama):
        super().__init__(nama)
    def suara(self):
        return f"{self.nama}: Meong"

k = Kucing("Milo")
print(k.suara())

try:
    x = 10 / 0
except ZeroDivisionError:
    print("Aman tertangkap")
`;
  const res = runPythonCode(code);
  assert.equal(res.success, true);
  assert.deepEqual(res.output, ['Milo: Meong', 'Aman tertangkap']);
});

test('handles mock input() and protects against infinite loops', () => {
  const resInput = runPythonCode('nama = input("Nama: ")\nprint("Halo", nama)', ['Alya']);
  assert.equal(resInput.success, true);
  assert.deepEqual(resInput.output, ['Nama: Alya', 'Halo Alya']);

  const resInf = runPythonCode('while True:\n    x = 1');
  assert.equal(resInf.success, false);
  assert.equal(resInf.errorType, 'RecursionError');
});

test('all 13 curriculum sandbox starters and lab challenge solutions run cleanly', () => {
  assert.equal(CURRICULUM_MODULES.length, 13);
  for (const mod of CURRICULUM_MODULES) {
    const starterRes = runPythonCode(mod.sandboxStarter, mod.sandboxInputs ?? []);
    assert.equal(
      starterRes.success,
      true,
      `Starter Modul ${mod.id} gagal: ${starterRes.errorType} ${starterRes.errorMessage}`
    );

    const solRes = runPythonCode(mod.labChallenge.solutionCode, mod.labChallenge.mockInputs ?? []);
    assert.equal(
      solRes.success,
      true,
      `Solusi Lab Modul ${mod.id} gagal: ${solRes.errorType} ${solRes.errorMessage}`
    );
    const joined = solRes.output.join('\n');
    for (const exp of mod.labChallenge.expectedOutputIncludes ?? []) {
      assert.equal(
        joined.includes(exp),
        true,
        `Output solusi Modul ${mod.id} tidak memuat "${exp}". Output: "${joined}"`
      );
    }
  }
});
