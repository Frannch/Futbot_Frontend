const API_URL = 'http://127.0.0.1:8000';

export async function obtenerLigas() {
    const token = localStorage.getItem('token');

    if (!token) {
        throw new Error('No se encontró el token de autenticación.');
    }

    let respuesta;

    try {
        respuesta = await fetch(`${API_URL}/api/ligas`, {
            headers: { Authorization: `Bearer ${token}` }
        });
    } catch {
        throw new Error('Falló la conexión al servidor.');
    }

    const datos = await respuesta.json().catch(() => ({}));
    console.log('Datos obtenidos de la API de ligas:', datos.lista_liga);

    if (!respuesta.ok) {
        throw new Error(
            datos.error ||
            datos.detail ||
            'No se pudieron obtener las ligas.'
        );
    }

    if (!Array.isArray(datos.lista_liga)) {
        throw new Error(
            'La respuesta de ligas no tiene un formato válido.'
        );
    }

    return datos.lista_liga.map((liga) => ({
        id: liga.id,
        name: liga.name,
        duracion_partido: liga.duracion_partido,
        maxima_cantidad_clubes: liga.maxima_cantidad_clubes,
        cantidad_de_equipos_insc: liga.cantidad_de_equipos_insc,
        tipo: liga.tipo
    }));
}