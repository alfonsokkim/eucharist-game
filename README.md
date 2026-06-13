# Recreate the Mass

A live, in-person classroom **multiplayer game** for a high-school faith-formation
lesson on the **Liturgy of the Eucharist**. It's a shared open-world: students
join on their phones, pick a name, and walk a little pixel-art avatar around a
top-down church. The teacher runs the **host screen** on a projector showing the
whole church. Each step of the Mass asks a question and three **answer pads**
light up in the nave - students **walk into the pad** they think is correct
before the timer runs out. The most-crowded pad is the class's answer: if it's
right, the chosen priest performs the action and the game advances; if not, the
correct answer is revealed with a short explanation. The session ends with a
class accuracy score.

## Requirements

- [Node.js](https://nodejs.org/) 18 or newer (tested on Node 22).

## Install & run

```bash
npm install
npm start        # or: node server/server.js
```

- **Teacher / host:** open `http://localhost:3000/host` on the projected laptop.
- **Students:** on phones on the **same Wi-Fi**, open `http://<LAPTOP-LAN-IP>:3000`,
  type a name, and walk straight into the church. **No room code, no login.**

Find your laptop's LAN IP: macOS `ipconfig getifaddr en0` · Windows `ipconfig`
(IPv4) · Linux `hostname -I`. The host screen also shows the address to type.

> **Firewall note:** the first run may prompt to allow `node` on the local
> network - allow it, or phones can't reach the host.

## How to play

1. Students open the page, enter a name, and spawn into the church. They can
   **roam freely** while everyone arrives.
2. The teacher presses **Start**. One student is chosen at random as the priest
   (gold ring + name on screen).
3. For each step: the prompt appears and **three answer pads** light up. A
   countdown runs (~25s). Students **walk onto the pad** they believe is next.
   Standing on a pad = that vote; step off / onto another to change.
   - Resolution happens when the **timer ends**, when **everyone is standing on
     a pad**, or when the teacher presses **Reveal**.
   - **Correct majority:** the priest avatar walks to the right station and
     performs the action (a short cutscene on every screen). Press **Next**.
   - **Wrong majority or a tie:** the correct pad is highlighted with an
     explanation; no action is performed. Press **Next** to continue.
4. After the final step, the host shows the class accuracy. **Restart** plays
   again with a new priest.

### Movement controls (phones)

Drag **anywhere** on the screen - a joystick appears under your thumb and your
avatar walks. (On a laptop you can also test with **WASD / arrow keys**.)

### Host controls

| Button | Does |
| --- | --- |
| **Start** | Chooses the priest and begins the first step. |
| **Reveal** | Resolves the current step early. |
| **Next** | Advances after a result/cutscene. |
| **Restart** | Resets the game with a new priest (keeps everyone in the world). |
| **New priest** | Reassigns the priest (also automatic if the priest leaves). |
| **🔔 / 🔕** | Toggles the soft chime. |

## Design decisions

- **One global world, no room codes** - anyone who opens the page and picks a
  name is in. The teacher just presses Start.
- **Voting is positional** - your avatar's pad is your vote. Plurality wins; a
  tie or an empty result counts as incorrect (teaching mode), then advances.
- **Per-step timer** (~25s, in `server/game.js` `VOTE_SECONDS`). It also resolves
  early once everyone is standing on a pad, or when the teacher hits Reveal.
- The priest **votes** like everyone else; on a correct step their avatar
  performs the cutscene.

## Fairness

The server **never** sends which pad is correct to any client - only the card
text and pad positions. Correctness is computed server-side and revealed only
when a step resolves. Cards are shuffled once per step on the server and the
same layout is sent to everyone.

## Art / sprites

The characters and church are drawn as **procedural 16-bit / GBA-Pokémon-style
pixel sprites** (animated 4-direction walk cycles, distinct priest vestments,
tiled stone church with pews, altar, stained glass) - see `public/sprites.js`.
No image assets are required, so it runs immediately. To drop in a real
top-down sprite sheet later, replace the draw calls in `drawCharacter()` /
`drawEnvironment()` with `drawImage()` blits from your atlas (e.g. a free CC0
pack from [Kenney.nl](https://kenney.nl)); nothing else needs to change.

## Movement / networking model

Movement is **client-authoritative** (each phone integrates its own avatar from
the joystick, resolves collision against the shared `world-config.js` geometry,
and reports its position ~12×/sec). The server keeps the authoritative game
state - phase, the chosen priest, the per-step timer, zone occupancy, scoring,
and the priest cutscene - and broadcasts a world snapshot to everyone at 20 Hz.
This is the standard lightweight ".io game" approach and feels responsive on a
classroom LAN. (Cheating isn't a concern here: pads aren't labelled "correct,"
so a forged position can't reveal the answer.)

## Project structure

```
server/
  server.js          Express + Socket.IO; one global game, 20 Hz tick loop
  game.js            World model: players, movement, zone voting, timer, cutscene
  steps.js           Authoritative liturgical content (do not reorder)
public/
  host/
    host.html, host.js     Whole-world view + pacing controls (projector)
  player/
    player.html, player.js Name entry + camera-follow world + joystick (phone)
  shared/
    socket-events.js       Event-name + phase constants (server + browser)
    world-config.js        World geometry: bounds, obstacles, stations, zones
  sprites.js               Procedural pixel-art characters + church environment
  world.js                 Shared renderer: camera, interpolation, zones, labels
  styles.css
package.json
README.md
```

## Notes

- All state is **in memory** - no database. Restarting the server clears the
  world. (This is why it needs a host that keeps a long-running process - see
  Deployment.)

## Deployment

This is a **stateful WebSocket server** (a persistent Node process with an
in-memory game loop), so it must run on a host that supports long-lived
processes and WebSockets. **Serverless platforms like Vercel do not work** for
this - their functions don't keep a process alive or hold a WebSocket open.

Recommended: **Render** (free tier, WebSocket-friendly). A `render.yaml` is
included, so:

1. Push this repo to GitHub.
2. In Render: **New → Blueprint**, point it at the repo; it reads `render.yaml`.
3. Open the resulting URL on the projector (`/host`) and share the base URL
   with students.

Railway and Fly.io work the same way. For a quick public link from your own
laptop without deploying, use a tunnel: `ngrok http 3000`.
