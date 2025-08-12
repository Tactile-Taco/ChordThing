export function randStr() {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const randomValues = new Uint8Array(43);
  crypto.getRandomValues(randomValues); // Cryptographically secure RNG
  return Array.from(randomValues, (byte) => charset[byte % charset.length]).join('');
}

function bytesToBase64Url(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  bytes.forEach((b) => binary += String.fromCharCode(b));
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function createSHA256CodeChallenge(codeVerifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const hash = await crypto.subtle.digest('SHA-256', data)
  return bytesToBase64Url(hash);
}

// oauthElm.addEventListener("load", async (evt)=>{
//   const oauthElm=document.getElementById("oauth");
//   const code = (new URLSearchParams(document.location.search)).get("code");
//   if (code){
//     sessionStorage.setItem("oauth", code);
//     oauthElm.outerHTML = oauthElm.innerHTML;
//   } else {
//     const hrefN = oauthElm.getAttributeNode("href");
//     const verifier = randStr();
//     let chal = await createSHA256CodeChallenge(verifier);
//     hrefN.value = new URL(`/auth?callbackURL=https://127.0.0.1:3000/&code_challenge=${chal}`,hrefN.value);
//   } 
// })
