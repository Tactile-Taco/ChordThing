import './style.css';
import { Typer, setupGlobalKeyboardHandling } from './typer';
import { setupConnectButton } from './device';

// Initialize session storage
sessionStorage.setItem('next_char_index', '0');

// Initialize typer
const typeDisplay = document.getElementById('typer-display') as HTMLDivElement;
const typer = new Typer(typeDisplay, sessionStorage);

// Setup global keyboard handling
setupGlobalKeyboardHandling(typer);

// Setup device connection button
setupConnectButton('chara-connect');

// Setup pause dialog
const pauseDialog = document.getElementById('test-pause-dialog') as HTMLDialogElement;
pauseDialog.addEventListener('focus', (e) => typer.unpause(e));
pauseDialog.addEventListener('click', (e) => typer.unpause(e));
