export interface Chord {
  chord: string;
  phrase: string;
}

export interface SplitToken {
  chordy: boolean;
  token: string;
}

export function getChords(): Chord[] {
  const chordsJson = localStorage.getItem('chords');
  return chordsJson ? (JSON.parse(chordsJson) as Chord[]) : [];
}

export function getChordForPhrase(phrase: string): string {
  const chords = getChords();
  const normalized = phrase.toLowerCase();
  return chords.find((chord) => chord.phrase.toLowerCase() === normalized)?.chord ?? '';
}

export function saveChords(chords: Chord[]): void {
  localStorage.setItem('chords', JSON.stringify(chords));
  invalidateRegexCache();
  invalidateChordWorker();
}

// --- Module-level cached regex ---

let cachedRegex: RegExp | null = null;
let cachedChordsHash = '';

function buildRegex(chords: Chord[]): RegExp {
  const sorted = [...chords].sort((a, b) => b.phrase.length - a.phrase.length);
  const escaped = sorted.map((chord) => RegExp.escape(chord.phrase));
  return new RegExp('(^|[\\s-])(' + escaped.join('|') + ')(?=[\\s-]|$)', 'gi');
}

function getRegex(): RegExp | null {
  const chords = getChords();
  const hash = JSON.stringify(chords);
  if (cachedRegex && hash === cachedChordsHash) {
    return cachedRegex;
  }
  if (chords.length === 0) {
    cachedRegex = null;
    cachedChordsHash = hash;
    return null;
  }
  cachedRegex = buildRegex(chords);
  cachedChordsHash = hash;
  return cachedRegex;
}

export function invalidateRegexCache(): void {
  cachedRegex = null;
  cachedChordsHash = '';
}

export function* splitChords(s: string): Generator<SplitToken> {
  const chordReg = getRegex();

  if (chordReg) {
    let lastIndex = 0;
    for (const match of s.matchAll(chordReg)) {
      if (match.index > lastIndex) {
        yield { chordy: false, token: s.slice(lastIndex, match.index) };
      }
      yield { chordy: true, token: match[2] };
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < s.length) {
      yield { chordy: false, token: s.slice(lastIndex) };
    }
  } else {
    yield { chordy: false, token: s };
  }
}

// --- Async worker-based splitting ---

let worker: Worker | null = null;
let pendingId = 0;
const pending = new Map<number, (tokens: SplitToken[]) => void>();

function getWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null;
  if (!worker) {
    worker = new Worker(new URL('./chordWorker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent) => {
      if (e.data.type === 'splitResult') {
        const resolve = pending.get(e.data.id);
        if (resolve) {
          pending.delete(e.data.id);
          resolve(e.data.tokens);
        }
      }
    };
    // Send chords + pre-built regex pattern to worker
    const chords = getChords();
    const regex = getRegex();
    worker.postMessage({ type: 'init', chords, regexPattern: regex?.source ?? null, regexFlags: regex?.flags ?? null });
  }
  return worker;
}

/** Invalidate the worker when chords change (call after saveChords) */
export function invalidateChordWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
    pending.clear();
    pendingId = 0;
  }
}

/** Async version of splitChords.
 *  Runs in a Web Worker when available; falls back to sync on the main thread otherwise.
 */
export function splitChordsAsync(text: string): Promise<SplitToken[]> {
  const w = getWorker();
  if (!w) {
    // Worker not available (test env, SSR) — fall back to sync
    return Promise.resolve(Array.from(splitChords(text)));
  }
  return new Promise((resolve) => {
    const id = ++pendingId;
    pending.set(id, resolve);
    w.postMessage({ type: 'split', id, text });
  });
}
