import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Login from '../pages/Login';

// contexto falso del websocket, porque montamos el login sin la app alrededor
vi.mock('../services/websocket.jsx', () => ({
  useWebSocket: () => ({ conectarWebSocket: vi.fn() })
}));

const datosLogin = {
  username: 'usuario123',
  password: 'password123',
};

function completarFormulario() {
  fireEvent.change(screen.getByLabelText('Nombre de Usuario'), {
    target: { value: datosLogin.username },
  });
  fireEvent.change(screen.getByLabelText('Contraseña'), {
    target: { value: datosLogin.password },
  });
  fireEvent.click(screen.getByRole('button', { name: 'INICIAR SESIÓN' }));
}

describe('Login', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('envía las credenciales y almacena el token cuando la autenticación es exitosa', async () => {
    fetch.mockResolvedValue({
      status: 200,
      json: async () => ({
        token: 'jwt-de-prueba',
        user_id: 'usuario-1',
        tiene_club: null,
        mensaje: 'Autenticación exitosa',
      }),
    });

    const cambiarPantalla = vi.fn();
    render(<Login cambiarPantalla={cambiarPantalla} />);

    fireEvent.change(screen.getByLabelText('Nombre de Usuario'), {
      target: { value: datosLogin.username },
    });
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: datosLogin.password },
    });
    fireEvent.click(screen.getByRole('button', { name: 'INICIAR SESIÓN' }));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    ));

    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual(datosLogin);
    expect(localStorage.getItem('token')).toBe('jwt-de-prueba');
    expect(localStorage.getItem('clubId')).toBeNull();
    expect(await screen.findByText('Autenticación exitosa')).toBeInTheDocument();
    expect(cambiarPantalla).toHaveBeenCalledWith('CrearClub');
  });

  it('redirige a mi-club cuando el usuario ya tiene club', async () => {
    fetch.mockResolvedValue({
      status: 200,
      json: async () => ({
        token: 'jwt-de-prueba',
        user_id: 'usuario-1',
        tiene_club: 10,
        mensaje: 'Autenticación exitosa',
      }),
    });

    const cambiarPantalla = vi.fn();
    render(<Login cambiarPantalla={cambiarPantalla} />);
    completarFormulario();

    await waitFor(() => expect(cambiarPantalla).toHaveBeenCalledWith('mi-club'));
    expect(localStorage.getItem('clubId')).toBe('10');
  });

  it('mantiene deshabilitado el botón con una contraseña menor a 8 caracteres', () => {
    render(<Login />);

    fireEvent.change(screen.getByLabelText('Nombre de Usuario'), {
      target: { value: datosLogin.username },
    });
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: '1234567' },
    });

    expect(screen.getByRole('button', { name: 'INICIAR SESIÓN' })).toBeDisabled();
  });

  it('muestra el error de la API cuando responde 400', async () => {
    fetch.mockResolvedValue({
      status: 400,
      json: async () => ({ error: 'Debes ingresar todos los datos.' }),
    });

    render(<Login />);
    completarFormulario();

    expect(await screen.findByText('Debes ingresar todos los datos.')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('muestra el error de la API cuando responde 401', async () => {
    fetch.mockResolvedValue({
      status: 401,
      json: async () => ({ error: 'El usuario o la contraseña son incorrectos.' }),
    });

    render(<Login />);
    completarFormulario();

    expect(await screen.findByText('El usuario o la contraseña son incorrectos.')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('bloquea el acceso y ofrece reenviar la verificación cuando responde 403', async () => {
    fetch.mockResolvedValue({
      status: 403,
      json: async () => ({ detail: 'Debes verificar tu correo antes de iniciar sesión.' }),
    });
    const cambiarPantalla = vi.fn();

    render(<Login cambiarPantalla={cambiarPantalla} />);
    completarFormulario();

    expect(await screen.findByText('Debes verificar tu correo antes de iniciar sesión.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '¿No recibiste el correo? Reenviar verificación' }));
    expect(cambiarPantalla).toHaveBeenCalledWith('reenviar-verificacion');
    expect(localStorage.getItem('token')).toBeNull();
  });
});
