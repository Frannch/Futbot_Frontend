const API_URL = 'http://127.0.0.1:8000';

export async function solicitarCambioPartido(idPartido, cambio) {
  if (!idPartido) {
    throw new Error('No se encontró el ID del partido.');
  }

  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No se encontró el token de autenticación.');
  }

  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}/api/partidos/${idPartido}/sustituciones`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cambio),
    });
  } catch {
    throw new Error('Falló la conexión al servidor.');
  }

  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new Error(datos.detail || 'No se pudo solicitar el cambio.');
  }

  return datos;
}

export async function cambiarComportamientoJugador(idPartido, idJugador, idComportamiento) {
  if (!idPartido) {
    throw new Error('No se encontró el ID del partido.');
  }

  if (!idJugador || !idComportamiento) {
    throw new Error('Se requiere el jugador y el comportamiento.');
  }

  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No se encontró el token de autenticación.');
  }

  let respuesta;
  try {
    respuesta = await fetch(
      `${API_URL}/api/partidos/${idPartido}/jugadores/${idJugador}/comportamiento`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id_comportamiento: Number(idComportamiento) }),
      }
    );
  } catch {
    throw new Error('Falló la conexión al servidor.');
  }

  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new Error(
      datos.detail ||
      datos.error ||
      'No se pudo actualizar el comportamiento.'
    );
  }

  return datos;
}
