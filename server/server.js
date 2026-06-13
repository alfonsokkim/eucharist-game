// Express + Socket.IO server for "Recreate the Mass".
// One global open-world game. No room codes: players join with a name and spawn
// straight into the shared world. The teacher opens /host and presses Start.

const path = require("path");
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");

const { STEPS } = require("./steps.js");
const { Game } = require("./game.js");
const { EVENTS, PHASES } = require("../public/shared/socket-events.js");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "..", "public");
const TICK_MS = 50;            // 20 Hz snapshot broadcast
const PRIEST_REVEAL_MS = 3500; // pause on the "today's priest is…" reveal

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const game = new Game(STEPS);

app.use(express.static(PUBLIC_DIR));
app.get("/", (_req, res) => res.sendFile(path.join(PUBLIC_DIR, "player", "player.html")));
app.get("/host", (_req, res) => res.sendFile(path.join(PUBLIC_DIR, "host", "host.html")));

// ---- helpers ---------------------------------------------------------------

function emitStep() {
  const payload = game.stepPayload();
  if (payload) io.emit(EVENTS.GAME_STEP, payload);
}

function emitPriestReveal() {
  const priest = game.players.get(game.priestId);
  io.emit(EVENTS.GAME_PRIEST_REVEAL, {
    priestId: game.priestId,
    priestName: priest ? priest.name : ""
  });
}

let revealTimer = null;
function scheduleFirstVote() {
  if (revealTimer) clearTimeout(revealTimer);
  revealTimer = setTimeout(() => {
    if (game.phase === PHASES.PRIEST_REVEAL) {
      game.beginVoting(Date.now());
      emitStep();
    }
  }, PRIEST_REVEAL_MS);
}

function doResolve() {
  const result = game.resolve(Date.now());
  if (result) io.emit(EVENTS.STEP_RESULT, result);
}

// ---- main tick loop --------------------------------------------------------

setInterval(() => {
  const now = Date.now();
  if (game.phase === PHASES.STEP_VOTING) {
    if (game.tickVoting(now) === "resolve") doResolve();
    else io.emit(EVENTS.VOTE_TALLY, { ...game.tally(), timeLeftMs: game.timeLeftMs(now) });
  } else if (game.phase === PHASES.STEP_RESULT) {
    game.tickCutscene(now);
  }
  io.emit(EVENTS.WORLD_SNAPSHOT, game.snapshot());
}, TICK_MS);

// ---- sockets ---------------------------------------------------------------

io.on("connection", (socket) => {
  socket.on(EVENTS.HOST_HELLO, () => {
    socket.data.role = "host";
    socket.emit(EVENTS.WORLD_SNAPSHOT, game.snapshot());
    if (game.phase === PHASES.STEP_VOTING) emitStep();
    if (game.phase === PHASES.STEP_RESULT && game.lastResult) socket.emit(EVENTS.STEP_RESULT, game.lastResult);
    if (game.phase === PHASES.COMPLETE) socket.emit(EVENTS.GAME_OVER, game.gameOver());
  });

  socket.on(EVENTS.PLAYER_JOIN, ({ name } = {}) => {
    const player = game.addPlayer(socket.id, name);
    socket.data.role = "player";
    socket.emit(EVENTS.PLAYER_JOINED, { playerId: player.id });
    socket.emit(EVENTS.WORLD_SNAPSHOT, game.snapshot());
    // catch a late joiner up to whatever is happening right now
    if (game.phase === PHASES.STEP_VOTING) emitStep();
    if (game.phase === PHASES.STEP_RESULT && game.lastResult) socket.emit(EVENTS.STEP_RESULT, game.lastResult);
    if (game.phase === PHASES.PRIEST_REVEAL || game.phase === PHASES.STEP_VOTING || game.phase === PHASES.STEP_RESULT) {
      emitPriestReveal();
    }
    if (game.phase === PHASES.COMPLETE) socket.emit(EVENTS.GAME_OVER, game.gameOver());
  });

  socket.on(EVENTS.PLAYER_INPUT, (input = {}) => {
    if (socket.data.role !== "player") return;
    game.setInput(socket.id, input);
  });

  // -- host controls (any /host screen may drive the game) --
  socket.on(EVENTS.HOST_START, (opts = {}) => {
    if (socket.data.role !== "host") return;
    if (!game.start(opts.priestId || null)) {
      socket.emit(EVENTS.NOTICE, { text: "No players have joined yet." });
      return;
    }
    io.emit(EVENTS.WORLD_SNAPSHOT, game.snapshot());
    emitPriestReveal();
    scheduleFirstVote();
  });

  socket.on(EVENTS.HOST_REVEAL, () => {
    if (socket.data.role !== "host") return;
    if (game.phase === PHASES.STEP_VOTING) doResolve();
  });

  socket.on(EVENTS.HOST_NEXT, () => {
    if (socket.data.role !== "host") return;
    if (game.phase !== PHASES.STEP_RESULT) return;
    const res = game.next(Date.now());
    io.emit(EVENTS.WORLD_SNAPSHOT, game.snapshot());
    if (res.done) io.emit(EVENTS.GAME_OVER, game.gameOver());
    else if (res.advanced) emitStep();
  });

  socket.on(EVENTS.HOST_RESTART, () => {
    if (socket.data.role !== "host") return;
    if (!game.restart()) return;
    io.emit(EVENTS.WORLD_SNAPSHOT, game.snapshot());
    emitPriestReveal();
    scheduleFirstVote();
  });

  socket.on(EVENTS.HOST_REASSIGN_PRIEST, ({ priestId } = {}) => {
    if (socket.data.role !== "host") return;
    if (game.phase === PHASES.LOBBY || game.phase === PHASES.COMPLETE) return;
    if (game.reassignPriest(priestId || null)) {
      io.emit(EVENTS.WORLD_SNAPSHOT, game.snapshot());
      emitPriestReveal();
    }
  });

  socket.on("disconnect", () => {
    if (socket.data.role !== "player") return;
    const { wasPriest, newPriest } = game.removePlayer(socket.id);
    if (wasPriest && newPriest) emitPriestReveal();
    io.emit(EVENTS.WORLD_SNAPSHOT, game.snapshot());
  });
});

server.listen(PORT, () => {
  console.log(`\n  Recreate the Mass - running`);
  console.log(`  Host screen:  http://localhost:${PORT}/host`);
  console.log(`  Players join: http://localhost:${PORT}/   (use your LAN IP on phones)\n`);
});
