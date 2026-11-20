import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aceptarAmistoso, rechazarAmistoso } from '../services/clubes.js';

const convocatoria = {
  formacion_tactica: 1,
  jugadores_convocados: [{ id_jugador: 1, rol: 'titular', comportamiento: 'Agresivo' }]
};

describe('respuestas a un amistoso', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    localStorage.setItem('token', 'jwt-de-prueba');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('acepta mandando la convocatoria y devuelve el id del partido', async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id_partido: 104 })
    });

    const data = await aceptarAmistoso(7, convocatoria);
    const [url, opciones] = fetch.mock.calls[0];

    expect(url).toContain('/api/amistosos/solicitudes/7/aceptar');
    expect(opciones.method).toBe('POST');
    expect(JSON.parse(opciones.body)).toEqual(convocatoria);
    expect(data.id_partido).toBe(104);
  });

  it('rechaza sin mandar cuerpo', async () => {
    fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });

    await rechazarAmistoso(7);
    const [url, opciones] = fetch.mock.calls[0];

    expect(url).toContain('/api/amistosos/solicitudes/7/rechazar');
    expect(opciones.body).toBeUndefined();
  });

  it('avisa que la invitacion expiro cuando el server responde 404', async () => {
    fetch.mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });

    const error = await aceptarAmistoso(7, convocatoria).catch((e) => e);

    expect(error.message).toBe('La invitación ya expiró o no existe.');
  });

  it('avisa que ya fue respondida cuando el server responde 409', async () => {
    fetch.mockResolvedValue({ ok: false, status: 409, json: async () => ({}) });

    const error = await aceptarAmistoso(7, convocatoria).catch((e) => e);

    expect(error.message).toBe('Esta invitación ya fue respondida.');
  });

  it('extrae el mensaje de validación cuando detail llega como objeto', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ detail: { error: 'Faltan jugadores en la convocatoria.' } })
    });

    await expect(aceptarAmistoso(7, convocatoria)).rejects.toThrow(
      'Faltan jugadores en la convocatoria.'
    );
  });

  it('identifica el campo y el valor que el backend no pudo convertir a entero', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        detail: [{
          loc: ['body', 'formacion_tactica'],
          msg: 'Input should be a valid integer',
          input: 'Defensiva'
        }]
      })
    });

    await expect(aceptarAmistoso(7, convocatoria)).rejects.toThrow(
      'formacion_tactica: Input should be a valid integer (recibido: "Defensiva")'
    );
  });
});