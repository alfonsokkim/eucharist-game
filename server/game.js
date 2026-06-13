// The shared open-world game model for "Recreate the Mass".
// One global world: players roam freely and vote by walking into zones.
// State is in memory. The server runs a tick loop that drives this model.

const { PHASES } = require("../public/shared/socket-events.js");
const WC = require("../public/shared/world-config.js");

const VOTE_SECONDS = 25;        // per-step countdown
const CUTSCENE_WALK_MS = 1300;  // priest walks to the station on success
const ALL_IN_GRACE_MS = 2200;   // earliest auto-resolve once everyone is in a zone

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Shuffle a step's three cards once and remember where the correct one landed.
function prepareStep(step) {
  const order = shuffle([0, 1, 2]);
  return {
    id: step.id,
    title: step.title,
    station: step.station,
    priestAction: step.priestAction,
    prompt: step.prompt,
    explain: step.explain,
    cards: order.map((i) => ({ text: step.cards[i].text })),
    correctIndex: order.findIndex((i) => step.cards[i].correct)
  };
}

class Game {
  constructor(allSteps) {
    this.allSteps = allSteps;
    /** @type {Map<string, object>} id -> player */
    this.players = new Map();
    this.priestId = null;

    this.phase = PHASES.LOBBY;
    this.steps = [];
    this.stepIndex = 0;
    this.correctSteps = 0;

    this.voteDeadline = 0;   // ms timestamp
    this.allInSince = 0;     // when everyone first stood in a zone
    this.lastResult = null;
    this.cutscene = null;    // priest walk animation during STEP_RESULT
  }

  // --- players ---

  addPlayer(id, name) {
    const clean = (name || "").toString().trim().slice(0, 18) || "Friend";
    const p = {
      id,
      name: clean,
      x: WC.SPAWN.x + (Math.random() * 2 - 1) * WC.SPAWN.jitterX,
      y: WC.SPAWN.y + (Math.random() * 2 - 1) * WC.SPAWN.jitterY,
      dir: "up",
      moving: false,
      isPriest: false
    };
    const c = WC.clampToWorld(p.x, p.y, WC.PLAYER_RADIUS);
    p.x = c.x; p.y = c.y;
    this.players.set(id, p);
    return p;
  }

  removePlayer(id) {
    const p = this.players.get(id);
    if (!p) return { wasPriest: false, newPriest: null };
    const wasPriest = p.isPriest;
    this.players.delete(id);

    let newPriest = null;
    const active =
      this.phase === PHASES.PRIEST_REVEAL ||
      this.phase === PHASES.STEP_VOTING ||
      this.phase === PHASES.STEP_RESULT;
    if (wasPriest) {
      this.priestId = null;
      if (this.cutscene && this.cutscene.priestId === id) this.cutscene = null;
      if (active && this.players.size > 0) newPriest = this._assignPriest();
    }
    return { wasPriest, newPriest };
  }

  // Accept a movement update (client-authoritative) only when the player is
  // allowed to move. The priest is frozen while their cutscene plays.
  setInput(id, input) {
    const p = this.players.get(id);
    if (!p) return;
    if (this.phase !== PHASES.LOBBY && this.phase !== PHASES.STEP_VOTING) return;
    const c = WC.clampToWorld(Number(input.x) || p.x, Number(input.y) || p.y, WC.PLAYER_RADIUS);
    p.x = c.x;
    p.y = c.y;
    if (["up", "down", "left", "right"].includes(input.dir)) p.dir = input.dir;
    p.moving = !!input.moving;
  }

  // --- lifecycle ---

  _assignPriest(preferredId = null) {
    for (const p of this.players.values()) p.isPriest = false;
    const ids = [...this.players.keys()];
    if (!ids.length) { this.priestId = null; return null; }
    const chosen =
      preferredId && this.players.has(preferredId)
        ? preferredId
        : ids[Math.floor(Math.random() * ids.length)];
    this.players.get(chosen).isPriest = true;
    this.priestId = chosen;
    return this.players.get(chosen);
  }

  start(preferredPriestId = null) {
    if (this.players.size === 0) return false;
    this.steps = this.allSteps.map(prepareStep);
    this.stepIndex = 0;
    this.correctSteps = 0;
    this.lastResult = null;
    this.cutscene = null;
    this._assignPriest(preferredPriestId);
    this.phase = PHASES.PRIEST_REVEAL;
    return true;
  }

  beginVoting(now) {
    this.phase = PHASES.STEP_VOTING;
    this.voteDeadline = now + VOTE_SECONDS * 1000;
    this.allInSince = 0;
    this.lastResult = null;
    this.cutscene = null;
    return this.currentStep();
  }

  currentStep() {
    return this.steps[this.stepIndex] || null;
  }

  tally() {
    const counts = [0, 0, 0];
    for (const p of this.players.values()) {
      const z = WC.zoneAt(p.x, p.y);
      if (z >= 0) counts[z]++;
    }
    const voted = counts[0] + counts[1] + counts[2];
    return { counts, voted, total: this.players.size };
  }

  // Called every tick while voting. Returns "resolve" if it's time to resolve.
  tickVoting(now) {
    if (this.phase !== PHASES.STEP_VOTING) return null;
    const { voted, total } = this.tally();
    const everyoneIn = total > 0 && voted === total;
    if (everyoneIn) {
      if (!this.allInSince) this.allInSince = now;
    } else {
      this.allInSince = 0;
    }
    const timeUp = now >= this.voteDeadline;
    const settled = everyoneIn && now - this.allInSince >= ALL_IN_GRACE_MS;
    return timeUp || settled ? "resolve" : null;
  }

  timeLeftMs(now) {
    return Math.max(0, this.voteDeadline - now);
  }

  resolve(now) {
    if (this.phase !== PHASES.STEP_VOTING) return null;
    const step = this.currentStep();
    if (!step) return null;

    const { counts } = this.tally();
    let majorityIndex = -1, max = -1, tie = false;
    counts.forEach((c, i) => {
      if (c > max) { max = c; majorityIndex = i; tie = false; }
      else if (c === max && c > 0) tie = true;
    });
    if (max <= 0 || tie) majorityIndex = -1;

    const success = majorityIndex === step.correctIndex;
    if (success) this.correctSteps++;

    this.phase = PHASES.STEP_RESULT;
    this.lastResult = {
      correctIndex: step.correctIndex,
      majorityIndex,
      success,
      explain: step.explain,
      station: step.station
    };

    // On success the priest avatar walks to the station for the cutscene.
    if (success && this.priestId && this.players.has(this.priestId)) {
      const pr = this.players.get(this.priestId);
      const dest = WC.STATIONS[step.station] || WC.STATIONS.altar;
      this.cutscene = {
        priestId: this.priestId,
        fromX: pr.x, fromY: pr.y,
        toX: dest.x, toY: dest.y,
        start: now, dur: CUTSCENE_WALK_MS
      };
    } else {
      this.cutscene = null;
    }
    return this.lastResult;
  }

  // Drive the priest's cutscene walk; returns true while animating.
  tickCutscene(now) {
    if (!this.cutscene) return false;
    const cs = this.cutscene;
    const pr = this.players.get(cs.priestId);
    if (!pr) { this.cutscene = null; return false; }
    const t = Math.min(1, (now - cs.start) / cs.dur);
    const e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    pr.x = cs.fromX + (cs.toX - cs.fromX) * e;
    pr.y = cs.fromY + (cs.toY - cs.fromY) * e;
    pr.moving = t < 1;
    // face the direction of travel
    const dx = cs.toX - cs.fromX, dy = cs.toY - cs.fromY;
    pr.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
    if (t >= 1) { pr.moving = false; this.cutscene = null; }
    return t < 1;
  }

  next(now) {
    if (this.phase !== PHASES.STEP_RESULT) return { done: false, advanced: false };
    if (this.stepIndex >= this.steps.length - 1) {
      this.phase = PHASES.COMPLETE;
      return { done: true, advanced: false };
    }
    this.stepIndex++;
    this.beginVoting(now);
    return { done: false, advanced: true };
  }

  restart() {
    return this.start();
  }

  reassignPriest(preferredId = null) {
    return this._assignPriest(preferredId);
  }

  // --- serializers ---

  snapshot() {
    return {
      phase: this.phase,
      stepIndex: this.stepIndex,
      totalSteps: this.steps.length || this.allSteps.length,
      score: this.correctSteps,
      priestId: this.priestId,
      players: [...this.players.values()].map((p) => ({
        id: p.id,
        name: p.name,
        x: Math.round(p.x),
        y: Math.round(p.y),
        dir: p.dir,
        moving: p.moving,
        isPriest: p.isPriest
      }))
    };
  }

  // game:step payload — text only, NEVER the correctIndex.
  stepPayload() {
    const step = this.currentStep();
    if (!step) return null;
    return {
      stepIndex: this.stepIndex,
      title: step.title,
      prompt: step.prompt,
      station: step.station,
      zones: WC.ZONE_SLOTS.map((z, i) => ({
        index: i, x: z.x, y: z.y, r: z.r, text: step.cards[i].text
      }))
    };
  }

  gameOver() {
    const total = this.steps.length || this.allSteps.length;
    const accuracyPct = total > 0 ? Math.round((this.correctSteps / total) * 100) : 0;
    return { correctSteps: this.correctSteps, totalSteps: total, accuracyPct };
  }
}

module.exports = { Game, prepareStep, shuffle, VOTE_SECONDS };
