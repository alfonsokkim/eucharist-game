// Host (projector) controller: renders the whole world + drives pacing.
(function () {
  "use strict";
  const socket = io();
  const world = new WorldView(document.getElementById("world"), { mode: "host" });
  world.start();

  const VOTE_MS = 25000; // matches server VOTE_SECONDS for the timer bar
  const el = (id) => document.getElementById(id);
  const refs = {
    joinAddr: el("join-addr"), playerPill: el("player-pill"),
    overlay: el("overlay"), overlayCard: el("overlay-card"),
    stepTitle: el("step-title"), stepPrompt: el("step-prompt"),
    timerWrap: el("timer-wrap"), timerFill: el("timer-fill"), timerText: el("timer-text"),
    tally: el("tally"),
    btnStart: el("btn-start"), btnReveal: el("btn-reveal"), btnNext: el("btn-next"),
    btnRestart: el("btn-restart"), btnReassign: el("btn-reassign"),
    mute: el("mute-toggle")
  };

  refs.joinAddr.textContent = location.host;

  // --- sound ---
  let muted = false, actx = null;
  function chime(ok) {
    if (muted) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      (ok ? [523.25, 659.25, 783.99] : [392, 329.63]).forEach((f, i) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = "sine"; o.frequency.value = f;
        const t = actx.currentTime + i * 0.12;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.18, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
        o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 0.65);
      });
    } catch (_) {}
  }
  refs.mute.addEventListener("click", () => {
    muted = !muted; refs.mute.textContent = muted ? "🔕" : "🔔";
  });

  function showOverlay(html) { refs.overlayCard.innerHTML = html; refs.overlay.classList.remove("hidden"); }
  function hideOverlay() { refs.overlay.classList.add("hidden"); }

  socket.on("connect", () => socket.emit(EVENTS.HOST_HELLO));

  socket.on(EVENTS.WORLD_SNAPSHOT, (snap) => {
    world.setSnapshot(snap);
    refs.playerPill.textContent = snap.players.length + (snap.players.length === 1 ? " in church" : " in church");

    const ph = snap.phase;
    refs.btnStart.disabled = !(ph === PHASES.LOBBY && snap.players.length > 0);
    refs.btnReveal.disabled = ph !== PHASES.STEP_VOTING;
    refs.btnNext.disabled = ph !== PHASES.STEP_RESULT;
    refs.btnRestart.disabled = !(ph === PHASES.COMPLETE || ph === PHASES.STEP_RESULT || ph === PHASES.STEP_VOTING);
    refs.btnReassign.disabled = !(ph === PHASES.PRIEST_REVEAL || ph === PHASES.STEP_VOTING || ph === PHASES.STEP_RESULT);

    if (ph === PHASES.STEP_VOTING || ph === PHASES.STEP_RESULT) {
      refs.timerWrap.classList.toggle("hidden", ph !== PHASES.STEP_VOTING);
    }
    if (ph === PHASES.LOBBY) {
      world.setStep(null);
      refs.timerWrap.classList.add("hidden");
      refs.stepTitle.textContent = "Get ready";
      refs.stepPrompt.textContent = "Players walk in and roam freely. Press Start when the class is ready.";
      clearTally();
      showOverlay(
        snap.players.length
          ? `<h2>${snap.players.length} ${snap.players.length === 1 ? "person is" : "people are"} in the church</h2>
             <p>They can wander around. Press <strong>Start</strong> and one of them becomes the priest.</p>`
          : `<h2>Waiting for the class…</h2>
             <p>Students open this page's address on their phones, pick a name, and walk right into the church.</p>`
      );
    }
  });

  socket.on(EVENTS.GAME_PRIEST_REVEAL, ({ priestName }) => {
    showOverlay(`<h2>Today's priest is…</h2><div class="big">${esc(priestName)}</div>
                 <p>Everyone, walk to the answer you think comes next.</p>`);
  });

  socket.on(EVENTS.GAME_STEP, (step) => {
    hideOverlay();
    world.setStep(step);
    refs.stepTitle.textContent = step.title;
    refs.stepPrompt.textContent = step.prompt;
    setTallyTexts(step.zones.map((z) => z.text));
    refs.timerWrap.classList.remove("hidden");
  });

  socket.on(EVENTS.VOTE_TALLY, ({ counts, voted, total, timeLeftMs }) => {
    world.setTally(counts);
    const max = Math.max(1, total);
    counts.forEach((c, i) => {
      const row = refs.tally.querySelector(`[data-index="${i}"]`);
      row.querySelector("i").style.width = (c / max) * 100 + "%";
      row.querySelector(".t-count").textContent = c;
    });
    const secs = Math.ceil(timeLeftMs / 1000);
    refs.timerFill.style.width = Math.max(0, Math.min(100, (timeLeftMs / VOTE_MS) * 100)) + "%";
    refs.timerText.textContent = `${secs}s · ${voted}/${total} chosen`;
  });

  socket.on(EVENTS.STEP_RESULT, (res) => {
    world.setResult(res);
    refs.timerWrap.classList.add("hidden");
    const rows = refs.tally.querySelectorAll(".hud-tally-row");
    rows.forEach((r) => {
      const i = Number(r.dataset.index);
      r.classList.toggle("correct", i === res.correctIndex);
      r.classList.toggle("wrong", !res.success && i === res.majorityIndex && res.majorityIndex >= 0);
    });
    showOverlay(
      `<h2 class="${res.success ? "ok" : "no"}">${res.success ? "✓ The class chose well!" : res.majorityIndex < 0 ? "No clear choice" : "Not quite"}</h2>
       <p>${esc(res.explain)}</p>
       <p class="dim">Press <strong>Next</strong> to continue.</p>`
    );
    chime(res.success);
  });

  socket.on(EVENTS.GAME_OVER, ({ correctSteps, totalSteps, accuracyPct }) => {
    world.setStep(null); world.setResult(null);
    refs.timerWrap.classList.add("hidden"); clearTally();
    const msg = accuracyPct >= 90 ? "Beautifully done!" : accuracyPct >= 60 ? "Well done — a few to revisit." : "A great start — let's walk it again.";
    showOverlay(`<h2>The Liturgy of the Eucharist — complete</h2>
                 <div class="big">${accuracyPct}%</div>
                 <p>${correctSteps} of ${totalSteps} steps in the right order.</p><p>${msg}</p>`);
    chime(accuracyPct >= 60);
  });

  socket.on(EVENTS.NOTICE, ({ text }) => { refs.stepPrompt.textContent = text; });

  refs.btnStart.addEventListener("click", () => socket.emit(EVENTS.HOST_START, {}));
  refs.btnReveal.addEventListener("click", () => socket.emit(EVENTS.HOST_REVEAL));
  refs.btnNext.addEventListener("click", () => socket.emit(EVENTS.HOST_NEXT));
  refs.btnRestart.addEventListener("click", () => socket.emit(EVENTS.HOST_RESTART));
  refs.btnReassign.addEventListener("click", () => socket.emit(EVENTS.HOST_REASSIGN_PRIEST, {}));

  function setTallyTexts(texts) {
    refs.tally.querySelectorAll(".hud-tally-row").forEach((r, i) => {
      r.classList.remove("correct", "wrong");
      r.querySelector(".t-text").textContent = texts[i] || "";
      r.querySelector("i").style.width = "0%";
      r.querySelector(".t-count").textContent = "0";
    });
  }
  function clearTally() { setTallyTexts(["", "", ""]); }
  function esc(s) { return (s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
})();
