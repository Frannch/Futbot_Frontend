import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FundarClub from '../pages/CrearClub';

function completarNombre() {
  fireEvent.change(screen.getByLabelText('Nombre Oficial'), {
    target: { value: 'Club Futbot' },
  });
}

function completarArchivo() {
  const archivoJpg = new File(['contenido'], 'escudo.jpg', { type: 'image/jpeg' });
  fireEvent.change(document.querySelector('input[type="file"]'), {
    target: { files: [archivoJpg] },
  });
}

describe('FundarClub', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:escudo'),
      revokeObjectURL: vi.fn(),
    });
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('deshabilita el botón cuando faltan el nombre o el escudo', () => {
    render(<FundarClub />);

    expect(screen.getByRole('button', { name: 'FUNDAR CLUB' })).toBeDisabled();

    completarNombre();
    expect(screen.getByRole('button', { name: 'FUNDAR CLUB' })).toBeDisabled();

    completarArchivo();
    expect(screen.getByRole('button', { name: 'FUNDAR CLUB' })).toBeEnabled();
  });

  it('limita el nombre del club a 20 caracteres', () => {
    render(<FundarClub />);

    expect(screen.getByLabelText('Nombre Oficial')).toHaveAttribute('maxLength', '20');
  });

  it('rechaza archivos que no son JPG', () => {
    render(<FundarClub />);
    const selectorArchivo = document.querySelector('input[type="file"]');
    const archivoPng = new File(['contenido'], 'escudo.png', { type: 'image/png' });

    fireEvent.change(selectorArchivo, { target: { files: [archivoPng] } });

    expect(selectorArchivo.value).toBe('');
    expect(screen.getByRole('button', { name: 'FUNDAR CLUB' })).toBeDisabled();
  });

  it('muestra la vista previa y habilita el botón con un JPG local', () => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:escudo'),
      revokeObjectURL: vi.fn(),
    });
    render(<FundarClub />);
    completarNombre();
    const archivoJpg = new File(['contenido'], 'escudo.jpg', { type: 'image/jpeg' });

    fireEvent.change(document.querySelector('input[type="file"]'), {
      target: { files: [archivoJpg] },
    });

    expect(document.querySelector('img')).toHaveAttribute('src', 'blob:escudo');
    expect(screen.getByRole('button', { name: 'FUNDAR CLUB' })).toBeEnabled();
  });

  it('envía el club con el token y muestra el mensaje de éxito', async () => {
    localStorage.setItem('token', 'token-de-prueba');
    fetch.mockResolvedValue({
      status: 201,
      json: async () => ({ id_club: 7, mensaje: 'Club creado exitosamente.' }),
    });
    render(<FundarClub />);
    completarNombre();
    completarArchivo();
    fireEvent.click(screen.getByRole('button', { name: 'FUNDAR CLUB' }));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/clubes/',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer token-de-prueba',
        },
      }),
    ));
    const cuerpo = fetch.mock.calls[0][1].body;
    expect(cuerpo.get('name')).toBe('Club Futbot');
    expect(cuerpo.get('photo').name).toBe('escudo.jpg');
    expect(localStorage.getItem('clubId')).toBe('7');
    expect(await screen.findByText('Club creado exitosamente.')).toBeInTheDocument();
  });

  it('no muestra el ID cuando la API no devuelve un mensaje', async () => {
    localStorage.setItem('token', 'token-de-prueba');
    fetch.mockResolvedValue({
      status: 201,
      json: async () => ({ id_club: 7 }),
    });
    render(<FundarClub />);
    completarNombre();
    completarArchivo();
    fireEvent.click(screen.getByRole('button', { name: 'FUNDAR CLUB' }));

    expect(await screen.findByText('Club creado correctamente.')).toBeInTheDocument();
    expect(screen.queryByText(/ID:/)).not.toBeInTheDocument();
  });

  it('indica que el usuario ya tiene un club cuando la API responde 403', async () => {
    localStorage.setItem('token', 'token-de-prueba');
    fetch.mockResolvedValue({
      status: 403,
      json: async () => ({ error: 'Acceso denegado.' }),
    });
    render(<FundarClub />);
    completarNombre();
    completarArchivo();
    fireEvent.click(screen.getByRole('button', { name: 'FUNDAR CLUB' }));

    expect(await screen.findByText('El usuario ya tiene un club.')).toBeInTheDocument();
  });

  it('muestra el error 409 y conserva la foto seleccionada', async () => {
    localStorage.setItem('token', 'token-de-prueba');
    fetch.mockResolvedValue({
      status: 409,
      json: async () => ({ error: 'El nombre del club ya está en uso.' }),
    });
    render(<FundarClub />);
    completarNombre();
    completarArchivo();
    fireEvent.click(screen.getByRole('button', { name: 'FUNDAR CLUB' }));

    expect(await screen.findByText('El nombre del club ya está en uso.')).toBeInTheDocument();
    expect(document.querySelector('img')).toHaveAttribute('src', 'blob:escudo');
  });
});