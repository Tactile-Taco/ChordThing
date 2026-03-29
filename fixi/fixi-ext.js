document.addEventListener("fx:init", (evt)=>{
  let elt = evt.target
  if (elt.matches("[ext-fx-oauth]")){
    const resource = elt.getAttribute('fx-action');
    const storeKey = `${resource}_apiKey`;
    const code = (new URLSearchParams(location.search)).get("code");
    function send(type, detail, bub){
      elt.dispatchEvent(new CustomEvent("ext-fx-oauth:" + type, {detail, cancelable:true, bubbles:bub !== false, composed:true}))
    }
    if (code){
      history.replaceState({}, '', origin);
      const verifier = sessionStorage.getItem(`${resource}_verifier`);
      sessionStorage.removeItem(`${resource}_verifier`);
      const route = `${resource}/${elt.getAttribute('ext-fx-oauth')}/auth/keys`;
      history.replaceState({}, '', origin);
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
      }).then(resp => {
        return resp.ok? resp.json() : Promise.reject(new Error("HTTP error:"))
      }).then(json => {
        sessionStorage.setItem(storeKey, json.key);
        send("apiKeyReceived", {store:storeKey});
      }).catch(err =>
        send("error", err)
      )
    } else if(!(sessionStorage.getItem(storeKey) && send("validate", evt))) {
      elt.addEventListener("fx:inited", (init_evt)=> {
        function randStr() {
          const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
          const randomValues = new Uint8Array(43);
          crypto.getRandomValues(randomValues);
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
        createSHA256CodeChallenge(verifier).then(chal => {
          elt.addEventListener("fx:config", (evt) => {
            const cfg = evt.detail.cfg;
            cfg.fetch = location.assign.bind(location);
            cfg.action = new URL(`/auth?callback_url=${location}&code_challenge=${chal}&code_challenge_method=S256`, resource).href;
          })
        }).catch(err => send("error", {cfg:evt.detail.cfg, error:err}));
      })
    } else {
      send("apiKeyReceived", {store:storeKey});
    }
  }
})
