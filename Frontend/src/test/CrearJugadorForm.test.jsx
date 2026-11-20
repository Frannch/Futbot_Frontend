import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CrearJugadorForm from '../components/CrearJugadorForm';
import { crearJugador } from '../services/JugadorService';

vi.mock('../services/JugadorService', () => ({
  crearJugador: vi.fn(),
}));

describe('CrearJugadorForm', () => {
  const onCreated = vi.fn();
  const onCancel = vi.fn();

  // Limpia los mocks y localStorage antes de cada prueba
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('token', 'token-de-prueba');
  });

  afterEach(() => {
    cleanup();
  });

  it('renderiza el formulario sin errores', () => {
    render(
      <CrearJugadorForm onCreated={onCreated} onCancel={onCancel}/>,
    );

    expect( screen.getByRole('heading', { name: 'CREAR JUGADOR' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre del jugador')).toBeInTheDocument();

    expect(screen.getByLabelText('Velocidad')).toBeInTheDocument();
    expect(screen.getByLabelText('Fuerza')).toBeInTheDocument();
    expect(screen.getByLabelText('Potencia')).toBeInTheDocument();
    expect(screen.getByLabelText('Agilidad')).toBeInTheDocument();
    expect(screen.getByLabelText('Control')).toBeInTheDocument();
  });

  it('muestra los 5 sliders con valores entre 20 y 100', () => {
    render(
      <CrearJugadorForm
        onCreated={onCreated}
        onCancel={onCancel}
      />,
    );

    const stats = [
      'Velocidad',
      'Fuerza',
      'Potencia',
      'Agilidad',
      'Control',
    ];

    stats.forEach((stat) => {
      const slider = screen.getByLabelText(stat);

      expect(slider).toHaveAttribute('min', '20');
      expect(slider).toHaveAttribute('max', '100');
    });
  });

  it('inicia con 60 puntos en cada estadística y total de 300', () => {
    render(
      <CrearJugadorForm
        onCreated={onCreated}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByLabelText('Velocidad')).toHaveValue('60');
    expect(screen.getByLabelText('Fuerza')).toHaveValue('60');
    expect(screen.getByLabelText('Potencia')).toHaveValue('60');
    expect(screen.getByLabelText('Agilidad')).toHaveValue('60');
    expect(screen.getByLabelText('Control')).toHaveValue('60');

    expect(screen.getByText('Total puntos: 300 / 300')).toBeInTheDocument();
  });

  it('mantiene deshabilitado el botón Crear cuando el nombre está vacío', () => {
    render(
      <CrearJugadorForm
        onCreated={onCreated}
        onCancel={onCancel}
      />,
    );

    const botonCrear = screen.getByRole('button', {
      name: 'CREAR JUGADOR',
    });

    expect(botonCrear).toBeDisabled();
  });

  it('mantiene deshabilitado el botón Crear cuando el nombre supera los 50 caracteres', () => {
    render(
      <CrearJugadorForm
        onCreated={onCreated}
        onCancel={onCancel}
      />,
    );

    const nombreLargo = 'A'.repeat(51);

    fireEvent.change(screen.getByLabelText('Nombre del jugador'), {
      target: { value: nombreLargo },
    });

    expect(
      screen.getByText(
        'El nombre debe tener entre 1 y 50 caracteres.',
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: 'CREAR JUGADOR',
      }),
    ).toBeDisabled();
  });

  it('habilita el botón Crear cuando el nombre es válido', () => {
    render(
      <CrearJugadorForm
        onCreated={onCreated}
        onCancel={onCancel}
      />,
    );

    fireEvent.change(screen.getByLabelText('Nombre del jugador'), {
      target: { value: 'Lionel Messi' },
    });

    expect( screen.getByRole('button', { name: 'CREAR JUGADOR', }), ).toBeEnabled();
  });

  it('actualiza el valor de un slider', () => {
    render(
      <CrearJugadorForm
        onCreated={onCreated}
        onCancel={onCancel}
      />,
    );

    const velocidad = screen.getByLabelText('Velocidad');

    fireEvent.change(velocidad, {
      target: { value: '80' },
    });

    expect(velocidad).toHaveValue('80');
  });

  it('mantiene el total de puntos en 300 al modificar un slider', () => {
    render(
      <CrearJugadorForm
        onCreated={onCreated}
        onCancel={onCancel}
      />,
    );

    // Aumentamos la velocidad a 80, lo que hace que el total sea 320
    fireEvent.change(screen.getByLabelText('Velocidad'), {target: { value: '80' },});
    
    expect(screen.getByText('Total puntos: 320 / 300')).toBeInTheDocument();

    const valores = [
      screen.getByLabelText('Velocidad'),
      screen.getByLabelText('Fuerza'),
      screen.getByLabelText('Potencia'),
      screen.getByLabelText('Agilidad'),
      screen.getByLabelText('Control'),
    ].map((slider) => Number(slider.value));

    const total = valores.reduce((suma, valor) => suma + valor, 0);

    expect(total).toBe(320);
  });

  it('muestra el indicador de total válido cuando el total es 300', () => {
    render(
      <CrearJugadorForm
        onCreated={onCreated}
        onCancel={onCancel}
      />,
    );

    const indicador = screen
      .getByText('Total puntos: 300 / 300')
      .closest('div');

    expect(indicador).toHaveClass('border-green-500');
    expect(indicador).toHaveClass('text-green-400');
  });

  it('permite restablecer las estadísticas a 60', () => {
    render(
      <CrearJugadorForm
        onCreated={onCreated}
        onCancel={onCancel}
      />,
    );

    fireEvent.change(screen.getByLabelText('Velocidad'), {
      target: { value: '80' },
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: 'RESTABLECER',
      }),
    );

    expect(screen.getByLabelText('Velocidad')).toHaveValue('60');
    expect(screen.getByLabelText('Fuerza')).toHaveValue('60');
    expect(screen.getByLabelText('Potencia')).toHaveValue('60');
    expect(screen.getByLabelText('Agilidad')).toHaveValue('60');
    expect(screen.getByLabelText('Control')).toHaveValue('60');

    expect(screen.getByText('Total puntos: 300 / 300')).toBeInTheDocument();
  });

  it('ejecuta onCancel al presionar CANCELAR', () => {
    render(
      <CrearJugadorForm
        onCreated={onCreated}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'CANCELAR',
      }),
    );

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('crea el jugador correctamente cuando el formulario es válido', async () => {
    crearJugador.mockResolvedValue({
      id: 10,
      name: 'Lionel Messi',
    });

    render(
      <CrearJugadorForm
        onCreated={onCreated}
        onCancel={onCancel}
      />,
    );

    fireEvent.change(screen.getByLabelText('Nombre del jugador'), {
      target: { value: 'Lionel Messi' },
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: 'CREAR JUGADOR',
      }),
    );

    await waitFor(() => {
      expect(crearJugador).toHaveBeenCalledWith(
        'Lionel Messi',
        {
          velocidad: 60,
          fuerza: 60,
          potencia: 60,
          agilidad: 60,
          control: 60,
        },
        'token-de-prueba',
      );
    });

    expect(onCreated).toHaveBeenCalledWith({
      id: 10,
      nombre: 'Lionel Messi',
      velocidad: 60,
      fuerza: 60,
      potencia: 60,
      agilidad: 60,
      control: 60,
    });
  });

  it('muestra estado de carga mientras crea el jugador', async () => {
    let resolver;

    crearJugador.mockReturnValue(
      new Promise((resolve) => {
        resolver = resolve;
      }),
    );

    render(
      <CrearJugadorForm
        onCreated={onCreated}
        onCancel={onCancel}
      />,
    );

    fireEvent.change(screen.getByLabelText('Nombre del jugador'), {
      target: { value: 'Jugador de prueba' },
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: 'CREAR JUGADOR',
      }),
    );

    expect(
      screen.getByRole('button', {
        name: 'CREANDO...',
      }),
    ).toBeDisabled();

    expect(
      screen.getByRole('button', {
        name: 'CANCELAR',
      }),
    ).toBeDisabled();

    resolver({
      id: 1,
      name: 'Jugador de prueba',
    });

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalled();
    });
  });

  it('muestra el error cuando la API responde 400', async () => {
    const error = new Error('Las estadísticas deben sumar 300; suman 320');
    error.status = 400;

    crearJugador.mockRejectedValue(error);

    render( <CrearJugadorForm onCreated={onCreated} onCancel={onCancel} />, );

    // Simulamos la entrada de datos en el formulario
    fireEvent.change(screen.getByLabelText('Nombre del jugador'), { target: { value: 'Jugador de prueba' },});

    // Simulamos la modificación del slider velocidad para que el total de estadísticas no sea 300
    fireEvent.change(screen.getByLabelText('Velocidad'), { target: { value: '80' },});
    
    // Verificamos que el botón Crear esté habilitado
    const botonCrear = screen.getByRole('button', { name: 'CREAR JUGADOR', });
    expect(botonCrear).toBeEnabled();
    
    // Verificamos que el total de puntos sea 320
    expect(screen.getByText('Total puntos: 320 / 300')).toBeInTheDocument();

    // Simulamos el envío del formulario
    fireEvent.click(botonCrear);
    expect( await screen.findByText('Las estadísticas deben sumar 300; suman 320'), ).toBeInTheDocument();

    expect(crearJugador).toHaveBeenCalledWith(
      'Jugador de prueba',
    {
      velocidad: 80,
      fuerza: 60,
      potencia: 60,
      agilidad: 60,
      control: 60,
    },
    'token-de-prueba',
    )
    expect(onCreated).not.toHaveBeenCalled();
  });

  it('muestra un error de conexión cuando ocurre un error inesperado', async () => {
    const error = new Error('Error inesperado');

    crearJugador.mockRejectedValue(error);

    render(
      <CrearJugadorForm
        onCreated={onCreated}
        onCancel={onCancel}
      />,
    );

    fireEvent.change(screen.getByLabelText('Nombre del jugador'), {
      target: { value: 'Jugador de prueba' },
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: 'CREAR JUGADOR',
      }),
    );

    expect(
      await screen.findByText(
        'Error de conexión con el servidor.',
      ),
    ).toBeInTheDocument();
  });
});