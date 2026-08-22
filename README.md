# Big Night

Party games for the room. The TV is the stage, your phone is the controller —
no downloads, no accounts.

## Running it

```bash
npm install
npm run dev
```

Open `http://localhost:3000` on the TV. Phones join at `<your-lan-ip>:3000/play`
with the 4-letter room code shown on screen.

## Configuration

Copy the key into `.env.local` (gitignored):

```
ANTHROPIC_API_KEY=sk-ant-...
```

Without it the AI generators are disabled and every game falls back to its
bundled content pack.

### Choosing models

Both are optional; the defaults below are what runs if they're unset. Change
them in the environment and restart — no code change needed.

| Variable | Default | Used for |
|---|---|---|
| `BIGNIGHT_MODEL_BOARD` | `claude-sonnet-5` | Big Board boards, Face-Off surveys — structured output that has to be accurate |
| `BIGNIGHT_MODEL_PACKS` | `claude-haiku-4-5` | Category ideas and rapid-fire prompt lists — short, cheap, high volume |

The old `HUDDLE_MODEL_*` names still work as a fallback, so a deploy that was
configured before the rebrand keeps its settings.

One caveat if you swap these: `output_config.effort` is rejected by some models
(Haiku 4.5 and Sonnet 4.5 among them). The code detects those by name and omits
the parameter, so pointing either variable at one of them still works.

## The games

All fourteen from the brief, plus Categories and Three in Five. Each belongs to
a family, and the family decides the colour that lights the screen.

| Game | Family | Devices |
|---|---|---|
| Big Board | Trivia | TV only |
| Trivia Royale | Trivia | TV + phones |
| Bluff Trivia | Trivia | TV + phones |
| Last One Standing | Trivia | TV + phones |
| Impostor | Deception | TV + phones |
| Code Grid | Deception | TV + phones |
| Most Likely To | Social | TV + phones |
| Who Said It | Social | TV + phones |
| Groupthink | Social | TV + phones |
| Face-Off | Social | TV only |
| Categories | Word | TV only |
| Three in Five | Word | TV only |
| Emoji Riddles | Word | TV + phones |
| Timeline | Word | TV + phones |
| Dial It In | Word | TV + phones |
| Sketch & Guess | Word | TV + phones |

Four TV-only games run in the host's browser with no room. The rest start from
a lobby; `+ Practice bots` fills it so one person can walk through any of them
alone.

### Engines

Twelve phone games run on four reducers, which is why the later ones were cheap:

- `roundEngine` — prompt, everyone writes, everyone votes, reveal.
  *Most Likely To, Who Said It, Bluff Trivia, Groupthink.*
- `buzzEngine` — a race, with the server deciding who was first.
  *Trivia Royale, Emoji Riddles.*
- `liveEngine` — everyone answers at once and the score is a calculation.
  *Last One Standing, Timeline, Dial It In.*
- One each for the three that don't fit: `impostor`, `codegrid`, `sketch`.

### Secrets

Three games have something the room mustn't see: who the impostor is, which
words are whose, and what's being drawn. Every client holds an SSE connection
that carries the whole room, so hiding those in the UI would be no protection —
the payload is one devtools tab away.

`lib/room/redact.ts` strips them on the server, per recipient, before anything
is written to the wire. The TV is a viewer too, and the strictest one: it's the
screen everybody can see, so it gets less than the phones do.

## Colour

"Midnight & Coral", defined once in `tailwind.config.ts` and `app/globals.css`.

| Token | Hex | Where |
|---|---|---|
| Midnight | `#101A3C` | Page background. Never pure black. |
| Dusk | `#1C2A55` | Cards, panels, tiles. |
| Moonlight | `#F4F2EC` | Text. Never pure white. |
| Coral Flare | `#FF6B57` | Brand only: logo, primary buttons, winners. |

Coral is never assigned to a game. Everything a game lights up uses `accent`,
which is a CSS variable — `--accent-rgb`, set by a `.g-trivia` / `.g-deception` /
`.g-social` / `.g-word` class on the screen. That's why the components say
`text-accent` rather than naming a colour: swapping a game's family is a
one-line change in `lib/games/families.ts`.

## Naming

No game in the public UI carries a trademarked name. `Big Board`, `Face-Off`,
`Three in Five`, `Who Said It`, `Groupthink` and `Dial It In` are the launch
names. This is a self-check, not legal clearance — the brand and the final game
names still need an IP lawyer's sign-off for the UAE/GCC.

## Deploying

Room state lives in the server's memory, so this needs a host that keeps one
process running — Railway, Render or Fly. It will **not** work correctly on
serverless platforms, where each request may hit a different instance with no
shared memory.
