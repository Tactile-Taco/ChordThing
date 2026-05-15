import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('main', () => {
  beforeEach(() => {
    sessionStorage.clear();
    document.body.innerHTML = '';
    // Clear module cache so main.ts re-runs on each import
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('should initialize when DOM elements exist', async () => {
    const typer = document.createElement('div');
    typer.id = 'typer';
    document.body.appendChild(typer);

    const typeDisplay = document.createElement('div');
    typeDisplay.id = 'typer-display';
    document.body.appendChild(typeDisplay);

    const dialog = document.createElement('dialog');
    dialog.id = 'test-pause-dialog';
    document.body.appendChild(dialog);

    const addEventListenerSpy = vi.spyOn(dialog, 'addEventListener');

    await import('./main');

    expect(sessionStorage.getItem('next_char_index')).toBe('0');
    expect(sessionStorage.getItem('test_gen_mode')).toBeNull();
    expect(addEventListenerSpy).toHaveBeenCalledWith('focus', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
  });

  it('should throw when #typer-display is missing', async () => {
    const typer = document.createElement('div');
    typer.id = 'typer';
    document.body.appendChild(typer);

    const dialog = document.createElement('dialog');
    dialog.id = 'test-pause-dialog';
    document.body.appendChild(dialog);

    await expect(import('./main')).rejects.toThrow('#typer-display element not found or invalid');
  });

  it('should throw when #test-pause-dialog is missing', async () => {
    const typer = document.createElement('div');
    typer.id = 'typer';
    document.body.appendChild(typer);

    const typeDisplay = document.createElement('div');
    typeDisplay.id = 'typer-display';
    document.body.appendChild(typeDisplay);

    await expect(import('./main')).rejects.toThrow('#test-pause-dialog element not found or invalid');
  });
});
