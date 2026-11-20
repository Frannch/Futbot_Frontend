import { afterEach, describe, expect, it } from 'vitest';
import {
  obtenerLigasClub,
  quitarLigaClub,
  registrarLigaClub,
} from '../services/ligasClub.js';

describe('persistencia local de ligas del club', () => {
  afterEach(() => localStorage.clear());

  it('devuelve una lista vacía si no hay club o el valor guardado no es una lista', () => {
    expect(obtenerLigasClub(null)).toEqual([]);
    localStorage.setItem('ligasClub-4', '{no-json');
    expect(obtenerLigasClub(4)).toEqual([]);
    localStorage.setItem('ligasClub-4', JSON.stringify({ id: 1 }));
    expect(obtenerLigasClub(4)).toEqual([]);
  });

  it('registra una liga nueva y conserva la marca de creador al actualizarla', () => {
    registrarLigaClub(12, 'Copa Inicial', 4);
    registrarLigaClub('12', 'Copa Actualizada', 4, false);

    expect(obtenerLigasClub(4)).toEqual([
      { id: '12', nombre: 'Copa Actualizada', esCreador: false },
    ]);

    registrarLigaClub(12, 'Copa Final', 4, true);
    registrarLigaClub(12, 'Copa Renombrada', 4, false);
    expect(obtenerLigasClub(4)).toEqual([
      { id: 12, nombre: 'Copa Renombrada', esCreador: true },
    ]);
  });

  it('ignora registros incompletos y permite usar el club guardado', () => {
    localStorage.setItem('clubId', '9');
    registrarLigaClub(null, 'Sin ID', 9);
    registrarLigaClub(3, 'Copa', null);
    registrarLigaClub(7, 'Liga local');

    expect(obtenerLigasClub()).toEqual([
      { id: 7, nombre: 'Liga local', esCreador: false },
    ]);
  });

  it('quita una liga sin modificar las otras', () => {
    registrarLigaClub(1, 'Primera', 4);
    registrarLigaClub(2, 'Segunda', 4);

    quitarLigaClub('1', 4);

    expect(obtenerLigasClub(4)).toEqual([
      { id: 2, nombre: 'Segunda', esCreador: false },
    ]);
  });
});