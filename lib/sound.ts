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
  | "fanfare"
  /** The title card: a rise into the moment the letters hit. */
  | "title";

const STORAGE_KEY = "bignight:muted";

/** A cue older than this missed its moment and is better off dropped. */
const STALE_MS = 1500;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
let noise: AudioBuffer | null = null;
let unlocked = false;

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
    master.gain.value = 0.9;
    /*
     * A compressor between the cues and the speakers. It means the gains below
     * can be loud enough to cut through a room without two cues landing
     * together and clipping — which is the usual reason game audio ends up
     * timid.
     */
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.setValueAtTime(-8, ctx.currentTime);
    limiter.knee.setValueAtTime(6, ctx.currentTime);
    limiter.ratio.setValueAtTime(12, ctx.currentTime);
    limiter.attack.setValueAtTime(0.003, ctx.currentTime);
    limiter.release.setValueAtTime(0.2, ctx.currentTime);
    master.connect(limiter).connect(ctx.destination);
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
  const peak = o.gain ?? 0.5;
  const attack = o.attack ?? 0.006;
  /*
   * Attack, hold, then decay. The first version rang down from the instant it
   * peaked, so the note spent nearly all its length almost silent and measured
   * about -32dBFS — inaudible across a room. Holding the peak for the first
   * half is most of the difference.
   */
  const hold = start + attack + (o.duration - attack) * 0.45;
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(peak, start + attack);
  amp.gain.setValueAtTime(peak, hold);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + o.duration);
  osc.connect(amp).connect(master!);
  osc.start(start);
  osc.stop(start + o.duration + 0.02);
}

function hit(
  c: AudioContext,
  { at = 0, duration = 0.18, gain = 0.5, cutoff = 1800 } = {},
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
 * Filtered noise with the filter climbing — the sound of something arriving.
 * Separate from `hit` because that one is a thud and this one is a lift.
 */
function rise(
  c: AudioContext,
  { at = 0, duration = 0.6, gain = 0.4, from = 200, to = 3000 } = {},
) {
  const start = c.currentTime + at;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c);
  src.loop = true;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.setValueAtTime(1.2, start);
  filter.frequency.setValueAtTime(from, start);
  filter.frequency.exponentialRampToValueAtTime(to, start + duration);
  const amp = c.createGain();
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + duration * 0.92);
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
    tone(c, { type: "square", from: 200, to: 150, duration: 0.45, gain: 0.75 });
    tone(c, { type: "square", from: 100, to: 74, duration: 0.45, gain: 0.5 });
  },

  correct(c) {
    tone(c, { type: "triangle", from: 523, duration: 0.13, gain: 0.6 });
    tone(c, { type: "triangle", from: 784, at: 0.1, duration: 0.3, gain: 0.65 });
  },

  wrong(c) {
    tone(c, { type: "sawtooth", from: 240, to: 90, duration: 0.42, gain: 0.5 });
    hit(c, { duration: 0.24, gain: 0.4, cutoff: 700 });
  },

  /** Face-Off's X. Percussive, and it should make people wince. */
  strike(c) {
    hit(c, { duration: 0.32, gain: 0.7, cutoff: 1100 });
    tone(c, { type: "square", from: 160, to: 60, duration: 0.36, gain: 0.6 });
  },

  /** A tile turning over. */
  reveal(c) {
    tone(c, { type: "triangle", from: 700, to: 1400, duration: 0.18, gain: 0.55 });
    tone(c, { type: "sine", from: 1400, at: 0.12, duration: 0.26, gain: 0.35 });
  },

  pop(c) {
    tone(c, { type: "sine", from: 420, to: 880, duration: 0.11, gain: 0.45 });
  },

  /** Quiet on purpose — it plays once a second and mustn't become annoying. */
  tick(c) {
    tone(c, { type: "square", from: 1200, duration: 0.04, gain: 0.22 });
  },

  timeup(c) {
    for (let i = 0; i < 3; i++) {
      tone(c, {
        type: "square",
        from: 880,
        at: i * 0.16,
        duration: 0.14,
        gain: 0.6,
      });
    }
  },

  whoosh(c) {
    hit(c, { duration: 0.36, gain: 0.35, cutoff: 900 });
    tone(c, { type: "sine", from: 180, to: 640, duration: 0.34, gain: 0.3 });
  },

  /**
   * The cold open. The timings here are the animation's, not this file's —
   * IMPACT in components/ShowMark.tsx is 0.6s, so the rise runs for exactly
   * that long and everything loud lands on the frame the letters do.
   */
  title(c) {
    // The letters flying in.
    rise(c, { duration: 0.6, gain: 0.32, from: 180, to: 2600 });
    tone(c, { type: "sine", from: 70, to: 300, duration: 0.6, gain: 0.3, attack: 0.2 });

    // The hit.
    tone(c, { type: "sine", from: 150, to: 42, at: 0.6, duration: 0.9, gain: 0.95 });
    hit(c, { at: 0.6, duration: 0.4, gain: 0.7, cutoff: 600 });
    tone(c, { type: "triangle", from: 784, at: 0.6, duration: 0.35, gain: 0.4 });
    tone(c, { type: "triangle", from: 1175, at: 0.62, duration: 0.4, gain: 0.3 });

    // The sparks, ringing out after it.
    tone(c, { type: "sine", from: 2093, at: 0.72, duration: 0.9, gain: 0.16 });
  },

  /** Somebody won. Worth four notes. */
  fanfare(c) {
    [523, 659, 784, 1047].forEach((hz, i) => {
      tone(c, {
        type: "triangle",
        from: hz,
        at: i * 0.11,
        duration: i === 3 ? 0.8 : 0.22,
        gain: 0.62,
      });
    });
    tone(c, { type: "sine", from: 1568, at: 0.35, duration: 0.9, gain: 0.28 });
  },
};

/**
 * Make the noise. Safe to call from anywhere, including the server.
 *
 * Returns false when nothing was heard — muted, no audio at all, or the
 * browser still holding the context shut because nobody has touched the page
 * yet. Most callers ignore it; the title card uses it to try again.
 */
export function play(cue: Cue): boolean {
  if (muted) return false;
  const c = audio();
  if (!c || !master) return false;

  /*
   * This is why the sound came and went.
   *
   * A browser parks the audio context whenever it feels like it — the tab goes
   * to the background, the machine sleeps, the page sits idle — and a parked
   * context accepts every note and plays none of them. `audio()` asks it to
   * resume, but resume() is asynchronous, so the cue that triggered the wake-up
   * was always scheduled into a context that hadn't woken yet and was simply
   * lost. The first buzz after any interruption never sounded.
   *
   * So a cue that arrives early waits for the context instead of being dropped.
   * The cutoff matters: coming back to a tab that has been closed for ten
   * minutes shouldn't replay everything that happened while you were away.
   */
  if (c.state !== "running") {
    const queuedAt = Date.now();
    void Promise.resolve(c.resume())
      .then(() => {
        if (muted || Date.now() - queuedAt > STALE_MS) return;
        try {
          CUES[cue](c);
        } catch {
          /* see below */
        }
      })
      .catch(() => {
        // Still shut, which means the page hasn't been touched yet. Nothing to
        // be done, and nothing worth breaking a game over.
      });
    return false;
  }

  try {
    CUES[cue](c);
    return true;
  } catch {
    // A cue is never important enough to break a game over.
    return false;
  }
}

/**
 * The title card couldn't play because the page hadn't been touched. Fire it
 * on the first thing the host does instead, so the sound isn't simply lost.
 */
export function primeTitleSound() {
  if (typeof window === "undefined" || muted) return;
  const go = () => {
    window.removeEventListener("pointerdown", go);
    window.removeEventListener("keydown", go);
    const c = audio();
    if (!c) return;
    // resume() is asynchronous, so wait for it rather than firing into a
    // context that is still shut.
    void Promise.resolve(c.resume()).then(() => play("title"));
  };
  window.addEventListener("pointerdown", go, { once: true });
  window.addEventListener("keydown", go, { once: true });
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
  if (typeof window === "undefined" || unlocked) return;
  unlocked = true;

  /*
   * Not `{ once: true }`. Browsers park the context again when a tab is
   * backgrounded, and a TV left on all evening will be backgrounded plenty, so
   * every interaction gets a chance to wake it rather than just the first.
   */
  const wake = () => {
    if (muted) return;
    const c = audio();
    if (c && c.state === "suspended") void c.resume();
  };

  window.addEventListener("pointerdown", wake);
  window.addEventListener("keydown", wake);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) wake();
  });
}

/** Whether the browser is actually letting us make a noise. For diagnostics. */
export const audioState = () => ctx?.state ?? "none";
