/* ============================================================
   VAIJAN — GSAP animations (progressive enhancement).
   The site works fully without GSAP; this only adds motion.
   ============================================================ */
(function(){
  if(!window.gsap) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce) return;
  gsap.registerPlugin(ScrollTrigger);

  /* hero entrance */
  gsap.from('[data-anim="hero"]', { y: 36, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12 });
  gsap.from('[data-anim="poster"]', { scale: 0.94, opacity: 0, duration: 1.1, ease: 'power3.out', delay: 0.15 });

  /* hero poster — gentle floating + slight parallax on scroll */
  const posterImg = document.querySelector('[data-anim="poster"] img');
  if(posterImg){
    gsap.to(posterImg, { y: -12, duration: 2.8, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 1.2 });
    gsap.to(posterImg, { yPercent: 4, ease: 'none',
      scrollTrigger: { trigger: '[data-anim="poster"]', start: 'top top', end: 'bottom top', scrub: 1 } });
  }

  /* mouse-move tilt on the hero poster (desktop, subtle) */
  const posterWrap = document.querySelector('[data-anim="poster"]');
  if(posterWrap && window.matchMedia('(pointer: fine)').matches){
    posterWrap.addEventListener('mousemove', e => {
      const r = posterWrap.getBoundingClientRect();
      const rx = ((e.clientY - r.top) / r.height - 0.5) * -5;
      const ry = ((e.clientX - r.left) / r.width - 0.5) * 5;
      gsap.to(posterWrap, { rotateX: rx, rotateY: ry, transformPerspective: 900, duration: 0.5, ease: 'power2.out' });
    });
    posterWrap.addEventListener('mouseleave', () => gsap.to(posterWrap, { rotateX: 0, rotateY: 0, duration: 0.7, ease: 'power3.out' }));
  }

  /* section headings */
  gsap.utils.toArray('[data-anim="heading"]').forEach(el => {
    gsap.from(el, { y: 26, opacity: 0, duration: 0.7, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

  /* product cards — staggered reveal */
  ScrollTrigger.batch('.card[data-cat]', {
    start: 'top 92%',
    onEnter: batch => gsap.fromTo(batch, { y: 42, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.08, overwrite: true })
  });

  /* feature strip */
  gsap.utils.toArray('[data-anim="feat"]').forEach((el, i) => {
    gsap.from(el, { y: 22, opacity: 0, duration: 0.6, delay: i * 0.06, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 94%' } });
  });

  /* cart button pop when an item is added */
  window.addEventListener('cart:added', () => {
    const fab = document.getElementById('cartFab');
    if(fab && fab.style.display !== 'none') gsap.fromTo(fab, { scale: 0.86 }, { scale: 1, duration: 0.45, ease: 'back.out(3)' });
  });
})();
