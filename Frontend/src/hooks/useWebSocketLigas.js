import { useCallback, useEffect, useRef, useState } from 'react';

const DEMORA_RECONEXION = 3000;

function normalizarLiga(liga) {
    return {
        id: liga.id_liga ?? liga.id,
        nombre: liga.nombre,
        cantidadEquipos: liga.cantidad_equipos,
        cuposOcupados: liga.cupos_ocupados,
        duracionPartido: liga.duracion_partido,
        esPrivada: liga.es_privada,
        estadoLiga: liga.estado_liga ?? liga.estado ?? liga.status,
        enCurso: Boolean(liga.en_curso ?? liga.enCurso),
        clubes: liga.clubes ?? liga.clubes_inscriptos ?? [],
        fechas: liga.fechas ?? [],
        actualizacionesPartido: liga.actualizacionesPartido ?? {},
    };
}

export default function useWebSocketLigas(idLiga = null) {
    const [ligas, setLigas] = useState([]);
    const [estado, setEstado] = useState('conectando');
    const [error, setError] = useState(null);
    const [listadoRecibido, setListadoRecibido] = useState(false);

    const socketRef = useRef(null);
    const reintentoRef = useRef(null);
    const desmontadoRef = useRef(false);

    const procesarMensaje = useCallback((data) => {
        switch (data.tipo) {
            case 'snapshot_liga': {
                if (String(data.id_liga) !== String(idLiga) || !data.liga) return;

                setLigas([normalizarLiga({
                    ...data.liga,
                    clubes: data.lista_liga ?? [],
                    cupos_ocupados: data.cupos_ocupados,
                })]);
                setListadoRecibido(true);
                setError(null);
                setEstado('conectado');
                break;
            }

            case 'listado': {
                // El snapshot reemplaza la lista completa.
                if (!Array.isArray(data.ligas)) {
                    setError('El listado de ligas recibido no tiene un formato válido.');
                    setEstado('error');
                    return;
                }

                setLigas(data.ligas.map(normalizarLiga));
                setListadoRecibido(true);
                setError(null);
                setEstado('conectado');
                break;
            }

            case 'evento_liga_creada': {
                const liga = data.liga ?? data;
                const nuevaLiga = normalizarLiga(liga);

                setLigas((actuales) => {
                    const yaExiste = actuales.some(
                        (actual) => String(actual.id) === String(nuevaLiga.id)
                    );

                    if (yaExiste) {
                        return actuales.map((actual) =>
                            String(actual.id) === String(nuevaLiga.id)
                                ? nuevaLiga
                                : actual
                        );
                    }

                    return [...actuales, nuevaLiga];
                });
                break;
            }

            case 'evento_liga_actualizada': {
                setLigas((actuales) =>
                    actuales.map((liga) =>
                        String(liga.id) === String(data.id_liga)
                            ? {
                                ...liga,
                                cuposOcupados: data.cupos_ocupados,
                                ...(data.estado_liga !== undefined || data.estado !== undefined
                                    ? { estadoLiga: data.estado_liga ?? data.estado }
                                    : {}),
                                ...(data.en_curso !== undefined || data.enCurso !== undefined
                                    ? { enCurso: Boolean(data.en_curso ?? data.enCurso) }
                                    : {}),
                                ...(data.clubes !== undefined || data.clubes_inscriptos !== undefined
                                    ? { clubes: data.clubes ?? data.clubes_inscriptos }
                                    : {}),
                                ...(data.lista_liga !== undefined
                                    ? { clubes: data.lista_liga }
                                    : {}),
                                ...(data.fechas !== undefined
                                    ? { fechas: data.fechas }
                                    : {}),
                            }
                            : liga
                    )
                );
                break;
            }

            case 'evento_partido_liga': {
                if (String(data.id_liga) !== String(idLiga) || data.id_partido == null) return;

                setLigas((actuales) => actuales.map((liga) => (
                    String(liga.id) === String(data.id_liga)
                        ? {
                            ...liga,
                            actualizacionesPartido: {
                                ...liga.actualizacionesPartido,
                                [String(data.id_partido)]: {
                                    marcador: data.marcador,
                                    finalizado: data.estado === 'FINALIZADO',
                                },
                            },
                        }
                        : liga
                )));
                break;
            }

            case 'evento_liga_no_disponible': {
                setLigas((actuales) =>
                    actuales.filter(
                        (liga) => String(liga.id) !== String(data.id_liga)
                    )
                );
                break;
            }

            default:
                console.warn('Evento de ligas desconocido:', data.tipo);
        }
    }, [idLiga]);

    // Manejo de la conexión WebSocket y la reconexión automática.
    useEffect(() => {
        desmontadoRef.current = false;

        const token = localStorage.getItem('token');

        if (!token) {
            setEstado('error');
            setError('No se encontró el token de autenticación.');
            return;
        }

        // Establece la conexión WebSocket y manejar los eventos.
        const conectar = () => {
            // Si el componente se ha desmontado mientras se esperaba para reconectar, no se intenta abrir un nuevo socket.
            if (desmontadoRef.current) return;

            setEstado('conectando');          

            const ruta = idLiga == null
                ? '/ws/ligas'
                : `/ws/ligas/${encodeURIComponent(idLiga)}`;
            const url = `ws://localhost:8000${ruta}?token=${encodeURIComponent(token)}`;
            const socket = new WebSocket(url);
            socketRef.current = socket;

            // Cuando el socket se abre, se marca el estado como conectando y se limpia cualquier error previo.
            socket.onopen = () => {
                if (desmontadoRef.current) {
                    socket.close();
                    return;
                }

                // El listado inicial todavía debe llegar desde el servidor.
                setEstado('conectando');
                setError(null);
            };

            // El socket recibe mensajes del servidor y los procesa según su tipo.
            socket.onmessage = (evento) => {
                if (desmontadoRef.current) return;

                try {
                    const data = JSON.parse(evento.data);
                    procesarMensaje(data);
                } catch {
                    setError('No se pudo interpretar un mensaje del canal de ligas.');
                }
            };

            // Si ocurre un error en la conexión, se marca el estado como error y se muestra un mensaje.
            socket.onerror = () => {
                if (!desmontadoRef.current) {
                    setEstado('error');
                    setError('No se pudo establecer la conexión con el canal de ligas.');
                }
            };

            // Si la conexión se cierra, se intenta reconectar después de un tiempo.
            socket.onclose = () => {
                if (socketRef.current === socket) {
                    socketRef.current = null;
                }

                if (desmontadoRef.current) return;

                setEstado('reconectando');
                reintentoRef.current = setTimeout(conectar, DEMORA_RECONEXION);
            };
        };
        // Inicia la primera conexión al montar el componente.
        conectar();

        // Limpieza al desmontar el componente: cierra el socket y cancela cualquier reintento pendiente.
        return () => {
            desmontadoRef.current = true;
            clearTimeout(reintentoRef.current);

            const socket = socketRef.current;
            socketRef.current = null;

            if(socket){
                socket.onclose = null;
                socket.onerror = null;

                if(socket.readyState === WebSocket.CONNECTING){
                    socket.onopen = () => socket.close();
                }
                else if (socket.readyState === WebSocket.OPEN){
                    socket.close();
                }
            }
        };
    }, [idLiga, procesarMensaje]);

    // retorna el estado de la conexión, el listado de ligas y cualquier error que haya ocurrido.
    return {
        ligas,
        estado,
        error,
        listadoRecibido,
    };
}
