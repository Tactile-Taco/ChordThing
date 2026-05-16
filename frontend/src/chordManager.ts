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
    // Sort by phrase length descending so longer chords match first
    const sorted = [...chords].sort((a, b) => b.phrase.length - a.phrase.length);
    const escaped = sorted.map((chord) => RegExp.escape(chord.phrase));
    // Match chords preceded by start/space/hyphen and followed by space/hyphen/end
    const chordReg = new RegExp('(^|[\\s-])(' + escaped.join('|') + ')(?=[\\s-]|$)', 'gi');

    let lastIndex = 0;
    for (const match of s.matchAll(chordReg)) {
      // Text before the chord match
      if (match.index > lastIndex) {
        yield { chordy: false, token: s.slice(lastIndex, match.index) };
      }

      // The chord phrase (capture group 2)
      yield { chordy: true, token: match[2] };

      // Update lastIndex to after the full match (including delimiter)
      lastIndex = match.index + match[0].length;
    }

    // Remaining text after last match
    if (lastIndex < s.length) {
      yield { chordy: false, token: s.slice(lastIndex) };
    }
  } else {
    yield { chordy: false, token: s };
  }
}
