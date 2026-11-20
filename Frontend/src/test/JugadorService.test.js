import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { crearJugador } from '../services/JugadorService';

describe('jugadorService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('envía correctamente los datos para crear un jugador', async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        id: 1,
        name: 'Lionel Messi',
      }),
    });

    const nombre = 'Lionel Messi';

    const stats = {
      velocidad: 60,
      fuerza: 60,
      potencia: 60,
      agilidad: 60,
      control: 60,
    };

    const token = 'jwt-de-prueba';

    const resultado = await crearJugador(
      nombre,
      stats,
      token,
    );

    expect(fetch).toHaveBeenCalledWith(
      `http://127.0.0.1:8000/api/jugadores`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer jwt-de-prueba',
        },
        body: JSON.stringify({
          name: 'Lionel Messi',
          speed: 60,
          strength: 60,
          power: 60,
          agility: 60,
          control: 60,
        }),
      },
    );

    expect(resultado).toEqual({
      id: 1,
      name: 'Lionel Messi',
    });
  });

  it('envía correctamente el token de autenticación', async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        id: 5,
        name: 'Jugador Test',
      }),
    });

    const stats = {
      velocidad: 60,
      fuerza: 60,
      potencia: 60,
      agilidad: 60,
      control: 60,
    };

    await crearJugador(
      'Jugador Test',
      stats,
      'mi-token',
    );

    expect(fetch).toHaveBeenCalledWith(
      `http://127.0.0.1:8000/api/jugadores`,
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mi-token',
        },
      }),
    );
  });

  it('convierte correctamente los nombres de las estadísticas al formato de la API', async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        id: 2,
        name: 'Jugador Test',
      }),
    });

    const stats = {
      velocidad: 70,
      fuerza: 65,
      potencia: 55,
      agilidad: 50,
      control: 60,
    };

    await crearJugador(
      'Jugador Test',
      stats,
      'token-test',
    );

    const opcionesFetch = fetch.mock.calls[0][1];

    expect(JSON.parse(opcionesFetch.body)).toEqual({
      name: 'Jugador Test',
      speed: 70,
      strength: 65,
      power: 55,
      agility: 50,
      control: 60,
    });
  });

  it('devuelve los datos cuando la API responde correctamente', async () => {
    const datosJugador = {
      id: 25,
      name: 'Jugador Test',
    };

    fetch.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => datosJugador,
    });

    const resultado = await crearJugador(
      'Jugador Test',
      {
        velocidad: 60,
        fuerza: 60,
        potencia: 60,
        agilidad: 60,
        control: 60,
      },
      'token-test',
    );

    expect(resultado).toEqual(datosJugador);
  });

  it('lanza un error con status 400 cuando la API responde 400', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        detail: 'Los datos del jugador son inválidos.',
      }),
    });

    await expect(
      crearJugador(
        'Jugador Test',
        {
          velocidad: 60,
          fuerza: 60,
          potencia: 60,
          agilidad: 60,
          control: 60,
        },
        'token-test',
      ),
    ).rejects.toMatchObject({
      status: 400,
      message: 'Los datos del jugador son inválidos.',
    });
  });

  it('lanza un error con status 403 cuando el token no es válido', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        detail: 'No autorizado.',
      }),
    });

    await expect(
      crearJugador(
        'Jugador Test',
        {
          velocidad: 60,
          fuerza: 60,
          potencia: 60,
          agilidad: 60,
          control: 60,
        },
        'token-invalido',
      ),
    ).rejects.toMatchObject({
      status: 403,
      message: 'No autorizado.',
    });
  });

  it('lanza un error con status 409 cuando el jugador ya existe', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        detail: 'El jugador ya existe.',
      }),
    });

    await expect(
      crearJugador(
        'Jugador Test',
        {
          velocidad: 60,
          fuerza: 60,
          potencia: 60,
          agilidad: 60,
          control: 60,
        },
        'token-test',
      ),
    ).rejects.toMatchObject({
      status: 409,
      message: 'El jugador ya existe.',
    });
  });

  it('usa un mensaje genérico cuando la API falla sin enviar detail', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    await expect(
      crearJugador(
        'Jugador Test',
        {
          velocidad: 60,
          fuerza: 60,
          potencia: 60,
          agilidad: 60,
          control: 60,
        },
        'token-test',
      ),
    ).rejects.toMatchObject({
      status: 500,
      message: 'Error al crear el jugador',
    });
  });

  it('maneja una respuesta que no contiene JSON', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('Respuesta sin JSON');
      },
    });

    await expect(
      crearJugador(
        'Jugador Test',
        {
          velocidad: 60,
          fuerza: 60,
          potencia: 60,
          agilidad: 60,
          control: 60,
        },
        'token-test',
      ),
    ).rejects.toMatchObject({
      status: 500,
      message: 'Error al crear el jugador',
    });
  });
});