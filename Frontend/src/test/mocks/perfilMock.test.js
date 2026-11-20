import { afterEach, describe, expect, it } from 'vitest';
import { actualizarPerfilMock, obtenerPerfilMock } from '../../mocks/perfilMock.js';

const perfilInicial = {
  id: 'mock-user-1',
  username: 'Usuario de prueba',
  email: 'usuario.prueba@ejemplo.com',
  avatar_url: '',
};

describe('mock del perfil', () => {
  afterEach(async () => {
    await actualizarPerfilMock(perfilInicial);
  });

  it('devuelve una copia de los datos del perfil', async () => {
    const perfil = await obtenerPerfilMock();

    expect(perfil).toEqual(perfilInicial);
    expect(perfil).not.toBe(perfilInicial);
  });

  it('actualiza nombre y correo y devuelve el perfil actualizado', async () => {
    const actualizado = await actualizarPerfilMock({
      username: 'Nombre nuevo',
      email: 'nuevo@ejemplo.com',
    });

    expect(actualizado).toEqual({
      ...perfilInicial,
      username: 'Nombre nuevo',
      email: 'nuevo@ejemplo.com',
    });
    expect(await obtenerPerfilMock()).toEqual(actualizado);
  });
});