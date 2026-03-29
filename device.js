// device.js - CharaChorder device connection and data retrieval

import { CharaChorderDevice } from "./cc.js";
import { saveChords } from "./chordManager.js";

export async function connectDevice() {
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
    saveChords(chords);
    console.log("Chords:", chords);

    // UI updates
    document.getElementById("chara-connect-dialog")?.close();
    document.getElementById("test-start-dialog")?.show();
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await device.disconnect();
    console.log("Disconnected from device");
  }
}

export function setupConnectButton(buttonId) {
  document.getElementById(buttonId)?.addEventListener('click', async (e) => {
    e.preventDefault();
    await connectDevice();
  });
}
