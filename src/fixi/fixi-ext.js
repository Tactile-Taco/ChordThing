document.addEventListener("fx:swapping", (evt)=>{
  const cfg = evt.detail.cfg;
  if(evt.target.matches("[ext-fx-migrate]") && cfg.swap in cfg.target)
    document.getElementById(evt.target.getAttribute("ext-fx-migrate"))[cfg.swap] = cfg.target[cfg.swap];
    console.log(cfg.target[cfg.swap]);
})

document.addEventListener("fx:init", (evt)=>{
  let elt = evt.target
  if (elt.matches("[ext-fx-oauth]")){
    elt.addEventListener("fx:inited", ()=> {
      function randStr() {
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
      function createSHA256CodeChallenge(codeVerifier) {
        const encoder = new TextEncoder();
        const data = encoder.encode(codeVerifier);
        const hash = await crypto.subtle.digest('SHA-256', data)
        return bytesToBase64Url(hash);
      }
      elt.__fixi.
    })
  }
})
