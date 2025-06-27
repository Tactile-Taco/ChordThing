
const { invoke } = window.__TAURI__?.core || {
  invoke: () => console.log("Tauri not available (running in a browser)")
}

var typeDisplay = document.getElementById("typer-display");
function get_text() {
  var text = "This is totally randomly generated text I promise you. If you don't believe me that is your problem. Just a bunch of really really randomly generated text that goes on and on and on. Don't worry about it";
  return wrap_text(text);
}

function regex_escape_chords (chords) {
  //return words.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return chords.map(RegExp.escape)
}
function split_chords(s, escaped_chords) {
  //TODO: find all chords in s:String and return split. You might need to add another param for chord list or make it global...
  // return [{isChord:false, str:s}];
  if (escaped_chords && escaped_chords.length) {
    chordReg = new RegExp(`\\b(${escaped_chords.join('|')})\\b`, 'i'); //this should really be generated when chords are generated and passed in...
    return s.split(chordReg);
  }
  return [s]; 
}
function wrap_text(s) {
  //TODO:
  // return s and all chords in s:String and return spli. You might need to add another param for chord list or make it global...t
  s = split_chords(s);
  const fragment = document.createDocumentFragment()
  
  for (let i in s) {
    const token = s[i]
    let tokenElement = (i % 2)? document.createElement('ruby') : document.createDocumentFragment();
    for (let char of token) {
      const charNode = document.createElement('char');
      charNode.textContent = char;
      tokenElement.appendChild(charNode);
    }
    fragment.appendChild(tokenElement);
  }
  return fragment; 
}

var typer = document.getElementById("typer");
function firstCharacter(node) {
  if (!node) throw "Non-character leaf descendant reached";
  if (typer != node && !typer.contains(node)) throw "Must search within typer element";

  return (node.tagName == "CHAR")? node : firstCharacter(node.firstElementChild);
}

function findNextCharacter(character) {
  do {
    const next = character.nextElementSibling;
    if (next) return firstCharacter(next);
    character = character.parentElement;
  } while (character != typer)
}

function selectCursor() {
  window.getSelection().selectAllChildren(document.getElementById("cursor"));
}

function cursorNextCharacter() {
  const cursor = document.getElementById("cursor");
  let next = findNextCharacter(cursor);
  cursor.removeAttribute('id');
  next.id = "cursor";
  window.getSelection().selectAllChildren(next);
}

typer.addEventListener("mousedown", function (e) {
  e.preventDefault();
  e.stopPropagation();
  selectCursor();
}, { capture: false })

typer.addEventListener("focus", function(e) {
  selectCursor();
})

window.addEventListener("keydown", function(e) {
  if (e.code === "Space" && e.target === document.body) {
    e.preventDefault();
  } else if (typer.contains(document.activeElement)) {
    e.preventDefault();
    cursorNextCharacter();
  }
});

typeDisplay.append(get_text());
firstCharacter(typer).id = "cursor"
