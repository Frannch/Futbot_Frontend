import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  actualizarAlineacionLiga,
  cancelarLiga,
  iniciarLiga,
  obtenerDatosDireccionLiga,
  obtenerAlineacionLiga,
  obtenerLobbyLiga,
  unirseALiga,
} from '../services/ligas.js';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

describe('servicio de ligas', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ mensaje: 'Liga iniciada correctamente' }),
    }));
    localStorage.setItem('token', 'token-de-prueba');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('inicia una liga con PUT y envía el token', async () => {
    await iniciarLiga(17);

    expect(fetch).toHaveBeenCalledWith(
      `${BASE_URL}/api/ligas/17/iniciar`,
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-de-prueba',
        }),
      })
    );
  });

  it('permite unirse a una liga enviando los datos de inscripción', async () => {
    const datos = { clave: 'secreta', id_club: 9 };

    await unirseALiga(17, datos);

    expect(fetch).toHaveBeenCalledWith(
      `${BASE_URL}/api/ligas/17/unirse`,
      expect.objectContaining({ method: 'POST', body: JSON.stringify(datos) }),
    );
  });

  it('valida los IDs requeridos por los servicios de liga', async () => {
    await expect(unirseALiga(null, {})).rejects.toThrow('No se indicó la liga a la que se quiere ingresar.');
    await expect(obtenerLobbyLiga(0)).rejects.toThrow('No se indicó la liga a consultar.');
    await expect(obtenerAlineacionLiga()).rejects.toThrow('No se indicó la liga a consultar.');
    await expect(actualizarAlineacionLiga(null, {})).rejects.toThrow('No se indicó la liga a actualizar.');
    await expect(obtenerDatosDireccionLiga(undefined)).rejects.toThrow('El partido no indica la liga que se quiere dirigir.');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('consulta lobby y alineación usando sus endpoints', async () => {
    await obtenerLobbyLiga(17);
    await obtenerAlineacionLiga(17);

    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      `${BASE_URL}/api/ligas/17/lobby`,
      `${BASE_URL}/api/ligas/17/alineacion`,
    ]);
  });

  it('actualiza la alineación con PUT y el cuerpo de convocatoria', async () => {
    const convocatoria = { jugadores: [{ id_jugador: 4, rol: 'titular' }] };

    await actualizarAlineacionLiga(17, convocatoria);

    expect(fetch).toHaveBeenCalledWith(
      `${BASE_URL}/api/ligas/17/alineacion`,
      expect.objectContaining({ method: 'PUT', body: JSON.stringify(convocatoria) }),
    );
  });

  it('cancela una liga con DELETE sin body y envía el token', async () => {
    await cancelarLiga(23);

    expect(fetch).toHaveBeenCalledWith(
      `${BASE_URL}/api/ligas/23`,
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-de-prueba',
        }),
      })
    );
    expect(fetch.mock.calls[0][1].body).toBeUndefined();
  });

  it('rechaza cancelar si falta el ID de la liga', async () => {
    await expect(cancelarLiga()).rejects.toThrow(
      'No se indicó la liga que se quiere cancelar.'
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it('combina convocatoria, jugadores y comportamientos por ID', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jugadores_convocados: [
            { id_jugador: 7, rol: 'titular', comportamiento: 'Presionar' },
            { id_jugador: 8, rol: 'suplente' },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 7, nombre: 'Jugador propio' },
          { id: 8, nombre: 'Jugador suplente' },
          { id: 99, nombre: 'Jugador ajeno' },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          comportamientos: [{ id_comportamiento: 1, nombre: 'Presionar' }],
        }),
      });

    const datos = await obtenerDatosDireccionLiga(3);

    expect(datos.convocatoria).toEqual([
      {
        id: 7,
        nombre: 'Jugador propio',
        id_jugador: 7,
        rol: 'titular',
        comportamiento: 'Presionar',
      },
      {
        id: 8,
        nombre: 'Jugador suplente',
        id_jugador: 8,
        rol: 'suplente',
      },
    ]);
    expect(datos.jugadores).toEqual(datos.convocatoria);
    expect(datos.comportamientos).toEqual([
      { id_comportamiento: 1, nombre: 'Presionar' },
    ]);
  });

  it('realiza las tres consultas necesarias para dirigir una liga', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ jugadores_convocados: [], comportamientos: [] }),
    });
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jugadores_convocados: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ comportamientos: [] }),
      });

    await obtenerDatosDireccionLiga(12);

    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      `${BASE_URL}/api/ligas/12/alineacion`,
      `${BASE_URL}/api/jugadores`,
      `${BASE_URL}/api/comportamientos`,
    ]);
  });

  it('combina jugadores identificados por id_jugador y usa lista vacía si faltan comportamientos', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jugadores_convocados: [{ id_jugador: 7, rol: 'titular' }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id_jugador: 7, nombre: 'Delantero' }],
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    const datos = await obtenerDatosDireccionLiga(8);

    expect(datos.convocatoria).toEqual([{ id_jugador: 7, nombre: 'Delantero', rol: 'titular' }]);
    expect(datos.comportamientos).toEqual([]);
  });
});
