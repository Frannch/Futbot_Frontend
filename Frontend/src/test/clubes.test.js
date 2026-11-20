import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  aceptarAmistoso,
  obtenerClubes,
  obtenerClubPorId,
  obtenerComportamientos,
  obtenerJugadores,
  rechazarAmistoso,
  solicitarAmistoso
} from '../services/clubes.js';

const convocatoria = {
  formacion_tactica: 1,
  jugadores_convocados: []
};

describe('servicio de clubes', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    localStorage.setItem('token', 'jwt-de-prueba');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('obtiene y normaliza clubes', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => [
        { id_club: 1, nombre: 'Club A' },
        { id: 2, name: 'Club B' }
      ]
    });

    const _pruebaClubPorId = async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id_club: 7, nombre_club: 'Futboleros FC' })
      });
      await expect(obtenerClubPorId(7)).resolves.toEqual({
        id_club: 7,
        nombre: 'Futboleros FC'
      });
      expect(fetch).toHaveBeenCalledWith(
        'http://127.0.0.1:8000/api/clubes/7',
        { headers: { Authorization: 'Bearer jwt-de-prueba' } }
      );
    };

    await expect(obtenerClubes()).resolves.toEqual([
      { id_club: 1, nombre: 'Club A' },
      { id_club: 2, nombre: 'Club B' }
    ]);
  });

  it('obtiene un club por ID y normaliza nombre_club', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id_club: 7, nombre_club: 'Futboleros FC' })
    });

    await expect(obtenerClubPorId(7)).resolves.toEqual({
      id_club: 7,
      nombre: 'Futboleros FC'
    });
  });

  it('rechaza clubes cuando falta el token, falla la red o la respuesta es inválida', async () => {
    localStorage.clear();
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'No autorizado' })
    });
    await expect(obtenerClubes()).rejects.toThrow('No autorizado');

    localStorage.setItem('token', 'jwt');
    fetch.mockRejectedValueOnce(new Error('offline'));
    await expect(obtenerClubes()).rejects.toThrow('Falló la conexión al servidor.');

    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'No autorizado' })
    });
    await expect(obtenerClubes()).rejects.toThrow('No autorizado');

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ clubes: [] })
    });
    await expect(obtenerClubes()).rejects.toThrow('La respuesta de clubes no tiene un formato válido.');
  });

  it('obtiene jugadores y mapea sus estadísticas', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => [{
        id: 3,
        name: 'Jugador',
        club_id: 8,
        speed: 70,
        strength: 71,
        power: 72,
        agility: 73,
        control: 74
      }]
    });

    await expect(obtenerJugadores()).resolves.toEqual([{
      id_jugador: 3,
      nombre: 'Jugador',
      club_id: 8,
      skills: { speed: 70, strength: 71, power: 72, agility: 73, control: 74 }
    }]);
  });

  it('maneja errores al obtener jugadores y comportamientos', async () => {
    localStorage.clear();
    await expect(obtenerJugadores()).rejects.toThrow('No se encontró el token de autenticación.');
    await expect(obtenerComportamientos()).rejects.toThrow('No se encontró el token de autenticación.');

    localStorage.setItem('token', 'jwt');
    fetch.mockRejectedValueOnce(new Error('offline'));
    await expect(obtenerJugadores()).rejects.toThrow('Falló la conexión al servidor.');

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ comportamientos: 'inválido' })
    });
    await expect(obtenerComportamientos()).rejects.toThrow(
      'La respuesta de comportamientos no tiene un formato válido.'
    );
  });

  it('obtiene comportamientos y envía una solicitud amistosa', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ comportamientos: [{ id: 1, name: 'Ataque' }] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id_solicitud: 9 })
      });

    await expect(obtenerComportamientos()).resolves.toEqual([
      { id_comportamiento: 1, nombre: 'Ataque' }
    ]);
    await expect(solicitarAmistoso(4, convocatoria)).resolves.toEqual({ id_solicitud: 9 });

    expect(fetch.mock.calls[1][0]).toContain('/api/clubes/4/amistosos/solicitar');
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual(convocatoria);
  });

  it('maneja errores al solicitar, aceptar y rechazar amistosos', async () => {
    fetch.mockRejectedValueOnce(new Error('offline'));
    await expect(solicitarAmistoso(4, convocatoria)).rejects.toThrow(
      'Falló la conexión al servidor.'
    );

    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: 'Solicitud inválida' })
    });
    await expect(solicitarAmistoso(4, convocatoria)).rejects.toThrow('No se pudo enviar la solicitud de amistoso.');

    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ detail: 'Error del servidor' })
    });
    await expect(aceptarAmistoso(4, convocatoria)).rejects.toThrow('Error del servidor');

    fetch.mockRejectedValueOnce(new Error('offline'));
    await expect(rechazarAmistoso(4)).rejects.toThrow('Falló la conexión al servidor.');

    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'No se pudo rechazar' })
    });
    await expect(rechazarAmistoso(4)).rejects.toThrow('No se pudo rechazar');
  });

  it('valida token y estados especiales al aceptar o rechazar', async () => {
    localStorage.clear();
    await expect(aceptarAmistoso(4, convocatoria)).rejects.toThrow(
      'No se encontró el token de autenticación.'
    );
    await expect(rechazarAmistoso(4)).rejects.toThrow(
      'No se encontró el token de autenticación.'
    );

    localStorage.setItem('token', 'jwt');
    fetch.mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({}) });
    await expect(aceptarAmistoso(4, convocatoria)).rejects.toThrow('La invitación ya expiró o no existe.');

    fetch.mockResolvedValueOnce({ ok: false, status: 409, json: async () => ({}) });
    await expect(aceptarAmistoso(4, convocatoria)).rejects.toThrow('Esta invitación ya fue respondida.');

    fetch.mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({}) });
    await expect(rechazarAmistoso(4)).rejects.toThrow('La invitación ya expiró o no existe.');
  });
});