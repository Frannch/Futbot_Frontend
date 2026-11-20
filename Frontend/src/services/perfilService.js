const BASE_URL = import.meta.env?.VITE_API_URL ?? 'http://127.0.0.1:8000';
export const PERFIL_MOCK_ACTIVO = import.meta.env?.VITE_MOCK_PERFIL === 'false'; //cambiar a true para testear manualmente

import {
  actualizarPerfilMock,
  obtenerPerfilMock,
} from '../mocks/perfilMock.js';

/**
 * Obtiene los datos del usuario desde GET /api/users/{id}.
 */
export async function obtenerPerfil(id, token = localStorage.getItem('token')) {
  if (PERFIL_MOCK_ACTIVO) {
    return obtenerPerfilMock();
  }

  const headers = {
    Accept: 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const respuesta = await fetch(`${BASE_URL}/api/users/${id}`, { headers });
  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    const error = new Error(
      datos.error || datos.detail || 'Error al obtener el usuario'
    );
    error.status = respuesta.status;
    throw error;
  }

  return datos;
}

/**
 * Solicita actualizar los datos del usuario mediante PATCH /api/users/{id}.
 */
export async function actualizarPerfil( //TODO cambiar en ticket KAN-127
  id,
  datosUsuario,
  token = localStorage.getItem('token')
) {
  if (PERFIL_MOCK_ACTIVO) {
    return actualizarPerfilMock(datosUsuario);
  }

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const respuesta = await fetch(`${BASE_URL}/api/users/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(datosUsuario),
  });

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    const error = new Error(
      datos.error || datos.detail || 'Error al actualizar el usuario'
    );
    error.status = respuesta.status;
    throw error;
  }

  return datos;
}

export function obtenerIdUsuarioActual() {
  return localStorage.getItem('userId');
}

export function obtenerTokenUsuarioActual(){
  return localStorage.getItem('token');
}
