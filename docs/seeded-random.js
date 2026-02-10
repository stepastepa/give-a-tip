/* ===== Seeded random ===== */
function mulberry32(seed) {
  return function () {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* ===== String to number ===== */
function stringToSeed(str) {
  let h = 2166136261;

  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  return h >>> 0;
}

/* ===== Seed handling ===== */
function newSeed(xxx) {
  let x = stringToSeed(xxx);
  return x;
}

function seededRandom(yyy) {
  let seed = newSeed(yyy); 
  let x = mulberry32(seed);
  return x();
}

export { seededRandom };