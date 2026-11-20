const API_URL = 'http://127.0.0.1:8000';

export async function crearJugador(nombre, stats, token) {
  const response = await fetch(`${API_URL}/api/jugadores`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: nombre,
      speed: stats.velocidad,
      strength: stats.fuerza,
      power: stats.potencia,
      agility: stats.agilidad,
      control: stats.control,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data.detail || 'Error al crear el jugador'
    );

    error.status = response.status;

    throw error;
  }

  return data;
}