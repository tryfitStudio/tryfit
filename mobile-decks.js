/* Independent button-only controllers; no touch, wheel or drag interception. */
(() => {
 const mobile=matchMedia('(max-width: 949.98px)');
 for(const [selector,name] of [['.courses','課程'],['.stories','學員故事']]){
  const section=document.querySelector(selector),track=section?.querySelector('.grid');
  if(!track)continue;
  const cards=Array.from(track.children);
  track.id=selector==='.courses'?'programs-mobile-track':'stories-mobile-track';
  track.classList.add('mobile-deck-ready');
  const controls=document.createElement('div');controls.className='carousel-controls mobile-deck-controls';
  const prev=document.createElement('button'),next=document.createElement('button'),status=document.createElement('p');
  for(const [button,label,text] of [[prev,`上一個${name}`,'←'],[next,`下一個${name}`,'→']]){
   button.type='button';button.textContent=text;button.setAttribute('aria-label',label);button.setAttribute('aria-controls',track.id);
  }
  status.className='mobile-deck-status';status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');
  controls.append(prev,status,next);track.after(controls);
  let index=0,frame=0;
  function mark(){
   prev.disabled=index===0;next.disabled=index===cards.length-1;
   status.textContent=`${index+1} / ${cards.length}`;
   cards.forEach((card,i)=>{
    card.classList.toggle('is-mobile-current',mobile.matches&&i===index);
    if(mobile.matches&&i!==index){card.setAttribute('aria-hidden','true');card.inert=true;}
    else{card.removeAttribute('aria-hidden');card.inert=false;}
   });
  }
  function go(to,instant=false){
   cancelAnimationFrame(frame);frame=0;index=Math.max(0,Math.min(cards.length-1,to));mark();
   if(!mobile.matches){track.scrollLeft=0;return;}
   const destination=Math.max(0,Math.min(track.scrollWidth-track.clientWidth,cards[index].offsetLeft+cards[index].offsetWidth/2-track.clientWidth/2));
   const start=track.scrollLeft;
   if(instant){track.scrollLeft=destination;return;}
   const began=performance.now();
   function step(now){
    const t=Math.min(1,(now-began)/500),ease=1-Math.pow(1-t,3);
    track.scrollLeft=start+(destination-start)*ease;
    if(t<1)frame=requestAnimationFrame(step);else frame=0;
   }
   frame=requestAnimationFrame(step);
  }
  prev.addEventListener('click',()=>go(index-1));next.addEventListener('click',()=>go(index+1));
  mobile.addEventListener('change',()=>go(index,true));
  const resize=new ResizeObserver(()=>go(index,true));resize.observe(track);
  go(0,true);
 }
})();
