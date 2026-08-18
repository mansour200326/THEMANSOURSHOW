# Huddle — Project Brief

Name: **Huddle.** The platform is a game show; the TV is the studio. Games are presented as segments ("Huddle presents: Team Jeopardy").

## Vision

A private party-games platform for Mansour and friends, played in person: one shared screen (TV) runs the **stage view**, everyone's phone becomes a **controller** by entering a 4-letter room code. No app downloads, no accounts. Think "private Jackbox," with AI-generated content so no round ever repeats.

Launch lineup — all 14 games ship:
1. **Team Jeopardy** — classic full Jeopardy, team-based, host-controlled (no phones needed)
2. **Trivia Royale** — Jeopardy-style board with individual buzzers on phones
3. **Impostor** — Spyfall-style hidden-role game
4. **Most Likely To** — vote-for-a-friend party game
5. **The Feud** — Family Feud-style team face-off
6. **Guess Who Said It** — anonymous answers, guess the author
7. **Bluff Trivia** — Fibbage-style fake-answer game
8. **Last One Standing** — elimination quiz, 1% Club-style
9. **Emoji Riddles** — decode AI-generated emoji puzzles
10. **Timeline** — order events chronologically
11. **Wavelength** — spectrum guessing game
12. **Herd Mentality** — match the majority
13. **Codenames-style** — two-team word grid
14. **Sketch & Guess** — draw on phone, guess on TV

## Core experience

- TV opens the site (e.g. `mansour.show`) → "Host a game" → shows room code (e.g. `KHLR`) in a lobby.
- Players open the same URL on their phones → enter code + name → appear in the lobby on the TV with an avatar.
- Host picks a game from the menu. The TV is always the spectacle; phones only ever show private info and input controls.
- Between games, players stay in the room — the platform is a session, not a single game.

## Stack

- **Next.js 14+ (App Router), TypeScript, Tailwind** — deployed on Vercel (same flow as Sumou Jet / Prairies).
- **Realtime: Ably** (or Supabase Realtime — pick whichever integrates cleaner; Ably preferred for buzzer latency and presence). Channels per room: `room:{code}`.
- **State authority:** a lightweight server-side room state held in a store the serverless functions can reach (Vercel KV / Upstash Redis). Clients never trust each other; all game-state transitions go through server routes, which then broadcast via the realtime channel. This prevents buzzer disputes and cheating.
- **AI content: Anthropic API (server-side only)** — generates Jeopardy boards, Impostor location packs, and Most Likely To prompts on demand. Responses requested as strict JSON and validated with Zod before use.

## Views

1. `/` — landing: "Host a game" / "Join a game".
2. `/host/[code]` — stage view (TV): lobby → game menu → game stages → scoreboards.
3. `/play/[code]` — controller view (phone): join form → per-game controls.
4. Controllers are dumb terminals: they render whatever "controller scene" the server says is active (buzzer, vote grid, text input, secret role card).

## Realtime event model

All events flow: phone → API route (validates + mutates room state) → broadcast → all clients re-render.

Core events: `player:join`, `player:leave`, `game:start`, `scene:change`, plus per-game events:
- Trivia: `board:pick`, `buzz` (server timestamps and locks first buzzer), `judge` (correct/wrong), `score:update`
- Impostor: `role:deal` (private per-player), `timer:start`, `vote:cast`, `reveal`
- Most Likely To: `prompt:show`, `vote:cast`, `results:reveal`

## Game specs

### 0. Team Jeopardy (classic, host-controlled — no phones)
- **The one game that needs no realtime layer at all.** Runs entirely in the host's browser, screen-mirrored to the TV. Can be played anywhere with just one device.
- Setup: host enters team names (2–4 teams) and a theme prompt. Claude generates the board (5–6 categories × 5 clues, values 100–500), same JSON shape as Trivia Royale.
- Flow: a turn indicator shows which team is up → that team calls out a category and value → host taps the tile → clue fills the screen → team answers out loud → host taps **✓ (award points)** or **✗ (deduct points)** → board returns with the tile spent → turn passes to the next team.
- Rules toggle at setup: (a) wrong answer = other teams may steal (host taps which team stole it), on/off; (b) deduct points on wrong answers, on/off.
- Team scores always visible along the bottom. End screen: winner celebration with final standings.
- Nice-to-haves: hidden daily-double tiles (team wagers before seeing the clue), a final-Jeopardy round where all teams wager and write answers on paper, per-clue countdown timer (30s) the host can toggle.
- State is purely local (React state + localStorage backup so a refresh doesn't kill the game).

### 1. Trivia Royale (Jeopardy-style)
- Setup: host types a theme prompt on the TV ("football, 2000s movies, roast-the-boys, Dubai"). Claude generates 4–6 categories × 5 clues with ascending values (100–500), returned as JSON: `{categories: [{title, clues: [{value, clue, answer}]}]}`.
- Flow: last correct player picks a tile → clue shows on TV → phones show BUZZ button → first buzz locks others out (server-timestamped) → buzzer's phone shows "Answer out loud" → host (or the picker) taps ✓/✗ on their phone → score updates, wrong answer reopens buzzing for others.
- Nice-to-haves: daily-double tiles, final round with wagers, buzzer lockout penalty (0.5s) for early buzzing.

### 2. Impostor (Spyfall-style)
- Setup: Claude generates a themed location pack (8 locations + 4 roles each), or use classic packs. One random player is the impostor.
- Flow: phones privately show location + role — impostor's phone shows "YOU ARE THE IMPOSTOR." TV shows the timer (8 min) and the full list of possible locations. Players interrogate each other out loud. Anyone can trigger a vote; majority accusation ends the round → reveal. Impostor wins by surviving the vote or naming the location.
- Scoring: impostor survival = 2 pts, correct group vote = 1 pt each.

### 3. Most Likely To
- Setup: Claude generates prompt packs by spice level (chill / spicy / roast). Player names are injected as vote options.
- Flow: prompt appears on TV ("Most likely to move countries without telling anyone") → everyone votes on their phone → TV reveals results as a dramatic bar race → biggest vote-getter gets highlighted. Optional: the "winner" must defend themselves for 20 seconds.
- Rounds of 10 prompts, running tally of "most voted overall."

## Games 5–14 (launch specs, condensed)

All in the launch scope. Ordered by how easily each slots in, with the engine each reuses.

1. **The Feud** (Family Feud-style) — AI generates the survey question + ranked answers. Two teams face off; host reveals answers on the board, three strikes passes control. *Reuses: host-judges-teams pattern from Team Jeopardy.*
2. **Guess Who Said It** — a prompt shows on TV, everyone submits an answer anonymously from their phone, then all vote on who wrote what. *Reuses: submit-and-vote engine from Most Likely To.*
3. **Bluff Trivia** (Fibbage-style) — obscure question; everyone submits a fake answer; all vote for the real one. Points for fooling friends and for finding the truth. *Reuses: submit-and-vote engine.*
4. **Last One Standing** (1% Club-style) — simultaneous answers on phones, escalating difficulty, wrong answer sends you to the "bench" shown on the TV until one player remains. *Reuses: simultaneous-answer plumbing.*
5. **Emoji Riddles** — AI generates emoji puzzles (movies, songs, Dubai spots); teams race to decode, first correct buzz or typed answer wins. *Reuses: buzzer or text-input scenes.*
6. **Timeline** — five AI-generated events appear; teams order them chronologically on their phones; TV reveals the true order dramatically. *New: drag-to-order controller scene.*
7. **Wavelength** — clue-giver gets a secret point on a spectrum ("overrated ↔ underrated"), gives a one-word clue; team dials in a guess on one phone. *New: dial controller scene.*
8. **Herd Mentality** — everyone answers a prompt; score by matching the majority. *Reuses: submit-and-vote engine.*

9. **Codenames-style word grid** — 25 AI-generated words on the TV, two teams, clue-givers see the key card on their phones, teams tap guesses. *New: shared grid scene + private key-card scene.*
10. **Sketch & Guess** — one player draws on their phone canvas, strokes stream live to the TV, everyone else types guesses; closest/fastest scores. *New: canvas controller scene + live stroke streaming.*

## AI content generation


- Single server module `lib/ai.ts` with typed generators: `generateTriviaBoard(theme)`, `generateLocationPack(theme)`, `generatePrompts(spiceLevel, playerNames)`.
- System prompts demand JSON-only output; validate with Zod; retry once on parse failure; keep a small bundled fallback content pack so the game never blocks on the API.
- Arabic/English mixing is welcome — the group is Dubai-based; content can reference Gulf culture when the theme calls for it.

## Design direction

- Stage view: dark, cinematic game-show aesthetic — deep navy/ink background, gold accents for points, big type readable from a couch (min 32px for clues). Subtle motion on reveals (Framer Motion).
- Controller view: huge tap targets (buzzer ≥ 40% of screen), thumb-reachable, near-zero chrome. Vibration API on buzz lockout.
- Playful but premium — this is Mansour's crew, not a kids' app. No clip-art energy.

## Build phases

All 14 games are launch scope; this is still the build order — each phase produces a playable milestone, and later games get cheaper because they reuse engines from earlier ones.

1. **Team Jeopardy:** the full classic game, single-screen, host-controlled. No realtime needed — playable on game night one. Build the board UI, clue reveal, team turns, scoring, and the AI board generator here (reused by Trivia Royale, The Feud, and others).
2. **Shell:** room create/join, lobby with live player list, realtime plumbing, scene system. *Milestone: 4 phones in a lobby on the TV.*
3. **Most Likely To:** simplest phone-controlled game loop (prompt → vote → reveal → next). Proves the engine.
4. **Trivia Royale:** buzzer race with server-side lockout, individual scoring — reusing the board UI and generator from Phase 1.
5. **Impostor:** private role dealing, timer, voting, reveal.
6. **Submit-and-vote wave:** Guess Who Said It, Bluff Trivia, Herd Mentality — all three ride the Most Likely To engine.
7. **Board-and-host wave:** The Feud (reuses Team Jeopardy's host-judging pattern), Emoji Riddles (buzzer/text-input scenes).
8. **New-scene wave:** Last One Standing (simultaneous answers + elimination), Timeline (drag-to-order scene), Wavelength (dial scene).
9. **Heavy-lift finale:** Codenames-style (shared grid + private key cards), Sketch & Guess (live drawing streams — the most technically involved game, so it goes last).
10. **Polish:** sounds, animations, session scoreboard across games, custom domain.

## Kickoff prompt (paste into Claude Code)

```
Read games-platform-brief.md in this directory — it's the full spec.

Scaffold the project: Next.js 14 App Router + TypeScript + Tailwind + Framer Motion.

Build Phase 1 first: Team Jeopardy, the complete single-screen host-controlled game
(spec #0 in the brief). Setup screen for team names + theme, the board, clue reveal,
turn rotation, ✓/✗ scoring with the steal and deduction toggles, spent tiles, winner
screen, localStorage persistence. Use a hardcoded sample board for now — we'll wire
the Anthropic API board generator right after, in the same session if it goes fast.

Don't build the realtime layer (Ably/Upstash) yet — that's Phase 2. But structure the
board and scoring components so Trivia Royale can reuse them later, as the brief notes.

Use the dark game-show design direction from the brief. Give me a local dev URL so I
can test it, and make sure it looks great fullscreen at TV resolution (1080p/4K).
```
