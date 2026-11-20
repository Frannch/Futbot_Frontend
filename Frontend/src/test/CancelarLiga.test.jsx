import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import CancelarLiga from '../components/layout/CancelarLiga.jsx';
import { cancelarLiga } from '../services/ligas.js';

vi.mock('../services/ligas.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, cancelarLiga: vi.fn() };
});

describe('CancelarLiga', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('no muestra la acción si el usuario no es creador', () => {
    render(<CancelarLiga idLiga={5} esCreador={false} />);

    expect(screen.queryByRole('button', { name: 'Cancelar liga' })).not.toBeInTheDocument();
  });

  it('pide confirmación, envía DELETE y vuelve a Mi Club al completar', async () => {
    const cambiarPantalla = vi.fn();
    cancelarLiga.mockResolvedValue({ mensaje: 'Liga eliminada.' });

    render(<CancelarLiga idLiga={5} esCreador cambiarPantalla={cambiarPantalla} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar liga' }));
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Todos los jugadores serán eliminados de la liga junto a ella.'
    );
    expect(cancelarLiga).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => {
      expect(cancelarLiga).toHaveBeenCalledWith(5);
      expect(cambiarPantalla).toHaveBeenCalledWith('mi-club');
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('muestra errores del servidor y permanece en el lobby', async () => {
    const cambiarPantalla = vi.fn();
    cancelarLiga.mockRejectedValue(new Error('La liga ya inició.'));

    render(<CancelarLiga idLiga={5} esCreador cambiarPantalla={cambiarPantalla} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar liga' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('La liga ya inició.');
    expect(cambiarPantalla).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('permite cancelar la confirmación sin invocar el servicio', () => {
    render(<CancelarLiga idLiga={5} esCreador />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar liga' }));
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }));

    expect(cancelarLiga).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
