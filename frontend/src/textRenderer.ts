import { splitChords, getChordForPhrase } from './chordManager';

function wrapToken(token: string, tokenElement: HTMLElement, frag: DocumentFragment, nextIndex: number, _chordy: boolean): number {
  for (const char of token) {
    const charNode = document.createElement('char');
    charNode.textContent = char;
    charNode.dataset.val = char;
    charNode.dataset.index = String(nextIndex++);
    charNode.dataset.typed = 'untyped';
    tokenElement.appendChild(charNode);
  }
  frag.appendChild(tokenElement);
  return nextIndex;
}

export function wrapText(text: string): DocumentFragment {
  let nextIndex = Number(sessionStorage.getItem('next_char_index') ?? 0);
  text = text.trim() + ' ';

  const chordStream = splitChords(text);
  const fragment = document.createDocumentFragment();

  for (const { chordy, token } of chordStream) {
    if (chordy) {
      const tokenWrap = document.createElement('ruby');
      nextIndex = wrapToken(token, tokenWrap, fragment, nextIndex, chordy);

      const openingRp = document.createElement('rp');
      openingRp.innerText = '(';

      const rt = document.createElement('rt');
      rt.innerText = getChordForPhrase(token);

      const closingRp = document.createElement('rp');
      closingRp.innerText = ')';

      tokenWrap.append(openingRp, rt, closingRp);
    } else {
      for (const word of token.split(/( )/)) {
        if (word === ' ') {
          const space = document.createElement('char');
          space.textContent = ' ';
          space.dataset.val = ' ';
          space.dataset.index = String(nextIndex++);
          space.dataset.typed = 'untyped';
          fragment.appendChild(space);
        } else {
          const wordWrap = document.createElement('word');
          nextIndex = wrapToken(word, wordWrap, fragment, nextIndex, chordy);
        }
      }
    }
  }

  sessionStorage.setItem('next_char_index', String(nextIndex));
  return fragment;
}
