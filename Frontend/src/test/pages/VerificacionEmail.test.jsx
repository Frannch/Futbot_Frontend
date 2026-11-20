import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import VerificacionEmail from '../pages/VerificacionEmail';

describe('VerificacionEmail', () => {
  afterEach(() => {
    cleanup();
    window.history.replaceState({}, '', '/');
  });

  it('muestra éxito para una verificación correcta', () => {
    window.history.replaceState({}, '', '/verificacion?estado=ok');
    render(<VerificacionEmail />);

    expect(screen.getByText('Correo verificado')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reenviar verificación' })).not.toBeInTheDocument();
  });

  it('permite reenviar cuando el enlace venció', () => {
    window.history.replaceState({}, '', '/verificacion?estado=expirado');
    const cambiarPantalla = vi.fn();
    render(<VerificacionEmail cambiarPantalla={cambiarPantalla} />);

    fireEvent.click(screen.getByRole('button', { name: 'Reenviar verificación' }));
    expect(cambiarPantalla).toHaveBeenCalledWith('reenviar-verificacion');
  });
});
