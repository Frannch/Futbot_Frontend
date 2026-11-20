import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import FakeWebSocket from '../mocks/FakeWebSocket';
import PartidosEnVivo, { usuarioParticipaEnPartido } from '../pages/PartidosEnVivo.jsx';

const { obtenerDatosDireccionLigaMock } = vi.hoisted(() => ({
  obtenerDatosDireccionLigaMock: vi.fn(),
}));

vi.mock('../components/Header.jsx', () => ({
  default: () => <header>Header</header>,
}));

vi.mock('../services/ligas.js', () => ({
  obtenerDatosDireccionLiga: obtenerDatosDireccionLigaMock,
}));

const partidoInicial = {
  id_partido: 15,
  tipo: 'liga',
  club_local: { nombre: 'Madrid' },
  club_visitante: { nombre: 'Barcelona' },
  marcador: [0, 0],
};

function abrirUltimoSocket() {
  const socket = FakeWebSocket.instances.at(-1);
  act(() => socket.open());
  return socket;
}

describe('PartidosEnVivo', () => {
  beforeEach(() => {
    FakeWebSocket.reiniciar();
    vi.stubGlobal('WebSocket', FakeWebSocket);
    localStorage.setItem('token', 'token-de-prueba');
    obtenerDatosDireccionLigaMock.mockReset();
    obtenerDatosDireccionLigaMock.mockResolvedValue({
      convocatoria: [],
      jugadores: [],
      comportamientos: [],
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('muestra el snapshot inicial con los nombres y el marcador', () => {
    render(<PartidosEnVivo />);
    const listado = abrirUltimoSocket();

    act(() => listado.recibirMensaje({
      tipo: 'PARTIDOS_EN_VIVO',
      partidos: [partidoInicial],
    }));

    expect(screen.getByText('Madrid')).toBeInTheDocument();
    expect(screen.getByText('Barcelona')).toBeInTheDocument();
    expect(screen.getByLabelText('Marcador')).toHaveTextContent('0 - 0');
    expect(screen.getByRole('button', { name: 'Espectar partido' })).toBeInTheDocument();
  });

  it('identifica si el usuario pertenece a los jugadores del partido', () => {
    const partido = {
      jugadores: [{ id_jugador: 8, id_usuario: 42 }],
    };

    expect(usuarioParticipaEnPartido(partido, 42)).toBe(true);
    expect(usuarioParticipaEnPartido(partido, 99)).toBe(false);
  });

  it('identifica al DT de una liga aunque no aparezca como jugador', () => {
    const partido = {
      tipo: 'liga',
      convocatorias: {
        0: {
          id_usuario_dt: 42,
          jugadores: [
            { id_jugador: 8, nombre: 'Jugador local', rol: 'titular' },
          ],
        },
        1: {
          id_entrenador: 77,
          jugadores: [],
        },
      },
    };

    expect(usuarioParticipaEnPartido(partido, 42)).toBe(true);
    expect(usuarioParticipaEnPartido(partido, 77)).toBe(true);
    expect(usuarioParticipaEnPartido(partido, 99)).toBe(false);
  });

  it('identifica al usuario por el club que tiene guardado en sesión', () => {
    const partido = {
      club_local: { id: 12, nombre: 'Club local' },
      club_visitante: { id: 15, nombre: 'Club visitante' },
    };

    expect(usuarioParticipaEnPartido(partido, 'usuario-2', '15')).toBe(true);
    expect(usuarioParticipaEnPartido(partido, 'usuario-2', '99')).toBe(false);
  });

  it('muestra Dirigir para el club del usuario en el catálogo', () => {
    localStorage.setItem('userId', 'usuario-2');
    localStorage.setItem('clubId', '15');
    render(<PartidosEnVivo />);
    const listado = abrirUltimoSocket();

    act(() => listado.recibirMensaje({
      tipo: 'PARTIDOS_EN_VIVO',
      partidos: [{
        ...partidoInicial,
        club_local: { id: 12, nombre: 'Madrid' },
        club_visitante: { id: 15, nombre: 'Barcelona' },
      }],
    }));

    expect(screen.getByRole('button', { name: 'Dirigir partido' })).toBeInTheDocument();
  });

  it('marca como Dirigir el partido en el que participa el usuario', () => {
    localStorage.setItem('userId', '42');
    render(<PartidosEnVivo />);
    const listado = abrirUltimoSocket();

    act(() => listado.recibirMensaje({
      tipo: 'PARTIDOS_EN_VIVO',
      partidos: [{
        ...partidoInicial,
        jugadores: [{ id_usuario: 42, id_jugador: 8 }],
      }],
    }));

    expect(screen.getByRole('button', { name: 'Dirigir partido' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Espectar partido' })).not.toBeInTheDocument();
  });

  it('actualiza el marcador cuando llega un tick del partido', () => {
    render(<PartidosEnVivo />);
    const listado = abrirUltimoSocket();

    act(() => listado.recibirMensaje({
      tipo: 'PARTIDOS_EN_VIVO',
      partidos: [partidoInicial],
    }));
    const partido = abrirUltimoSocket();

    act(() => partido.recibirMensaje({
      tipo: 'PARTIDO_TICK',
      tick: 10,
      marcador: [1, 0],
    }));

    expect(screen.getByLabelText('Marcador')).toHaveTextContent('1 - 0');
    expect(screen.getByRole('button', { name: 'Espectar partido' })).toBeInTheDocument();
  });

  it('renderiza la cancha con alineaciones en el formato del backend', () => {
    render(<PartidosEnVivo />);
    const listado = abrirUltimoSocket();

    act(() => listado.recibirMensaje({
      tipo: 'PARTIDOS_EN_VIVO',
      partidos: [partidoInicial],
    }));
    const partido = abrirUltimoSocket();

    act(() => partido.recibirMensaje({
      tipo: 'PARTIDO_INICIAL',
      id_partido: 15,
      clubes: {
        local: { id: 1, nombre: 'Madrid' },
        visitante: { id: 2, nombre: 'Barcelona' },
      },
      alineaciones: {
        local: { titulares: [1], suplentes: [2] },
        visitante: { titulares: [3], suplentes: [4] },
      },
    }));

    act(() => screen.getByRole('button', { name: 'Espectar partido' }).click());

    expect(screen.getByLabelText('Cancha de fútbol y posiciones de jugadores')).toBeInTheDocument();
  });

  it('permite dejar de ver y volver a Mi Club antes de finalizar', () => {
    const cambiarPantalla = vi.fn();
    render(<PartidosEnVivo cambiarPantalla={cambiarPantalla} />);
    const listado = abrirUltimoSocket();

    act(() => listado.recibirMensaje({
      tipo: 'PARTIDOS_EN_VIVO',
      partidos: [partidoInicial],
    }));
    const partido = abrirUltimoSocket();

    act(() => partido.recibirMensaje({
      tipo: 'PARTIDO_ESTADO',
      id_partido: 15,
      clubes: {
        local: { nombre: 'Madrid' },
        visitante: { nombre: 'Barcelona' },
      },
      cancha: { ancho: 100, alto: 60 },
      jugadores: [],
      pelota: { x: 50, y: 30 },
      marcador: [0, 0],
    }));
    act(() => screen.getByRole('button', { name: 'Espectar partido' }).click());
    act(() => screen.getByRole('button', { name: 'Dejar de ver' }).click());

    expect(cambiarPantalla).toHaveBeenCalledWith('mi-club');
    expect(screen.getByRole('button', { name: 'Espectar partido' })).toBeInTheDocument();
  });

  it('muestra los controles al dirigir un partido del club del usuario', () => {
    localStorage.setItem('userId', 'usuario-2');
    localStorage.setItem('clubId', '15');
    render(<PartidosEnVivo />);
    const listado = abrirUltimoSocket();

    act(() => listado.recibirMensaje({
      tipo: 'PARTIDOS_EN_VIVO',
      partidos: [{
        ...partidoInicial,
        club_local: { id: 12, nombre: 'Madrid' },
        club_visitante: { id: 15, nombre: 'Barcelona' },
      }],
    }));
    const partido = abrirUltimoSocket();

    act(() => partido.recibirMensaje({
      tipo: 'PARTIDO_ESTADO',
      id_partido: 15,
      clubes: {
        local: { id: 12, nombre: 'Madrid' },
        visitante: { id: 15, nombre: 'Barcelona' },
      },
      cancha: { ancho: 100, alto: 60 },
      jugadores: [],
      pelota: { x: 50, y: 30 },
      marcador: [0, 0],
    }));
    act(() => screen.getByRole('button', { name: 'Dirigir partido' }).click());

    expect(screen.getByRole('heading', { name: 'Comportamiento de jugadores' }))
      .toBeInTheDocument();
  });

  it('mantiene el modo espectador sin controles ni nombres privados', () => {
    render(<PartidosEnVivo />);
    const listado = abrirUltimoSocket();

    act(() => listado.recibirMensaje({
      tipo: 'PARTIDOS_EN_VIVO',
      partidos: [partidoInicial],
    }));
    const partido = abrirUltimoSocket();

    act(() => partido.recibirMensaje({
      tipo: 'PARTIDO_ESTADO',
      id_partido: 15,
      clubes: {
        local: { id: 1, nombre: 'Madrid' },
        visitante: { id: 2, nombre: 'Barcelona' },
      },
      cancha: { ancho: 100, alto: 60 },
      jugadores: [
        { id: 1, nombre: 'Nombre privado local', equipo: 0, x: 20, y: 30 },
        { id: 2, nombre: 'Nombre privado rival', equipo: 1, x: 80, y: 30 },
      ],
      pelota: { x: 50, y: 30 },
      marcador: [0, 0],
    }));
    act(() => screen.getByRole('button', { name: 'Espectar partido' }).click());

    const titles = Array.from(document.querySelectorAll('svg title'))
      .map((title) => title.textContent);
    expect(titles).toContain('Jugador 1');
    expect(titles).toContain('Jugador 2');
    expect(titles).not.toContain('Nombre privado local');
    expect(titles).not.toContain('Nombre privado rival');
    expect(screen.queryByRole('heading', { name: 'Comportamiento de jugadores' }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Cambio de jugador' }))
      .not.toBeInTheDocument();
    expect(obtenerDatosDireccionLigaMock).not.toHaveBeenCalled();
  });

  it('al dirigir carga el plantel propio y deja al rival identificado por ID', async () => {
    localStorage.setItem('userId', 'usuario-2');
    localStorage.setItem('clubId', '15');
    obtenerDatosDireccionLigaMock.mockResolvedValue({
      convocatoria: [
        { id_jugador: 1, nombre: 'Jugador propio', rol: 'titular' },
      ],
      jugadores: [
        { id_jugador: 1, nombre: 'Jugador propio', rol: 'titular' },
      ],
      comportamientos: [{ id_comportamiento: 4, nombre: 'Presionar' }],
    });

    render(<PartidosEnVivo />);
    const listado = abrirUltimoSocket();

    act(() => listado.recibirMensaje({
      tipo: 'PARTIDOS_EN_VIVO',
      partidos: [{
        ...partidoInicial,
        id_liga: 3,
        club_local: { id: 12, nombre: 'Madrid' },
        club_visitante: { id: 15, nombre: 'Barcelona' },
      }],
    }));
    const partido = abrirUltimoSocket();

    act(() => partido.recibirMensaje({
      tipo: 'PARTIDO_ESTADO',
      id_partido: 15,
      id_liga: 3,
      clubes: {
        local: { id: 12, nombre: 'Madrid' },
        visitante: { id: 15, nombre: 'Barcelona' },
      },
      cancha: { ancho: 100, alto: 60 },
      jugadores: [
        { id: 1, equipo: 0, x: 20, y: 30 },
        { id: 2, nombre: 'Nombre rival', equipo: 1, x: 80, y: 30 },
      ],
      pelota: { x: 50, y: 30 },
      marcador: [0, 0],
    }));
    act(() => screen.getByRole('button', { name: 'Dirigir partido' }).click());

    await waitFor(() => {
      expect(obtenerDatosDireccionLigaMock).toHaveBeenCalledWith(3);
    });
    const titles = Array.from(document.querySelectorAll('svg title'))
      .map((title) => title.textContent);
    expect(titles).toContain('Jugador propio');
    expect(titles).toContain('Jugador 2');
    expect(titles).not.toContain('Nombre rival');
    expect(screen.getByRole('heading', { name: 'Comportamiento de jugadores' }))
      .toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Cambio de jugador' }))
      .toBeInTheDocument();

    act(() => partido.recibirMensaje({
      tipo: 'PARTIDO_TICK',
      id_partido: 15,
      id_liga: 3,
      tick: 11,
      jugadores: [
        { id: 1, equipo: 0, x: 25, y: 30 },
        { id: 2, equipo: 1, x: 75, y: 30 },
      ],
    }));
    expect(obtenerDatosDireccionLigaMock).toHaveBeenCalledTimes(1);
  });

  it('muestra el aviso de pausa a los espectadores', () => {
    render(<PartidosEnVivo />);
    const listado = abrirUltimoSocket();

    act(() => listado.recibirMensaje({
      tipo: 'PARTIDOS_EN_VIVO',
      partidos: [partidoInicial],
    }));
    const partido = abrirUltimoSocket();

    act(() => partido.recibirMensaje({
      tipo: 'PARTIDO_ESTADO',
      id_partido: 15,
      tick: 20,
      ticks_totales: 100,
      clubes: {
        local: { nombre: 'Madrid' },
        visitante: { nombre: 'Barcelona' },
      },
      cancha: { ancho: 100, alto: 60 },
      jugadores: [],
      pelota: { x: 50, y: 30 },
      marcador: [0, 0],
    }));
    act(() => partido.recibirMensaje({
      tipo: 'PARTIDO_PAUSADO',
      tick: 20,
      duracion_pausa_segundos: 10,
    }));
    act(() => screen.getByRole('button', { name: 'Espectar partido' }).click());

    expect(screen.getByRole('status')).toHaveTextContent('Cooling Break #1');
    expect(screen.getByText('Realizando sustituciones')).toBeInTheDocument();
  });

  it('elimina la tarjeta cuando recibe PARTIDO_NO_DISPONIBLE', () => {
    render(<PartidosEnVivo />);
    const listado = abrirUltimoSocket();

    act(() => listado.recibirMensaje({
      tipo: 'PARTIDOS_EN_VIVO',
      partidos: [partidoInicial],
    }));
    expect(screen.getByText('Madrid')).toBeInTheDocument();

    act(() => listado.recibirMensaje({
      tipo: 'PARTIDO_NO_DISPONIBLE',
      id_partido: 15,
    }));

    expect(screen.queryByText('Madrid')).not.toBeInTheDocument();
    expect(screen.getByText('No hay partidos en vivo para mostrar.')).toBeInTheDocument();
  });
});
