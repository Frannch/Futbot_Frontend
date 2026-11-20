import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import FakeWebSocket from '../../mocks/FakeWebSocket.js';
import {
  combinarPelota,
  crearServicioPartidosEnVivo,
  normalizarOrdenPartido,
} from '../../services/partidosEnVivo.js';

const token = 'token-de-prueba';

function abrirUltimoSocket() {
  const socket = FakeWebSocket.instances.at(-1);
  act(() => socket.open());
  return socket;
}

describe('crearServicioPartidosEnVivo', () => {
  beforeEach(() => {
    FakeWebSocket.reiniciar();
    vi.stubGlobal('WebSocket', FakeWebSocket);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('conserva la posición de la pelota cuando el tick penal llega incompleto', () => {
    expect(combinarPelota({}, { x: 25, y: 18 })).toMatchObject({ x: 25, y: 18 });
    expect(combinarPelota({ posicion: { x: 70, y: 42 } }, { x: 25, y: 18 }))
      .toMatchObject({ x: 70, y: 42 });
  });

  it('mantiene un orden único de clubes, marcador y colores por sus IDs', () => {
    const partido = normalizarOrdenPartido({
      id_partido: 15,
      club_local: { id_club: 20, nombre: 'Madrid' },
      club_visitante: { id_club: 10, nombre: 'Barcelona' },
      marcador: [3, 1],
      jugadores: [
        { id: 1, equipo: 0 },
        { id: 2, equipo: 1 },
      ],
    });

    expect(partido.club_local.nombre).toBe('Barcelona');
    expect(partido.club_visitante.nombre).toBe('Madrid');
    expect(partido.marcador).toEqual([1, 3]);
    expect(partido.jugadores.map((jugador) => jugador.equipo)).toEqual([1, 0]);
  });

  it('usa los nombres como clave cuando el backend no envía IDs de clubes', () => {
    const partido = normalizarOrdenPartido({
      club_local: { nombre: 'Madrid' },
      club_visitante: { nombre: 'Barca' },
      marcador: [3, 1],
    });

    expect(partido.club_local.nombre).toBe('Barca');
    expect(partido.club_visitante.nombre).toBe('Madrid');
    expect(partido.marcador).toEqual([1, 3]);
  });

  it('conserva la orientación del snapshot aunque un tick llegue invertido', () => {
    const onPartidoActualizado = vi.fn();
    const desconectar = crearServicioPartidosEnVivo(token, { onPartidoActualizado });
    const listado = abrirUltimoSocket();

    act(() => listado.recibirMensaje({
      tipo: 'PARTIDOS_EN_VIVO',
      partidos: [{
        id_partido: 15,
        club_local: { nombre: 'Madrid' },
        club_visitante: { nombre: 'Barca' },
        marcador: [1, 0],
      }],
    }));
    const partido = abrirUltimoSocket();

    act(() => partido.recibirMensaje({
      tipo: 'PARTIDO_TICK',
      club_local: { nombre: 'Madrid' },
      club_visitante: { nombre: 'Barca' },
      marcador: [1, 0],
    }));

    expect(onPartidoActualizado.mock.calls[0][2]).toMatchObject({
      club_local: { nombre: 'Barca' },
      club_visitante: { nombre: 'Madrid' },
      marcador: [0, 1],
    });
    desconectar();
  });

  it('conecta el listado con el token y abre un socket por partido', () => {
    const onPartidosIniciales = vi.fn();
    const desconectar = crearServicioPartidosEnVivo(token, { onPartidosIniciales });
    const listado = abrirUltimoSocket();

    expect(listado.url).toBe(
      'ws://localhost:8000/websocket/partidos-en-vivo?token=token-de-prueba',
    );

    act(() => listado.recibirMensaje({
      tipo: 'PARTIDOS_EN_VIVO',
      partidos: [{ id_partido: 15, marcador: [1, 0] }],
    }));

    expect(onPartidosIniciales).toHaveBeenCalledWith([{ id_partido: 15, marcador: [1, 0] }]);
    expect(FakeWebSocket.instances).toHaveLength(2);
    expect(FakeWebSocket.instances[1].url).toBe(
      'ws://localhost:8000/websocket/partidos/15?token=token-de-prueba',
    );

    desconectar();
  });

  it('no duplica el socket cuando recibe dos notificaciones del mismo partido', () => {
    const desconectar = crearServicioPartidosEnVivo(token);
    const listado = abrirUltimoSocket();

    act(() => {
      listado.recibirMensaje({ tipo: 'PARTIDO_DISPONIBLE', id_partido: 15 });
      listado.recibirMensaje({ tipo: 'PARTIDO_DISPONIBLE', id_partido: 15 });
    });

    expect(FakeWebSocket.instances).toHaveLength(2);
    desconectar();
  });

  it('emite el estado inicial y los ticks del partido', () => {
    const onPartidoActualizado = vi.fn();
    const desconectar = crearServicioPartidosEnVivo(token, { onPartidoActualizado });
    const listado = abrirUltimoSocket();

    act(() => listado.recibirMensaje({ tipo: 'PARTIDO_DISPONIBLE', id_partido: 15 }));
    const partido = abrirUltimoSocket();

    act(() => partido.recibirMensaje({
      tipo: 'PARTIDO_INICIAL',
      clubes: {
        local: { nombre: 'Madrid' },
        visitante: { nombre: 'Barcelona' },
      },
      marcador: [0, 0],
    }));
    act(() => partido.recibirMensaje({
      tipo: 'PARTIDO_TICK',
      tick: 12,
      marcador: [1, 0],
    }));

    expect(onPartidoActualizado).toHaveBeenCalledTimes(2);
    expect(onPartidoActualizado.mock.calls[0][2]).toMatchObject({
      id_partido: 15,
      marcador: [0, 0],
    });

    expect(onPartidoActualizado.mock.calls[1][2]).toMatchObject({
      id_partido: 15,
      tick: 12,
      marcador: [1, 0],
    });

    desconectar();
  });

  it('no conserva jugadores del listado cuando el socket del partido comienza', () => {
    const onPartidoActualizado = vi.fn();
    const desconectar = crearServicioPartidosEnVivo(token, { onPartidoActualizado });
    const listado = abrirUltimoSocket();

    act(() => listado.recibirMensaje({
      tipo: 'PARTIDOS_EN_VIVO',
      partidos: [{
        id_partido: 15,
        jugadores: [{ id: 8, nombre: 'Jugador obsoleto' }],
        marcador: [0, 0],
      }],
    }));
    const partido = abrirUltimoSocket();

    act(() => partido.recibirMensaje({
      tipo: 'PARTIDO_TICK',
      tick: 10,
      marcador: [1, 0],
    }));

    expect(onPartidoActualizado.mock.calls[0][2].jugadores).toBeUndefined();
    desconectar();
  });

  it('mapea PARTIDO_INICIAL y PARTIDO_ESTADO a la tarjeta del partido', () => {
    const onPartidoActualizado = vi.fn();
    const desconectar = crearServicioPartidosEnVivo(token, { onPartidoActualizado });
    const listado = abrirUltimoSocket();

    act(() => listado.recibirMensaje({
      tipo: 'PARTIDOS_EN_VIVO',
      partidos: [{ id_partido: 12 }],
    }));
    const partido = abrirUltimoSocket();

    act(() => partido.recibirMensaje({
      tipo: 'PARTIDO_INICIAL',
      id_partido: 12,
      tick: 40,
      ticks_totales: 600,
      cancha: { ancho: 100, alto: 60 },
      clubes: {
        local: { id: 1, nombre: 'Club A' },
        visitante: { id: 2, nombre: 'Club B' },
      },
      alineaciones: {
        local: { titulares: [10], suplentes: [11] },
        visitante: { titulares: [20], suplentes: [21] },
      },
    }));
    act(() => partido.recibirMensaje({
      tipo: 'PARTIDO_ESTADO',
      tick: 41,
      ticks_totales: 600,
      marcador: [1, 0],
      jugadores: [],
      pelota: { x: 50, y: 30 },
    }));

    expect(onPartidoActualizado.mock.calls[0][2]).toMatchObject({
      id_partido: 12,
      tick: 40,
      club_local: { id: 1, nombre: 'Club A' },
      club_visitante: { id: 2, nombre: 'Club B' },
      alineaciones: {
        local: { titulares: [10], suplentes: [11] },
      },
    });
    expect(onPartidoActualizado.mock.calls[1][2]).toMatchObject({
      tick: 41,
      marcador: [1, 0],
    });
    desconectar();
  });

  it('elimina y cierra el socket cuando el partido deja de estar disponible o finaliza', () => {
    const onPartidoEliminado = vi.fn();
    const desconectar = crearServicioPartidosEnVivo(token, { onPartidoEliminado });
    const listado = abrirUltimoSocket();

    act(() => listado.recibirMensaje({ tipo: 'PARTIDO_DISPONIBLE', id_partido: 15 }));
    const partido = abrirUltimoSocket();

    act(() => listado.recibirMensaje({ tipo: 'PARTIDO_NO_DISPONIBLE', id_partido: 15 }));
    expect(partido.readyState).toBe(FakeWebSocket.CLOSED);
    expect(onPartidoEliminado).toHaveBeenCalledWith(15);

    act(() => listado.recibirMensaje({ tipo: 'PARTIDO_DISPONIBLE', id_partido: 15 }));
    const partidoNuevo = abrirUltimoSocket();
    act(() => partidoNuevo.recibirMensaje({ tipo: 'PARTIDO_FINALIZADO' }));

    expect(partidoNuevo.readyState).toBe(FakeWebSocket.CLOSED);
    expect(onPartidoEliminado).toHaveBeenCalledTimes(2);
    desconectar();
  });

  it('cierra el listado y todos los partidos al desconectar', () => {
    const desconectar = crearServicioPartidosEnVivo(token);
    const listado = abrirUltimoSocket();
    act(() => listado.recibirMensaje({ tipo: 'PARTIDO_DISPONIBLE', id_partido: 15 }));
    const partido = abrirUltimoSocket();

    desconectar();

    expect(listado.readyState).toBe(FakeWebSocket.CLOSED);
    expect(partido.readyState).toBe(FakeWebSocket.CLOSED);
  });
});
