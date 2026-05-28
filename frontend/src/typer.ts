import { wrapText, wrapTextAsync } from './textRenderer';
import { ChordDetector, type ChordDetectedEvent } from './chordDetector';
import { getChords } from './chordManager';

const TEST_BUFFER_MIN_LENGTH = 800;
/** Max fragments to generate in a single refill pass to avoid runaway */
const MAX_FRAGMENTS_PER_REFILL = 25;

export class Typer {
  private typeDisplay: HTMLDivElement;
  private sessionStorage: Storage;
  private typerElement: HTMLDivElement;
  private typerInited = false;
  #untypedCount = 0;
  private scrollPending = false;
  private refillPending = false;
  private scrollTarget: HTMLElement | null = null;
  private chordDetector: ChordDetector;

  /** @test-only Exposed for test verification only */
  getUntypedCount(): number {
    return this.#untypedCount;
  }

  constructor(typeDisplay: HTMLDivElement, sessionStorage: Storage) {
    this.typeDisplay = typeDisplay;
    this.sessionStorage = sessionStorage;
    this.typerElement = document.getElementById('typer') as HTMLDivElement;
    this.chordDetector = new ChordDetector(
      (event: ChordDetectedEvent) => this.handleChordDetected(event),
      new Map(getChords().map((c) => [c.phrase, c.chord]))
    );
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

  private handleChordDetected(event: ChordDetectedEvent): void {
    for (let i = event.startIndex; i <= event.endIndex; i++) {
      const charEl = this.charAt(i);
      if (charEl) {
        charEl.dataset.typed = charEl.dataset.val ?? '';
        charEl.textContent = charEl.dataset.typed;
        charEl.setAttribute('class', 'correct');
      }
    }
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
          const cursorIndex = Number(cursor.dataset.index);
          this.chordDetector.feed(data, cursorIndex);

          cursor.dataset.typed = data;
          cursor.textContent = cursor.dataset.typed;
          const isCorrect = cursor.dataset.val === cursor.dataset.typed;
          cursor.setAttribute('class', isCorrect ? 'correct' : 'typo');
          this.#untypedCount--;

          if (!this.refillPending) {
            this.refillPending = true;
            requestAnimationFrame(() => {
              this.runRefillLoop();
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

  /** Async refill loop — generates fragments off-main-thread and appends when ready */
  private async runRefillLoop(): Promise<void> {
    try {
      let fragmentsGenerated = 0;
      while (
        this.#untypedCount < TEST_BUFFER_MIN_LENGTH &&
        fragmentsGenerated < MAX_FRAGMENTS_PER_REFILL
      ) {
        const fragment = await this.getTextFragment();
        this.typeDisplay.append(fragment);
      }
    } finally {
      this.refillPending = false;
    }
  }

  getElement(): HTMLDivElement {
    return this.typerElement;
  }

  private async getTextFragment(): Promise<DocumentFragment> {
    const text = 'Type this text as fast as you can';
    const fragment = await wrapTextAsync(text);
    const untypedChars = fragment.querySelectorAll('[data-typed="untyped"]');
    this.#untypedCount += untypedChars.length;
    return fragment;
  }

  init(): void {
    const tgm = 'test_gen_mode';
    if (!this.sessionStorage.getItem(tgm)) {
      this.sessionStorage.setItem(tgm, localStorage.getItem(tgm) ?? 'random');
    }

    const fragment = wrapText('Type this text as fast as you can');
    const untypedChars = fragment.querySelectorAll('[data-typed="untyped"]');
    this.#untypedCount += untypedChars.length;
    this.typeDisplay.append(fragment);

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
