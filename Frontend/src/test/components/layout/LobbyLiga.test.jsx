import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LobbyLiga from '../../../components/layout/LobbyLiga';

const { actualizaciones } = vi.hoisted(() => ({ actualizaciones: { current: {} } }));

vi.mock('../../../hooks/useWebSocketLigas', () => ({
  default: (idLiga) => ({
    ligas: idLiga == null
      ? []
      : [{ id: idLiga, actualizacionesPartido: actualizaciones.current }],
  }),
}));

// Mockeamos los componentes hijos para aislar las pruebas de LobbyLiga
vi.mock('../../../components/layout/ListaClubesLiga', () => ({
  default: ({ clubes, fechas }) => (
    <div data-testid="lista-clubes">
      Clubes cargados: {clubes?.length ?? 0}
      Fechas tabla: {fechas?.length ?? 0}
    </div>
  ),
}));

vi.mock('../../../components/layout/CambiarAlineacion', () => ({
  default: ({ idLiga }) => <div data-testid="cambiar-alineacion">Liga {idLiga}</div>,
}));

vi.mock('../../../services/ligas', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    obtenerLobbyLiga: vi.fn().mockResolvedValue({ fixture: [], tablas_posiciones: [] }),
  };
});

vi.mock('../../../components/layout/fixture', () => ({
  default: ({ fechas, onEspectarPartido }) => (
    <div data-testid="fixture">
      Fechas cargadas: {fechas?.length ?? 0}
      <output data-testid="fixture-partidos">
        {JSON.stringify(fechas?.flatMap((fecha) => fecha.partidos ?? []))}
      </output>
      {onEspectarPartido && (
        <button onClick={() => onEspectarPartido(fechas[0]?.partidos?.[0])}>
          Espectar partido mock
        </button>
      )}
    </div>
  ),
}));

describe('LobbyLiga', () => {
  const ligaDePrueba = {
    id: 1,
    nombre: 'Liga de prueba',
    clubes: [{ id: 7, nombre: 'Club real' }],
    fechas: [{ numero_fecha: 1, partidos: [] }],
  };

  afterEach(() => {
    cleanup();
    actualizaciones.current = {};
    vi.restoreAllMocks();
  });

  it('renderiza el nombre predeterminado "Liga" cuando no se pasa la prop liga', () => {
    render(<LobbyLiga />);

    expect(screen.getByRole('heading', { level: 1, name: 'Liga' })).toBeInTheDocument();
  });

  it('renderiza el nombre de la liga provisto por props', () => {
    const ligaPrueba = { nombre: 'Liga Profesional Redduc' };
    render(<LobbyLiga liga={ligaPrueba} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Liga Profesional Redduc' })).toBeInTheDocument();
  });

  it('renderiza los componentes hijos ListaClubesLiga y Fixture', () => {
    render(<LobbyLiga liga={ligaDePrueba} />);

    // Verifica que se monten los componentes hijos
    expect(screen.getByTestId('lista-clubes')).toBeInTheDocument();
    expect(screen.getByTestId('fixture')).toBeInTheDocument();
  });

  it('muestra CambiarAlineacion solo cuando la liga está iniciada', () => {
    const { rerender } = render(<LobbyLiga liga={{ ...ligaDePrueba, estado: 'espera' }} />);

    expect(screen.queryByTestId('cambiar-alineacion')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cambiar alineación' })).not.toBeInTheDocument();

    rerender(<LobbyLiga liga={{ ...ligaDePrueba, estado: 'iniciada' }} />);

    expect(screen.getByRole('button', { name: 'Cambiar alineación' })).toBeInTheDocument();
    expect(screen.queryByTestId('cambiar-alineacion')).not.toBeInTheDocument();
    expect(screen.getByTestId('fixture')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cambiar alineación' }));

    expect(screen.getByTestId('cambiar-alineacion')).toHaveTextContent('Liga 1');
    expect(screen.queryByTestId('fixture')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver fixture' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ver fixture' }));

    expect(screen.getByTestId('fixture')).toBeInTheDocument();
    expect(screen.queryByTestId('cambiar-alineacion')).not.toBeInTheDocument();
  });

  it('pasa solo clubes y fechas recibidos en la liga', () => {
    render(<LobbyLiga liga={ligaDePrueba} />);

    expect(screen.getByTestId('lista-clubes')).toHaveTextContent('Clubes cargados: 1');
    expect(screen.getByTestId('lista-clubes')).toHaveTextContent('Fechas tabla: 1');
    expect(screen.getByTestId('fixture')).toHaveTextContent('Fechas cargadas: 1');
  });

  it('mantiene vacía la tabla y el fixture cuando todavía no llegan datos', () => {
    render(<LobbyLiga liga={{ id: 8, nombre: 'Liga sin resultados', clubes: [], fechas: [] }} />);

    expect(screen.getByTestId('lista-clubes')).toHaveTextContent('Clubes cargados: 0');
    expect(screen.getByTestId('lista-clubes')).toHaveTextContent('Fechas tabla: 0');
    expect(screen.getByTestId('fixture')).toHaveTextContent('Fechas cargadas: 0');
  });

  it('actualiza el marcador del fixture en cada tick y lo finaliza al terminar', () => {
    const liga = {
      id: 77,
      nombre: 'Liga en vivo',
      clubes: [{ id: 7, nombre: 'Club real' }],
      fechas: [{
        id_fecha: 1,
        numero_fecha: 1,
        estado_fecha: 'actual',
        partidos: [{
          id: 901,
          local: 'Club real',
          visitante: 'Rival',
          goles_local: 0,
          goles_visitante: 0,
          estado: '1T',
        }],
      }],
    };
    const { rerender } = render(<LobbyLiga liga={liga} />);

    actualizaciones.current = {
      '901': { marcador: [2, 1], finalizado: false },
    };
    rerender(<LobbyLiga liga={liga} />);
    expect(JSON.parse(screen.getByTestId('fixture-partidos').textContent)[0]).toMatchObject({
      goles_local: 2,
      goles_visitante: 1,
      estado: '1T',
    });

    actualizaciones.current = {
      '901': { marcador: [2, 1], finalizado: true },
    };
    rerender(<LobbyLiga liga={liga} />);
    expect(JSON.parse(screen.getByTestId('fixture-partidos').textContent)[0]).toMatchObject({
      goles_local: 2,
      goles_visitante: 1,
      estado: 'finalizado',
    });
  });

  it('muestra Cancelar Liga solo para el creador', () => {
    const { rerender } = render(<LobbyLiga liga={{ id: 12, nombre: 'Liga activa' }} />);

    expect(screen.queryByRole('button', { name: 'Cancelar liga' })).not.toBeInTheDocument();

    rerender(
      <LobbyLiga liga={{ id: 12, nombre: 'Liga activa', esCreador: true }} />
    );

    expect(screen.getByRole('button', { name: 'Cancelar liga' })).toBeInTheDocument();
  });

  it('guarda el partido y navega al hub al solicitar espectarlo', () => {
    const cambiarPantalla = vi.fn();
    const liga = {
      ...ligaDePrueba,
      fechas: [{
        numero_fecha: 1,
        estado_fecha: 'actual',
        partidos: [{ id: 901, estado: '1T' }],
      }],
    };

    render(<LobbyLiga liga={liga} cambiarPantalla={cambiarPantalla} />);
    screen.getByRole('button', { name: 'Espectar partido mock' }).click();

    expect(localStorage.getItem('partidoEspectadoId')).toBe('901');
    expect(cambiarPantalla).toHaveBeenCalledWith('partidos-en-vivo');
    localStorage.removeItem('partidoEspectadoId');
  });
});