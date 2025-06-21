const { invoke } = window.__TAURI__?.core || {
  invoke: () => console.log("Tauri not available (running in a browser)")
};

var typeDisplay = document.getElementById("typer-display");
function get_text() {
  var text = "This is totally randomly generated text I promise you. If you don't believe me that is your problem. Just a bunch of really really randomly generated text that goes on and on and on. Don't worry about it";
  return text;
}

window.addEventListener("keydown", function(e) {
  if (e.code === "Space" && e.target === document.body) {
    e.preventDefault();
  }
});

var typer = document.getElementById("typer");
function firstLetter(node) {
  if (!node) throw "Non-letter leaf descendant reached";
  if (typer != node && !typer.contains(node)) throw "Must search within typer element";

  return (node.className == "letter")? node : firstLetter(node.firstChild);
}

function findNextLetter(letter) {
  do {
    letter = letter.nextElementSibling;
    if (letter) return firstLetter(letter);
    
    letter = letter.parentElement;
  } while (letter != typer);
}

function selectCursor() {
  window.getSelection().setPosition(document.getElementById("cursor").firstChild, 0);
}

function cursorNextLetter() {
  const cursor = document.getElementById("cursor");
  let next = findNextLetter(cursor);
  cursor.removeAttribute('id');
  next.id = "cursor";
  window.getSelection.setPosition(next.firstChild, 0);
}

typer.addEventListener("mousedown", function (e) {
  e.preventDefault();
  e.stopPropagation();
}, { capture: false })

typer.addEventListener("focus", function(e) {
  selectNextLetter();
})

typeDisplay.append(get_text());
