import { CharaChorderDevice } from "/cc.js"
const { invoke } = window.__TAURI__?.core || {
  invoke: () => console.log("Tauri not available (running in a browser)")
}

const typeDisplay = document.getElementById("typer-display");
function get_text() {
  let text = "This is totally randomly generated text I promise you. If you don't believe me that is your problem. Just a bunch of really really randomly generated text that goes on and on and on. Don't worry about it. JK this is just a testa tat tat tat at s s  s s s s s s s s s s s s s s s s s s s s s  s s s s s s s s s s s s s   s  s s s  s s        sssssssssssssssssssssss s s s s s sy sy s s s sy s sy sy y y s sy  y y sy sy ys sy:";
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

function wrap_text(s, last_index = 0) {
  //TODO:
  // return s and all chords in s:String and return split. You might need to add another param for chord list or make it global...t
  s = split_chords(s);
  const fragment = document.createDocumentFragment()
  
  for (let i in s) {
    const token = s[i]
    let tokenElement = (i % 2)? document.createElement('ruby') : document.createDocumentFragment();
    for (let char of token) {
      const charNode = document.createElement('char');
      charNode.textContent = char;
      charNode.dataset.val = char;
      charNode.dataset.index = last_index++;
      tokenElement.appendChild(charNode);
    }
    fragment.appendChild(tokenElement);
  }
  return fragment; 
}

var typer = document.getElementById("typer");
function charAt(index){
  return typeDisplay.querySelector(`[data-index="${index}"]`);
}

typer.addEventListener("mousedown", function (e) {
  e.preventDefault();
  e.stopPropagation();
  window.getSelection().selectAllChildren(document.getElementById("cursor"));
}, { capture: false });

typer.addEventListener("focus", function(e) {
  window.getSelection().selectAllChildren(document.getElementById("cursor"));
});

window.addEventListener("keydown", function(e) {
  if (e.code === "Space" && e.target === document.body) {
    e.preventDefault();
  } else if (typer.contains(document.activeElement) && e.code.startsWith("Arrow")) {
    e.preventDefault();
  }
});

typer.addEventListener("beforeinput", function(e) {
  e.preventDefault();
  let reverse = false;
  switch (e.inputType) {
    case "deleteContentBackward":
      reverse = true;
    case "insertText":
      const cursor = document.getElementById("cursor");
      const move = charAt(Number(cursor.dataset.index) + (reverse? -1 : 1))
      if (!move) {
        console.log("reached typer boundary");
        break;
      }
      cursor.removeAttribute('id');
      move.id = "cursor";
      window.getSelection().selectAllChildren(move);    

      if (reverse) {
        move.removeAttribute("class");
        move.textContent = move.dataset.val;
        delete move.dataset.typed;
        // if (move.offsetTop < typeDisplay.scrollTop){
        //   move.scrollIntoView();
        // }
      } else {
        cursor.dataset.typed = e.data;
        cursor.textContent = cursor.dataset.typed;
        cursor.setAttribute("class", cursor.dataset.val === cursor.dataset.typed? "correct" : "typo");
        // if (move.offsetTop > typeDisplay.scrollTop + move.offsetHeight * 2) {
        //   typeDisplay.scrollBy(0, move.offsetHeight);
        // }
      }

      move.scrollIntoView(true);

      break;
    default:
      console.log(`invalid input type used in typer: ${e.inputType}`);
  }
});

typeDisplay.append(get_text());
charAt(0).id = "cursor"

document.getElementById('connectButton').addEventListener('click', async () => {
  const device = new CharaChorderDevice();

  try {
    await device.connect();
    console.log("Connected to device");

    const os = await device.getOperatingSystem();
    console.log("Operating System:", os);

    const keymap = await device.getKeymap();
    console.log("Keymap:", keymap);

    const chords = await device.listChords();
    console.log("Chords:", chords);

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await device.disconnect();
    console.log("Disconnected from device");
  }
});
