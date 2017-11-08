
export function map(value, start1, stop1, start2, stop2) {
  return parseFloat(start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1)));
}

export function lerp(start, end, alpha) {
  return start + (end - start) * alpha
}