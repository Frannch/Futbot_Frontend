import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ReenviarVerificacion from '../pages/ReenviarVerificacion';

describe('ReenviarVerificacion', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('envía el correo y muestra un mensaje genérico', async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({}) });
    render(<ReenviarVerificacion />);

    fireEvent.change(screen.getByLabelText('Correo Electrónico'), {
      target: { value: 'usuario@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'REENVIAR VERIFICACIÓN' }));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      `${import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'}/api/auth/reenviar-verificacion`,
      expect.objectContaining({ method: 'POST' }),
    ));
    expect(await screen.findByText(
      'Si el correo está registrado y sin verificar, te hemos enviado un nuevo enlace.'
    )).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ESPERA 60s/ })).toBeDisabled();
  });

  it('mantiene deshabilitado el botón con un correo inválido', () => {
    render(<ReenviarVerificacion />);

    fireEvent.change(screen.getByLabelText('Correo Electrónico'), {
      target: { value: 'usuario' },
    });

    expect(screen.getByRole('button', { name: 'REENVIAR VERIFICACIÓN' })).toBeDisabled();
  });
});
