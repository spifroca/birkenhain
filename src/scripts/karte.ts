/**
 * Karte ohne Cookies: Leaflet liegt im Bundle, nicht auf einem CDN, und der
 * Standardmarker wird ersetzt, damit keine PNGs nachgeladen werden.
 *
 * Die Karte laedt mit der Seite. Der frueher vorgeschaltete Klick ist auf
 * Wunsch entfallen — damit geht die IP der Besucherin schon beim Aufruf an
 * OpenStreetMap, und genau das sagt der Datenschutztext jetzt auch.
 */
export function initKarte(): void {
  const frame = document.querySelector<HTMLElement>('[data-karte]');
  if (!frame) return;

  const canvas = frame.querySelector<HTMLElement>('[data-karte-canvas]');
  if (!canvas) return;

  const load = async () => {
    try {
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

  void load();
}
