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
  return chords.find((chord) => chord.phrase === phrase)?.chord ?? '';
}

export function saveChords(chords: Chord[]): void {
  localStorage.setItem('chords', JSON.stringify(chords));
}

export function* splitChords(s: string): Generator<{ chordy: boolean; token: string }> {
  const chords = getChords();

  if (chords.length > 0) {
    let isChord = false;
    const escaped = chords.map((chord) => RegExp.escape(chord.phrase));
    const chordReg = new RegExp('\\b(' + escaped.join('|') + ')\\b', 'i');
    for (const chunk of s.split(chordReg)) {
      if (chunk.length !== 0) {
        yield { chordy: isChord, token: chunk };
      }
      isChord = !isChord;
    }
  } else {
    yield { chordy: false, token: s };
  }
}
