/**
 * Parallaxe im Bildband: das Bild wandert langsamer als die Seite. Sehr
 * knapp gehalten — der Auftritt soll ruhig bleiben, die Bewegung faellt nur
 * auf, wenn man sie sucht.
 *
 * Ohne JavaScript oder bei `prefers-reduced-motion` passiert nichts: das
 * Band steht dann einfach still. Der Versatz wird ausschliesslich per
 * `transform` gesetzt, damit der Browser nicht bei jedem Bildlauf neu
 * layouten muss.
 */
/** Anteil der Bandhoehe, um den das Bild zuruecksbleibt. 0.08 ist knapp
 *  genug, dass es als Tiefe und nicht als Effekt gelesen wird. */
const WEG = 0.08;

const band = document.querySelector<HTMLElement>('.hero--band');
const ruhe = window.matchMedia('(prefers-reduced-motion: reduce)');

if (band && !ruhe.matches) {
  const ebenen = Array.from(band.querySelectorAll<HTMLElement>('.hero__image, .hero__video'));

  if (ebenen.length > 0) {
    band.dataset.parallax = 'on';

    let angefordert = false;

    const setzen = () => {
      angefordert = false;

      const hoehe = band.offsetHeight;
      if (hoehe === 0) return;

      // 0 solange das Band oben anliegt, 1 wenn es ganz durchgelaufen ist.
      const fortschritt = Math.min(Math.max(-band.getBoundingClientRect().top / hoehe, 0), 1);
      const versatz = fortschritt * hoehe * WEG;

      for (const ebene of ebenen) {
        ebene.style.transform = `translate3d(0, ${-versatz}px, 0)`;
      }
    };

    const anfordern = () => {
      if (angefordert) return;
      angefordert = true;
      requestAnimationFrame(setzen);
    };

    window.addEventListener('scroll', anfordern, { passive: true });
    window.addEventListener('resize', anfordern);
    setzen();

    // Wer die Einstellung waehrend des Besuchs aendert, bekommt sofort Ruhe.
    ruhe.addEventListener('change', () => {
      if (!ruhe.matches) return;
      window.removeEventListener('scroll', anfordern);
      delete band.dataset.parallax;
      for (const ebene of ebenen) ebene.style.transform = '';
    });
  }
}
