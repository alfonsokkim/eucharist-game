// Shared world renderer used by both the host (whole-world view) and players
// (camera follows their own avatar). Caches the static church to an offscreen
// canvas, interpolates other players between snapshots, and draws text labels
// in screen space so they stay crisp at any zoom. Exposes `window.WorldView`.

(function () {
  "use strict";
  const WC = window.WorldConfig;

  class WorldView {
    constructor(canvas, opts) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.mode = (opts && opts.mode) || "host";
      this.selfId = null;
      this.selfPos = null; // {x,y,dir,moving} — player's local authoritative self

      this.entities = new Map(); // id -> render entity
      this.phase = "LOBBY";
      this.priestId = null;
      this.step = null;          // {zones:[{index,text,x,y,r}], station}
      this.result = null;        // {correctIndex, majorityIndex, success}
      this.counts = [0, 0, 0];

      this.cam = { scale: 1, ox: 0, oy: 0 };
      this._bg = null;
      this._last = performance.now();
      this._raf = null;
    }

    setSelf(id) { this.selfId = id; }
    setSelfPos(p) { this.selfPos = p; }
    setStep(step) { this.step = step; this.result = null; this.counts = [0, 0, 0]; }
    setResult(r) { this.result = r; }
    setTally(counts) { if (counts) this.counts = counts; }

    setSnapshot(snap) {
      this.phase = snap.phase;
      this.priestId = snap.priestId;
      const seen = new Set();
      for (const p of snap.players) {
        seen.add(p.id);
        let e = this.entities.get(p.id);
        if (!e) {
          e = { x: p.x, y: p.y, tx: p.x, ty: p.y, dir: p.dir, moving: p.moving, walk: 0 };
          this.entities.set(p.id, e);
        }
        e.tx = p.x; e.ty = p.y; e.dir = p.dir; e.moving = p.moving;
        e.name = p.name; e.isPriest = p.isPriest;
      }
      for (const id of [...this.entities.keys()]) if (!seen.has(id)) this.entities.delete(id);
    }

    start() {
      const loop = () => {
        const now = performance.now();
        const dt = Math.min(0.05, (now - this._last) / 1000);
        this._last = now;
        this._update(dt);
        this._draw();
        this._raf = requestAnimationFrame(loop);
      };
      if (!this._raf) loop();
    }

    _ensureBg() {
      if (this._bg) return;
      const off = document.createElement("canvas");
      off.width = WC.WORLD_W; off.height = WC.WORLD_H;
      window.Sprites.drawEnvironment(off.getContext("2d"), WC);
      this._bg = off;
    }

    _update(dt) {
      for (const [id, e] of this.entities) {
        if (this.mode === "player" && id === this.selfId && this.selfPos) {
          e.x = this.selfPos.x; e.y = this.selfPos.y;
          e.dir = this.selfPos.dir; e.moving = this.selfPos.moving;
        } else {
          e.x += (e.tx - e.x) * Math.min(1, dt * 12);
          e.y += (e.ty - e.y) * Math.min(1, dt * 12);
        }
        e.walk = (e.walk + (e.moving ? dt * 1.7 : 0)) % 1;
        if (!e.moving) e.walk = 0;
      }
    }

    _computeCamera(cw, ch) {
      if (this.mode === "host") {
        const scale = Math.min(cw / WC.WORLD_W, ch / WC.WORLD_H);
        this.cam = { scale, ox: (cw - WC.WORLD_W * scale) / 2, oy: (ch - WC.WORLD_H * scale) / 2 };
      } else {
        const viewW = 780; // world px visible across the phone
        const scale = cw / viewW;
        const self = this.selfId && this.entities.get(this.selfId);
        let camX = self ? self.x : WC.WORLD_W / 2;
        let camY = self ? self.y : WC.WORLD_H / 2;
        const halfW = cw / scale / 2, halfH = ch / scale / 2;
        camX = Math.max(halfW, Math.min(WC.WORLD_W - halfW, camX));
        camY = Math.max(halfH, Math.min(WC.WORLD_H - halfH, camY));
        this.cam = { scale, ox: cw / 2 - camX * scale, oy: ch / 2 - camY * scale };
      }
    }

    _draw() {
      const ctx = this.ctx, canvas = this.canvas;
      const dpr = window.devicePixelRatio || 1;
      const cw = canvas.clientWidth, ch = canvas.clientHeight;
      if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
        canvas.width = Math.round(cw * dpr);
        canvas.height = Math.round(ch * dpr);
      }
      this._ensureBg();
      this._computeCamera(cw, ch);
      const { scale, ox, oy } = this.cam;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#1c1530";
      ctx.fillRect(0, 0, cw, ch);

      // world space
      ctx.save();
      ctx.translate(ox, oy);
      ctx.scale(scale, scale);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this._bg, 0, 0);
      this._drawZones(ctx);
      this._drawPlayers(ctx);
      ctx.restore();

      // screen-space labels
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this._drawLabels(ctx);
    }

    _showZones() {
      return this.step && (this.phase === "STEP_VOTING" || this.phase === "STEP_RESULT");
    }

    _drawZones(ctx) {
      if (!this._showZones()) return;
      const t = performance.now() / 1000;
      this.step.zones.forEach((z) => {
        let ring = "#d8b46a", fill = "rgba(216,180,106,0.16)";
        if (this.result) {
          if (z.index === this.result.correctIndex) { ring = "#3f8f5f"; fill = "rgba(63,143,95,0.22)"; }
          else if (z.index === this.result.majorityIndex) { ring = "#b14250"; fill = "rgba(177,66,80,0.20)"; }
          else { ring = "#9a93a8"; fill = "rgba(120,110,140,0.12)"; }
        }
        ctx.fillStyle = fill;
        ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = ring;
        ctx.lineWidth = 4;
        ctx.setLineDash(this.result ? [] : [14, 10]);
        ctx.lineDashOffset = -t * 30;
        ctx.beginPath(); ctx.arc(z.x, z.y, z.r - 3, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
      });
    }

    _drawPlayers(ctx) {
      const list = [...this.entities.entries()].sort((a, b) => a[1].y - b[1].y);
      for (const [id, e] of list) {
        if (e.isPriest) {
          ctx.fillStyle = "rgba(216,180,106,0.85)";
          ctx.lineWidth = 4; ctx.strokeStyle = "rgba(216,180,106,0.9)";
          ctx.beginPath(); ctx.ellipse(e.x, e.y + 2, 22, 8, 0, 0, Math.PI * 2); ctx.stroke();
        }
        window.Sprites.drawCharacter(ctx, e.x, e.y, {
          dir: e.dir, moving: e.moving, walkPhase: e.walk,
          isPriest: e.isPriest, hue: window.Sprites.hueFor(id),
          hair: window.Sprites.hairFor(id), scale: 2.3
        });
      }
    }

    _w2s(x, y) { return { x: this.cam.ox + x * this.cam.scale, y: this.cam.oy + y * this.cam.scale }; }

    _drawLabels(ctx) {
      // zone labels + live counts
      if (this._showZones()) {
        this.step.zones.forEach((z) => {
          const c = this._w2s(z.x, z.y);
          const rad = z.r * this.cam.scale;
          ctx.textAlign = "center";
          // index badge at the top of the pad
          ctx.font = "800 16px -apple-system, Segoe UI, sans-serif";
          // wrapped card text
          ctx.font = "700 14px -apple-system, Segoe UI, sans-serif";
          this._wrapText(ctx, z.text, c.x, c.y - 6, rad * 1.7, 16, "#3a2f55", "#fff");
          // live count
          const n = this.counts[z.index] || 0;
          ctx.font = "900 22px -apple-system, Segoe UI, sans-serif";
          ctx.fillStyle = "rgba(42,31,64,0.9)";
          ctx.fillText(String(n), c.x, c.y + rad - 6);
        });
      }
      // name tags
      for (const [id, e] of this.entities) {
        const s = this._w2s(e.x, e.y - 58);
        const name = e.name || "";
        ctx.font = "700 12px -apple-system, Segoe UI, sans-serif";
        const w = ctx.measureText(name).width + 12;
        ctx.fillStyle = e.isPriest ? "rgba(216,180,106,0.95)" : "rgba(36,27,58,0.85)";
        this._roundRect(ctx, s.x - w / 2, s.y - 9, w, 18, 6); ctx.fill();
        ctx.fillStyle = e.isPriest ? "#2a1f40" : "#fff";
        ctx.textAlign = "center";
        ctx.fillText((e.isPriest ? "♱ " : "") + name, s.x, s.y + 4);
      }
    }

    _wrapText(ctx, text, cx, cy, maxW, lh, stroke, fill) {
      const words = text.split(" ");
      const lines = [];
      let line = "";
      for (const w of words) {
        const test = line ? line + " " + w : w;
        if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
        else line = test;
      }
      if (line) lines.push(line);
      const startY = cy - ((lines.length - 1) * lh) / 2;
      ctx.lineWidth = 3; ctx.strokeStyle = stroke; ctx.fillStyle = fill;
      ctx.lineJoin = "round";
      lines.forEach((ln, i) => {
        ctx.strokeText(ln, cx, startY + i * lh);
        ctx.fillText(ln, cx, startY + i * lh);
      });
    }

    _roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }
  }

  window.WorldView = WorldView;
})();
