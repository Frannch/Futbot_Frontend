const API_URL = 'http://127.0.0.1:8000';

// Función para abandonar la liga por medio de una solicitud PUT "/{id_liga}/{id_usuario}", 
// donde {id_liga} es el ID de la liga y {id_usuario} es el ID del usuario que desea abandonar la liga.
export async function abandonarLiga(id_liga, id_usuario, token) {
  const response = await fetch(`${API_URL}/api/ligas/${id_liga}/${id_usuario}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data.detail || 'Error al abandonar la liga'
    );
    error.status = response.status;

    throw error;
  }

  return data;
}