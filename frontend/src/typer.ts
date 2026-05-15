import { wrapText } from './textRenderer';

const TEST_BUFFER_MIN_LENGTH = 800;

export class Typer {
  private typeDisplay: HTMLDivElement;
  private sessionStorage: Storage;
  private typerElement: HTMLDivElement;
  private typerInited = false;
  #untypedCount = 0;
  private scrollPending = false;
  private refillPending = false;
  private scrollTarget: HTMLElement | null = null;

  /** @test-only Exposed for test verification only */
  getUntypedCount(): number {
    return this.#untypedCount;
  }

  constructor(typeDisplay: HTMLDivElement, sessionStorage: Storage) {
    this.typeDisplay = typeDisplay;
    this.sessionStorage = sessionStorage;
    this.typerElement = document.getElementById('typer') as HTMLDivElement;
    this.setupEventListeners();
  }

  private charAt(index: number): HTMLElement | null {
    return this.typeDisplay.querySelector(`[data-index="${index}"]`);
  }

  private setupEventListeners(): void {
    this.typerElement.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
    }, { capture: false });

    this.typerElement.addEventListener('focus', () => {
      const cursor = document.getElementById('cursor');
      if (cursor) {
        window.getSelection()?.selectAllChildren(cursor);
      }
    });

    this.typerElement.addEventListener('blur', () => {
      const dialog = document.getElementById('test-pause-dialog') as HTMLDialogElement | null;
      dialog?.show();
    });

    this.typerElement.addEventListener('beforeinput', (e) => this.handleInput(e));
  }

  private handleInput(e: InputEvent): void {
    e.preventDefault();
    let reverse = false;

    switch (e.inputType) {
      case 'deleteContentBackward':
        reverse = true;
      // fallthrough intended
      case 'insertText': {
        const cursor = document.getElementById('cursor');
        if (!cursor) break;
        const nextIndex = Number(cursor.dataset.index) + (reverse ? -1 : 1);
        const move = this.charAt(nextIndex);

        if (!move) {
          console.log('reached typer boundary');
          break;
        }

        cursor.removeAttribute('id');
        move.id = 'cursor';
        window.getSelection()?.selectAllChildren(move);

        if (reverse) {
          move.removeAttribute('class');
          move.textContent = move.dataset.val ?? '';
          move.dataset.typed = 'untyped';
          this.#untypedCount++;
        } else {
          const data = e.data ?? '';
          cursor.dataset.typed = data;
          cursor.textContent = cursor.dataset.typed;
          const isCorrect = cursor.dataset.val === cursor.dataset.typed;
          cursor.setAttribute('class', isCorrect ? 'correct' : 'typo');
          this.#untypedCount--;

          if (!this.refillPending) {
            this.refillPending = true;
            requestAnimationFrame(() => {
              this.refillPending = false;
              while (this.#untypedCount < TEST_BUFFER_MIN_LENGTH) {
                this.typeDisplay.append(this.getTextFragment());
              }
            });
          }
        }

        if (!this.scrollPending) {
          this.scrollPending = true;
          requestAnimationFrame(() => {
            this.scrollPending = false;
            this.scrollTarget?.scrollIntoView({ block: 'start' });
            this.scrollTarget = null;
          });
        }
        this.scrollTarget = move;
        break;
      }
      default:
        console.log(`invalid input type used in typer: ${e.inputType}`);
    }
  }

  getElement(): HTMLDivElement {
    return this.typerElement;
  }

  private getTextFragment(): DocumentFragment {
    const text = 'Type this text as fast as you can';
    const fragment = wrapText(text);
    const untypedChars = fragment.querySelectorAll('[data-typed="untyped"]');
    this.#untypedCount += untypedChars.length;
    return fragment;
  }

  init(): void {
    const tgm = 'test_gen_mode';
    if (!this.sessionStorage.getItem(tgm)) {
      this.sessionStorage.setItem(tgm, localStorage.getItem(tgm) ?? 'random');
    }

    this.typeDisplay.append(this.getTextFragment());
    this.typerInited = true;
    const first = this.charAt(0);
    if (!first) {
      throw new Error('Typer init failed: no element with data-index="0" found');
    }
    first.id = 'cursor';
  }

  unpause(e: Event): void {
    if (!this.typerInited) {
      this.init();
    }
    const target = e.currentTarget as HTMLDialogElement;
    target.close();
    this.typerElement.focus();
  }
}

export function setupGlobalKeyboardHandling(typerInstance: Typer): void {
  window.addEventListener('keydown', (e) => {
    if (
      (e.code === 'Space' && e.target === document.body) ||
      (typerInstance.getElement().contains(document.activeElement) && e.code.startsWith('Arrow'))
    ) {
      e.preventDefault();
    }
  });
}
