export function parseChordActions(hexString: string): number[] {
  const bigInt = BigInt(`0x${hexString}`);
  const actions: number[] = [];
  for (let i = 0; i < 12; i++) {
    const action = Number((bigInt >> BigInt(10 * i)) & BigInt(0x3ff));
    if (action !== 0) {
      actions.push(action);
    }
  }
  return actions;
}

export function stringifyChordActions(actions: number[]): string {
  let bigInt = BigInt(0);
  for (let i = 0; i < actions.length && i < 12; i++) {
    const action = BigInt(actions[i]);
    bigInt |= action << BigInt(10 * i);
  }
  return bigInt.toString(16).toUpperCase().padStart(32, '0');
}

export function parsePhraseHex(hexString: string): string {
  const pairs = hexString.match(/.{2}/g);
  return pairs ? pairs.map((hex) => String.fromCharCode(parseInt(hex, 16))).join('') : '';
}

export function stringifyPhrase(phrase: string): string {
  return phrase
    .split('')
    .map((char) => char.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0'))
    .join('');
}
