// Estructura de los mensajes que se envían desde el servidor al cliente durante un partido en tiempo real por websocket
/**
 * @typedef {{ id: number, nombre: string }} ClubPartido
 * @typedef {{ x: number, y: number, vx?: number, vy?: number }} PelotaPartido
 * @typedef {{ id: number, nombre: string, equipo: number, x: number, y: number, cooldown_pateo?: number }} JugadorPartido
 * @typedef {{
*   tipo: 'ESTADO_PARTIDO',
*   tick: number,
*   ticks_totales: number,
*   marcador: [number, number],
*   clubes: { local: ClubPartido, visitante: ClubPartido },
*   pelota: PelotaPartido,
*   jugadores: JugadorPartido[],
*   cancha: { ancho: number, alto: number }
* }} EstadoPartido
* @typedef {{ tipo: 'ERROR_PARTIDO', mensaje: string }} ErrorPartido
* @typedef {{ tipo: 'PARTIDO_FINALIZADO' }} PartidoFinalizado
* @typedef {EstadoPartido | ErrorPartido | PartidoFinalizado} MensajePartido
*/

export {};
