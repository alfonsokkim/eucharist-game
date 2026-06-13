// Procedural pixel-art sprites in a clean 16-bit / GBA-Pokémon style:
// chunky readable characters with crisp 1px outlines, two-tone shading, a
// 4-frame walk cycle, four facing directions, and distinct priest vestments.
// A tiled warm-stone church for the environment. Exposes `window.Sprites`.
//
// SWAP-IN ART: to use a real top-down sprite sheet later, replace the body of
// drawCharacter()/drawEnvironment() with drawImage() blits from your atlas —
// nothing else in the game needs to change.

(function () {
  "use strict";

  const OUTLINE = "#241b3a";
  const SKIN = "#f0c79f", SKIN_SH = "#d39e72";
  const HAIRS = ["#3a2a1c", "#5a3a22", "#1f1a16", "#7a5230", "#9a9aa8", "#caa24a"];
  const SHIRTS_L = 60; // lightness baseline for shirt hue
  const PANTS = "#3c4a63", PANTS_SH = "#2c3850";
  const SHOE = "#2c2030";
  const ALB = "#f4f1e6", ALB_SH = "#ddd7c3";
  const CHASUBLE = "#9c3a4e", CHASUBLE_SH = "#7e2f3f";
  const GOLD = "#d8b46a", GOLD_SH = "#b8924a";

  function hashStr(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  }
  function hueFor(id) { return hashStr(id || "x") % 360; }
  function hairFor(id) { return HAIRS[hashStr((id || "x") + "h") % HAIRS.length]; }

  // outlined block — the crisp pixel look
  function blk(ctx, x, y, w, h, fill) {
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
  }
  function rect(ctx, x, y, w, h, fill) { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); }

  // ---- characters ---------------------------------------------------------

  function drawCharacter(ctx, x, y, opts) {
    const o = opts || {};
    const u = o.scale || 2.4;
    const dir = o.dir || "down";
    const moving = !!o.moving;
    const phase = (o.walkPhase || 0) * Math.PI * 2;
    const isPriest = !!o.isPriest;
    const shirt = `hsl(${o.hue == null ? 210 : o.hue} 52% ${SHIRTS_L}%)`;
    const shirtSh = `hsl(${o.hue == null ? 210 : o.hue} 52% ${SHIRTS_L - 14}%)`;
    const hair = o.hair || "#5a3a22";

    const cx = x;
    const feetY = y;
    const shoeH = 3 * u, legH = 5 * u, torsoH = 8 * u, headH = 9 * u;
    const headW = 11 * u, torsoW = 12 * u;

    const bob = moving ? Math.abs(Math.sin(phase)) * 1 * u : 0;
    const swing = moving ? Math.sin(phase) : 0;

    // shadow
    ctx.fillStyle = "rgba(20,12,30,0.28)";
    ctx.beginPath();
    ctx.ellipse(cx, feetY + 1, 8 * u, 2.6 * u, 0, 0, Math.PI * 2);
    ctx.fill();

    const shoeTop = feetY - shoeH;
    const legTop = shoeTop - legH;
    const torsoTop = legTop - torsoH - bob;
    const headTop = torsoTop - headH;

    // feet (animate)
    let lLift = 0, rLift = 0, lDX = 0, rDX = 0;
    if (moving) {
      if (dir === "left" || dir === "right") {
        const s = swing * 2.4 * u * (dir === "left" ? -1 : 1);
        lDX = s; rDX = -s;
      } else {
        lLift = Math.max(0, swing) * 2 * u;
        rLift = Math.max(0, -swing) * 2 * u;
      }
    }
    if (isPriest) {
      // small dark shoes peeking under the robe
      blk(ctx, cx - 4.5 * u + lDX, shoeTop - lLift, 4 * u, shoeH, SHOE);
      blk(ctx, cx + 0.5 * u + rDX, shoeTop - rLift, 4 * u, shoeH, SHOE);
    } else {
      blk(ctx, cx - 4.5 * u + lDX, shoeTop - lLift, 4 * u, shoeH, SHOE);
      blk(ctx, cx + 0.5 * u + rDX, shoeTop - rLift, 4 * u, shoeH, SHOE);
      // legs / pants
      blk(ctx, cx - 4.5 * u, legTop, 9 * u, legH, PANTS);
      rect(ctx, cx - 0.5 * u, legTop, 1 * u, legH, PANTS_SH); // center seam
    }

    if (isPriest) {
      // alb (white robe) — flares to the feet
      blk(ctx, cx - 6 * u, torsoTop, 12 * u, torsoH + legH + 1, ALB);
      rect(ctx, cx - 6 * u, torsoTop + (torsoH + legH) * 0.5, 12 * u, (torsoH + legH) * 0.5, ALB_SH);
      // chasuble (poncho) over the shoulders
      blk(ctx, cx - 6.5 * u, torsoTop + 0.5 * u, 13 * u, 9 * u, CHASUBLE);
      rect(ctx, cx - 6.5 * u, torsoTop + 5.5 * u, 13 * u, 4 * u, CHASUBLE_SH);
      // gold orphrey stripe + neck
      rect(ctx, cx - 1.2 * u, torsoTop + 0.5 * u, 2.4 * u, 9 * u, GOLD);
      rect(ctx, cx - 3 * u, torsoTop + 0.5 * u, 6 * u, 1.4 * u, GOLD_SH);
    } else {
      // torso / shirt + simple arms
      blk(ctx, cx - 6 * u, torsoTop, torsoW, torsoH, shirt);
      rect(ctx, cx - 6 * u, torsoTop + torsoH * 0.55, torsoW, torsoH * 0.45, shirtSh);
      // arms (swing a touch when walking)
      const armDY = moving && (dir === "up" || dir === "down") ? swing * 1.2 * u : 0;
      blk(ctx, cx - 7.5 * u, torsoTop + 1 * u + armDY, 2.4 * u, 5.5 * u, shirt);
      blk(ctx, cx + 5.1 * u, torsoTop + 1 * u - armDY, 2.4 * u, 5.5 * u, shirt);
      // hands
      rect(ctx, cx - 7.3 * u, torsoTop + 6.2 * u + armDY, 2 * u, 1.8 * u, SKIN);
      rect(ctx, cx + 5.3 * u, torsoTop + 6.2 * u - armDY, 2 * u, 1.8 * u, SKIN);
    }

    // head
    blk(ctx, cx - headW / 2, headTop, headW, headH, SKIN);
    rect(ctx, cx - headW / 2, headTop + headH * 0.6, headW, headH * 0.4, SKIN_SH);

    // hair + face by direction
    const hx = cx - headW / 2;
    if (dir === "up") {
      blk(ctx, hx, headTop, headW, headH * 0.92, hair); // back of head
    } else if (dir === "left" || dir === "right") {
      const back = dir === "left" ? hx + headW * 0.45 : hx; // hair on the rear
      blk(ctx, back, headTop, headW * 0.55, headH * 0.8, hair);
      rect(ctx, hx, headTop, headW, headH * 0.32, hair); // top
      const eyeX = dir === "left" ? hx + 1.4 * u : hx + headW - 3.4 * u;
      rect(ctx, eyeX, headTop + headH * 0.5, 2 * u, 2 * u, OUTLINE); // eye
      const noseX = dir === "left" ? hx - 0.6 * u : hx + headW - 1.4 * u;
      rect(ctx, noseX, headTop + headH * 0.6, 1.4 * u, 1.6 * u, SKIN_SH); // nose nub
    } else {
      // down — top hair + two eyes
      rect(ctx, hx, headTop, headW, headH * 0.36, hair);
      rect(ctx, hx, headTop, 2 * u, headH * 0.7, hair); // sideburns
      rect(ctx, hx + headW - 2 * u, headTop, 2 * u, headH * 0.7, hair);
      rect(ctx, cx - 3.2 * u, headTop + headH * 0.52, 2 * u, 2 * u, OUTLINE);
      rect(ctx, cx + 1.2 * u, headTop + headH * 0.52, 2 * u, 2 * u, OUTLINE);
    }

    if (isPriest) {
      // a small zucchetto-ish crown highlight + gold edge so the priest reads
      rect(ctx, hx + 1 * u, headTop - 0.5 * u, headW - 2 * u, 1.5 * u, GOLD);
    }
  }

  // ---- environment (drawn once to a world-sized offscreen canvas) ----------

  function drawEnvironment(ctx, WC) {
    const { WORLD_W, WORLD_H, WALL, TILE, OBSTACLES, STATIONS } = WC;
    const SANCT_Y = 360;

    // nave floor — warm stone tiles with a subtle checker
    for (let ty = SANCT_Y; ty < WORLD_H; ty += TILE) {
      for (let tx = 0; tx < WORLD_W; tx += TILE) {
        const even = ((tx / TILE) + (ty / TILE)) % 2 === 0;
        rect(ctx, tx, ty, TILE, TILE, even ? "#d9c6a2" : "#d0bb96");
      }
    }
    // sanctuary marble
    for (let ty = 0; ty < SANCT_Y; ty += TILE) {
      for (let tx = 0; tx < WORLD_W; tx += TILE) {
        const even = ((tx / TILE) + (ty / TILE)) % 2 === 0;
        rect(ctx, tx, ty, TILE, TILE, even ? "#ece3d0" : "#e3d8c2");
      }
    }
    // sanctuary step edge
    rect(ctx, 0, SANCT_Y - 8, WORLD_W, 8, "#c9b490");
    rect(ctx, 0, SANCT_Y, WORLD_W, 4, "#b6a079");

    // red carpet runner: down the central aisle and up to the altar
    function carpet(x, y, w, h) {
      rect(ctx, x, y, w, h, "#8d2f3f");
      rect(ctx, x, y, 6, h, "#b8924a");
      rect(ctx, x + w - 6, y, 6, h, "#b8924a");
    }
    carpet(720, SANCT_Y, 160, WORLD_H - WALL - SANCT_Y);
    carpet(740, 250, 120, SANCT_Y - 250);

    // ---- walls ----
    rect(ctx, 0, 0, WORLD_W, WALL, "#8b8893");
    rect(ctx, 0, WORLD_H - WALL, WORLD_W, WALL, "#8b8893");
    rect(ctx, 0, 0, WALL, WORLD_H, "#807d88");
    rect(ctx, WORLD_W - WALL, 0, WALL, WORLD_H, "#807d88");
    // brick lines on top wall
    ctx.strokeStyle = "rgba(40,36,52,0.25)";
    ctx.lineWidth = 1;
    for (let bx = 0; bx < WORLD_W; bx += 48) {
      ctx.beginPath(); ctx.moveTo(bx, 0); ctx.lineTo(bx, WALL); ctx.stroke();
    }
    // stained-glass windows along the top wall
    const glass = ["#c0506a", "#5a86c4", "#5aa86a", "#d8b46a", "#9a5fb0"];
    for (let i = 0; i < 5; i++) {
      const gx = 180 + i * 280, gw = 120, gy = 4, gh = WALL - 8;
      blk(ctx, gx, gy, gw, gh, glass[i % glass.length]);
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.fillRect(gx + gw / 2 - 1, gy, 2, gh);
      ctx.fillRect(gx, gy + gh / 2 - 1, gw, 2);
    }
    // entrance doors at the bottom-centre
    blk(ctx, WORLD_W / 2 - 70, WORLD_H - WALL, 140, WALL, "#6b4a2b");
    rect(ctx, WORLD_W / 2 - 2, WORLD_H - WALL, 4, WALL, "#4a3018");

    // ---- pews (the obstacle rows) ----
    OBSTACLES.forEach((o) => {
      if (o.y >= 600 && o.h < 60) {
        blk(ctx, o.x, o.y, o.w, o.h, "#7a5230");
        rect(ctx, o.x, o.y, o.w, o.h * 0.4, "#8c613b"); // seat highlight
        rect(ctx, o.x, o.y + o.h - 4, o.w, 4, "#5e3f23"); // shadow
        ctx.strokeStyle = "rgba(60,40,24,0.4)";
        for (let px = o.x + 24; px < o.x + o.w; px += 60) {
          ctx.beginPath(); ctx.moveTo(px, o.y); ctx.lineTo(px, o.y + o.h); ctx.stroke();
        }
      }
    });

    // ---- sanctuary furniture ----
    // tabernacle
    blk(ctx, 755, 70, 90, 70, GOLD);
    rect(ctx, 755, 70, 90, 70, GOLD);
    rect(ctx, 798, 78, 4, 18, GOLD_SH); rect(ctx, 790, 84, 20, 4, GOLD_SH); // cross
    rect(ctx, 798, 70, 4, 70, "#b8924a"); // door seam
    // altar — white cloth, gold hem, cross + candles
    blk(ctx, 700, 170, 200, 80, ALB);
    rect(ctx, 700, 236, 200, 14, GOLD);
    rect(ctx, 700, 170, 200, 6, ALB_SH);
    rect(ctx, 796, 184, 8, 36, GOLD); rect(ctx, 782, 192, 36, 8, GOLD); // altar cross
    function candle(x) {
      rect(ctx, x, 178, 7, 30, "#f3efe4"); rect(ctx, x, 178, 7, 4, "#d8d2c0");
      ctx.fillStyle = "#ffcf5a"; ctx.beginPath();
      ctx.ellipse(x + 3.5, 174, 4, 7, 0, 0, Math.PI * 2); ctx.fill();
    }
    candle(720); candle(873);
    // ambo
    blk(ctx, 330, 210, 80, 95, "#7a5230");
    rect(ctx, 330, 210, 80, 18, "#8c613b");
    blk(ctx, 340, 196, 60, 18, ALB); // open book
    rect(ctx, 369, 196, 2, 18, "#b8924a");
    // presider chair
    blk(ctx, 1190, 210, 80, 95, "#7a5230");
    rect(ctx, 1190, 210, 80, 26, "#5e3f23"); // tall back
    rect(ctx, 1198, 240, 64, 50, "#9c3a4e"); // cushion
    // credence with cruets + chalice
    blk(ctx, 1410, 250, 90, 70, "#7a5230");
    rect(ctx, 1410, 250, 90, 16, "#8c613b");
    rect(ctx, 1420, 238, 12, 16, "#5a86c4"); // water cruet
    rect(ctx, 1438, 238, 12, 16, "#9c3a4e"); // wine cruet
    rect(ctx, 1462, 236, 16, 18, GOLD); rect(ctx, 1466, 252, 8, 8, GOLD); // chalice
  }

  window.Sprites = { drawCharacter, drawEnvironment, hueFor, hairFor };
})();
