// typer.js - Typing test logic and input handling

import { wrapText } from "./textRenderer.js";

const TEST_BUFFER_MIN_LENGTH = 800;

export class Typer {
  constructor(typeDisplay, sessionStorage) {
    this.typeDisplay = typeDisplay;
    this.sessionStorage = sessionStorage;
    this.typerElement = document.getElementById("typer");
    this.typerInited = false;
    
    this.setupEventListeners();
  }

  charAt(index) {
    return this.typeDisplay.querySelector(`[data-index="${index}"]`);
  }

  setupEventListeners() {
    // Prevent default mouse behavior
    this.typerElement.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
    }, { capture: false });

    // Focus handling
    this.typerElement.addEventListener("focus", () => {
      window.getSelection().selectAllChildren(document.getElementById("cursor"));
    });

    // Blur handling - show pause dialog
    this.typerElement.addEventListener("blur", () => {
      document.getElementById("test-pause-dialog").show();
    });

    // Input handling
    this.typerElement.addEventListener("beforeinput", (e) => this.handleInput(e));
  }

  handleInput(e) {
    e.preventDefault();
    let reverse = false;

    switch (e.inputType) {
      case "deleteContentBackward":
        reverse = true;
      case "insertText":
        const cursor = document.getElementById("cursor");
        const move = this.charAt(Number(cursor.dataset.index) + (reverse ? -1 : 1));
        
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
          cursor.setAttribute("class", cursor.dataset.val === cursor.dataset.typed ? "correct" : "typo");

          // Buffer more text if needed
          while (this.typeDisplay.querySelectorAll('[data-typed="untyped"]').length < TEST_BUFFER_MIN_LENGTH) {
            this.typeDisplay.append(this.getTextFragment());
          }
        }

        move.scrollIntoView(true);
        break;

      default:
        console.log(`invalid input type used in typer: ${e.inputType}`);
    }
  }

  getTextFragment() {
    const text = "This test is totally randomly generated text";
    return wrapText(text, this.sessionStorage);
  }

  init() {
    const tgm = "test_gen_mode";
    if (!this.sessionStorage.getItem(tgm)) {
      this.sessionStorage.setItem(tgm, localStorage.getItem(tgm) ?? "random");
    }

    this.typeDisplay.append(this.getTextFragment());
    this.typerInited = true;
    this.charAt(0).id = "cursor";
  }

  unpause(e) {
    if (!this.typerInited) {
      this.init();
    }
    e.target.close();
    this.typerElement.focus();
  }
}

// Global keyboard shortcuts
export function setupGlobalKeyboardHandling(typerInstance) {
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && e.target === document.body) {
      e.preventDefault();
    } else if (typerInstance.typerElement.contains(document.activeElement) && e.code.startsWith("Arrow")) {
      e.preventDefault();
    }
  });
}
