/* Keyboard access to the desktop reveal without changing mobile controls. */
(() => {
 const desktop=matchMedia('(min-width: 950px)');
 const cards=document.querySelectorAll('.courses .course');
 function sync(){cards.forEach(card=>{if(desktop.matches)card.tabIndex=0;else card.removeAttribute('tabindex');});}
 desktop.addEventListener('change',sync);sync();
})();
