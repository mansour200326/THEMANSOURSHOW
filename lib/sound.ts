"use client";

/**
 * The noise the room makes.
 *
 * Every cue is synthesised with the Web Audio API rather than loaded from a
 * file. Three reasons: nothing to download, so a buzzer never arrives late on
 * the one press that mattered; nothing to license; and nothing to keep in sync
 * with the code. It also means the whole soundtrack is about two hundred lines
 * instead of two megabytes.
 *
 * Browsers won't let a page make noise until someone has interacted with it,
 * so the context is created lazily on the first cue and unlocked by the first
 * click or key anywhere in the room.
 */

export type Cue =
  | "buzz"
  | "correct"
  | "wrong"
  | "strike"
  | "reveal"
  | "pop"
  | "tick"
  | "timeup"
  | "whoosh"
  | "fanfare";

const STORAGE_KEY = "bignight:muted";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
let noise: AudioBuffer | null = null;

/** Read the host's choice once, on the client. */
if (typeof window !== "undefined") {
  try {
    muted = window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    /* private mode */
  }
}

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  // Safari and Chrome both park the context until a gesture has happened.
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** White noise, for the percussive cues. Built once and reused. */
function noiseBuffer(c: AudioContext): AudioBuffer {
  if (!noise) {
    const length = Math.floor(c.sampleRate * 0.4);
    noise = c.createBuffer(1, length, c.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noise;
}

type ToneOptions = {
  type?: OscillatorType;
  /** Start and end frequency, in Hz. Equal values hold a pitch. */
  from: number;
  to?: number;
  /** Seconds from now. */
  at?: number;
  duration: number;
  gain?: number;
  /** A quick fade-in stops the click you get from a hard start. */
  attack?: number;
};

function tone(c: AudioContext, o: ToneOptions) {
  const start = c.currentTime + (o.at ?? 0);
  const osc = c.createOscillator();
  const amp = c.createGain();
  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(o.from, start);
  if (o.to && o.to !== o.from) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(1, o.to),
      start + o.duration,
    );
  }
  const peak = o.gain ?? 0.3;
  const attack = o.attack ?? 0.006;
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(peak, start + attack);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + o.duration);
  osc.connect(amp).connect(master!);
  osc.start(start);
  osc.stop(start + o.duration + 0.02);
}

function hit(
  c: AudioContext,
  { at = 0, duration = 0.18, gain = 0.25, cutoff = 1800 } = {},
) {
  const start = c.currentTime + at;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c);
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(cutoff, start);
  const amp = c.createGain();
  amp.gain.setValueAtTime(gain, start);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  src.connect(filter).connect(amp).connect(master!);
  src.start(start);
  src.stop(start + duration + 0.02);
}

/**
 * Each cue is written to be recognisable from across a room with people
 * talking over it — short, with its meaning in the pitch direction. Up is
 * good, down is bad, flat and harsh is the buzzer.
 */
const CUES: Record<Cue, (c: AudioContext) => void> = {
  /** The one that has to cut through everything. */
  buzz(c) {
    tone(c, { type: "square", from: 200, to: 150, duration: 0.42, gain: 0.3 });
    tone(c, { type: "square", from: 100, to: 74, duration: 0.42, gain: 0.22 });
  },

  correct(c) {
    tone(c, { type: "triangle", from: 523, duration: 0.1, gain: 0.28 });
    tone(c, { type: "triangle", from: 784, at: 0.09, duration: 0.22, gain: 0.28 });
  },

  wrong(c) {
    tone(c, { type: "sawtooth", from: 240, to: 90, duration: 0.4, gain: 0.22 });
    hit(c, { duration: 0.22, gain: 0.16, cutoff: 700 });
  },

  /** Face-Off's X. Percussive, and it should make people wince. */
  strike(c) {
    hit(c, { duration: 0.3, gain: 0.34, cutoff: 1100 });
    tone(c, { type: "square", from: 160, to: 60, duration: 0.34, gain: 0.26 });
  },

  /** A tile turning over. */
  reveal(c) {
    tone(c, { type: "triangle", from: 700, to: 1400, duration: 0.16, gain: 0.24 });
    tone(c, { type: "sine", from: 1400, at: 0.1, duration: 0.22, gain: 0.14 });
  },

  pop(c) {
    tone(c, { type: "sine", from: 420, to: 880, duration: 0.09, gain: 0.2 });
  },

  /** Quiet on purpose — it plays once a second and mustn't become annoying. */
  tick(c) {
    tone(c, { type: "square", from: 1200, duration: 0.03, gain: 0.07 });
  },

  timeup(c) {
    for (let i = 0; i < 3; i++) {
      tone(c, {
        type: "square",
        from: 880,
        at: i * 0.16,
        duration: 0.12,
        gain: 0.26,
      });
    }
  },

  whoosh(c) {
    hit(c, { duration: 0.36, gain: 0.16, cutoff: 900 });
    tone(c, { type: "sine", from: 180, to: 640, duration: 0.34, gain: 0.12 });
  },

  /** Somebody won. Worth four notes. */
  fanfare(c) {
    [523, 659, 784, 1047].forEach((hz, i) => {
      tone(c, {
        type: "triangle",
        from: hz,
        at: i * 0.11,
        duration: i === 3 ? 0.7 : 0.2,
        gain: 0.26,
      });
    });
    tone(c, { type: "sine", from: 1568, at: 0.33, duration: 0.8, gain: 0.1 });
  },
};

/** Make the noise. Safe to call from anywhere, including the server. */
export function play(cue: Cue) {
  if (muted) return;
  const c = audio();
  if (!c || !master) return;
  try {
    CUES[cue](c);
  } catch {
    // A cue is never important enough to break a game over.
  }
}

export const isMuted = () => muted;

export function setMuted(next: boolean) {
  muted = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  } catch {
    /* private mode */
  }
  if (!next) audio();
}

/**
 * Browsers keep the context suspended until the page has been interacted with.
 * The host clicking "Host a game" is usually the unlock, but this catches every
 * other route in as well.
 */
export function unlockAudio() {
  if (typeof window === "undefined") return;
  const wake = () => {
    if (!muted) audio();
  };
  window.addEventListener("pointerdown", wake, { once: true });
  window.addEventListener("keydown", wake, { once: true });
}
