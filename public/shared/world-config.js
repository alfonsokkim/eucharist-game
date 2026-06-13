// Shared world geometry - loaded by the server (collision/zone logic) and the
// browser (rendering + local movement). Keeping it in one place means the
// server and every client agree on where everything is.

const TILE = 40;
const WORLD_W = 40 * TILE; // 1600
const WORLD_H = 30 * TILE; // 1200
const WALL = TILE; // border thickness

const PLAYER_RADIUS = 15;
const PLAYER_SPEED = 240; // world px / second

// Solid rectangles players cannot walk through (collision is resolved client
// side; the server just clamps to the world bounds).
const OBSTACLES = [
  // border walls
  { x: 0, y: 0, w: WORLD_W, h: WALL },
  { x: 0, y: WORLD_H - WALL, w: WORLD_W, h: WALL },
  { x: 0, y: 0, w: WALL, h: WORLD_H },
  { x: WORLD_W - WALL, y: 0, w: WALL, h: WORLD_H },
  // sanctuary furniture
  { x: 755, y: 70, w: 90, h: 70 },   // tabernacle
  { x: 700, y: 170, w: 200, h: 80 }, // altar
  { x: 330, y: 210, w: 80, h: 95 },  // ambo
  { x: 1190, y: 210, w: 80, h: 95 }, // chair
  { x: 1410, y: 250, w: 90, h: 70 }, // credence
  // pews - four rows, split by a wide central aisle
  { x: 120, y: 600, w: 540, h: 48 }, { x: 940, y: 600, w: 540, h: 48 },
  { x: 120, y: 720, w: 540, h: 48 }, { x: 940, y: 720, w: 540, h: 48 },
  { x: 120, y: 840, w: 540, h: 48 }, { x: 940, y: 840, w: 540, h: 48 },
  { x: 120, y: 960, w: 540, h: 48 }, { x: 940, y: 960, w: 540, h: 48 }
];

// Where the priest avatar stands to perform each step's action.
const STATIONS = {
  altar: { x: 800, y: 300 },
  ambo: { x: 370, y: 330 },
  chair: { x: 1230, y: 330 },
  credence: { x: 1455, y: 350 },
  tabernacle: { x: 800, y: 160 },
  aisle: { x: 800, y: 1080 },
  entrance: { x: 800, y: 1130 }
};

// The three voting pads, in a clear band between the sanctuary and the pews.
const ZONE_SLOTS = [
  { x: 380, y: 470, r: 95 },
  { x: 800, y: 470, r: 95 },
  { x: 1220, y: 470, r: 95 }
];

const SPAWN = { x: 800, y: 1090, jitterX: 250, jitterY: 50 };

// Circle-vs-rectangle overlap test (used for client-side collision).
function collides(x, y, r, obstacles) {
  for (const o of obstacles || OBSTACLES) {
    const cx = Math.max(o.x, Math.min(x, o.x + o.w));
    const cy = Math.max(o.y, Math.min(y, o.y + o.h));
    const dx = x - cx, dy = y - cy;
    if (dx * dx + dy * dy < r * r) return true;
  }
  return false;
}

function clampToWorld(x, y, r) {
  return {
    x: Math.max(WALL + r, Math.min(WORLD_W - WALL - r, x)),
    y: Math.max(WALL + r, Math.min(WORLD_H - WALL - r, y))
  };
}

// Which zone (0,1,2) is this point inside, or -1 if none.
function zoneAt(x, y) {
  for (let i = 0; i < ZONE_SLOTS.length; i++) {
    const z = ZONE_SLOTS[i];
    const dx = x - z.x, dy = y - z.y;
    if (dx * dx + dy * dy <= z.r * z.r) return i;
  }
  return -1;
}

const WorldConfig = {
  TILE, WORLD_W, WORLD_H, WALL,
  PLAYER_RADIUS, PLAYER_SPEED,
  OBSTACLES, STATIONS, ZONE_SLOTS, SPAWN,
  collides, clampToWorld, zoneAt
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = WorldConfig;
} else {
  window.WorldConfig = WorldConfig;
}
