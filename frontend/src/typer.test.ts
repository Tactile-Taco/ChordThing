import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Typer, setupGlobalKeyboardHandling } from './typer';

function createMinimalDom() {
  const typer = document.createElement('div');
  typer.id = 'typer';
  typer.setAttribute('tabindex', '0');
  document.body.appendChild(typer);

  const typeDisplay = document.createElement('div');
  typeDisplay.id = 'typer-display';
  document.body.appendChild(typeDisplay);

  const dialog = document.createElement('dialog');
  dialog.id = 'test-pause-dialog';
  document.body.appendChild(dialog);

  return { typer, typeDisplay, dialog };
}

function dispatchBeforeInput(target: HTMLDivElement, inputType: string, data?: string) {
  const event = new InputEvent('beforeinput', {
    inputType,
    data,
    cancelable: true,
    bubbles: true,
  });
  target.dispatchEvent(event);
  return event;
}

describe('Typer', () => {
  let typerInstance: Typer;
  let typeDisplay: HTMLDivElement;
  let typerElement: HTMLDivElement;
  let dialog: HTMLDialogElement;

  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem('next_char_index', '0');
    const dom = createMinimalDom();
    typeDisplay = dom.typeDisplay;
    typerElement = dom.typer;
    dialog = dom.dialog;
    typerInstance = new Typer(typeDisplay, sessionStorage);
    typerInstance.init();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('untypedCount accuracy', () => {
    it('should maintain an internal counter that matches DOM query count after insertions', () => {
      const cursor = document.getElementById('cursor') as HTMLElement;
      expect(cursor).not.toBeNull();
      const initialUntyped = typeDisplay.querySelectorAll('[data-typed="untyped"]').length;
      expect(initialUntyped).toBeGreaterThan(0);

      dispatchBeforeInput(typerElement, 'insertText', 'T');

      const afterUntyped = typeDisplay.querySelectorAll('[data-typed="untyped"]').length;
      expect(afterUntyped).toBe(initialUntyped - 1);
    });

    it('should maintain an internal counter that matches DOM query count after deletions', () => {
      dispatchBeforeInput(typerElement, 'insertText', 'T');
      const afterInsert = typeDisplay.querySelectorAll('[data-typed="untyped"]').length;

      dispatchBeforeInput(typerElement, 'deleteContentBackward');
      const afterDelete = typeDisplay.querySelectorAll('[data-typed="untyped"]').length;
      expect(afterDelete).toBe(afterInsert + 1);
    });

    it('should not drift after multiple insert/delete cycles', () => {
      for (let i = 0; i < 5; i++) {
        dispatchBeforeInput(typerElement, 'insertText', 'a');
      }
      for (let i = 0; i < 3; i++) {
        dispatchBeforeInput(typerElement, 'deleteContentBackward');
      }
      for (let i = 0; i < 2; i++) {
        dispatchBeforeInput(typerElement, 'insertText', 'b');
      }

      const domCount = typeDisplay.querySelectorAll('[data-typed="untyped"]').length;
      const expectedUntyped = domCount;
      expect(expectedUntyped).toBe(domCount);
    });
  });

  describe('buffer refill', () => {
    it('should not append fragments synchronously inside the beforeinput handler', () => {
      const appendSpy = vi.spyOn(typeDisplay, 'append');
      dispatchBeforeInput(typerElement, 'insertText', 'a');
      const callsDuringHandler = appendSpy.mock.calls.length;

      expect(callsDuringHandler).toBe(0);
    });

    it('should defer buffer refill to a requestAnimationFrame callback', async () => {
      const appendSpy = vi.spyOn(typeDisplay, 'append');
      dispatchBeforeInput(typerElement, 'insertText', 'a');
      expect(appendSpy).not.toHaveBeenCalled();

      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      expect(appendSpy).toHaveBeenCalled();
    });
  });

  describe('scrollIntoView throttling', () => {
    it('should call scrollIntoView at most once per animation frame for multiple inputs', async () => {
      const cursor = document.getElementById('cursor') as HTMLElement;
      const scrollSpy = vi.spyOn(cursor, 'scrollIntoView');

      dispatchBeforeInput(typerElement, 'insertText', 'a');
      dispatchBeforeInput(typerElement, 'insertText', 'b');
      dispatchBeforeInput(typerElement, 'insertText', 'c');

      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      expect(scrollSpy.mock.calls.length).toBeLessThanOrEqual(1);
    });

    it('should keep the cursor within scroll container bounds after the frame', async () => {
      typeDisplay.style.overflow = 'auto';
      typeDisplay.style.maxHeight = '100px';

      for (let i = 0; i < 10; i++) {
        dispatchBeforeInput(typerElement, 'insertText', 'x');
      }

      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      const cursor = document.getElementById('cursor') as HTMLElement;
      const containerRect = typeDisplay.getBoundingClientRect();
      const cursorRect = cursor.getBoundingClientRect();

      expect(cursorRect.top).toBeGreaterThanOrEqual(containerRect.top);
      expect(cursorRect.bottom).toBeLessThanOrEqual(containerRect.bottom + 1);
    });
  });

  describe('CSS transition scope', () => {
    it('should not use the all keyword in char element transition declarations', () => {
      const char = typeDisplay.querySelector('char') as HTMLElement;
      if (!char) {
        expect.fail('No char element found in typeDisplay');
      }
      const computed = window.getComputedStyle(char);
      const transition = computed.transition || computed.webkitTransition || '';
      expect(transition).not.toMatch(/\ball\b/i);
    });

    it('should transition only color and background-color on char elements', () => {
      const char = typeDisplay.querySelector('char') as HTMLElement;
      if (!char) {
        expect.fail('No char element found in typeDisplay');
      }
      const computed = window.getComputedStyle(char);
      const transition = computed.transition || computed.webkitTransition || '';
      const allowed = ['color', 'background-color'];
      const parts = transition.split(',').map((s) => s.trim().split(' ')[0]).filter(Boolean);
      for (const part of parts) {
        if (part === 'all') {
          expect.fail('Transition uses "all" keyword');
        }
        expect(allowed).toContain(part);
      }
    });
  });

  describe('public behavior preservation', () => {
    it('should advance cursor on insertText', () => {
      const cursorBefore = document.getElementById('cursor') as HTMLElement;
      const indexBefore = cursorBefore.dataset.index;
      dispatchBeforeInput(typerElement, 'insertText', 'a');
      const cursorAfter = document.getElementById('cursor') as HTMLElement;
      expect(cursorAfter.dataset.index).not.toBe(indexBefore);
      expect(Number(cursorAfter.dataset.index)).toBe(Number(indexBefore) + 1);
    });

    it('should retreat cursor on deleteContentBackward', () => {
      dispatchBeforeInput(typerElement, 'insertText', 'a');
      const cursorAfterInsert = document.getElementById('cursor') as HTMLElement;
      const indexAfterInsert = cursorAfterInsert.dataset.index;

      dispatchBeforeInput(typerElement, 'deleteContentBackward');
      const cursorAfterDelete = document.getElementById('cursor') as HTMLElement;
      expect(Number(cursorAfterDelete.dataset.index)).toBe(Number(indexAfterInsert) - 1);
    });

    it('should apply correct class when typed character matches dataset.val', () => {
      const firstChar = typeDisplay.querySelector('[data-index="0"]') as HTMLElement;
      const expectedChar = firstChar.dataset.val ?? '';
      dispatchBeforeInput(typerElement, 'insertText', expectedChar);
      expect(firstChar.classList.contains('correct')).toBe(true);
      expect(firstChar.classList.contains('typo')).toBe(false);
    });

    it('should apply typo class when typed character does not match dataset.val', () => {
      const firstChar = typeDisplay.querySelector('[data-index="0"]') as HTMLElement;
      const wrongChar = firstChar.dataset.val === 'z' ? 'a' : 'z';
      dispatchBeforeInput(typerElement, 'insertText', wrongChar);
      expect(firstChar.classList.contains('typo')).toBe(true);
      expect(firstChar.classList.contains('correct')).toBe(false);
    });

    it('should update data-typed attribute to the typed character', () => {
      const firstChar = typeDisplay.querySelector('[data-index="0"]') as HTMLElement;
      dispatchBeforeInput(typerElement, 'insertText', 'x');
      expect(firstChar.dataset.typed).toBe('x');
    });

    it('should reset data-typed to untyped and restore textContent on backspace', () => {
      const firstChar = typeDisplay.querySelector('[data-index="0"]') as HTMLElement;
      const originalVal = firstChar.dataset.val ?? '';
      dispatchBeforeInput(typerElement, 'insertText', 'x');
      expect(firstChar.dataset.typed).toBe('x');

      dispatchBeforeInput(typerElement, 'deleteContentBackward');
      expect(firstChar.dataset.typed).toBe('untyped');
      expect(firstChar.textContent).toBe(originalVal);
    });

    it('should show pause dialog on blur', () => {
      const showSpy = vi.spyOn(dialog, 'show');
      typerElement.dispatchEvent(new FocusEvent('blur'));
      expect(showSpy).toHaveBeenCalled();
    });

    it('should focus typer element when unpause is called', () => {
      const focusSpy = vi.spyOn(typerElement, 'focus');
      const event = new FocusEvent('focus', { bubbles: true });
      Object.defineProperty(event, 'currentTarget', { value: dialog, enumerable: true });
      typerInstance.unpause(event);
      expect(focusSpy).toHaveBeenCalled();
    });

    it('should close dialog when unpause is called', () => {
      const closeSpy = vi.spyOn(dialog, 'close');
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'currentTarget', { value: dialog, enumerable: true });
      typerInstance.unpause(event);
      expect(closeSpy).toHaveBeenCalled();
    });
  });

  describe('setupGlobalKeyboardHandling', () => {
    it('should prevent default for Space when target is document.body', () => {
      setupGlobalKeyboardHandling(typerInstance);
      const event = new KeyboardEvent('keydown', { code: 'Space', bubbles: true });
      Object.defineProperty(event, 'target', { value: document.body, enumerable: true });
      const preventSpy = vi.spyOn(event, 'preventDefault');
      window.dispatchEvent(event);
      expect(preventSpy).toHaveBeenCalled();
    });

    it('should prevent default for Arrow keys when typer has focus', () => {
      typerElement.focus();
      setupGlobalKeyboardHandling(typerInstance);
      const event = new KeyboardEvent('keydown', { code: 'ArrowLeft', bubbles: true });
      const preventSpy = vi.spyOn(event, 'preventDefault');
      window.dispatchEvent(event);
      expect(preventSpy).toHaveBeenCalled();
    });
  });
});
