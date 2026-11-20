import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ExploradorLigas from '../pages/ExploradorLigas.jsx';

vi.mock('../components/Header.jsx', () => ({
  default: ({ onCambiarPantalla }) => (
    <header>
      Header
      <button onClick={() => onCambiarPantalla('ligas')}>Explorador de Ligas</button>
    </header>
  )
}));

vi.mock('../components/CrearLiga.jsx', () => ({
  default: ({ alCerrar, irAlLobby, irALogin }) => (
    <div role="dialog">
      <button onClick={alCerrar}>Cerrar modal</button>
      <button onClick={() => irAlLobby(12)}>Ir al lobby</button>
      <button onClick={irALogin}>Ir al login</button>
    </div>
  )
}));

vi.mock('../components/ListaLigas.jsx', () => ({
  default: ({ onUnirse }) => (
    <button onClick={() => onUnirse({ id: 24, nombre: 'Liga disponible' })}>
      Unirse a liga disponible
    </button>
  ),
}));

// Mock de InscripcionLiga para simular la confirmación de la inscripción
vi.mock('../components/InscripcionLiga.jsx', () => ({
  default: ({ liga, irAlLobby }) => (
    <div>
      <button onClick={() => irAlLobby(liga.id, liga.nombre)}>
        Confirmar e ir al lobby
      </button>
    </div>
  ),
}));

describe('ExploradorLigas', () => {
  afterEach(() => {
    cleanup();
  });

  it('muestra el explorador y abre o cierra el modal de creación', () => {
    const alLobby = vi.fn();
    const alLogin = vi.fn();
    render(<ExploradorLigas irAlLobby={alLobby} irALogin={alLogin} />);

    expect(screen.getByText('LIGAS Y COMPETICIONES')).toBeInTheDocument();
    
    // 1. Simula clic para seleccionar la liga
    fireEvent.click(screen.getByRole('button', { name: 'Unirse a liga disponible' }));
    
    // 2. Simula clic en el botón de la vista de inscripción que efectivamente llama a irAlLobby
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar e ir al lobby' }));
    expect(alLobby).toHaveBeenCalledWith(24, 'Liga disponible');
    expect(screen.queryByRole('button', { name: 'Confirmar e ir al lobby' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unirse a liga disponible' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '+ CREAR LIGA' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ir al login' }));
    expect(alLogin).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Ir al lobby' }));
    expect(alLobby).toHaveBeenCalledWith(12);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '+ CREAR LIGA' }));
    fireEvent.click(screen.getByRole('button', { name: 'Explorador de Ligas' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('muestra el lobby dentro del explorador cuando hay una liga activa', () => {
    render(
      <ExploradorLigas
        ligaActiva={{
          id: 12,
          nombre: 'Torneo Apertura',
          clubes: [{ id_club: 3, nombre: 'Club Norte' }],
        }}
      />
    );

    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Torneo Apertura' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'CLUBES DEL LOBBY' })).toBeInTheDocument();
    expect(screen.getByText('Club Norte')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByText('Datos de ejemplo para visualizar puntajes')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '+ CREAR LIGA' })).not.toBeInTheDocument();
  });
});