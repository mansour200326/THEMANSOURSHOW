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
