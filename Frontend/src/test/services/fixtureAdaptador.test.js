import { describe, expect, it } from 'vitest';
import { adaptarFixture } from '../../utils/fixture';

describe('adaptarFixture', () => {
  it('retorna array vacío si el fixture es nulo, indefinido o vacío', () => {
    expect(adaptarFixture(null)).toEqual([]);
    expect(adaptarFixture(undefined)).toEqual([]);
    expect(adaptarFixture([])).toEqual([]);
  });

  it('mantiene la estructura si ya viene agrupado por fecha con numero_fecha', () => {
    const yaAgrupado = [{ numero_fecha: 1, partidos: [] }];
    expect(adaptarFixture(yaAgrupado)).toBe(yaAgrupado);
  });

  it('agrupa partidos planos por fecha y asigna estado_fecha actual y próxima', () => {
    const fixturePlano = [
      {
        fecha: 1,
        id_partido: 101,
        club_local_nombre: 'Equipo A',
        club_visitante_nombre: 'Equipo B',
        gol_club_local: 2,
        gol_club_visitante: 1,
        estado: 'FINALIZADO',
      },
      {
        fecha: 2,
        id_partido: 102,
        club_local_nombre: 'Equipo C',
        club_visitante_nombre: 'Equipo D',
        gol_club_local: 0,
        gol_club_visitante: 0,
        estado: 'EN_VIVO',
      },
      {
        fecha: 3,
        id_partido: 103,
        club_local_nombre: 'Equipo A',
        club_visitante_nombre: 'Equipo C',
        gol_club_local: 0,
        gol_club_visitante: 0,
        estado: 'EN_ESPERA',
      },
    ];

    const resultado = adaptarFixture(fixturePlano);

    expect(resultado).toHaveLength(3);
    expect(resultado[0].numero_fecha).toBe(1);
    expect(resultado[0].estado_fecha).toBe('finalizada');
    expect(resultado[0].partidos[0].local).toBe('Equipo A');
    expect(resultado[0].partidos[0].goles_local).toBe(2);

    expect(resultado[1].numero_fecha).toBe(2);
    expect(resultado[1].estado_fecha).toBe('actual');
    expect(resultado[1].partidos[0].estado).toBe('1T');

    expect(resultado[2].numero_fecha).toBe(3);
    expect(resultado[2].estado_fecha).toBe('proxima');
    expect(resultado[2].partidos[0].estado).toBe('Por jugar');
  });
});
