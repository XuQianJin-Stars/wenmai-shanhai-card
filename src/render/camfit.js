// Aspect-adaptive camera framing.
//
// All the scene cameras are hand-placed for a 16:9 window. Anything narrower — iPad in landscape
// (4:3), a half-width desktop window, a phone held upright — crops the board. This keeps the camera
// aiming at the same point from the same angle and only slides it along the view axis until every
// point that must stay on screen is inside the frustum.
import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);
const _v = new THREE.Vector3();
const _x = new THREE.Vector3();
const _y = new THREE.Vector3();
const _z = new THREE.Vector3();

// Distance from `look`, along `dir`, at which every point fits inside a `fov`/`aspect` frustum.
export function fitDistance({ look, dir, fov, aspect, points, pad = 1 }) {
  const tanY = Math.tan(THREE.MathUtils.degToRad(fov / 2)) / pad;
  const tanX = tanY * aspect;
  _z.copy(dir).normalize();
  _x.crossVectors(UP, _z).normalize();
  _y.crossVectors(_z, _x);
  let d = 0;
  for (const p of points) {
    _v.copy(p).sub(look);
    const qx = _v.dot(_x), qy = _v.dot(_y), qz = _v.dot(_z);
    d = Math.max(d, qz + Math.abs(qx) / tanX, qz + Math.abs(qy) / tanY);
  }
  return d;
}

// How much further back than the 16:9 framing this aspect needs. 1 means "no change".
// Clamped so an extreme viewport can't push the board to a speck (portrait asks the player to
// rotate instead) or pull it in far enough to clip the HUD.
export function framingScale({ look, dir, fov, aspect, points, pad = 1, min = 0.92, max = 2.2 }) {
  const ref = fitDistance({ look, dir, fov, aspect: 16 / 9, points, pad });
  if (ref <= 0) return 1;
  const now = fitDistance({ look, dir, fov, aspect, points, pad });
  return THREE.MathUtils.clamp(now / ref, min, max);
}

// Corners of an axis-aligned box, for callers that would rather describe a volume than points.
export function boxPoints(min, max) {
  const pts = [];
  for (const x of [min.x, max.x]) for (const y of [min.y, max.y]) for (const z of [min.z, max.z]) pts.push(new THREE.Vector3(x, y, z));
  return pts;
}
