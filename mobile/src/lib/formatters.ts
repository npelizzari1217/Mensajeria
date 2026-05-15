/**
 * Formateadores de uso global en la app mobile.
 *
 * Usa Intl.DateTimeFormat — disponible en Hermes (Expo SDK 51+).
 */

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * Formatea un ISO string a fecha legible en es-AR.
 * Ej: "2024-05-14T10:30:00.000Z" → "14/05/2024, 07:30"
 */
export function formatDate(iso: string): string {
  try {
    return dateFormatter.format(new Date(iso));
  } catch {
    return iso;
  }
}

/**
 * Versión corta para listas — solo fecha sin hora.
 */
const shortFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function formatDateShort(iso: string): string {
  try {
    return shortFormatter.format(new Date(iso));
  } catch {
    return iso;
  }
}
