import './style.css';
import { Typer, setupGlobalKeyboardHandling } from './typer';
import { setupConnectButton } from './device';

// Initialize session storage
if (!sessionStorage.getItem('next_char_index')) {
  sessionStorage.setItem('next_char_index', '0');
}

// Initialize typer
const typeDisplay = document.getElementById('typer-display');
if (!(typeDisplay instanceof HTMLDivElement)) {
  throw new Error('#typer-display element not found or invalid');
}
const typer = new Typer(typeDisplay, sessionStorage);

// Setup global keyboard handling
setupGlobalKeyboardHandling(typer);

// Setup device connection button
setupConnectButton('chara-connect');

// Setup pause dialog
const pauseDialog = document.getElementById('test-pause-dialog');
if (!(pauseDialog instanceof HTMLDialogElement)) {
  throw new Error('#test-pause-dialog element not found or invalid');
}
pauseDialog.addEventListener('focus', (e) => typer.unpause(e));
pauseDialog.addEventListener('click', (e) => typer.unpause(e));
