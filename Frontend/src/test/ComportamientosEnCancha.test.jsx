import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import ComportamientosEnCancha from '../components/ComportamientosEnCancha.jsx';

describe('ComportamientosEnCancha', () => {
  afterEach(() => cleanup());

  it('permite actualizar el comportamiento de cada jugador', async () => {
    const onCambiarComportamiento = vi.fn().mockResolvedValue({
      mensaje: 'Comportamiento actualizado para el próximo tick.',
    });

    render(
      <ComportamientosEnCancha
        jugadoresEnCancha={[
          { id: 1, nombre: 'Carlos', id_comportamiento: 1 },
          { id: 2, nombre: 'Juan' },
        ]}
        comportamientos={[
          { id_comportamiento: 1, nombre: 'Defensor' },
          { id_comportamiento: 3, nombre: 'Atacante' },
        ]}
        onCambiarComportamiento={onCambiarComportamiento}
      />
    );

    fireEvent.change(screen.getByLabelText('Comportamiento de Juan'), {
      target: { value: '3' },
    });
    fireEvent.click(screen.getAllByRole('button', { name: 'Actualizar' })[1]);

    await waitFor(() => expect(onCambiarComportamiento).toHaveBeenCalledWith({
      id_jugador: 2,
      id_comportamiento: 3,
    }));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Comportamiento actualizado para el próximo tick.'
    );
  });

  it('reemplaza al jugador que sale sin desplazar las posiciones restantes', () => {
    const { rerender } = render(
      <ComportamientosEnCancha
        jugadoresEnCancha={[
          { id: 1, nombre: 'Carlos' },
          { id: 2, nombre: 'Juan' },
          { id: 3, nombre: 'Pedro' },
        ]}
        comportamientos={[]}
        onCambiarComportamiento={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Comportamiento de Carlos')).toBeInTheDocument();
    expect(screen.getByLabelText('Comportamiento de Juan')).toBeInTheDocument();
    expect(screen.getByLabelText('Comportamiento de Pedro')).toBeInTheDocument();

    rerender(
      <ComportamientosEnCancha
        jugadoresEnCancha={[
          { id: 1, nombre: 'Carlos' },
          { id: 3, nombre: 'Pedro' },
          { id: 4, nombre: 'Luis' },
        ]}
        comportamientos={[]}
        onCambiarComportamiento={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Comportamiento de Carlos')).toBeInTheDocument();
    expect(screen.getByLabelText('Comportamiento de Luis')).toBeInTheDocument();
    expect(screen.getByLabelText('Comportamiento de Pedro')).toBeInTheDocument();
    expect(screen.queryByLabelText('Comportamiento de Juan')).not.toBeInTheDocument();
  });
});
