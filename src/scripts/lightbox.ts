/**
 * Lightbox-Steuerung.
 *
 * Fokus und Escape kommen von `<dialog>.showModal()`: der Browser haelt den
 * Fokus im Dialog und schliesst auf Escape. Ergaenzt werden hier nur
 * Bildwechsel, Scroll-Sperre und die Fokusrueckgabe an den ausloesenden
 * Button — plus ein expliziter Trap fuer den Fall, dass der Dialog
 * non-modal geoeffnet werden muss.
 */
export function initLightbox(): void {
  const dialog = document.querySelector<HTMLDialogElement>('[data-lightbox]');
  if (!dialog) return;

  const items = Array.from(dialog.querySelectorAll<HTMLElement>('[data-lb-item]'));
  const counter = dialog.querySelector<HTMLElement>('[data-lb-counter]');
  const template = dialog.querySelector<HTMLTemplateElement>('[data-lb-counter-template]');
  const counterFormat = template?.innerHTML.trim() ?? '{current} / {total}';

  if (items.length === 0) return;

  let index = 0;
  let opener: HTMLElement | null = null;

  const render = () => {
    items.forEach((item, i) => {
      item.hidden = i !== index;
    });
    if (counter) {
      counter.textContent = counterFormat
        .replace('{current}', String(index + 1))
        .replace('{total}', String(items.length));
    }
  };

  const go = (delta: number) => {
    index = (index + delta + items.length) % items.length;
    render();
  };

  const open = (start: number, trigger: HTMLElement) => {
    index = Math.min(Math.max(start, 0), items.length - 1);
    opener = trigger;
    render();
    document.body.setAttribute('data-scroll-locked', '');
    dialog.showModal();
    dialog.querySelector<HTMLElement>('[data-lb-close]')?.focus();
  };

  const close = () => {
    document.body.removeAttribute('data-scroll-locked');
    // Fokus zurueck auf das ausloesende Element, nicht an den Seitenanfang.
    opener?.focus();
    opener = null;
  };

  document.querySelectorAll<HTMLElement>('[data-lb-open]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      open(Number(trigger.dataset.lbOpen ?? '0'), trigger);
    });
  });

  dialog.querySelector('[data-lb-close]')?.addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-lb-prev]')?.addEventListener('click', () => go(-1));
  dialog.querySelector('[data-lb-next]')?.addEventListener('click', () => go(1));

  // `close` feuert auch beim Escape des Browsers — eine Stelle fuer beides.
  dialog.addEventListener('close', close);

  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      go(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      go(-1);
    } else if (event.key === 'Tab') {
      trapFocus(dialog, event);
    }
  });

  // Klick auf den Rand schliesst — der Dialog selbst ist die Flaeche,
  // die Inhalte liegen darin.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  render();
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Explizite Fokusfalle. `showModal()` erledigt das normalerweise selbst;
 * dieser Trap greift, wenn der Dialog non-modal geoeffnet wurde oder ein
 * Browser die native Eingrenzung nicht liefert.
 */
function trapFocus(container: HTMLElement, event: KeyboardEvent): void {
  const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (element) => element.offsetParent !== null || element === document.activeElement,
  );
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!first || !last) return;

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
