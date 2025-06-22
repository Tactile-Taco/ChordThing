const { invoke } = window.__TAURI__?.core || {
  invoke: () => console.log("Tauri not available (running in a browser)")
};

var typeDisplay = document.getElementById("typer-display");
function get_text() {
  var text = "This is totally randomly generated text I promise you. If you don't believe me that is your problem. Just a bunch of really really randomly generated text that goes on and on and on. Don't worry about it";
  return text;
}

function split_chords(s) {
  //TODO: find all chords in s:String and return split. You might need to add another param for chord list or make it global...
  return [s];
}
function wrap_text(s) {
  //TODO:
  // return s;nd all chords in s:String and return spli. You might need to add another param for chord list or make it global...t
  return s; 
}

var typer = document.getElementById("typer");
function firstCharacter(node) {
  if (!node) throw "Non-character leaf descendant reached";
  if (typer != node && !typer.contains(node)) throw "Must search within typer element";

  return (node.className == "character")? node : firstCharacter(node.firstChild);
}

function findNextCharacter(character) {
  do {
    character = character.nextElementSibling;
    if (character) return firstCharacter(character);
    
    character = character.parentElement;
  } while (character != typer);
}

function selectCursor() {
  window.getSelection().setPosition(document.getElementById("cursor").firstChild, 0);
}

function cursorNextCharacter() {
  const cursor = document.getElementById("cursor");
  let next = findNextCharacter(cursor);
  cursor.removeAttribute('id');
  next.id = "cursor";
  window.getSelection.setPosition(next.firstChild, 0);
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
  } else if (typer.contains(document.activeElement())) {
    cursorNextCharacter();
  }
});

typeDisplay.append(get_text());
