const toggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('#main-nav');
function setMenu(open) {
  toggle.setAttribute('aria-expanded', String(open));
  menu.dataset.open = String(open);
  toggle.setAttribute('aria-label', open ? '關閉選單' : '開啟選單');
}
toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
menu.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {setMenu(false);toggle.focus();} });
document.addEventListener('click', event => {if (!event.target.closest('.nav')) setMenu(false);});
window.matchMedia('(min-width: 1000px)').addEventListener('change', () => setMenu(false));

// One animation controller owns scrolling; native snap must stay disabled.
const track = document.querySelector('#coach-track');
const cards = [...track.querySelectorAll('.coach')];
const previous = document.querySelector('.carousel-prev');
const next = document.querySelector('.carousel-next');
const status = document.querySelector('.carousel-status');
const buttonOnly = window.matchMedia('(max-width: 949px), (pointer: coarse)');
let current = 2, requested = 2, position = 0, target = 0;
let centers = [], limit = 0, frame = 0, lastTime = 0;
let dragging = null, wheelTimer, resizeTimer;
const clamp = value => Math.max(0, Math.min(limit, value));
function measure() {
  limit = track.scrollWidth - track.clientWidth;
  centers = cards.map(card => clamp(card.offsetLeft + card.offsetWidth / 2 - track.clientWidth / 2));
}
function nearest(value) {
  return centers.reduce((best, center, i) => Math.abs(center - value) < Math.abs(centers[best] - value) ? i : best, 0);
}
function paintSelection() {
  const index = nearest(position);
  if (index !== current) {
    cards[current].classList.remove('is-current');
    current = index;
    cards[current].classList.add('is-current');
  }
  previous.disabled = requested === 0;
  next.disabled = requested === cards.length - 1;
}
function announce() {
  status.textContent = `${current + 1} / ${cards.length} · ${cards[current].querySelector('h3').textContent}`;
}
function tick(now) {
  const dt = Math.min(40, now - lastTime || 16.7);
  lastTime = now;
  // Time-based damping behaves consistently on 60/120 Hz screens.
  position += (target - position) * (1 - Math.exp(-dt / (dragging ? 38 : 95)));
  if (Math.abs(target - position) < .25) position = target;
  track.scrollLeft = position;
  paintSelection();
  if (position !== target) frame = requestAnimationFrame(tick);
  else { frame = 0; announce(); }
}
function moveTo(value, instant = false) {
  target = clamp(value);
  if (instant) {
    cancelAnimationFrame(frame); frame = 0;
    position = target; track.scrollLeft = position; paintSelection(); announce();
  } else if (!frame) { lastTime = performance.now(); frame = requestAnimationFrame(tick); }
}
function goTo(index, instant = false) {
  clearTimeout(wheelTimer);
  requested = Math.max(0, Math.min(cards.length - 1, index));
  moveTo(centers[requested], instant);
}
previous.addEventListener('click', () => goTo(requested - 1));
next.addEventListener('click', () => goTo(requested + 1));
track.addEventListener('keydown', event => {
  if (buttonOnly.matches) return;
  const destinations = {ArrowLeft: requested - 1, ArrowRight: requested + 1, Home: 0, End: cards.length - 1};
  if (!(event.key in destinations)) return;
  event.preventDefault();
  goTo(destinations[event.key]);
  cards[requested].focus({preventScroll:true});
});
track.addEventListener('focusin', event => {
  if (buttonOnly.matches || dragging) return;
  const index = cards.indexOf(event.target.closest('.coach'));
  if (index >= 0) goTo(index);
});
track.addEventListener('pointerdown', event => {
  if (buttonOnly.matches || event.pointerType !== 'mouse' || event.button !== 0) return;
  event.preventDefault();
  clearTimeout(wheelTimer);
  cancelAnimationFrame(frame); frame = 0;
  position = track.scrollLeft; target = position;
  dragging = {id:event.pointerId, x:event.clientX, left:position, lastX:event.clientX, time:performance.now(), velocity:0};
  track.setPointerCapture(event.pointerId);
  track.classList.add('is-dragging');
});
track.addEventListener('pointermove', event => {
  if (!dragging) return;
  const now = performance.now();
  const dt = Math.max(8, now - dragging.time);
  const speed = (dragging.lastX - event.clientX) / dt;
  dragging.velocity = .55 * dragging.velocity + .45 * Math.max(-2.5, Math.min(2.5, speed));
  dragging.lastX = event.clientX; dragging.time = now;
  requested = nearest(clamp(dragging.left - (event.clientX - dragging.x)));
  moveTo(dragging.left - (event.clientX - dragging.x));
});
function finishDrag(event) {
  if (!dragging) return;
  const velocity = event?.type !== 'pointercancel' && performance.now() - dragging.time < 100 ? dragging.velocity : 0;
  const id = dragging.id;
  dragging = null;
  track.classList.remove('is-dragging');
  if (track.hasPointerCapture(id)) track.releasePointerCapture(id);
  goTo(nearest(clamp(target + velocity * 110)));
}
track.addEventListener('pointerup', finishDrag);
track.addEventListener('pointercancel', finishDrag);
track.addEventListener('lostpointercapture', finishDrag);
track.addEventListener('dragstart', event => event.preventDefault());
track.addEventListener('wheel', event => {
  if (buttonOnly.matches || event.ctrlKey || dragging) return;
  let delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
  delta *= event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? track.clientWidth : 1;
  if (!delta || (delta < 0 && target <= 0) || (delta > 0 && target >= limit)) return;
  event.preventDefault();
  clearTimeout(wheelTimer);
  requested = nearest(clamp(target + delta));
  moveTo(target + delta);
  wheelTimer = setTimeout(() => goTo(nearest(target)), 160);
}, {passive:false});
// Keep direct scrollbar manipulation available on desktop.
track.addEventListener('scroll', () => {
  if (frame || dragging || Math.abs(track.scrollLeft - position) < 1) return;
  position = track.scrollLeft; target = position; requested = nearest(position);
  paintSelection();
  clearTimeout(wheelTimer);
  wheelTimer = setTimeout(() => goTo(nearest(position)), 180);
}, {passive:true});
function syncCarouselInput() {
  finishDrag();
  if (buttonOnly.matches) track.removeAttribute('tabindex'); else track.tabIndex = 0;
  track.setAttribute('aria-label', buttonOnly.matches ? '教練卡片，請使用下方左右按鈕切換' : '教練卡片，可使用左右方向鍵切換');
  cards.forEach(card => { if (buttonOnly.matches) card.removeAttribute('tabindex'); else card.tabIndex = 0; });
  measure(); goTo(requested, true);
}
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(syncCarouselInput, 120);
});
buttonOnly.addEventListener('change', syncCarouselInput);
syncCarouselInput();

// Explicit ease-in/out for the full journey back to the top.
const backToTop = document.querySelector('.back-to-top');
let topFrame = 0, savedScrollBehavior = '';
function stopTop() {
  if (!topFrame) return;
  cancelAnimationFrame(topFrame); topFrame = 0;
  document.documentElement.style.scrollBehavior = savedScrollBehavior;
}
backToTop.addEventListener('click', event => {
  event.preventDefault(); stopTop();
  const start = window.scrollY;
  if (start < 1) return;
  const duration = Math.min(1500, Math.max(750, start * .28));
  const started = performance.now();
  savedScrollBehavior = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = 'auto';
  function step(now) {
    const t = Math.min(1, (now - started) / duration);
    const eased = t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
    window.scrollTo({top:start*(1-eased),behavior:'instant'});
    if (t < 1) topFrame = requestAnimationFrame(step);
    else { stopTop(); history.replaceState(null, '', '#top'); }
  }
  topFrame = requestAnimationFrame(step);
});
// Give control back immediately if the user starts scrolling themselves.
window.addEventListener('wheel', stopTop, {passive:true});
window.addEventListener('touchstart', stopTop, {passive:true});
window.addEventListener('pointerdown', stopTop, {passive:true});
window.addEventListener('keydown', event => {
  if (['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' ','Escape'].includes(event.key)) stopTop();
});
