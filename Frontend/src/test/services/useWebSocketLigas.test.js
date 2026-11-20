import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import FakeWebSocket from '../../mocks/FakeWebSocket';
import useWebSocketLigas from '../../hooks/useWebSocketLigas';

const ligaInicial = {
    id_liga: 1,
    nombre: 'Copa de prueba',
    cantidad_equipos: 8,
    cupos_ocupados: 3,
    duracion_partido: 10,
    es_privada: false,
};

const ligaNueva = {
    id_liga: 2,
    nombre: 'Liga privada',
    cantidad_equipos: 4,
    cupos_ocupados: 1,
    duracion_partido: 15,
    es_privada: true,
};

function conectarSocket() {
    const socket = FakeWebSocket.instances.at(-1);
    act(() => { socket.open(); });
    return socket;
}

function enviarListado(socket, ligas) {
    act(() => { socket.recibirMensaje({ tipo: 'listado', ligas, }); });
}

describe('useWebSocketLigas', () => {
    beforeEach(() => {
        FakeWebSocket.reiniciar();
        localStorage.setItem('token', 'token-falso-de-prueba');
        vi.stubGlobal('WebSocket', FakeWebSocket);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
        localStorage.clear();
    });

    it('se conecta al canal de ligas usando el token', () => {
        renderHook(() => useWebSocketLigas());

        expect(FakeWebSocket.instances).toHaveLength(1);
        expect(FakeWebSocket.instances[0].url).toContain('ws://localhost:8000/ws/ligas?token=token-falso-de-prueba');
    });

    it('carga y actualiza los clubes desde el canal de una liga', () => {
        const { result } = renderHook(() => useWebSocketLigas(9));
        const socket = conectarSocket();

        expect(socket.url).toContain('/ws/ligas/9?token=');

        act(() => {
            socket.recibirMensaje({
                tipo: 'snapshot_liga',
                id_liga: 9,
                cupos_ocupados: 1,
                liga: {
                    id_liga: 9,
                    nombre: 'Copa de prueba',
                    cantidad_equipos: 8,
                    duracion_partido: 10,
                    es_privada: false,
                },
                lista_liga: [{ name: 'Club Norte' }],
            });
        });

        expect(result.current.ligas[0].clubes).toEqual([{ name: 'Club Norte' }]);

        act(() => {
            socket.recibirMensaje({
                tipo: 'evento_liga_actualizada',
                id_liga: 9,
                cupos_ocupados: 2,
                lista_liga: [{ name: 'Club Norte' }, { name: 'Club Sur' }],
            });
        });

        expect(result.current.ligas[0].cuposOcupados).toBe(2);
        expect(result.current.ligas[0].clubes).toEqual([
            { name: 'Club Norte' },
            { name: 'Club Sur' },
        ]);
    });

    it('actualiza el estado de un partido recibido por la sala de la liga', () => {
        const { result } = renderHook(() => useWebSocketLigas(9));
        const socket = conectarSocket();
        act(() => {
            socket.recibirMensaje({
                tipo: 'snapshot_liga',
                id_liga: 9,
                liga: { id_liga: 9, nombre: 'Copa de prueba' },
            });
            socket.recibirMensaje({
                tipo: 'evento_partido_liga',
                id_liga: 9,
                id_partido: 901,
                marcador: [2, 1],
                estado: 'EN_VIVO',
            });
        });

        expect(result.current.ligas[0].actualizacionesPartido['901']).toEqual({
            marcador: [2, 1],
            finalizado: false,
        });
    });

    it('carga las ligas recibidas en el listado inicial', () => {
        const { result } = renderHook(() => useWebSocketLigas());
        const socket = conectarSocket();

        enviarListado(socket, [ligaInicial]);

        expect(result.current.listadoRecibido).toBe(true);
        expect(result.current.estado).toBe('conectado');
        expect(result.current.ligas).toEqual([
            {
                id: 1,
                nombre: 'Copa de prueba',
                cantidadEquipos: 8,
                cuposOcupados: 3,
                duracionPartido: 10,
                esPrivada: false,
                estadoLiga: undefined,
                enCurso: false,
                clubes: [],
                fechas: [],
                actualizacionesPartido: {},
            },
        ]);
        expect(result.current.error).toBeNull();
    });

    it('acepta un listado vacío sin considerarlo un error', () => {
        const { result } = renderHook(() => useWebSocketLigas());
        const socket = conectarSocket();

        enviarListado(socket, []);

        expect(result.current.listadoRecibido).toBe(true);
        expect(result.current.ligas).toEqual([]);
        expect(result.current.error).toBeNull();
        expect(result.current.estado).toBe('conectado');
    });

    it('agrega una liga cuando recibe evento_liga_creada', () => {
        const { result } = renderHook(() => useWebSocketLigas());
        const socket = conectarSocket();

        enviarListado(socket, [ligaInicial]);

        act(() => {
            socket.recibirMensaje({
                tipo: 'evento_liga_creada',
                liga: ligaNueva,
            });
        });

        expect(result.current.ligas).toHaveLength(2);
        expect(result.current.ligas[1]).toMatchObject({
            id: 2,
            nombre: 'Liga privada',
            cuposOcupados: 1,
            esPrivada: true,
        });
    });

    it('actualiza solamente los cupos de la liga indicada', () => {
        const { result } = renderHook(() => useWebSocketLigas());
        const socket = conectarSocket();

        enviarListado(socket, [ligaInicial, ligaNueva]);

        act(() => {
            socket.recibirMensaje({
                tipo: 'evento_liga_actualizada',
                id_liga: 1,
                cupos_ocupados: 7,
            });
        });

        expect(result.current.ligas[0].cuposOcupados).toBe(7);
        expect(result.current.ligas[1].cuposOcupados).toBe(1);
        expect(result.current.ligas).toHaveLength(2);
    });

    it('elimina una liga cuando deja de estar disponible', () => {
        const { result } = renderHook(() => useWebSocketLigas());
        const socket = conectarSocket();

        enviarListado(socket, [ligaInicial, ligaNueva]);

        act(() => {
            socket.recibirMensaje({
                tipo: 'evento_liga_no_disponible',
                id_liga: 1,
                motivo: 'completa',
            });
        });

        expect(result.current.ligas).toHaveLength(1);
        expect(result.current.ligas[0].id).toBe(2);
    });

    it('intenta reconectarse y acepta el nuevo snapshot', () => {
        vi.useFakeTimers();

        const { result } = renderHook(() => useWebSocketLigas());
        const primerSocket = conectarSocket();

        enviarListado(primerSocket, [ligaInicial]);

        act(() => {
            primerSocket.desconectar();
        });

        expect(result.current.estado).toBe('reconectando');

        act(() => {
            vi.advanceTimersByTime(3000);
        });

        expect(FakeWebSocket.instances).toHaveLength(2);

        const segundoSocket = conectarSocket();

        enviarListado(segundoSocket, [ligaNueva]);

        expect(result.current.estado).toBe('conectado');
        expect(result.current.ligas).toHaveLength(1);
        expect(result.current.ligas[0].id).toBe(2);
    });

    it('muestra un error si no existe un token', () => {
        localStorage.removeItem('token');

        const { result } = renderHook(() => useWebSocketLigas());

        expect(result.current.estado).toBe('error');
        expect(result.current.error).toContain('token');
        expect(FakeWebSocket.instances).toHaveLength(0);
    });
});
