// chordManager.js - Chord-related logic and storage management

export function getChords() {
  const chordsJson = localStorage.getItem("chords");
  return chordsJson ? JSON.parse(chordsJson) : [];
}

export function getChordForPhrase(phrase) {
  const chords = getChords();
  return chords.find(chord => chord.phrase === phrase)?.chord || '';
}

export function saveChords(chords) {
  localStorage.setItem("chords", JSON.stringify(chords));
}

export function* splitChords(s) {
  const chords = getChords();
  const escaped = chords.map(chord => chord.phrase_regex_escaped);
  
  if (escaped && escaped.length) {
    let isChord = false;
    const chordReg = new RegExp(`\\b(${escaped.join('|')})\\b`, 'i');
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
