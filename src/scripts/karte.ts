/**
 * Cookiefreie Karte: Leaflet und die OSM-Tiles werden erst nach einem Klick
 * geladen. Bis dahin geht kein Request an Dritte. Die Einwilligung wird
 * optional im `sessionStorage` gemerkt — kein Cookie, Ende mit dem Tab.
 */
const CONSENT_KEY = 'birkenhain:map-consent';

export function initKarte(): void {
  const frame = document.querySelector<HTMLElement>('[data-karte]');
  if (!frame) return;

  const consent = frame.querySelector<HTMLElement>('[data-karte-consent]');
  const canvas = frame.querySelector<HTMLElement>('[data-karte-canvas]');
  const accept = frame.querySelector<HTMLButtonElement>('[data-karte-accept]');
  const remember = frame.querySelector<HTMLInputElement>('[data-karte-remember]');
  if (!consent || !canvas || !accept) return;

  let loaded = false;

  const load = async () => {
    if (loaded) return;
    loaded = true;

    consent.hidden = true;
    canvas.hidden = false;

    try {
      // Leaflet liegt als Paket im Bundle, nicht auf einem CDN.
      const [{ default: L }] = await Promise.all([
        import('leaflet'),
        import('leaflet/dist/leaflet.css'),
      ]);

      const lat = Number(frame.dataset.lat);
      const lng = Number(frame.dataset.lng);
      const zoom = Number(frame.dataset.zoom ?? '16');

      const map = L.map(canvas, {
        center: [lat, lng],
        zoom,
        scrollWheelZoom: false,
        attributionControl: true,
      });

      canvas.setAttribute('role', 'application');
      canvas.setAttribute('aria-label', frame.dataset.label ?? '');

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: frame.dataset.attribution ?? '',
      }).addTo(map);

      // Eigener divIcon: Leaflets Standardmarker wuerde PNGs nachladen.
      L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'karte__marker',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        }),
        keyboard: false,
      }).addTo(map);
    } catch {
      canvas.textContent = frame.dataset.fallback ?? '';
      canvas.classList.add('karte__pending');
    }
  };

  accept.addEventListener('click', () => {
    if (remember?.checked) {
      try {
        sessionStorage.setItem(CONSENT_KEY, '1');
      } catch {
        // Privater Modus o. ae. — die Karte laedt trotzdem, nur ohne Merken.
      }
    }
    void load();
  });

  try {
    if (sessionStorage.getItem(CONSENT_KEY) === '1') void load();
  } catch {
    // Kein Zugriff auf sessionStorage: Einwilligung wird erneut gefragt.
  }
}
