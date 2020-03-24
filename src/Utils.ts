export function zip<T1, T2>(a1: T1[], a2: T2[]): Array<[T1, T2]> {
  const dst: Array<[T1, T2]> = [];
  for (let i = 0; i < Math.max(a1.length, a2.length); i++) {
    dst.push([a1[i], a2[i]]);
  }
  return dst;
}
