import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import EliminarComportamiento from '../components/EliminarComportamiento.jsx';
import { eliminarComportamiento } from '../services/ComportamientoService.js';

vi.mock('../services/ComportamientoService.js', () => ({
  eliminarComportamiento: vi.fn(),
}));

describe('EliminarComportamiento', () => {
  const comportamiento = { id_comportamiento: 4, nombre: 'Ataque rápido' };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('pide confirmación, elimina y notifica al contenedor', async () => {
    const onEliminado = vi.fn();
    eliminarComportamiento.mockResolvedValue({ mensaje: 'Comportamiento eliminado.' });

    render(
      <EliminarComportamiento
        comportamiento={comportamiento}
        onEliminado={onEliminado}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Ataque rápido');

    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => {
      expect(eliminarComportamiento).toHaveBeenCalledWith('Ataque rápido');
      expect(onEliminado).toHaveBeenCalledWith(comportamiento);
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('muestra el error del servidor y no notifica eliminación', async () => {
    const onEliminado = vi.fn();
    eliminarComportamiento.mockRejectedValue(
      new Error('El comportamiento está asignado a una convocatoria.')
    );

    render(
      <EliminarComportamiento
        comportamiento={comportamiento}
        onEliminado={onEliminado}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El comportamiento está asignado a una convocatoria.'
    );
    expect(onEliminado).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('permite cancelar sin llamar al servicio', () => {
    render(<EliminarComportamiento comportamiento={comportamiento} />);

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(eliminarComportamiento).not.toHaveBeenCalled();
  });
});
