import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Amistosos from '../../pages/Amistosos.jsx';
import {
  obtenerClubes,
  obtenerComportamientos,
  obtenerInvitacionesPendientes,
  obtenerJugadores,
  solicitarAmistoso,
} from '../../services/clubes.js';

const {
  useWebSocketMock,
  aceptarInvitacionDesdeListaMock,
  rechazarInvitacionDesdeListaMock,
  guardarConvocatoriaPartidoMock,
} = vi.hoisted(() => ({
  useWebSocketMock: vi.fn(),
  aceptarInvitacionDesdeListaMock: vi.fn(),
  rechazarInvitacionDesdeListaMock: vi.fn(),
  guardarConvocatoriaPartidoMock: vi.fn(),
}));

vi.mock('../../services/websocket.jsx', () => ({
  useWebSocket: useWebSocketMock,
}));

vi.mock('../../services/clubes.js', () => ({
  obtenerClubes: vi.fn(),
  obtenerComportamientos: vi.fn(),
  obtenerInvitacionesPendientes: vi.fn(),
  obtenerJugadores: vi.fn(),
  normalizarLogo: (logo) => logo,
  solicitarAmistoso: vi.fn(),
}));

vi.mock('../../components/layout/SelectorAmistoso.jsx', () => ({
  default: ({ abierto, nombreClubDesafiado, mensajeError, alCerrar, alEnviar }) => (
    abierto ? (
      <div role="dialog">
        <h2>{nombreClubDesafiado}</h2>
        {mensajeError && <p>{mensajeError}</p>}
        <button onClick={alCerrar}>Cerrar selector</button>
        <button onClick={() => alEnviar({ formacion_tactica: 1, jugadores_convocados: [] })}>
          Enviar convocatoria
        </button>
      </div>
    ) : null
  ),
}));

vi.mock('../../components/layout/Timer.jsx', () => ({
  default: ({ clubRival, onTiempoExpirado }) => (
    <div>
      <p>Esperando respuesta de {clubRival.nombre}</p>
      <button onClick={onTiempoExpirado}>Expirar temporizador</button>
    </div>
  ),
}));

const clubes = [{ id_club: 10, nombre: 'Club rival' }];
const jugadores = [{ id_jugador: 1, nombre: 'Jugador 1' }];
const comportamientos = [{ id_comportamiento: 1, nombre: 'Equilibrado' }];

describe('DesafiosAmistosos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWebSocketMock.mockReturnValue({
      invitacionActual: null,
      resultadoSolicitud: null,
      aceptarInvitacionDesdeLista: aceptarInvitacionDesdeListaMock,
      rechazarInvitacion: rechazarInvitacionDesdeListaMock,
      guardarConvocatoriaPartido: guardarConvocatoriaPartidoMock,
    });
    rechazarInvitacionDesdeListaMock.mockResolvedValue(true);
    guardarConvocatoriaPartidoMock.mockReset();
    obtenerClubes.mockResolvedValue(clubes);
    obtenerInvitacionesPendientes.mockResolvedValue([]);
    obtenerJugadores.mockResolvedValue(jugadores);
    obtenerComportamientos.mockResolvedValue(comportamientos);
    solicitarAmistoso.mockResolvedValue({ id_solicitud_amistoso: 10, mensaje: 'Solicitud enviada' });
  });

  afterEach(() => {
    cleanup();
  });

  it('carga y muestra los clubes disponibles', async () => {
    render(<Amistosos />);

    expect(screen.getByText('Cargando clubes...')).toBeInTheDocument();
    expect(await screen.findByText('Club rival')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Jugar Amistoso' })).toBeEnabled();
    expect(obtenerClubes).toHaveBeenCalledTimes(1);
    expect(obtenerJugadores).toHaveBeenCalledTimes(1);
    expect(obtenerComportamientos).toHaveBeenCalledTimes(1);
  });

  it('actualiza solo la lista de clubes cuando se solicita', async () => {
    render(<Amistosos />);
    await screen.findByText('Club rival');

    fireEvent.click(screen.getByRole('button', { name: 'Actualizar clubes' }));

    await waitFor(() => expect(obtenerClubes).toHaveBeenCalledTimes(2));
    expect(obtenerJugadores).toHaveBeenCalledTimes(1);
    expect(obtenerComportamientos).toHaveBeenCalledTimes(1);
  });

  it('carga las invitaciones pendientes y permite volver a invitar clubes', async () => {
    obtenerInvitacionesPendientes.mockResolvedValue([{
      id_solicitud: 3,
      nombre_club_retador: 'Club desafiante',
      avatar: 'https://example.com/club.png',
      tiempo_restante: 125,
    }]);

    render(<Amistosos />);
    await screen.findByText('Club rival');

    fireEvent.click(screen.getByRole('button', { name: 'Invitaciones recibidas' }));

    expect(screen.getByRole('heading', { name: 'Invitaciones de amistosos recibidas' }))
      .toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Club desafiante' }))
      .toBeInTheDocument();
    expect(screen.getByText('Invitación pendiente · 2 min 5 s restantes'))
      .toBeInTheDocument();
    //expect(screen.getByRole('presentation')).toHaveAttribute(
    //  'src',
    //  'https://example.com/club.png'
    //);
    expect(obtenerInvitacionesPendientes).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Aceptar' }));
    expect(aceptarInvitacionDesdeListaMock).toHaveBeenCalledWith(expect.objectContaining({
      id_solicitud: 3,
      nombre_club_retador: 'Club desafiante',
    }));
    expect(screen.queryByText('Club rival')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Jugar Amistoso' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Invitar clubes' }));

    expect(await screen.findByText('Club rival')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Jugar Amistoso' })).toBeInTheDocument();
    expect(obtenerClubes).toHaveBeenCalledTimes(1);
  });

  it('muestra inmediatamente una invitación recibida por WebSocket', async () => {
    useWebSocketMock.mockReturnValue({
      invitacionActual: {
        id_solicitud: 42,
        id_club_retador: 9,
        expira_en_segundos: 240,
      },
      resultadoSolicitud: null,
      aceptarInvitacionDesdeLista: aceptarInvitacionDesdeListaMock,
      rechazarInvitacion: rechazarInvitacionDesdeListaMock,
    });

    render(<Amistosos />);
    fireEvent.click(await screen.findByRole('button', { name: 'Invitaciones recibidas' }));

    expect(await screen.findByRole('heading', { name: 'Club 9' })).toBeInTheDocument();
    expect(screen.getByText('Invitación pendiente · 4 min 0 s restantes'))
      .toBeInTheDocument();
  });

  it('rechaza desde la fila seleccionada y la quita de la lista', async () => {
    const invitacion = {
      id_solicitud: 27,
      nombre_club_retador: 'Club que desafía',
      avatar: '',
      tiempo_restante: 180,
    };
    obtenerInvitacionesPendientes.mockResolvedValue([invitacion]);

    render(<Amistosos />);
    fireEvent.click(await screen.findByRole('button', { name: 'Invitaciones recibidas' }));
    expect(await screen.findByRole('heading', { name: 'Club que desafía' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }));

    await waitFor(() => {
      expect(rechazarInvitacionDesdeListaMock).toHaveBeenCalledWith(invitacion);
      expect(screen.queryByRole('heading', { name: 'Club que desafía' })).not.toBeInTheDocument();
    });
  });

  it('muestra errores independientes al cargar jugadores, comportamientos y clubes', async () => {
    obtenerClubes.mockRejectedValue(new Error('No se pudieron cargar clubes'));
    obtenerJugadores.mockRejectedValue(new Error('No se pudieron cargar jugadores'));
    obtenerComportamientos.mockRejectedValue(new Error('No se pudieron cargar comportamientos'));

    render(<Amistosos />);

    expect(await screen.findByText('No se pudieron cargar clubes')).toBeInTheDocument();
    expect(screen.getByText('No se pudieron cargar jugadores')).toBeInTheDocument();
    expect(screen.getByText('No se pudieron cargar comportamientos')).toBeInTheDocument();
  });

  it('abre el selector, envía la solicitud y activa el temporizador', async () => {
    render(<Amistosos />);
    fireEvent.click(await screen.findByRole('button', { name: 'Jugar Amistoso' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Club rival');

    fireEvent.click(screen.getByRole('button', { name: 'Enviar convocatoria' }));

    await waitFor(() => expect(solicitarAmistoso).toHaveBeenCalledWith(10, {
      formacion_tactica: 1,
      jugadores_convocados: [],
    }));
    expect(guardarConvocatoriaPartidoMock).toHaveBeenCalledWith(
      { formacion_tactica: 1, jugadores_convocados: [] },
      jugadores,
      [{ id_club: 10, nombre: 'Club rival' }]
    );
    expect(await screen.findByText('Esperando respuesta de Club rival')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Expirar temporizador' }));
    expect(screen.queryByText('Esperando respuesta de Club rival')).not.toBeInTheDocument();
  });

  it('cierra el temporizador de espera cuando rechazan esa solicitud por WebSocket', async () => {
    const { rerender } = render(<Amistosos />);
    fireEvent.click(await screen.findByRole('button', { name: 'Jugar Amistoso' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enviar convocatoria' }));

    expect(await screen.findByText('Esperando respuesta de Club rival')).toBeInTheDocument();

    useWebSocketMock.mockReturnValue({
      invitacionActual: null,
      resultadoSolicitud: {
        evento: 'desafio_rechazado',
        data: { id_solicitud: 10 },
        mensaje: 'El club rival rechazó tu desafío.',
      },
    });
    rerender(<Amistosos />);

    await waitFor(() => {
      expect(screen.queryByText('Esperando respuesta de Club rival')).not.toBeInTheDocument();
    });
  });

  it('mantiene abierto el selector y muestra el error al fallar el envío', async () => {
    solicitarAmistoso.mockRejectedValue(new Error('Solicitud rechazada'));
    render(<Amistosos />);
    fireEvent.click(await screen.findByRole('button', { name: 'Jugar Amistoso' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enviar convocatoria' }));

    expect(await screen.findByText('Solicitud rechazada')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByText('Esperando respuesta de Club rival')).not.toBeInTheDocument();
  });
});
