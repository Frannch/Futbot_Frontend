import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebSocketProvider, useWebSocket } from '../services/websocket.jsx';

const {
  aceptarAmistosoMock,
  obtenerClubPorIdMock,
  obtenerComportamientosMock,
  obtenerInvitacionesPendientesMock,
  obtenerJugadoresMock,
  rechazarAmistosoMock,
  enviarCambioPartidoMock,
} = vi.hoisted(() => ({
  aceptarAmistosoMock: vi.fn(),
  obtenerClubPorIdMock: vi.fn(),
  obtenerComportamientosMock: vi.fn(),
  obtenerInvitacionesPendientesMock: vi.fn(),
  obtenerJugadoresMock: vi.fn(),
  rechazarAmistosoMock: vi.fn(),
  enviarCambioPartidoMock: vi.fn(),
}));

vi.mock('../services/clubes.js', () => ({
  aceptarAmistoso: aceptarAmistosoMock,
  obtenerClubPorId: obtenerClubPorIdMock,
  obtenerComportamientos: obtenerComportamientosMock,
  obtenerInvitacionesPendientes: obtenerInvitacionesPendientesMock,
  obtenerJugadores: obtenerJugadoresMock,
  rechazarAmistoso: rechazarAmistosoMock,
}));

vi.mock('../services/partidos.js', () => ({
  solicitarCambioPartido: enviarCambioPartidoMock,
}));

class WebSocketFalso {
  static CLOSED = 3;

  constructor(url) {
    this.url = url;
    this.readyState = 1;
    this.send = vi.fn();
    WebSocketFalso.instancias.push(this);
  }

  close() {
    this.readyState = WebSocketFalso.CLOSED;
    this.onclose?.();
  }
}

WebSocketFalso.instancias = [];

function Consumidor() {
  const {
    ws,
    conectarWebSocket,
    invitacionActual,
    resultadoSolicitud,
    partidoPausado,
    partidoFinalizado,
    modoPenales,
    resultadoPenales,
    rondaActualPenales,
    historialPenales,
    ganadorDefinicion,
    estadoPartido,
    convocatoriaPartido,
    jugadoresPartido,
    comportamientosPartido,
    rechazarInvitacion,
  } = useWebSocket();

  return (
    <>
      <output>{ws ? 'conectado' : 'desconectado'}</output>
      <output data-testid="invitacion-actual">{invitacionActual?.id_solicitud ?? ''}</output>
      <output data-testid="resultado-solicitud">{resultadoSolicitud?.evento ?? ''}</output>
      <output data-testid="partido-pausado">{String(partidoPausado)}</output>
      <output data-testid="partido-finalizado">{String(partidoFinalizado)}</output>
      <output data-testid="modo-penales">{String(modoPenales)}</output>
      <output data-testid="resultado-penales">{JSON.stringify(resultadoPenales)}</output>
      <output data-testid="ronda-penales">{String(rondaActualPenales ?? '')}</output>
      <output data-testid="historial-penales">{JSON.stringify(historialPenales)}</output>
      <output data-testid="ganador-definicion">{String(ganadorDefinicion ?? '')}</output>
      <output data-testid="marcador-reglamentario">{JSON.stringify(estadoPartido?.marcador_reglamentario ?? null)}</output>
      <output data-testid="convocatoria-partido">{JSON.stringify(convocatoriaPartido)}</output>
      <output data-testid="jugadores-partido">{JSON.stringify(jugadoresPartido)}</output>
      <output data-testid="comportamientos-partido">{JSON.stringify(comportamientosPartido)}</output>
      <button onClick={() => rechazarInvitacion({ id_solicitud: 43 })}>
        Rechazar desde lista
      </button>
      <button onClick={() => conectarWebSocket('usuario 1', 'token/de-prueba')}>
        Conectar
      </button>
    </>
  );
}



describe('WebSocketProvider', () => {
  beforeEach(() => {
    vi.stubGlobal('WebSocket', WebSocketFalso);
    WebSocketFalso.instancias = [];
    localStorage.clear();
    aceptarAmistosoMock.mockResolvedValue({ id_partido: 90 });
    obtenerClubPorIdMock.mockImplementation(async (idClub) => ({
      id_club: Number(idClub),
      nombre: `Club ${idClub}`,
    }));
    obtenerJugadoresMock.mockResolvedValue(
      Array.from({ length: 6 }, (_, index) => ({
        id_jugador: index + 1,
        nombre: `Jugador ${index + 1}`,
      }))
    );
    obtenerComportamientosMock.mockResolvedValue([
      { id_comportamiento: 1, nombre: 'Presionar' },
    ]);
    obtenerInvitacionesPendientesMock.mockResolvedValue([]);
    rechazarAmistosoMock.mockResolvedValue({ mensaje: 'Se rechazo con exito' });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('se reconecta al recargar con las credenciales guardadas y evita duplicar sockets', async () => {
    localStorage.setItem('token', 'token guardado');
    localStorage.setItem('userId', 'usuario 1');

    render(
      <WebSocketProvider pantallaActual="inicio">
        <Consumidor />
      </WebSocketProvider>
    );

    await waitFor(() => expect(screen.getByText('conectado')).toBeInTheDocument());
    expect(WebSocketFalso.instancias).toHaveLength(1);
    expect(WebSocketFalso.instancias[0].url).toBe(
      'ws://localhost:8000/ws/usuario 1?token=token%20guardado'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Conectar' }));
    expect(WebSocketFalso.instancias).toHaveLength(1);
  });

  it('recibe y muestra correctamente una invitación amistosa', async () => {
    render(
      <WebSocketProvider pantallaActual="inicio">
        <Consumidor />
      </WebSocketProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Conectar' }));

    const socket = WebSocketFalso.instancias[0];
    act(() => {
      socket.onmessage({
        data: JSON.stringify({
          tipo: 'NUEVA_SOLICITUD_AMISTOSO',
          id_solicitud: 42,
          mensaje: 'Club rival te desafió',
        }),
      });
    });

    expect(await screen.findByText('Club rival te desafió')).toBeInTheDocument();
    expect(screen.getByTestId('invitacion-actual')).toHaveTextContent('42');
    expect(screen.getByRole('button', { name: 'Aceptar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rechazar' })).toBeInTheDocument();
  });

  it('recupera invitaciones pendientes al conectar y muestra la más reciente', async () => {
    localStorage.setItem('token', 'token guardado');
    localStorage.setItem('userId', 'usuario 2');
    obtenerInvitacionesPendientesMock.mockResolvedValue([
      {
        id_solicitud: 41,
        id_club_retador: 3,
        nombre_club_retador: 'Club anterior',
        expira_en_segundos: 120,
      },
      {
        id_solicitud: 42,
        id_club_retador: 4,
        nombre_club_retador: 'Club nuevo',
        expira_en_segundos: 180,
      },
    ]);

    render(
      <WebSocketProvider pantallaActual="inicio">
        <Consumidor />
      </WebSocketProvider>
    );

    act(() => WebSocketFalso.instancias[0].onopen());

    expect(await screen.findByTestId('invitacion-actual')).toHaveTextContent('42');
    expect(await screen.findByText('El club Club 4 te ha retado.')).toBeInTheDocument();
    expect(obtenerInvitacionesPendientesMock).toHaveBeenCalledTimes(1);
  });

  it('activa el estado de pausa y lo limpia al reanudar el partido', async () => {
    render(
      <WebSocketProvider pantallaActual="inicio">
        <Consumidor />
      </WebSocketProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Conectar' }));

    const socket = WebSocketFalso.instancias[0];
    act(() => {
      socket.onmessage({ data: JSON.stringify({ tipo: 'PARTIDO_PAUSADO', tick: 150 }) });
    });

    expect(screen.getByTestId('partido-pausado')).toHaveTextContent('true');

    act(() => {
      socket.onmessage({ data: JSON.stringify({ tipo: 'PARTIDO_REANUDADO', tick: 150 }) });
    });
    expect(screen.getByTestId('partido-pausado')).toHaveTextContent('false');
  });

  it('acepta desde la notificación usando el ID recibido por WebSocket', async () => {
    render(
      <WebSocketProvider pantallaActual="inicio">
        <Consumidor />
      </WebSocketProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Conectar' }));

    act(() => {
      WebSocketFalso.instancias[0].onmessage({
        data: JSON.stringify({
          tipo: 'NUEVA_SOLICITUD_AMISTOSO',
          id_solicitud: 42,
          mensaje: 'Club rival te desafió',
        }),
      });
    });

    fireEvent.click(await screen.findByRole('button', { name: 'Aceptar' }));
    await screen.findByRole('dialog');

    [1, 2, 3].forEach((idJugador, index) => {
      fireEvent.change(screen.getByLabelText(`Jugador ${index + 1}`), {
        target: { value: String(idJugador) },
      });
      fireEvent.change(document.querySelector(`#comportamiento-titular-${index}`), {
        target: { value: 'Presionar' },
      });
    });
    [4, 5, 6].forEach((idJugador, index) => {
      fireEvent.change(screen.getByLabelText(`Suplente ${index + 1}`), {
        target: { value: String(idJugador) },
      });
    });

    fireEvent.click(screen.getByRole('button', { name: 'Aceptar desafío' }));

    await waitFor(() => {
      expect(aceptarAmistosoMock).toHaveBeenCalledWith(
        42,
        expect.objectContaining({
          formacion_tactica: 1,
          jugadores_convocados: expect.arrayContaining([
            { id_jugador: 1, rol: 'titular', comportamiento: 'Presionar' },
            { id_jugador: 4, rol: 'suplente', comportamiento: null },
          ]),
        })
      );
    });
    expect(JSON.parse(screen.getByTestId('convocatoria-partido').textContent)).toHaveLength(6);
    expect(JSON.parse(screen.getByTestId('jugadores-partido').textContent)).toHaveLength(6);
  });

  it('carga comportamientos cuando el emisor recibe la aceptación del amistoso', async () => {
    render(
      <WebSocketProvider pantallaActual="inicio">
        <Consumidor />
      </WebSocketProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Conectar' }));

    act(() => {
      WebSocketFalso.instancias[0].onmessage({
        data: JSON.stringify({
          evento: 'desafio_aceptado',
          id_partido: 90,
        }),
      });
    });

    await waitFor(() => expect(obtenerComportamientosMock).toHaveBeenCalledTimes(1));
    expect(JSON.parse(screen.getByTestId('comportamientos-partido').textContent)).toEqual([
      { id_comportamiento: 1, nombre: 'Presionar' },
    ]);
  });

  it('carga comportamientos al guardar la convocatoria del receptor', async () => {
    render(
      <WebSocketProvider pantallaActual="inicio">
        <Consumidor />
      </WebSocketProvider>
    );

    const consumidor = screen.getByRole('button', { name: 'Conectar' });
    fireEvent.click(consumidor);
    act(() => {
      WebSocketFalso.instancias[0].onmessage({
        data: JSON.stringify({ evento: 'desafio_aceptado', id_partido: 90 }),
      });
    });

    await waitFor(() => {
      expect(obtenerComportamientosMock).toHaveBeenCalled();
    });
  });

  it('quita la notificación de pantalla sin descartar la invitación', async () => {
    render(
      <WebSocketProvider pantallaActual="inicio">
        <Consumidor />
      </WebSocketProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Conectar' }));

    act(() => {
      WebSocketFalso.instancias[0].onmessage({
        data: JSON.stringify({
          tipo: 'NUEVA_SOLICITUD_AMISTOSO',
          id_solicitud: 43,
          mensaje: 'Club rival te desafió',
          expira_en_segundos: 300,
        }),
      });
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar notificación' }));

    expect(screen.queryByText('Club rival te desafió')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Invitación amistosa/ })).not.toBeInTheDocument();
    expect(screen.getByTestId('invitacion-actual')).toHaveTextContent('43');
  });

  it('cierra el aviso al rechazar desde la lista aunque el ID llegue como number', async () => {
    render(
      <WebSocketProvider pantallaActual="amistosos">
        <Consumidor />
      </WebSocketProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Conectar' }));

    act(() => {
      WebSocketFalso.instancias[0].onmessage({
        data: JSON.stringify({
          tipo: 'NUEVA_SOLICITUD_AMISTOSO',
          id_solicitud: '43',
          mensaje: 'Reto pendiente',
        }),
      });
    });

    expect(await screen.findByText('Reto pendiente')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Rechazar desde lista' }));

    await waitFor(() => {
      expect(rechazarAmistosoMock).toHaveBeenCalledWith(43);
      expect(screen.queryByText('Reto pendiente')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('invitacion-actual')).toBeEmptyDOMElement();
  });

  it('elimina la invitación cuando se cumple el tiempo de expiración', () => {
    vi.useFakeTimers();
    render(
      <WebSocketProvider pantallaActual="inicio">
        <Consumidor />
      </WebSocketProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Conectar' }));

    const socket = WebSocketFalso.instancias[0];
    act(() => {
      socket.onmessage({
        data: JSON.stringify({
          tipo: 'NUEVA_SOLICITUD_AMISTOSO',
          id_solicitud: 8,
          mensaje: 'Desafío que expira',
          expira_en_segundos: 2,
        }),
      });
    });

    expect(screen.getByText('Desafío que expira')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByText('Desafío que expira')).not.toBeInTheDocument();
  });

    it('arranca el contador con el tiempo que manda el servidor', () => {
    render(
      <WebSocketProvider pantallaActual="inicio">
        <Consumidor />
      </WebSocketProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Conectar' }));

    const socket = WebSocketFalso.instancias[0];
    act(() => {
      socket.onmessage({
        data: JSON.stringify({
          tipo: 'NUEVA_SOLICITUD_AMISTOSO',
          id_solicitud: 7,
          mensaje: 'Club rival te desafió',
          expira_en_segundos: 300,
        }),
      });
    });

    expect(screen.getByText('05:00')).toBeInTheDocument();
  });

  it('ignora los mensajes que no son una invitación', () => {
    render(
      <WebSocketProvider pantallaActual="inicio">
        <Consumidor />
      </WebSocketProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Conectar' }));

    const socket = WebSocketFalso.instancias[0];
    act(() => {
      socket.onmessage({ data: JSON.stringify({ tipo: 'OTRA_COSA' }) });
    });

    expect(screen.queryByRole('button', { name: 'Aceptar' })).not.toBeInTheDocument();
  });

  it('expone el evento WebSocket que informa el rechazo al retador', () => {
    render(
      <WebSocketProvider pantallaActual="inicio">
        <Consumidor />
      </WebSocketProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Conectar' }));

    act(() => {
      WebSocketFalso.instancias[0].onmessage({
        data: JSON.stringify({
          evento: 'desafio_rechazado',
          data: { id_solicitud: 10 },
          mensaje: 'El club rival rechazó tu desafío.',
        }),
      });
    });

    expect(screen.getByTestId('resultado-solicitud')).toHaveTextContent('desafio_rechazado');
  });

  it('procesa el ciclo completo de la definición por penales', () => {
    render(
      <WebSocketProvider pantallaActual="inicio">
        <Consumidor />
      </WebSocketProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Conectar' }));
    const socket = WebSocketFalso.instancias[0];

    // 1. Regular match ends in tie 2-2
    act(() => {
      socket.onmessage({
        data: JSON.stringify({
          tipo: 'PARTIDO_TICK',
          tick: 600,
          ticks_totales: 600,
          marcador: [2, 2],
          clubes: {
            local: { id_club: 1, nombre: 'Boca' },
            visitante: { id_club: 2, nombre: 'River' },
          },
          pelota: { x: 50, y: 30 },
          jugadores: [{ id: 10, equipo: 0, x: 50, y: 30 }],
        }),
      });
    });

    expect(screen.getByTestId('modo-penales')).toHaveTextContent('false');
    expect(screen.getByTestId('partido-finalizado')).toHaveTextContent('false');

    // 2. PENALES_INICIADOS (Ronda 1)
    act(() => {
      socket.onmessage({
        data: JSON.stringify({
          tipo: 'PENALES_INICIADOS',
          id_solicitud: 14,
          fase: 'definicion',
          ronda_penal: 1,
          tick: 0,
          ticks_totales: 600,
          marcador: [0, 0],
          resultado_penales: [0, 0],
          ganador_definicion: null,
          equipo_ganador: null,
          pelota: { x: 50, y: 30, vx: 0, vy: 0 },
          jugadores: [
            { id: 10, equipo: 0, x: 42, y: 30 },
            { id: 20, equipo: 1, x: 58, y: 30 },
          ],
        }),
      });
    });

    expect(screen.getByTestId('modo-penales')).toHaveTextContent('true');
    expect(screen.getByTestId('ronda-penales')).toHaveTextContent('1');
    expect(screen.getByTestId('resultado-penales')).toHaveTextContent('[0,0]');
    // Marcador reglamentario conservado
    expect(screen.getByTestId('marcador-reglamentario')).toHaveTextContent('[2,2]');

    // 3. PENAL_TICK (10 Hz update)
    act(() => {
      socket.onmessage({
        data: JSON.stringify({
          tipo: 'PENAL_TICK',
          id_solicitud: 14,
          fase: 'definicion',
          ronda_penal: 1,
          tick: 45,
          ticks_totales: 600,
          marcador: [0, 0],
          resultado_penales: [0, 0],
          pelota: { x: 46, y: 29 },
          jugadores: [
            { id: 10, equipo: 0, x: 44, y: 30 },
            { id: 20, equipo: 1, x: 52, y: 30 },
          ],
        }),
      });
    });
    expect(screen.getByTestId('ronda-penales')).toHaveTextContent('1');

    // 4. PENAL_RONDA_FINALIZADA (Ronda 1 ganada por local 1-0)
    act(() => {
      socket.onmessage({
        data: JSON.stringify({
          tipo: 'PENAL_RONDA_FINALIZADA',
          id_solicitud: 14,
          fase: 'definicion',
          ronda_penal: 1,
          ganador_ronda: 0,
          tick: 78,
          ticks_totales: 600,
          marcador: [1, 0],
          resultado_penales: [1, 0],
          ganador_definicion: null,
          equipo_ganador: null,
        }),
      });
    });
    expect(screen.getByTestId('resultado-penales')).toHaveTextContent('[1,0]');
    expect(screen.getByTestId('historial-penales')).toHaveTextContent('"ganador_ronda":0');

    // 5. PENAL_RONDA_INICIADA (Ronda 2)
    act(() => {
      socket.onmessage({
        data: JSON.stringify({
          tipo: 'PENAL_RONDA_INICIADA',
          id_solicitud: 14,
          fase: 'definicion',
          ronda_penal: 2,
          tick: 0,
          ticks_totales: 600,
          marcador: [0, 0],
          resultado_penales: [1, 0],
          ganador_definicion: null,
          equipo_ganador: null,
        }),
      });
    });
    expect(screen.getByTestId('ronda-penales')).toHaveTextContent('2');

    // 6. PARTIDO_FINALIZADO con ganador de definición
    act(() => {
      socket.onmessage({
        data: JSON.stringify({
          tipo: 'PARTIDO_FINALIZADO',
          id_solicitud: 14,
          fase: 'finalizado',
          tick: 600,
          ticks_totales: 600,
          marcador: [2, 2],
          resultado_penales: [3, 1],
          ganador_definicion: 0,
          equipo_ganador: 0,
        }),
      });
    });

    expect(screen.getByTestId('partido-finalizado')).toHaveTextContent('true');
    expect(screen.getByTestId('ganador-definicion')).toHaveTextContent('0');
    expect(screen.getByTestId('resultado-penales')).toHaveTextContent('[3,1]');
    expect(screen.getByTestId('marcador-reglamentario')).toHaveTextContent('[2,2]');
  });

  it('finaliza correctamente un partido regular sin penales cuando no hubo empate o penales deshabilitados', () => {
    render(
      <WebSocketProvider pantallaActual="inicio">
        <Consumidor />
      </WebSocketProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Conectar' }));
    const socket = WebSocketFalso.instancias[0];

    act(() => {
      socket.onmessage({
        data: JSON.stringify({
          tipo: 'PARTIDO_INICIADO',
          tick: 0,
          ticks_totales: 600,
          marcador: [0, 0],
          clubes: {
            local: { id_club: 1, nombre: 'Boca' },
            visitante: { id_club: 2, nombre: 'River' },
          },
          pelota: { x: 50, y: 30 },
          jugadores: [],
        }),
      });
    });

    // Finaliza sin pasar por penales
    act(() => {
      socket.onmessage({
        data: JSON.stringify({
          tipo: 'PARTIDO_FINALIZADO',
          fase: 'finalizado',
          tick: 600,
          ticks_totales: 600,
          marcador: [2, 1],
          ganador_definicion: null,
          equipo_ganador: 0,
        }),
      });
    });

    expect(screen.getByTestId('partido-finalizado')).toHaveTextContent('true');
    expect(screen.getByTestId('modo-penales')).toHaveTextContent('false');
    expect(screen.getByTestId('ganador-definicion')).toBeEmptyDOMElement();
  });
  
});
