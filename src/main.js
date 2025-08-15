import { CharaChorderDevice } from "/cc.js"
import { randStr, createSHA256CodeChallenge } from "./auth.js";
const TESTBUFFERMINLENGTH = 800;
const typeDisplay = document.getElementById("typer-display");
sessionStorage.setItem("next_char_index", 0);
function get_text() {
  let text = "This test is totally randomly generated text";
  return wrap_text(text);
}

async function prepAuthLink(oauthElm) {
    const hrefN = oauthElm.getAttributeNode("href");
    const verifier = randStr();
    sessionStorage.setItem('verifier', verifier);
    let chal = await createSHA256CodeChallenge(verifier);
    hrefN.value = new URL(`/auth?callback_url=${window.location.origin}&code_challenge=${chal}&code_challenge_method=S256`,hrefN.value);
}

window.onload = async function() {
  const oauthElm=document.getElementById("oauth");
  const code = (new URLSearchParams(window.location.search)).get("code");
  const apiKey = sessionStorage.getItem('apiKey');
  
  if (code){
    window.history.replaceState({}, '', window.origin);
    const response = await fetch('https://openrouter.ai/api/v1/auth/keys', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: code,
        code_verifier: sessionStorage.getItem('verifier'),
        code_challenge_method: 'S256'
      }),
    });
    const { apiKey } = await response.json();
    sessionStorage.setItem('apiKey', apiKey);
    oauthElm.outerHTML = oauthElm.innerHTML;
    oauthElm.textContent = "Remote LLM";
    document.getElementById('remote-llm').checked = true;
  } else if (apiKey) {
    oauthElm.outerHTML = oauthElm.innerHTML;
    oauthElm.textContent = "Remote LLM";
    document.getElementById('remote-llm').checked = true;
  } else {
    prepAuthLink(oauthElm);
  } 
}

function split_chords(s) {
  //TODO: find all chords in s:String and return split. You might need to add another param for chord list or make it global...
  // return [{isChord:false, str:s}];
  const escaped = JSON.parse(localStorage.getItem("chords")).map(chord => chord.phrase_regex_escaped);
  if (escaped && escaped.length) {
    const chordReg = new RegExp(`\\b(${escaped.join('|')})\\b`, 'i'); //this should really be generated when chords are generated and passed in...
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

document.getElementById('chara-connect').addEventListener('click', async (e) => {
  e.preventDefault();
  const device = new CharaChorderDevice();

  try {
    await device.connect();
    console.log("Connected to device");

    const os = await device.getOperatingSystem();
    localStorage.setItem("os", os);
    console.log("Operating System:", JSON.stringify(os));

    const keymap = await device.getKeymap();
    localStorage.setItem("keymap", JSON.stringify(keymap));
    console.log("Keymap:", keymap);

    const chords = await device.listChords();
    localStorage.setItem("chords", JSON.stringify(chords));
    console.log("Chords:", chords);

    document.getElementById("chara-connect-dialog").close();
    document.getElementById("test-start-dialog").show();
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await device.disconnect();
    console.log("Disconnected from device");
  }
});

let typerInited = false;
function initTyper() {
  const tgm = "test_gen_mode"
  if (!sessionStorage.getItem(tgm)) {
    sessionStorage.setItem(tgm, localStorage.getItem(tgm) ?? "random");
  }

  typeDisplay.append(get_text());
  typerInited = true;
  charAt(0).id = "cursor"
}

function unpause(e) {
  if (!typerInited)
    initTyper();
  e.target.close();
  typer.focus();
}
const pauseDialog = document.getElementById("test-pause-dialog");
pauseDialog.addEventListener("focus", unpause);
pauseDialog.addEventListener("click", unpause);

document.getElementById("typer").addEventListener("blur", function(e) {
  document.getElementById("test-pause-dialog").show();
})
