document.addEventListener("fx:init", (evt)=>{
  if (evt.target.matches("[ext-fx-relocate]")){
    var relocationId = evt.target.getAttribute("ext-fx-relocate");
    evt.target.addEventListener("fx:after", (afterEvt)=>{
      let curSwap=cfg.swap;
      evt.detail.cfg.swap = (cfg)=>{
        let shiftElm;
        if(curSwap in cfg.target){
          shiftElm = cfg.target[curSwap];
        }
        else{
          shiftElm = cfg.target.outerHTML;
          if(curSwap in )
        }
          curSwap(cfg);
        else if(/(before|after)(begin|end)/.test(curSwap))
          cfg.target.insertAdjacentHTML()
        document.getElementById(relocationId).replaceWith(shiftElm);
      }
    })
  }
})
