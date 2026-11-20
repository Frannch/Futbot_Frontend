const API_URL = 'http://127.0.0.1:8000';

export async function obtenerComportamientos() {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No se encontró el token de autenticación.');
  }

  let respuesta;

  try {
    respuesta = await fetch(`${API_URL}/api/comportamientos`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch {
    throw new Error('Falló la conexión al servidor.');
  }

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(
      datos.error ||
      datos.detail ||
      'No se pudieron obtener los comportamientos.'
    );
  }

  if (!Array.isArray(datos.comportamientos)) {
    throw new Error(
      'La respuesta de comportamientos no tiene un formato válido.'
    );
  }

  return datos.comportamientos.map((comportamiento) => ({
    id_comportamiento:
      comportamiento.id_comportamiento ?? comportamiento.id,
    nombre: comportamiento.nombre ?? comportamiento.name
  }));
}

export async function obtenerComportamientoPorNombre(nombre) {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No se encontró el token de autenticación.');
  }

  let respuesta;

  try {
    respuesta = await fetch(
      `${API_URL}/api/comportamientos/${encodeURIComponent(nombre)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  } catch {
    throw new Error('Falló la conexión al servidor.');
  }

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    if (respuesta.status === 404) {
      throw new Error('El comportamiento no existe.');
    }

    throw new Error(
      datos.error ||
      datos.detail ||
      'No se pudo obtener el detalle del comportamiento.'
    );
  }

  return {
    id: datos.id,
    nombre: datos.name,
    script: datos.script
  };
}

export async function probarComportamiento(idComportamiento) {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No se encontró el token de autenticación.');
  }

  let respuesta;
  try {
    respuesta = await fetch(
      `${API_URL}/api/comportamientos/${encodeURIComponent(idComportamiento)}/probar`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  } catch {
    throw new Error('Falló la conexión al servidor.');
  }

  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new Error(
      typeof datos.detail === 'string'
        ? datos.detail
        : datos.error || 'No se pudo simular el comportamiento.'
    );
  }

  return datos;
}

export async function crearComportamiento(nombre, codigoPython) {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No se encontró el token de autenticación.');
  }

  let respuesta;

  try {
    respuesta = await fetch(`${API_URL}/api/comportamientos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name: nombre, script: codigoPython })
    });
  } catch {
    throw new Error('Falló la conexión al servidor.');
  }

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    if (respuesta.status === 422) {
      throw new Error('Los datos del comportamiento no son válidos. Revisá el nombre y el código.');
    }
    throw new Error(
      datos.error ||
      (typeof datos.detail === 'string' ? datos.detail : null) ||
      'No se pudo crear el comportamiento.'
    );
  }

  return datos;
}

export async function actualizarComportamiento(nombre, codigoPython) {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No se encontró el token de autenticación.');
  }

  let respuesta;

  try {
    respuesta = await fetch(
      `${API_URL}/api/comportamientos/${encodeURIComponent(nombre)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ script: codigoPython })
      }
    );
  } catch {
    throw new Error('Falló la conexión al servidor.');
  }

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    if (respuesta.status === 422) {
      throw new Error('El código del comportamiento no es válido. Revisá el contenido.');
    }
    throw new Error(
      datos.error ||
      (typeof datos.detail === 'string' ? datos.detail : null) ||
      'No se pudo actualizar el comportamiento.'
    );
  }

  return datos;
}

export async function eliminarComportamiento(nombre) {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No se encontró el token de autenticación.');
  }

  let respuesta;

  try {
    respuesta = await fetch(
      `${API_URL}/api/comportamientos/${encodeURIComponent(nombre)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  } catch {
    throw new Error('Falló la conexión al servidor.');
  }

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(
      datos.error ||
      datos.detail ||
      'No se pudo eliminar el comportamiento.'
    );
  }

  return datos;
}