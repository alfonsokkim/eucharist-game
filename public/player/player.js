// Player (phone) controller: join with a name, spawn into the shared world,
// walk around with a virtual joystick, and vote by standing in a zone.
(function () {
  "use strict";
  const WC = window.WorldConfig;
  const socket = io();

  const el = (id) => document.getElementById(id);
  const refs = {
    join: el("view-join"), game: el("view-game"),
    name: el("join-name"), joinBtn: el("join-btn"), joinError: el("join-error"),
    stepTitle: el("p-step-title"), stepPrompt: el("p-step-prompt"), timer: el("p-timer"),
    joystick: el("joystick"), knob: el("joystick-knob"),
    rolePop: el("role-pop"), resultPop: el("result-pop"), endPop: el("end-pop"),
    moveHint: el("move-hint")
  };

  let world = null;
  let myId = null;
  let phase = PHASES.LOBBY;
  let self = { x: WC.WORLD_W / 2, y: WC.WORLD_H / 2, dir: "up", moving: false };
  let selfInit = false;
  let controlling = false;
  let lastSent = 0;

  const MOVE_PHASES = new Set([PHASES.LOBBY, PHASES.STEP_VOTING]);
  const keys = new Set();
  const joy = { active: false, dx: 0, dy: 0, id: null };

  // --- join ---
  function doJoin() {
    const name = refs.name.value.trim();
    if (!name) { refs.joinError.textContent = "Please enter your name."; return; }
    socket.emit(EVENTS.PLAYER_JOIN, { name });
  }
  refs.joinBtn.addEventListener("click", doJoin);
  refs.name.addEventListener("keydown", (e) => { if (e.key === "Enter") doJoin(); });

  socket.on(EVENTS.PLAYER_JOINED, ({ playerId }) => {
    myId = playerId;
    refs.join.classList.add("hidden");
    refs.game.classList.remove("hidden");
    world = new WorldView(el("world"), { mode: "player" });
    world.setSelf(myId);
    world.start();
    startMovementLoop();
    setTimeout(() => refs.moveHint.classList.add("fade"), 4000);
  });

  // --- world state ---
  socket.on(EVENTS.WORLD_SNAPSHOT, (snap) => {
    if (!world) return;
    world.setSnapshot(snap);
    phase = snap.phase;

    const me = snap.players.find((p) => p.id === myId);
    if (me && !selfInit) { self.x = me.x; self.y = me.y; self.dir = me.dir; selfInit = true; }

    const canMove = MOVE_PHASES.has(phase);
    if (canMove && !controlling) {
      // (re)sync local avatar to the server's position before resuming control
      if (me) { self.x = me.x; self.y = me.y; self.dir = me.dir; }
      controlling = true;
    } else if (!canMove && controlling) {
      controlling = false;
      self.moving = false;
      world.setSelfPos(null); // hand the avatar back to the server (e.g. cutscene)
    }
    refs.joystick.classList.toggle("hidden", !canMove);
    if (phase !== PHASES.STEP_VOTING) refs.timer.classList.add("hidden");
  });

  socket.on(EVENTS.GAME_PRIEST_REVEAL, ({ priestId }) => {
    const mine = priestId === myId;
    refs.rolePop.className = "toast role " + (mine ? "priest" : "parishioner");
    refs.rolePop.innerHTML = mine
      ? `<div class="role-badge">♱ You are the PRIEST</div><div>Lead the class — you still walk and vote like everyone else.</div>`
      : `<div class="role-badge">You are a parishioner</div><div>Walk into the answer you think comes next.</div>`;
    refs.rolePop.classList.remove("hidden");
    setTimeout(() => refs.rolePop.classList.add("hidden"), 3200);
  });

  socket.on(EVENTS.GAME_STEP, (step) => {
    world.setStep(step);
    refs.stepTitle.textContent = step.title;
    refs.stepPrompt.textContent = step.prompt;
    refs.resultPop.classList.add("hidden");
    refs.rolePop.classList.add("hidden");
    refs.timer.classList.remove("hidden");
  });

  socket.on(EVENTS.VOTE_TALLY, ({ counts, voted, total, timeLeftMs }) => {
    world.setTally(counts);
    const secs = Math.ceil(timeLeftMs / 1000);
    refs.timer.textContent = `⏱ ${secs}s   ·   ${voted}/${total} chosen`;
    refs.timer.classList.toggle("urgent", secs <= 5);
  });

  socket.on(EVENTS.STEP_RESULT, (res) => {
    world.setResult(res);
    refs.timer.classList.add("hidden");
    const myZone = WC.zoneAt(self.x, self.y);
    let line;
    if (myZone < 0) line = "You weren't standing on an answer.";
    else if (myZone === res.correctIndex) line = "You were on the right answer! ✓";
    else line = "You were on a different answer.";
    const t = res.teach || {};
    const teachHtml = res.teach
      ? `<div class="teach">
           <div class="teach-row"><span class="teach-label">What happens</span><p>${esc(t.whatHappens)}</p></div>
           <div class="teach-row"><span class="teach-label">Why it matters</span><p>${esc(t.meaning)}</p></div>
           <div class="teach-row"><span class="teach-label">In Scripture</span><p>${esc(t.scripture)}</p></div>
         </div>`
      : `<div class="result-explain">${esc(res.explain)}</div>`;
    refs.resultPop.className = "toast result " + (res.success ? "ok" : "no");
    refs.resultPop.innerHTML =
      `<div class="result-head">${res.success ? "The class got it right!" : "The class missed this one"}</div>
       <div class="result-mine">${line}</div>
       <div class="reveal-answer">✓ <strong>${esc(res.title)}</strong> — ${esc(res.correctText)}</div>
       ${teachHtml}`;
    refs.resultPop.classList.remove("hidden");
  });

  socket.on(EVENTS.GAME_OVER, ({ correctSteps, totalSteps, accuracyPct }) => {
    refs.resultPop.classList.add("hidden");
    refs.endPop.innerHTML =
      `<div class="end-acc">${accuracyPct}%</div>
       <div>The class placed ${correctSteps} of ${totalSteps} steps in order.</div>
       <div class="dim">Thank you for praying along!</div>`;
    refs.endPop.classList.remove("hidden");
  });

  socket.on(EVENTS.NOTICE, ({ text }) => { refs.stepPrompt.textContent = text; });

  // --- movement (client-authoritative, with collision) ---
  function startMovementLoop() {
    let last = performance.now();
    function tick(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (controlling) integrate(dt, now);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function integrate(dt, now) {
    let vx = joy.dx, vy = joy.dy;
    if (keys.has("a") || keys.has("arrowleft")) vx -= 1;
    if (keys.has("d") || keys.has("arrowright")) vx += 1;
    if (keys.has("w") || keys.has("arrowup")) vy -= 1;
    if (keys.has("s") || keys.has("arrowdown")) vy += 1;
    const mag = Math.hypot(vx, vy);
    self.moving = mag > 0.12;
    if (self.moving) {
      vx /= mag || 1; vy /= mag || 1;
      const r = WC.PLAYER_RADIUS, step = WC.PLAYER_SPEED * dt;
      const nx = self.x + vx * step;
      if (!WC.collides(nx, self.y, r)) self.x = nx;
      const ny = self.y + vy * step;
      if (!WC.collides(self.x, ny, r)) self.y = ny;
      const c = WC.clampToWorld(self.x, self.y, r);
      self.x = c.x; self.y = c.y;
      self.dir = Math.abs(vx) > Math.abs(vy) ? (vx > 0 ? "right" : "left") : (vy > 0 ? "down" : "up");
    }
    world.setSelfPos({ x: self.x, y: self.y, dir: self.dir, moving: self.moving });
    if (now - lastSent > 80) {
      socket.emit(EVENTS.PLAYER_INPUT, { x: self.x, y: self.y, dir: self.dir, moving: self.moving });
      lastSent = now;
    }
  }

  // --- virtual joystick (drag anywhere) ---
  function joyStart(e, x, y) {
    joy.active = true;
    const r = refs.joystick.getBoundingClientRect();
    refs.joystick.style.left = (x - r.width / 2) + "px";
    refs.joystick.style.top = (y - r.height / 2) + "px";
    refs.joystick.classList.add("dragging");
    joyMove(x, y, x, y);
  }
  function joyMove(x, y) {
    const r = refs.joystick.getBoundingClientRect();
    const cxp = r.left + r.width / 2, cyp = r.top + r.height / 2;
    let dx = x - cxp, dy = y - cyp;
    const max = r.width / 2;
    const d = Math.hypot(dx, dy);
    if (d > max) { dx = dx / d * max; dy = dy / d * max; }
    refs.knob.style.transform = `translate(${dx}px, ${dy}px)`;
    joy.dx = dx / max; joy.dy = dy / max;
  }
  function joyEnd() {
    joy.active = false; joy.dx = 0; joy.dy = 0;
    refs.knob.style.transform = "translate(0,0)";
    refs.joystick.classList.remove("dragging");
  }

  // touch: drag starting anywhere on the game screen moves the joystick there
  refs.game.addEventListener("touchstart", (e) => {
    if (!controlling) return;
    const t = e.changedTouches[0];
    joy.id = t.identifier;
    joyStart(e, t.clientX, t.clientY);
    e.preventDefault();
  }, { passive: false });
  refs.game.addEventListener("touchmove", (e) => {
    if (!joy.active) return;
    for (const t of e.changedTouches) if (t.identifier === joy.id) joyMove(t.clientX, t.clientY);
    e.preventDefault();
  }, { passive: false });
  refs.game.addEventListener("touchend", (e) => {
    for (const t of e.changedTouches) if (t.identifier === joy.id) joyEnd();
  });

  // mouse (desktop testing)
  refs.game.addEventListener("mousedown", (e) => { if (controlling) { joyStart(e, e.clientX, e.clientY); } });
  window.addEventListener("mousemove", (e) => { if (joy.active) joyMove(e.clientX, e.clientY); });
  window.addEventListener("mouseup", () => { if (joy.active) joyEnd(); });

  // keyboard (desktop testing)
  window.addEventListener("keydown", (e) => keys.add(e.key.toLowerCase()));
  window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));

  function esc(s) { return (s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
})();
