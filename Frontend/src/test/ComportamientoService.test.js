import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  obtenerComportamientos,
  obtenerComportamientoPorNombre,
  crearComportamiento,
  actualizarComportamiento,
  eliminarComportamiento,
  probarComportamiento,
} from '../services/ComportamientoService';

describe('obtenerComportamientos', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());

    localStorage.setItem('token', 'token-de-prueba');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('realiza un GET al endpoint de comportamientos y devuelve los datos', async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        comportamientos: [
          {
            id: 1,
            nombre: 'Ataque rápido',
          },
          {
            id: 2,
            nombre: 'Defensa en zona',
          },
        ],
      }),
    });

    const resultado = await obtenerComportamientos();

    expect(fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/comportamientos',
      {
        headers: {
          Authorization: 'Bearer token-de-prueba',
        },
      }
    );

    expect(resultado).toEqual([
      {
        id_comportamiento: 1,
        nombre: 'Ataque rápido',
      },
      {
        id_comportamiento: 2,
        nombre: 'Defensa en zona',
      },
    ]);
  });

  it('envía el token JWT en el header Authorization', async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        comportamientos: [],
      }),
    });

    localStorage.setItem('token', 'mi-token-jwt');

    await obtenerComportamientos();

    expect(fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/comportamientos',
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer mi-token-jwt',
        },
      })
    );
  });

  it('lanza un error si no existe el token', async () => {
    localStorage.removeItem('token');

    await expect(obtenerComportamientos()).rejects.toThrow(
      'No se encontró el token de autenticación.'
    );

    expect(fetch).not.toHaveBeenCalled();
  });

  it('lanza un error cuando falla la conexión con el servidor', async () => {
    fetch.mockRejectedValue(new Error('Network Error'));

    await expect(obtenerComportamientos()).rejects.toThrow(
      'Falló la conexión al servidor.'
    );
  });

  it('lanza un error cuando el servidor responde con error', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 403,
      json: vi.fn().mockResolvedValue({
        detail: 'El usuario autenticado no tiene un club.',
      }),
    });

    await expect(obtenerComportamientos()).rejects.toThrow(
      'El usuario autenticado no tiene un club.'
    );
  });

  it('lanza un error cuando la respuesta no contiene una lista de comportamientos válida', async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        comportamientos: {},
      }),
    });

    await expect(obtenerComportamientos()).rejects.toThrow(
      'La respuesta de comportamientos no tiene un formato válido.'
    );
  });
});

describe('obtenerComportamientoPorNombre', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());

    localStorage.setItem('token', 'token-de-prueba');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('realiza un GET al endpoint del comportamiento seleccionado', async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        id: 1,
        name: 'Ataque rápido',
        script: 'def ataque():\n    return True',
      }),
    });

    const resultado = await obtenerComportamientoPorNombre(
      'Ataque rápido'
    );

    expect(fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/comportamientos/Ataque%20r%C3%A1pido',
      {
        headers: {
          Authorization: 'Bearer token-de-prueba',
        },
      }
    );

    expect(resultado).toEqual({
      id: 1,
      nombre: 'Ataque rápido',
      script: 'def ataque():\n    return True',
    });
  });

  it('envía el token JWT en el header Authorization', async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        id: 1,
        name: 'Ataque rápido',
        script: 'def ataque():\n    return True',
      }),
    });

    localStorage.setItem('token', 'mi-token-jwt');

    await obtenerComportamientoPorNombre('Ataque rápido');

    expect(fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/comportamientos/Ataque%20r%C3%A1pido',
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer mi-token-jwt',
        },
      })
    );
  });

  it('lanza un error si no existe el token', async () => {
    localStorage.removeItem('token');

    await expect(
      obtenerComportamientoPorNombre('Ataque rápido')
    ).rejects.toThrow(
      'No se encontró el token de autenticación.'
    );

    expect(fetch).not.toHaveBeenCalled();
  });

  it('lanza un error cuando el comportamiento no existe', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: vi.fn().mockResolvedValue({
        detail: 'Comportamiento no existe',
      }),
    });

    await expect(
      obtenerComportamientoPorNombre('Comportamiento inexistente')
    ).rejects.toThrow('El comportamiento no existe.');
  });

  it('lanza un error cuando el servidor responde con error', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({
        detail: 'Ocurrió un error interno del servidor.',
      }),
    });

    await expect(
      obtenerComportamientoPorNombre('Ataque rápido')
    ).rejects.toThrow(
      'Ocurrió un error interno del servidor.'
    );
  });

  it('lanza un error cuando falla la conexión con el servidor', async () => {
    fetch.mockRejectedValue(new Error('Network Error'));

    await expect(
      obtenerComportamientoPorNombre('Ataque rápido')
    ).rejects.toThrow(
      'Falló la conexión al servidor.'
    );
  });
});

describe('crearComportamiento', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    localStorage.setItem('token', 'token-de-prueba');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('envía POST con el token y el cuerpo JSON del comportamiento', async () => {
    const datos = { mensaje: 'Creado', id_comportamiento: 12 };
    fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(datos),
    });

    await expect(
      crearComportamiento('Ataque rápido', 'def correr(): pass')
    ).resolves.toEqual(datos);

    expect(fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/comportamientos',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-de-prueba',
        },
        body: JSON.stringify({
          name: 'Ataque rápido',
          script: 'def correr(): pass',
        }),
      }
    );
  });

  it('propaga el error de conflicto enviado por el servidor', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 409,
      json: vi.fn().mockResolvedValue({ error: 'Nombre duplicado.' }),
    });

    await expect(
      crearComportamiento('Ataque rápido', 'codigo')
    ).rejects.toThrow('Nombre duplicado.');
  });

  it('muestra un mensaje legible cuando el backend rechaza datos inválidos', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 422,
      json: vi.fn().mockResolvedValue({
        detail: [
          { loc: ['body', 'name'], msg: 'Field required', type: 'missing' },
          { loc: ['body', 'script'], msg: 'Field required', type: 'missing' },
        ],
      }),
    });

    await expect(
      crearComportamiento('Ataque rápido', 'codigo')
    ).rejects.toThrow('Los datos del comportamiento no son válidos. Revisá el nombre y el código.');
  });
});

describe('actualizarComportamiento', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    localStorage.setItem('token', 'token-de-prueba');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('envía PUT al comportamiento seleccionado sin modificar su nombre', async () => {
    const datos = { mensaje: 'Actualizado' };
    fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(datos),
    });

    await expect(
      actualizarComportamiento('Ataque rápido', 'def patear(): pass')
    ).resolves.toEqual(datos);

    expect(fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/comportamientos/Ataque%20r%C3%A1pido',
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-de-prueba',
        },
        body: JSON.stringify({ script: 'def patear(): pass' }),
      }
    );
  });

  it('propaga el error de bloqueo enviado por el servidor', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 403,
      json: vi.fn().mockResolvedValue({ error: 'Está en uso.' }),
    });

    await expect(
      actualizarComportamiento('Ataque rápido', 'codigo')
    ).rejects.toThrow('Está en uso.');
  });
});

describe('probarComportamiento', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    localStorage.setItem('token', 'token-de-prueba');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('solicita y devuelve los frames de la simulación autenticada', async () => {
    const datos = {
      ancho_cancha: 100,
      alto_cancha: 60,
      ticks: 20,
      frames: [],
    };
    fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(datos),
    });

    await expect(probarComportamiento(17)).resolves.toEqual(datos);
    expect(fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/comportamientos/17/probar',
      {
        method: 'POST',
        headers: { Authorization: 'Bearer token-de-prueba' },
      }
    );
  });
});

describe('eliminarComportamiento', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    localStorage.setItem('token', 'token-de-prueba');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('envía DELETE autenticado usando el nombre codificado en la URL', async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ mensaje: 'Comportamiento eliminado.' }),
    });

    const resultado = await eliminarComportamiento('Ataque rápido');

    expect(fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/comportamientos/Ataque%20r%C3%A1pido',
      {
        method: 'DELETE',
        headers: { Authorization: 'Bearer token-de-prueba' },
      }
    );
    expect(resultado).toEqual({ mensaje: 'Comportamiento eliminado.' });
  });

  it('propaga el error informado por el servidor', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 403,
      json: vi.fn().mockResolvedValue({ error: 'El comportamiento está asignado.' }),
    });

    await expect(eliminarComportamiento('Defensa en zona')).rejects.toThrow(
      'El comportamiento está asignado.'
    );
  });

  it('no envía la solicitud si falta el token', async () => {
    localStorage.removeItem('token');

    await expect(eliminarComportamiento('Ataque rápido')).rejects.toThrow(
      'No se encontró el token de autenticación.'
    );
    expect(fetch).not.toHaveBeenCalled();
  });
});