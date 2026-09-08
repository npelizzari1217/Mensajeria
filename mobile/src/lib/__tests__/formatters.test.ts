import { formatDate, formatDateShort } from '../formatters';

// Prueba de humo de los formateadores.
//
// No se afirma el string exacto a proposito. Intl.DateTimeFormat depende de dos
// cosas ajenas al codigo: la zona horaria del runner (el CI corre en UTC, el
// desarrollo en horario argentino) y los datos de ICU del build de Node, que
// para es-AR devuelven 12 horas con marcador — "14/05/2024, 12:30 p. m." — y
// pueden variar entre versiones. Afirmar el string completo hace que el test
// falle por motivos que no tienen nada que ver con el formateador.
//
// Se afirma lo que el formateador promete de verdad: que empieza con la fecha
// en dd/mm/aaaa y que incluye una hora. Mas el camino de fallback.

describe('formatDate', () => {
  it('formatea un ISO valido como dd/mm/aaaa, hh:mm', () => {
    const salida = formatDate('2024-05-14T10:30:00.000Z');
    expect(salida).toMatch(/^\d{2}\/\d{2}\/\d{4}\b/);
    expect(salida).toMatch(/\d{1,2}:\d{2}/);
  });

  it('devuelve la entrada intacta cuando no es una fecha valida', () => {
    expect(formatDate('no soy una fecha')).toBe('no soy una fecha');
  });
});

describe('formatDateShort', () => {
  it('formatea un ISO valido como dd/mm/aaaa, sin hora', () => {
    expect(formatDateShort('2024-05-14T10:30:00.000Z')).toMatch(
      /^\d{2}\/\d{2}\/\d{4}$/,
    );
  });

  it('devuelve la entrada intacta cuando no es una fecha valida', () => {
    expect(formatDateShort('')).toBe('');
  });
});
