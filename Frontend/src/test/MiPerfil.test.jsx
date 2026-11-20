import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MiPerfil from '../components/MiPerfil.jsx';

const { actualizarPerfilMock, obtenerPerfilMock } = vi.hoisted(() => ({
  actualizarPerfilMock: vi.fn(),
  obtenerPerfilMock: vi.fn(),
}));

vi.mock('../services/perfilService.js', () => ({
  actualizarPerfil: actualizarPerfilMock,
  obtenerPerfil: obtenerPerfilMock,
  obtenerIdUsuarioActual: () => '8',
  obtenerTokenUsuarioActual: () => 'token-prueba',
  PERFIL_MOCK_ACTIVO: false,
}));

describe('MiPerfil', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('mantiene los datos actuales hasta confirmar los cambios por correo', async () => {
    obtenerPerfilMock.mockResolvedValue({
      id: 8,
      username: 'nombre-anterior',
      email: 'anterior@example.com',
    });
    actualizarPerfilMock.mockResolvedValue({
      id: 8,
      username: 'nombre-anterior',
      email: 'anterior@example.com',
    });

    render(<MiPerfil esModal={false} abierto />);

    fireEvent.click(await screen.findByRole('button', { name: 'Editar Perfil' }));
    fireEvent.change(screen.getByLabelText('Nombre de Usuario'), {
      target: { value: 'nombre-nuevo' },
    });
    fireEvent.change(screen.getByLabelText('Correo Electrónico'), {
      target: { value: 'nuevo@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('Revisa tu bandeja de entrada para confirmar los cambios')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'nombre-anterior' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Editar Perfil' }));
    await waitFor(() => {
      expect(screen.getByLabelText('Nombre de Usuario')).toHaveValue('nombre-anterior');
      expect(screen.getByLabelText('Correo Electrónico')).toHaveValue('anterior@example.com');
    });
  });

  it('vuelve a cargar los valores del servidor si se cierra y abre el perfil antes de confirmar', async () => {
    obtenerPerfilMock.mockResolvedValue({
      id: 8,
      username: 'nombre-anterior',
      email: 'anterior@example.com',
    });
    actualizarPerfilMock.mockResolvedValue({
      id: 8,
      username: 'nombre-anterior',
      email: 'anterior@example.com',
    });

    const vista = render(<MiPerfil esModal={false} abierto />);
    fireEvent.click(await screen.findByRole('button', { name: 'Editar Perfil' }));
    fireEvent.change(screen.getByLabelText('Nombre de Usuario'), {
      target: { value: 'nombre-nuevo' },
    });
    fireEvent.change(screen.getByLabelText('Correo Electrónico'), {
      target: { value: 'nuevo@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await screen.findByText('Revisa tu bandeja de entrada para confirmar los cambios');

    vista.unmount();
    render(<MiPerfil esModal={false} abierto />);

    expect(await screen.findByRole('heading', { name: 'nombre-anterior' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Editar Perfil' }));
    expect(screen.getByLabelText('Nombre de Usuario')).toHaveValue('nombre-anterior');
    expect(screen.getByLabelText('Correo Electrónico')).toHaveValue('anterior@example.com');
  });
});