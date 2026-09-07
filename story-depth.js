/* Pointer-driven depth for member stories; touch keeps the static layout. */
(() => {
 const desktop=matchMedia('(hover: hover) and (pointer: fine)');
 const cards=Array.from(document.querySelectorAll('.stories .story'));
 const resets=[];
 cards.forEach(card=>{
  let timer=0,frame=0,rect=null,x=0,y=0;
  function apply(){frame=0;card.style.setProperty('--story-rx',`${y.toFixed(2)}deg`);card.style.setProperty('--story-ry',`${x.toFixed(2)}deg`);}
  function move(event){
   if(!desktop.matches||event.pointerType!=='mouse'||!rect)return;
   x=Math.max(-1,Math.min(1,(event.clientX-rect.left)/rect.width*2-1))*7;
   y=-Math.max(-1,Math.min(1,(event.clientY-rect.top)/rect.height*2-1))*6;
   if(card.classList.contains('is-tilting')&&!frame)frame=requestAnimationFrame(apply);
  }
  function reset(){
   clearTimeout(timer);cancelAnimationFrame(frame);timer=frame=0;rect=null;x=y=0;
   card.classList.remove('is-tilting');card.style.removeProperty('--story-rx');card.style.removeProperty('--story-ry');
  }
  card.addEventListener('pointerenter',event=>{
   if(!desktop.matches||event.pointerType!=='mouse')return;
   reset();rect=card.getBoundingClientRect();move(event);
   timer=setTimeout(()=>{card.classList.add('is-tilting');apply();},250);
  });
  card.addEventListener('pointermove',move);
  card.addEventListener('pointerleave',reset);card.addEventListener('pointercancel',reset);
  resets.push(reset);
 });
 function resetAll(){resets.forEach(reset=>reset());}
 desktop.addEventListener('change',resetAll);
 window.addEventListener('resize',resetAll);window.addEventListener('blur',resetAll);
 window.addEventListener('scroll',resetAll,{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)resetAll();});
})();
