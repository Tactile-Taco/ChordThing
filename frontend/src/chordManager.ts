export interface Chord {
  chord: string;
  phrase: string;
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
}

export function* splitChords(s: string): Generator<{ chordy: boolean; token: string }> {
  const chords = getChords();

  if (chords.length > 0) {
    let isChord = false;
    // Sort by phrase length descending so longer chords match first
    const sorted = [...chords].sort((a, b) => b.phrase.length - a.phrase.length);
    const escaped = sorted.map((chord) => RegExp.escape(chord.phrase));
    // Match chords preceded by start/space/hyphen and followed by space/hyphen/end
    const chordReg = new RegExp('(^|[\\s-])(' + escaped.join('|') + ')(?=[\\s-]|$)', 'gi');
    for (const chunk of s.split(chordReg)) {
      if (chunk !== undefined && chunk.length !== 0) {
        yield { chordy: isChord, token: chunk };
      }
      isChord = !isChord;
    }
  } else {
    yield { chordy: false, token: s };
  }
}
