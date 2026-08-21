# Huddle

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
| `HUDDLE_MODEL_BOARD` | `claude-sonnet-5` | Jeopardy boards, Feud surveys — structured output that has to be accurate |
| `HUDDLE_MODEL_PACKS` | `claude-haiku-4-5` | Category ideas and rapid-fire prompt lists — short, cheap, high volume |

One caveat if you swap these: `output_config.effort` is rejected by some models
(Haiku 4.5 and Sonnet 4.5 among them). The code detects those by name and omits
the parameter, so pointing either variable at one of them still works.

## The games

| Segment | Devices |
|---|---|
| Team Jeopardy | TV only |
| The Feud | TV only |
| Most Likely To | TV + phones |
| Guess Who Said It | TV + phones |
| Bluff Trivia | TV + phones |
| Herd Mentality | TV + phones |

## Deploying

Room state lives in the server's memory, so this needs a host that keeps one
process running — Railway, Render or Fly. It will **not** work correctly on
serverless platforms, where each request may hit a different instance with no
shared memory.
