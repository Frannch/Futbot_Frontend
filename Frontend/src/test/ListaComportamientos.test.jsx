import {
  render,
  screen,
  waitFor,
  fireEvent,
  cleanup,
  within,
} from '@testing-library/react';

import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from 'vitest';

import ListaComportamientos from '../components/layout/ListaComportamientos';

import {
  eliminarComportamiento,
  obtenerComportamientos,
  obtenerComportamientoPorNombre,
  actualizarComportamiento,
  probarComportamiento,
} from '../services/ComportamientoService';

vi.mock('../services/ComportamientoService', () => ({
  eliminarComportamiento: vi.fn(),
  obtenerComportamientos: vi.fn(),
  obtenerComportamientoPorNombre: vi.fn(),
  actualizarComportamiento: vi.fn(),
  probarComportamiento: vi.fn(),
}));

describe('ListaComportamientos', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    localStorage.setItem('token', 'token-de-prueba');
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('muestra el estado de carga mientras obtiene los comportamientos', () => {
    obtenerComportamientos.mockReturnValue(
      new Promise(() => {})
    );

    render(<ListaComportamientos />);

    expect(
      screen.getByText('Cargando comportamientos...')
    ).toBeInTheDocument();
  });

  it('muestra los comportamientos recibidos del API', async () => {
    obtenerComportamientos.mockResolvedValue([
      {
        id_comportamiento: 1,
        nombre: 'Ataque rápido',
      },
      {
        id_comportamiento: 2,
        nombre: 'Defensa en zona',
      },
    ]);

    render(<ListaComportamientos />);

    expect(
      await screen.findByText('Ataque rápido')
    ).toBeInTheDocument();

    expect(
      screen.getByText('Defensa en zona')
    ).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /Ataque rápido/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Defensa en zona/ })).toBeInTheDocument();
    expect(screen.getByLabelText('Editor de comportamiento')).toBeInTheDocument();
  });

  it('elimina el comportamiento seleccionado desde las acciones del panel derecho', async () => {
    obtenerComportamientos.mockResolvedValue([
      { id_comportamiento: 1, nombre: 'Ataque rápido' },
    ]);
    obtenerComportamientoPorNombre.mockResolvedValue({
      id: 1,
      nombre: 'Ataque rápido',
      script: 'def ataque(): pass',
    });
    eliminarComportamiento.mockResolvedValue({ mensaje: 'Comportamiento eliminado.' });

    render(<ListaComportamientos />);

    fireEvent.click(await screen.findByRole('button', { name: /Ataque rápido/ }));
    await screen.findByRole('button', { name: 'Editar' });
    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => {
      expect(eliminarComportamiento).toHaveBeenCalledWith('Ataque rápido');
      expect(screen.queryByText('Ataque rápido')).not.toBeInTheDocument();
    });
  });

  it('muestra "No hay comportamientos" cuando el API devuelve una lista vacía', async () => {
    obtenerComportamientos.mockResolvedValue([]);

    render(<ListaComportamientos />);

    expect(await screen.findByText('No hay comportamientos guardados.')).toBeInTheDocument();
    expect(screen.getByLabelText('Editor de comportamiento')).toBeInTheDocument();
  });

  it('muestra un mensaje de error cuando falla el API', async () => {
    obtenerComportamientos.mockRejectedValue(
      new Error('Error al obtener comportamientos')
    );

    render(<ListaComportamientos />);

    expect(
      await screen.findByText('Error al obtener comportamientos')
    ).toBeInTheDocument();
  });

  it('obtiene el detalle cuando se selecciona un comportamiento', async () => {
    obtenerComportamientos.mockResolvedValue([
      {
        id_comportamiento: 1,
        nombre: 'Ataque rápido',
      },
    ]);

    obtenerComportamientoPorNombre.mockResolvedValue({
      id: 1,
      nombre: 'Ataque rápido',
      script: 'def ataque():\n    return True',
    });

    render(<ListaComportamientos />);

    const comportamiento = await screen.findByText('Ataque rápido');

    fireEvent.click(comportamiento);

    await waitFor(() => {
      expect(obtenerComportamientoPorNombre).toHaveBeenCalledWith(
        'Ataque rápido'
      );
    });
  });

  it('muestra la carga del detalle en el panel derecho', async () => {
    obtenerComportamientos.mockResolvedValue([
      {
        id_comportamiento: 1,
        nombre: 'Ataque rápido',
      },
    ]);

    obtenerComportamientoPorNombre.mockReturnValue(
      new Promise(() => {})
    );

    render(<ListaComportamientos />);

    const comportamiento = await screen.findByText('Ataque rápido');

    fireEvent.click(comportamiento);

    expect(screen.getByText('Cargando código...')).toBeInTheDocument();
  });

  it('carga el comportamiento seleccionado en el panel derecho sin modal', async () => {
  obtenerComportamientos.mockResolvedValue([
    {
      id_comportamiento: 1,
      nombre: 'Ataque rápido'
    }
  ]);

  obtenerComportamientoPorNombre.mockResolvedValue({
    id: 1,
    nombre: 'Ataque rápido',
    script: 'def ataque():\n    return True'
  });

  render(<ListaComportamientos />);

  const comportamiento = await screen.findByText('Ataque rápido');
  fireEvent.click(comportamiento);

  expect(
    await screen.findByText('Código Python')
  ).toBeInTheDocument();

  const nombres = await screen.findAllByText('Ataque rápido');

  expect(nombres).toHaveLength(2);

  const codigo = await screen.findByText(
    (_, elemento) =>
      elemento?.tagName.toLowerCase() === 'code' &&
      elemento.textContent.includes('def ataque():') &&
      elemento.textContent.includes('return True')
  );

  expect(codigo).toBeInTheDocument();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Simular' })).toBeInTheDocument();
});

  it('solicita y presenta la simulación del comportamiento seleccionado', async () => {
    obtenerComportamientos.mockResolvedValue([
      { id_comportamiento: 7, nombre: 'Defensor' },
    ]);
    obtenerComportamientoPorNombre.mockResolvedValue({
      id: 7,
      nombre: 'Defensor',
      script: 'cubrir_posicion(10, 20)',
    });
    probarComportamiento.mockResolvedValue({
      ancho_cancha: 100,
      alto_cancha: 60,
      ticks: 0,
      frames: [{
        tick: 0,
        jugador: { x: 10, y: 20 },
        companero: { x: 15, y: 20 },
        pelota: { x: 50, y: 30 },
      }],
    });

    render(<ListaComportamientos />);
    fireEvent.click(await screen.findByText('Defensor'));
    fireEvent.click(await screen.findByRole('button', { name: 'Simular' }));

    await waitFor(() => expect(probarComportamiento).toHaveBeenCalledWith(7));
    expect(await screen.findByRole('img', { name: 'Cancha de simulación de Defensor' }))
      .toHaveAttribute('viewBox', '0 0 100 60');
    expect(screen.getByRole('button', { name: 'Cancelar simulación' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pausar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reiniciar' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar simulación' }));
    expect(screen.queryByRole('img', { name: 'Cancha de simulación de Defensor' })).not.toBeInTheDocument();
    expect(screen.getByText('Código Python')).toBeInTheDocument();
  });

  it('permite editar y guardar solo el código del comportamiento', async () => {
    obtenerComportamientos.mockResolvedValue([
      { id_comportamiento: 1, nombre: 'Ataque rápido' },
    ]);
    obtenerComportamientoPorNombre.mockResolvedValue({
      id: 1,
      nombre: 'Ataque rápido',
      script: 'def ataque():\n    return True',
    });
    actualizarComportamiento.mockResolvedValue({ mensaje: 'Actualizado' });

    render(<ListaComportamientos />);

    fireEvent.click(await screen.findByText('Ataque rápido'));
    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));

    const editor = screen.getByRole('textbox', { name: 'Código Python' });
    expect(editor).toHaveValue('def ataque():\n    return True');

    fireEvent.change(editor, {
      target: { value: 'def ataque():\n    return False' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(actualizarComportamiento).toHaveBeenCalledWith(
        'Ataque rápido',
        'def ataque():\n    return False',
      );
    });

    expect(
      await screen.findByText(
        (_, elemento) =>
          elemento?.tagName.toLowerCase() === 'code' &&
          elemento.textContent.includes('def ataque():') &&
          elemento.textContent.includes('return False'),
      ),
    ).toBeInTheDocument();
  });

  it('muestra un mensaje de error cuando el comportamiento no existe', async () => {
    obtenerComportamientos.mockResolvedValue([
      {
        id_comportamiento: 1,
        nombre: 'Ataque rápido',
      },
    ]);

    obtenerComportamientoPorNombre.mockRejectedValue(
      new Error('El comportamiento no existe.')
    );

    render(<ListaComportamientos />);

    const comportamiento = await screen.findByText('Ataque rápido');

    fireEvent.click(comportamiento);

    expect(
      await screen.findByText('El comportamiento no existe.')
    ).toBeInTheDocument();
  });

  it('muestra un mensaje de error cuando falla la consulta del detalle', async () => {
    obtenerComportamientos.mockResolvedValue([
      {
        id_comportamiento: 1,
        nombre: 'Ataque rápido',
      },
    ]);

    obtenerComportamientoPorNombre.mockRejectedValue(
      new Error(
        'Ocurrió un error interno del servidor.'
      )
    );

    render(<ListaComportamientos />);

    const comportamiento = await screen.findByText('Ataque rápido');

    fireEvent.click(comportamiento);

    expect(
      await screen.findByText(
        'Ocurrió un error interno del servidor.'
      )
    ).toBeInTheDocument();
  });

  it('mantiene visible el panel y el código al seleccionar un comportamiento', async () => {
    obtenerComportamientos.mockResolvedValue([
      {
        id_comportamiento: 1,
        nombre: 'Ataque rápido',
      },
    ]);

    obtenerComportamientoPorNombre.mockResolvedValue({
      id: 1,
      nombre: 'Ataque rápido',
      script: 'def ataque():\n    return True',
    });

    render(<ListaComportamientos />);

    const comportamiento = await screen.findByText('Ataque rápido');

    fireEvent.click(comportamiento);

    expect(await screen.findByRole('heading', { name: 'Ataque rápido' })).toBeInTheDocument();
    expect(screen.getByLabelText('Editor de comportamiento')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
