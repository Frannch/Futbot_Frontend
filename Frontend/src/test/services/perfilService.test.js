import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  actualizarPerfil,
  obtenerIdUsuarioActual,
  obtenerPerfil,
  obtenerTokenUsuarioActual,
} from '../../services/perfilService.js';

describe('actualizarPerfil', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('envía PATCH a la ruta del perfil con los datos y el token', async () => {
    const datosUsuario = { username: 'nuevo-nombre', email: 'nuevo@example.com' };
    const respuesta = { id: 8, ...datosUsuario };
    localStorage.setItem('token', 'token-prueba');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(respuesta),
    }));

    await expect(actualizarPerfil(8, datosUsuario)).resolves.toEqual(respuesta);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/users\/8$/),
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: 'Bearer token-prueba',
        },
        body: JSON.stringify(datosUsuario),
      }
    );
  });

  it('obtiene el perfil y agrega autorización cuando hay token', async () => {
    const perfil = { id: 8, username: 'nahuel' };
    localStorage.setItem('token', 'token-prueba');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(perfil),
    }));

    await expect(obtenerPerfil(8)).resolves.toEqual(perfil);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/users\/8$/),
      { headers: { Accept: 'application/json', Authorization: 'Bearer token-prueba' } },
    );
  });

  it('obtiene el perfil sin Authorization cuando no hay token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ id: 8 }),
    }));

    await expect(obtenerPerfil(8)).resolves.toEqual({ id: 8 });
    expect(fetch.mock.calls[0][1].headers).toEqual({ Accept: 'application/json' });
  });

  it.each([
    [{ error: 'Perfil privado' }, 'Perfil privado'],
    [{ detail: 'Usuario inexistente' }, 'Usuario inexistente'],
    [{}, 'Error al obtener el usuario'],
  ])('propaga errores HTTP al consultar perfil: %o', async (body, mensaje) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: vi.fn().mockResolvedValue(body),
    }));

    await expect(obtenerPerfil(8)).rejects.toMatchObject({ message: mensaje, status: 404 });
  });

  it('usa mensaje predeterminado si la respuesta de error no es JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: vi.fn().mockRejectedValue(new Error('respuesta vacía')),
    }));

    await expect(obtenerPerfil(8)).rejects.toMatchObject({
      message: 'Error al obtener el usuario',
      status: 503,
    });
  });

  it('propaga el error al actualizar perfil y acepta respuesta no JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockRejectedValue(new Error('respuesta vacía')),
    }));

    await expect(actualizarPerfil(8, { username: 'nuevo' })).rejects.toMatchObject({
      message: 'Error al actualizar el usuario',
      status: 500,
    });
    expect(fetch.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it('lee los identificadores actuales del almacenamiento local', () => {
    localStorage.setItem('userId', '8');
    localStorage.setItem('token', 'jwt-actual');

    expect(obtenerIdUsuarioActual()).toBe('8');
    expect(obtenerTokenUsuarioActual()).toBe('jwt-actual');
  });
});
