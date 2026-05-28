import { splitChords, splitChordsAsync, getChordForPhrase, type SplitToken } from './chordManager';

function wrapToken(token: string, tokenElement: HTMLElement, nextIndex: number): number {
  for (const char of token) {
    const charNode = document.createElement('char');
    charNode.textContent = char;
    charNode.dataset.val = char;
    charNode.dataset.index = String(nextIndex++);
    charNode.dataset.typed = 'untyped';
    tokenElement.appendChild(charNode);
  }
  return nextIndex;
}

function buildFragmentFromTokens(tokens: SplitToken[]): DocumentFragment {
  let nextIndex = Number(sessionStorage.getItem('next_char_index') ?? 0);
  const fragment = document.createDocumentFragment();

  for (const { chordy, token } of tokens) {
    if (chordy) {
      const ruby = document.createElement('ruby');

      const wordWrap = document.createElement('word');
      nextIndex = wrapToken(token, wordWrap, nextIndex);
      ruby.appendChild(wordWrap);

      const openingRp = document.createElement('rp');
      openingRp.innerText = '(';

      const rt = document.createElement('rt');
      rt.innerText = getChordForPhrase(token);

      const closingRp = document.createElement('rp');
      closingRp.innerText = ')';

      ruby.append(openingRp, rt, closingRp);
      fragment.appendChild(ruby);
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
          nextIndex = wrapToken(word, wordWrap, nextIndex);
          fragment.appendChild(wordWrap);
        }
      }
    }
  }

  sessionStorage.setItem('next_char_index', String(nextIndex));
  return fragment;
}

/** Synchronous version — blocks main thread */
export function wrapText(text: string): DocumentFragment {
  text = text.trim() + ' ';
  const tokens = Array.from(splitChords(text));
  return buildFragmentFromTokens(tokens);
}

/** Asynchronous version — runs splitChords in a Web Worker */
export async function wrapTextAsync(text: string): Promise<DocumentFragment> {
  text = text.trim() + ' ';
  const tokens = await splitChordsAsync(text);
  return buildFragmentFromTokens(tokens);
}
