document.addEventListener("fx:init", (evt)=>{
  let elt = evt.target
  if (elt.matches("[ext-fx-oauth]")){
    const resource = evt.action;
    const code = (new URLSearchParams(window.location.search)).get("code");
    function send(type, detail, bub){
      elt.dispatchEvent(new CustomEvent("ext-fx-oauth:" + type, {detail, cancelable:true, bubbles:bub !== false, composed:true}))
    }
    if (code){
      window.history.replaceState({}, '', window.origin);
      const verifier = sessionStorage.getItem(`${resource}_verifier`);
      sessionStorage.removeItem(`${resource}_verifier`);
      const route = `${resource}/auth/keys`;
      fetch(route, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          code_verifier: verifier,
          code_challenge_method: 'S256'
        })
      }.then(resp =>
        resp.ok? resp.json() : (throw new Error("HTTP error:", {cause: resp}))
      ).then(({ apiKey }) =>
        sessionStorage.setItem(`${resource}_apiKey`, apiKey);
        send("apiKeyReceived", {resource:resource);
      ).catch(err =>
        send("error", err)
      )
    } else if(!(sessionStorage.getItem(`${resource}_apiKey`) && send("validate", evt))) {
      elt.addEventListener("fx:inited", (init_evt)=> {
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
        async function createSHA256CodeChallenge(codeVerifier) {
          const encoder = new TextEncoder();
          const data = encoder.encode(codeVerifier);
          const hash = await crypto.subtle.digest('SHA-256', data)
          return bytesToBase64Url(hash);
        }

        const verifier = randStr();
        sessionStorage.setItem(`${resource}_verifier`, verifier);
        createSHA256CodeChallenge(verifier).then(chal =>
          evt.detail.cfg.fetch = window.location.assign.bind(window.location, new URL(`/auth?callback_url=${window.location.origin}&code_challenge=${chal}&code_challenge_method=S256`, resource).href)
        ).catch(err => send("error", {cfg, err}));
      })
    }
  }
})
