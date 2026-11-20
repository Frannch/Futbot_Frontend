import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Registro from '../../pages/Registro';

const datosValidos = {
  username: 'usuario123',
  email: 'usuario@example.com',
  password: 'password123',
};

function completarFormulario({ confirmarPassword = datosValidos.password } = {}) {
  fireEvent.change(screen.getByLabelText('Nombre de Usuario'), {
    target: { value: datosValidos.username },
  });
  fireEvent.change(screen.getByLabelText('Correo Electrónico'), {
    target: { value: datosValidos.email },
  });
  fireEvent.change(screen.getByLabelText('Contraseña'), {
    target: { value: datosValidos.password },
  });
  fireEvent.change(screen.getByLabelText('Confirmar Contraseña'), {
    target: { value: confirmarPassword },
  });
}

describe('Registro', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('deshabilita el botón cuando los campos están incompletos', () => {
    render(<Registro />);

    expect(screen.getByRole('button', { name: 'CREAR CUENTA' })).toBeDisabled();
  });

  it('muestra validaciones para username, email, password y confirmación', () => {
    render(<Registro />);

    fireEvent.change(screen.getByLabelText('Nombre de Usuario'), {
      target: { value: 'usuario!' },
    });
    fireEvent.change(screen.getByLabelText('Correo Electrónico'), {
      target: { value: 'correo-invalido' },
    });
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'corta' },
    });
    fireEvent.change(screen.getByLabelText('Confirmar Contraseña'), {
      target: { value: 'diferente' },
    });

    expect(screen.getByText('Usa solo letras y números.')).toBeInTheDocument();
    expect(screen.getByText('Ingresa un correo electrónico válido.')).toBeInTheDocument();
    expect(screen.getByText('La contraseña debe tener al menos 8 caracteres.')).toBeInTheDocument();
    expect(screen.getByText('Las contraseñas no coinciden.')).toBeInTheDocument();
  });

  it('alterna la visibilidad de ambas contraseñas', () => {
    render(<Registro />);

    const password = screen.getByLabelText('Contraseña');
    const confirmPassword = screen.getByLabelText('Confirmar Contraseña');

    expect(password).toHaveAttribute('type', 'password');
    expect(confirmPassword).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar confirmar contraseña' }));

    expect(password).toHaveAttribute('type', 'text');
    expect(confirmPassword).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toBeInTheDocument();
  });

  it('envía el JSON requerido, muestra la cuenta regresiva y redirige al login', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Registro exitoso' }),
    });
    const cambiarPantalla = vi.fn();

    render(<Registro cambiarPantalla={cambiarPantalla} />);
    completarFormulario();
    fireEvent.click(screen.getByRole('button', { name: 'CREAR CUENTA' }));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/auth/registro',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    ));
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual(datosValidos);
    expect(await screen.findByText(
      'Cuenta creada. Revisa tu bandeja de entrada (y la carpeta de spam) para verificar tu correo antes de iniciar sesión.'
    )).toBeInTheDocument();
    expect(await screen.findByText(
      'Serás redirigido al inicio de sesión en 10 segundos.'
    )).toBeInTheDocument();

    await waitFor(() => expect(cambiarPantalla).toHaveBeenCalledWith('login'), {
      timeout: 11000,
    });
  }, 15000);

  it('muestra el error devuelto por la API', async () => {
    fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ detail: 'El usuario ya existe.' }),
    });

    render(<Registro />);
    completarFormulario();
    fireEvent.click(screen.getByRole('button', { name: 'CREAR CUENTA' }));

    expect(await screen.findByText('El usuario ya existe.')).toBeInTheDocument();
  });

  it('muestra un mensaje cuando no hay conexión con el servidor', async () => {
    fetch.mockRejectedValue(new Error('Backend apagado'));

    render(<Registro />);
    completarFormulario();
    fireEvent.click(screen.getByRole('button', { name: 'CREAR CUENTA' }));

    expect(await screen.findByText('Error de conexión con el servidor.')).toBeInTheDocument();
  });
});
