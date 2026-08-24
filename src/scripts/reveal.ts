/**
 * Scroll-Reveal. Elemente mit `data-reveal` werden erst beim Eintreten in
 * den Viewport aufgedeckt — was beim Laden schon sichtbar ist, bleibt
 * unangetastet. Ohne JS oder bei `prefers-reduced-motion` ist alles sichtbar:
 * das Attribut wird nur dann auf `pending` gesetzt, wenn tatsaechlich
 * animiert wird.
 */
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));

if (!reduced && targets.length > 0 && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.setAttribute('data-reveal', 'done');
        io.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.06 },
  );

  for (const el of targets) {
    // Was bereits im Bild steht, wird nicht erst versteckt.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.94) continue;
    el.setAttribute('data-reveal', 'pending');
    io.observe(el);
  }
}
