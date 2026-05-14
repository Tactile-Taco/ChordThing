// textRenderer.js - Text rendering and DOM manipulation for the typing test

import { splitChords, getChordForPhrase } from "./chordManager.js";

export function wrapToken(token, tokenElement, frag, nextIndex, chordy) {
  for (let char of token) {
    const charNode = document.createElement('char');
    charNode.textContent = char;
    charNode.dataset.val = char;
    charNode.dataset.index = nextIndex++;
    charNode.dataset.typed = "untyped";
    tokenElement.appendChild(charNode);
  }
  frag.appendChild(tokenElement);
  return nextIndex;
}

export function wrapText(text) {
  let nextIndex = Number(sessionStorage.getItem("next_char_index") ?? 0);
  if (nextIndex) text = " " + text;
  
  const chordStream = splitChords(text);
  const fragment = document.createDocumentFragment();
  
  for (const { chordy, token } of chordStream) {
    console.log(token);
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
      // Text wrapping workaround for Chrome
      for (const word of token.split(/( )/)) {
        if (word === ' ') {
          const space = document.createElement('char');
          space.textContent = ' ';
          space.dataset.val = ' ';
          space.dataset.index = nextIndex++;
          space.dataset.typed = 'untyped';
          fragment.appendChild(space);
        } else {
          const wordWrap = document.createElement('word');
          nextIndex = wrapToken(word, wordWrap, fragment, nextIndex, chordy);
        }
      }
    }
  }
  
  sessionStorage.setItem("next_char_index", nextIndex);
  return fragment;
}
