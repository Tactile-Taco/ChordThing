import { CharaChorderDevice } from './cc';
import { saveChords } from './chordManager';

export async function connectDevice(): Promise<void> {
  const device = new CharaChorderDevice();

  try {
    await device.connect();
    console.log('Connected to device');

    const os = await device.getOperatingSystem();
    localStorage.setItem('os', os);
    console.log('Operating System:', JSON.stringify(os));

    const keymap = await device.getKeymap();
    localStorage.setItem('keymap', JSON.stringify(keymap));
    console.log('Keymap:', keymap);

    const chords = await device.listChords();
    saveChords(chords);
    console.log('Chords:', chords);

    document.getElementById('chara-connect-dialog')?.closest('dialog')?.close();
    (document.getElementById('test-start-dialog') as HTMLDialogElement | null)?.show();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await device.disconnect();
    console.log('Disconnected from device');
  }
}

export function setupConnectButton(buttonId: string): void {
  document.getElementById(buttonId)?.addEventListener('click', async (e) => {
    e.preventDefault();
    await connectDevice();
  });
}
