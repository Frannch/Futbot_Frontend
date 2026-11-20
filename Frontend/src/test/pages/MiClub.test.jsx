import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MiClub from '../pages/MiClub';

vi.mock('../components/layout/CrearJugadorForm', () => ({
  default: ({ onCreated, onCancel }) => (
    <div>
      <h2>Formulario crear jugador</h2>

      <button
        type="button"
        onClick={() =>
          onCreated({
            id: 1,
            nombre: 'Lionel Messi',
            velocidad: 60,
            fuerza: 60,
            potencia: 60,
            agilidad: 60,
            control: 60,
          })
        }
      >
        Crear jugador de prueba
      </button>

      <button
        type="button"
        onClick={onCancel}
      >
        Cancelar formulario
      </button>
    </div>
  ),
}));

vi.mock('../components/layout/CrearComportamiento', () => ({
  default: ({ onCancel }) => (
    <div>
      <h2>Editor de comportamiento</h2>
      <button type="button" onClick={onCancel}>
        Cancelar creación
      </button>
    </div>
  ),
}));

vi.mock('../components/layout/ListaComportamientos', () => ({
  default: () => <div>Lista de comportamientos</div>,
}));

describe('MiClub', () => {
  afterEach(() => {
    cleanup();
  });

  it('renderiza la pantalla Mi Club sin errores', () => {
    render(<MiClub />);

    expect(screen.getByText('MI CLUB')).toBeInTheDocument();

    expect(
      screen.getByText(
        'Gestiona los atributos, roles y scripts tácticos asignados a cada uno de tus jugadores registrados.',
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: 'Agregar jugador',
      }),
    ).toBeInTheDocument();
  });

  it('muestra el formulario al presionar Agregar jugador', () => {
    render(<MiClub />);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Agregar jugador',
      }),
    );

    expect(
      screen.getByText('Formulario crear jugador'),
    ).toBeInTheDocument();
  });

  it('abre y cierra la pantalla de creación de comportamiento', () => {
    render(<MiClub />);

    fireEvent.click(screen.getByRole('button', { name: 'Comportamientos' }));
    fireEvent.click(
      screen.getByRole('button', { name: '+ Nuevo comportamiento' }),
    );

    expect(screen.getByText('Editor de comportamiento')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar creación' }));

    expect(screen.getByText('Lista de comportamientos')).toBeInTheDocument();
  });

  it('agrega el jugador a la lista cuando se crea', () => {
    render(<MiClub />);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Agregar jugador',
      }),
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Crear jugador de prueba',
      }),
    );

    expect(
      screen.getByRole('heading', {
        name: 'Lionel Messi',
      }),
    ).toBeInTheDocument();

    expect(screen.getByText('Velocidad')).toBeInTheDocument();
    expect(screen.getByText('Fuerza')).toBeInTheDocument();
    expect(screen.getByText('Potencia')).toBeInTheDocument();
    expect(screen.getByText('Agilidad')).toBeInTheDocument();
    expect(screen.getByText('Control')).toBeInTheDocument();
  });

  it('cierra el formulario al cancelar', () => {
    render(<MiClub />);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Agregar jugador',
      }),
    );

    expect(
      screen.getByText('Formulario crear jugador'),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Cancelar formulario',
      }),
    );

    expect(
      screen.queryByText('Formulario crear jugador'),
    ).not.toBeInTheDocument();
  });

  it('muestra correctamente las estadísticas del jugador creado', () => {
    render(<MiClub />);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Agregar jugador',
      }),
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Crear jugador de prueba',
      }),
    );

    expect(screen.getAllByText('60')).toHaveLength(5);
  });
});