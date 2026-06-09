const BASE_W = 1672
const BASE_H = 941

export function getScale(): number {
  return Math.min(window.innerWidth / BASE_W, window.innerHeight / BASE_H)
}

export function wsBounds(x: number, y: number, w: number, h: number) {
  const s = getScale()
  return { x: Math.round(x * s), y: Math.round(y * s), width: Math.round(w * s), height: Math.round(h * s) }
}
