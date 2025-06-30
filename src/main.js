import { CharaChorderDevice } from "/cc.js"
const { invoke } = window.__TAURI__?.core || {
  invoke: () => console.log("Tauri not available (running in a browser)")
}
const TESTBUFFERMINLENGTH = 300;
const typeDisplay = document.getElementById("typer-display");
function get_text() {
  let text = "This is totally randomly generated text";
  return wrap_text(text);
}

window.onload = function() {
  sessionStorage.setItem("next_char_index", 0);
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

function wrap_token(token, tokenElement, frag, next_index) {
  for (let char of token) {
    const charNode = document.createElement('char');
    charNode.textContent = char;
    charNode.dataset.val = char;
    charNode.dataset.index = next_index++;
    charNode.dataset.typed = "untyped";
    tokenElement.appendChild(charNode);
  }
  frag.appendChild(tokenElement);
  return next_index;
}

function wrap_text(s) {
  //TODO:
  // return s and all chords in s:String and return split. You might need to add another param for chord list or make it global...t
  let next_index = Number(sessionStorage.getItem("next_char_index") ?? 0);
  if (next_index) s = " " + s;
  s = split_chords(s);
  const fragment = document.createDocumentFragment()
  let chord = false;
  for (const token of s) {
    console.log(token);
    if (chord) {
      const tokenWrap = document.createElement('ruby');
      next_index = wrap_token(token, tokenWrap, fragment, next_index);
    } else {
      //I have to do all this because text wrapping is wack in chrome unless I wrap words too
      for (const word of token.split(/( )/)) {
        if(word === ' '){
          const space = document.createElement('char');
          space.textContent = ' ';
          space.dataset.val = ' ';
          space.dataset.index = next_index++;
          space.dataset.typed = 'untyped';
          fragment.appendChild(space);
        } else {
          const wordWrap = document.createElement('word');
          next_index = wrap_token(word, wordWrap, fragment, next_index);
        }
      }
    }
    chord = !chord;
  }
  sessionStorage.setItem("next_char_index", next_index);
  return fragment; 
}

var typer = document.getElementById("typer");
function charAt(index){
  return typeDisplay.querySelector(`[data-index="${index}"]`);
}

typer.addEventListener("mousedown", function (e) {
  e.preventDefault();
  e.stopPropagation();
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
        move.dataset.typed = "untyped";
      } else {
        cursor.dataset.typed = e.data;
        cursor.textContent = cursor.dataset.typed;
        cursor.setAttribute("class", cursor.dataset.val === cursor.dataset.typed? "correct" : "typo");

        while (typeDisplay.querySelectorAll('[data-typed="untyped"]').length < TESTBUFFERMINLENGTH){
          typeDisplay.append(get_text());
        }
      }

      move.scrollIntoView(true);

      break;
    default:
      console.log(`invalid input type used in typer: ${e.inputType}`);
  }
});

document.getElementById('chara-connect-dialog').addEventListener('close', function(e) {
  document.getElementById("test-start-dialog").show();
});

document.getElementById('chara-connect').addEventListener('click', async () => {
  const device = new CharaChorderDevice();

  try {
    await device.connect();
    console.log("Connected to device");

    const os = await device.getOperatingSystem();
    localStorage.setItem("os", os);
    console.log("Operating System:", os);

    const keymap = await device.getKeymap();
    localStorage.setItem("keymap", keymap);
    console.log("Keymap:", keymap);

    const chords = await device.listChords();
    localStorage.setItem("chords", chords);
    console.log("Chords:", chords);

    document.getElementById("chara-connect-dialog").close();
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await device.disconnect();
    console.log("Disconnected from device");
  }
});

function runTyper() {
  const tgm = "test_gen_mode"
  if (!sessionStorage.getItem(tgm)) {
    sessionStorage.setItem(tgm, localStorage.getItem(tgm) ?? "random");
  }

  typeDisplay.append(get_text());
  charAt(0).id = "cursor"
  
}

document.getElementById("test-start-dialog").addEventListener("click", function(e) {
  e.target.close();
  runTyper();
  typer.focus();
});

document.getElementById("test-pause-dialog").addEventListener("focus", function(e) {
  e.target.close();
  typer.focus();
})

document.getElementById("typer").addEventListener("blur", function(e) {
  document.getElementById("test-pause-dialog").show();
})
