import { afterEach, describe, expect, it, vi } from 'vitest';
import { abandonarLiga } from '../services/AbandonarLiga';

describe('servicio abandonarLiga', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('envía una petición autenticada y devuelve los datos al completar', async () => {
    const respuesta = { message: 'Liga abandonada correctamente' };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => respuesta,
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(abandonarLiga(10, 20, 'token-test')).resolves.toEqual(respuesta);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/ligas/10/20',
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-test',
        },
      },
    );
  });

  it('lanza el detalle recibido y adjunta el status si falla la petición', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ detail: 'El creador no puede abandonar la liga' }),
    }));

    const error = await abandonarLiga(10, 20, 'token-test').catch((value) => value);

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('El creador no puede abandonar la liga');
    expect(error.status).toBe(409);
  });

  it('usa el mensaje predeterminado si el error no trae detalle', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    }));

    await expect(abandonarLiga(10, 20, 'token-test')).rejects.toMatchObject({
      message: 'Error al abandonar la liga',
      status: 500,
    });
  });

  it('continúa aunque la respuesta no contenga JSON válido', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error('respuesta vacía');
      },
    }));

    await expect(abandonarLiga(10, 20, 'token-test')).rejects.toMatchObject({
      message: 'Error al abandonar la liga',
      status: 502,
    });
  });
});