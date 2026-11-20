import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorHttp, httpGet, httpPost } from '../services/http.js';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

describe('servicio http', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('arma la url y manda el body como json', async () => {
    fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });

    await httpPost('/api/ligas', { nombre: 'Copa' });

    const [url, opciones] = fetch.mock.calls[0];

    expect(url).toBe(`${BASE_URL}/api/ligas`);
    expect(opciones.method).toBe('POST');
    expect(opciones.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(opciones.body)).toEqual({ nombre: 'Copa' });
  });

  it('pega el token solo cuando hay sesion', async () => {
    fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });

    await httpGet('/api/jugadores');
    expect(fetch.mock.calls[0][1].headers.Authorization).toBeUndefined();

    localStorage.setItem('token', 'jwt-de-prueba');
    await httpGet('/api/jugadores');
    expect(fetch.mock.calls[1][1].headers.Authorization).toBe('Bearer jwt-de-prueba');
  });

  it('con FormData manda el body tal cual y no fija el Content-Type', async () => {
    fetch.mockResolvedValue({ ok: true, status: 201, json: async () => ({}) });
    const datos = new FormData();
    datos.append('name', 'Club Futbot');

    await httpPost('/api/clubes/', datos);

    const opciones = fetch.mock.calls[0][1];

    expect(opciones.headers['Content-Type']).toBeUndefined();
    expect(opciones.body).toBe(datos);
  });

  it('lanza ErrorHttp con el codigo y el mensaje del backend', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: 'Ya existe una liga con ese nombre.' })
    });

    const error = await httpPost('/api/ligas', {}).catch((e) => e);

    expect(error).toBeInstanceOf(ErrorHttp);
    expect(error.status).toBe(409);
    expect(error.message).toBe('Ya existe una liga con ese nombre.');
  });

  it('usa status 0 cuando no se llega al servidor', async () => {
    fetch.mockRejectedValue(new Error('Backend apagado'));

    const error = await httpGet('/api/ligas').catch((e) => e);

    expect(error.status).toBe(0);
    expect(error.message).toBe('Error de conexión con el servidor.');
  });

  it('no se rompe si la respuesta no trae json valido', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => { throw new Error('respuesta vacia'); }
    });

    const error = await httpGet('/api/ligas').catch((e) => e);

    expect(error.status).toBe(500);
    expect(error.message).toBe('Ocurrió un error inesperado.');
  });
});