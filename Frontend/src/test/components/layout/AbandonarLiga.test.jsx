
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import AbandonarLiga from '../../../components/layout/AbandonarLiga';
import { abandonarLiga } from '../../../services/AbandonarLiga';

vi.mock('../../../services/AbandonarLiga', () => ({
  abandonarLiga: vi.fn(),
}));

describe('AbandonarLiga', () => {
  const idLiga = 10;
  const idUsuario = '20';
  const token = 'token-prueba';
  const cambiarPantalla = vi.fn();

  const renderComponente = (props = {}) =>
    render(
      <AbandonarLiga
        idLiga={idLiga}
        cambiarPantalla={cambiarPantalla}
        {...props}
      />
    );

  const abrirModal = () => {
    fireEvent.click(screen.getByRole('button', { name: 'Abandonar liga' }));
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    localStorage.setItem('ownerId', '999');
    localStorage.setItem('userId', idUsuario);
    localStorage.setItem('token', token);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('muestra el botón deshabilitado cuando el usuario es el creador', () => {
    localStorage.setItem('ownerId', idUsuario);

    renderComponente();

    const boton = screen.getByRole('button', { name: 'Abandonar liga' });

    expect(boton).toBeInTheDocument();
    expect(boton).toBeDisabled();
    expect(boton).toHaveAttribute('aria-disabled', 'true');
    expect(
      screen.queryByText('El creador de la liga no puede abandonar.')
    ).not.toBeInTheDocument();

    fireEvent.click(boton);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(abandonarLiga).not.toHaveBeenCalled();
  });

  it('permite abrir el modal cuando el usuario no es el creador', () => {
    renderComponente();

    abrirModal();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByText('¿Estás seguro de que deseas abandonar esta liga?')
    ).toBeInTheDocument();
  });

  it('cierra el modal al cancelar sin llamar al servicio', () => {
    renderComponente();

    abrirModal();

    fireEvent.click(screen.getByRole('button', { name: 'No' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(abandonarLiga).not.toHaveBeenCalled();
    expect(cambiarPantalla).not.toHaveBeenCalled();
  });

  it('llama al servicio con los argumentos correctos y navega a Mi Club si tiene éxito', async () => {
    abandonarLiga.mockResolvedValue({
      message: 'Eliminado correctamente',
    });

    renderComponente();

    abrirModal();

    fireEvent.click(screen.getByRole('button', { name: 'Sí' }));

    await waitFor(() => {
      expect(abandonarLiga).toHaveBeenCalledWith(
        idLiga,
        idUsuario,
        token
      );
    });

    await waitFor(() => {
      expect(cambiarPantalla).toHaveBeenCalledWith('mi-club');
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('muestra un error y permanece en el lobby si falla el servicio', async () => {
    const error = new Error('No se pudo abandonar la liga.');
    abandonarLiga.mockRejectedValue(error);

    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    renderComponente();

    abrirModal();

    fireEvent.click(screen.getByRole('button', { name: 'Sí' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo abandonar la liga.'
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(cambiarPantalla).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('muestra un error si no se proporciona el ID de la liga', async () => {
    renderComponente({ idLiga: null });

    abrirModal();

    fireEvent.click(screen.getByRole('button', { name: 'Sí' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se encontró el ID de la liga.'
    );

    expect(abandonarLiga).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(cambiarPantalla).not.toHaveBeenCalled();
  });

  it('muestra un error si no existe el ID del usuario', async () => {
    localStorage.removeItem('userId');

    renderComponente();

    abrirModal();

    fireEvent.click(screen.getByRole('button', { name: 'Sí' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No se encontró el ID del usuario.');
    expect(abandonarLiga).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('muestra un error si no existe el token', async () => {
    localStorage.removeItem('token');

    renderComponente();

    abrirModal();

    fireEvent.click(screen.getByRole('button', { name: 'Sí' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No se encontró el token de autenticación.');
    expect(abandonarLiga).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('deshabilita los botones y muestra el estado de carga durante la petición', async () => {
    let resolverPeticion;

    abandonarLiga.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolverPeticion = resolve;
        })
    );

    renderComponente();

    abrirModal();

    fireEvent.click(screen.getByRole('button', { name: 'Sí' }));

    expect( await screen.findByRole('button', { name: 'Abandonando...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'No' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Abandonar liga' })).toBeDisabled();

    resolverPeticion({ message: 'Eliminado correctamente' });

    await waitFor(() => {
      expect(cambiarPantalla).toHaveBeenCalledWith('mi-club');
    });
  });
});
