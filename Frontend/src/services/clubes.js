const API_URL = 'http://127.0.0.1:8000';

export async function obtenerClubes() {
  const token = localStorage.getItem('token');
  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}/api/clubes`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  } catch {
    throw new Error('Falló la conexión al servidor.');
  }
  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(datos.error || 'No se pudieron obtener los clubes.');
  }

  if (!Array.isArray(datos)) {
    throw new Error('La respuesta de clubes no tiene un formato válido.');
  }

  return datos.map((club) => ({
    id_club: club.id_club ?? club.id,
    nombre: club.nombre ?? club.name,
    
  }));
}

export async function obtenerClubPorId(idClub) {
  if (!idClub) {
    throw new Error('No se encontró el ID del club.');
  }

  const token = localStorage.getItem('token');
  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}/api/clubes/${idClub}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  } catch {
    throw new Error('Falló la conexión al servidor.');
  }

  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new Error(datos.error || datos.detail || 'No se pudo obtener el club.');
  }

  const nombre = datos.nombre_club ?? datos.nombre ?? datos.name;
  if (!nombre) {
    throw new Error('La respuesta del club no tiene un nombre válido.');
  }

  return {
    id_club: datos.id_club ?? datos.id ?? Number(idClub),
    nombre,
  };
}
export async function obtenerJugadores() {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No se encontró el token de autenticación.');
  }

  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}/api/jugadores`, {
    headers: { Authorization: `Bearer ${token}` }
    });
  } catch {
    throw new Error('Falló la conexión al servidor.');
  }
  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(datos.error || 'No se pudieron obtener los jugadores de tu club.');
  }

  if (!Array.isArray(datos)) {
    throw new Error('La respuesta de jugadores no tiene un formato válido.');
  }

  // Mapeamos id -> id_jugador y name -> nombre para SelectorConvocatoria
  return datos.map((jugador) => ({
    id_jugador: jugador.id,
    nombre: jugador.name,
    club_id: jugador.club_id,
    skills: {
      speed: jugador.speed,
      strength: jugador.strength,
      power: jugador.power,
      agility: jugador.agility,
      control: jugador.control,
    },
  }));
}

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
    throw new Error(datos.error || datos.detail || 'No se pudieron obtener los comportamientos.');
  }

  if (!Array.isArray(datos.comportamientos)) {
    throw new Error('La respuesta de comportamientos no tiene un formato válido.');
  }

  return datos.comportamientos.map((comportamiento) => ({
    id_comportamiento: comportamiento.id_comportamiento ?? comportamiento.id,
    nombre: comportamiento.nombre ?? comportamiento.name
  }));
}

export async function solicitarAmistoso(idClubRival, convocatoria) {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No se encontró el token de autenticación.');
  }

  let respuesta;
  try {
    respuesta = await fetch(
    `${API_URL}/api/clubes/${idClubRival}/amistosos/solicitar`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(convocatoria)
    }
    );
  } catch {
    throw new Error('Falló la conexión al servidor.');
  }
  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(datos.error || 'No se pudo enviar la solicitud de amistoso.');
  }

  return datos;
}

export async function obtenerInvitacionesPendientes() {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No se encontró el token de autenticación.');
  }

  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}/api/amistosos/solicitudes/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch {
    throw new Error('Falló la conexión al servidor.');
  }

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(datos.error || datos.detail || 'No se pudieron obtener las invitaciones pendientes.');
  }

  if (!Array.isArray(datos.lista_amistosos)) {
    throw new Error('La respuesta de invitaciones no tiene un formato válido.');
  }

  return datos.lista_amistosos;
}

export function normalizarLogo(logo) {
  if (!logo || logo.startsWith('http')) return logo;

  return `${API_URL}/${logo.replace(/^\/+/, '')}`;
}

export async function aceptarAmistoso(idSolicitud, convocatoria) {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No se encontró el token de autenticación.');
  }
  // usamos let para poder reaisgnar la variable en try catch
  let respuesta;
  try {
    respuesta = await fetch(
      `${API_URL}/api/amistosos/solicitudes/${idSolicitud}/aceptar`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(convocatoria)
      }
    );
  } catch {
    throw new Error('Falló la conexión al servidor.');
  }

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    // 404 = la solicitud expiró o no existe, 409 = ya fue respondida
    if (respuesta.status === 404) {
      throw new Error('La invitación ya expiró o no existe.');
    }
    if (respuesta.status === 409) {
      throw new Error('Esta invitación ya fue respondida.');
    }
    const detalle = datos.detail;
    const mensajeDetalle = typeof detalle === 'string'
      ? detalle
      : Array.isArray(detalle)
        ? detalle.map((item) => {
          const campo = Array.isArray(item?.loc)
            ? item.loc.filter((parte) => parte !== 'body').join('.')
            : '';
          const texto = item?.msg || item?.error || item?.message;
          const valor = Object.hasOwn(item ?? {}, 'input')
            ? ` (recibido: ${JSON.stringify(item.input)})`
            : '';
          return texto ? `${campo ? `${campo}: ` : ''}${texto}${valor}` : '';
        }).filter(Boolean).join(' ')
        : detalle?.error || detalle?.message;
    const mensajeError = typeof datos.error === 'string'
      ? datos.error
      : datos.error?.message || mensajeDetalle;
    throw new Error(mensajeError || 'No se pudo aceptar el desafío.');
  }

  return datos;
}

export async function rechazarAmistoso(idSolicitud) {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No se encontró el token de autenticación.');
  }

  let respuesta;
  try {
    respuesta = await fetch(
      `${API_URL}/api/amistosos/solicitudes/${idSolicitud}/rechazar`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      }
    );
  } catch {
    throw new Error('Falló la conexión al servidor.');
  }

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    if (respuesta.status === 404) {
      throw new Error('La invitación ya expiró o no existe.');
    }
    throw new Error(datos.error || datos.detail || 'No se pudo rechazar el desafío.');
  }

  return datos;
}