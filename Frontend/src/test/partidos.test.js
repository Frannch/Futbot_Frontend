import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cambiarComportamientoJugador,
  solicitarCambioPartido,
} from '../services/partidos.js';

describe('solicitarCambioPartido', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('envía el cambio autenticado al endpoint del partido', async () => {
    localStorage.setItem('token', 'token-test');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id_partido: 21, tick_aplicacion: 150 }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const resultado = await solicitarCambioPartido(21, {
      id_jugador_sale: 4,
      id_jugador_entra: 7,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/partidos/21/sustituciones',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer token-test',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id_jugador_sale: 4, id_jugador_entra: 7 }),
      })
    );
    expect(resultado.tick_aplicacion).toBe(150);
  });

  it('actualiza el comportamiento del jugador con el token JWT', async () => {
    localStorage.setItem('token', 'token-test');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id_partido: 12,
        id_jugador: 34,
        id_comportamiento: 3,
        nombre: 'Atacante',
        mensaje: 'Comportamiento actualizado para el próximo tick.',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const resultado = await cambiarComportamientoJugador(12, 34, 3);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/partidos/12/jugadores/34/comportamiento',
      expect.objectContaining({
        method: 'PUT',
        headers: {
          Authorization: 'Bearer token-test',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id_comportamiento: 3 }),
      })
    );
    expect(resultado.nombre).toBe('Atacante');
  });
});
