// Shared Socket.IO event-name constants.
// Loaded both in the browser (as a global `EVENTS`) and on the server (via require).

const EVENTS = {
  // Client -> Server
  HOST_HELLO: "host:hello",          // a /host screen identifies itself
  PLAYER_JOIN: "player:join",        // { name }
  PLAYER_INPUT: "player:input",      // { x, y, dir, moving } (client-authoritative movement)
  HOST_START: "host:start",
  HOST_REVEAL: "host:reveal",        // force-resolve the current step
  HOST_NEXT: "host:next",            // advance after a result/cutscene
  HOST_RESTART: "host:restart",
  HOST_REASSIGN_PRIEST: "host:reassignPriest",

  // Server -> Client
  PLAYER_JOINED: "player:joined",    // { playerId }
  NOTICE: "notice",                  // { text }
  WORLD_SNAPSHOT: "world:snapshot",  // { phase, stepIndex, totalSteps, score, players:[...] }
  GAME_PRIEST_REVEAL: "game:priestReveal", // { priestId, priestName }
  GAME_STEP: "game:step",            // { stepIndex, title, prompt, station, zones:[{index,text,x,y,r}] }
  VOTE_TALLY: "vote:tally",          // { counts:[n,n,n], voted, total, timeLeftMs }
  STEP_RESULT: "step:result",        // { correctIndex, majorityIndex, success, explain, station }
  GAME_OVER: "game:over"             // { correctSteps, totalSteps, accuracyPct }
};

// Phases for the room state machine.
const PHASES = {
  LOBBY: "LOBBY",
  PRIEST_REVEAL: "PRIEST_REVEAL",
  STEP_VOTING: "STEP_VOTING",
  STEP_RESULT: "STEP_RESULT",
  COMPLETE: "COMPLETE"
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { EVENTS, PHASES };
} else {
  window.EVENTS = EVENTS;
  window.PHASES = PHASES;
}
