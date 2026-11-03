import { rgb } from "./grid";

const hex2 = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");

/** Linear mix of two hex colours (k = 0 → a, 1 → b). */
export function mix(a: string, b: string, k: number): string {
  const A = rgb(a);
  const B = rgb(b);
  return "#" + hex2(A[0] + (B[0] - A[0]) * k) + hex2(A[1] + (B[1] - A[1]) * k) + hex2(A[2] + (B[2] - A[2]) * k);
}
