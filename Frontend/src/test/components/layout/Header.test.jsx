import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Header from '../../../components/layout/Header.jsx';

vi.mock('../../../components/layout/MiPerfil.jsx', () => ({
  default: ({ alCerrar, onCerrarSesion }) => (
    <div role="dialog" aria-label="Mi Perfil">
      <button type="button" onClick={alCerrar}>Cerrar perfil</button>
      <button type="button" onClick={onCerrarSesion}>Cerrar sesión</button>
    </div>
  ),
}));

describe('Header', () => {
  afterEach(() => {
    cleanup();
  });

  it('muestra los destinos principales y permite navegar a Ligas', () => {
    const cambiarPantalla = vi.fn();
    render(
      <Header
        onCambiarPantalla={cambiarPantalla}
        pantallaActual="mi-club"
      />
    );

    expect(screen.getByRole('button', { name: 'Mi Club' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Amistosos' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Partidos en Vivo' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Explorador de Ligas' }));

    expect(cambiarPantalla).toHaveBeenCalledWith('ligas');
  });

  it('permite navegar a Amistosos desde la barra principal', () => {
    const cambiarPantalla = vi.fn();
    render(<Header onCambiarPantalla={cambiarPantalla} pantallaActual="ligas" />);

    fireEvent.click(screen.getByRole('button', { name: 'Amistosos' }));

    expect(cambiarPantalla).toHaveBeenCalledWith('amistosos');
  });

  it('permite navegar a Partidos en Vivo', () => {
    const cambiarPantalla = vi.fn();
    render(
      <Header
        onCambiarPantalla={cambiarPantalla}
        pantallaActual="ligas"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Partidos en Vivo' }));

    expect(cambiarPantalla).toHaveBeenCalledWith('partidos-en-vivo');
  });

  it('abre el perfil desde el botón superior y permite cerrar el modal', () => {
    const cerrarSesion = vi.fn();
    render(<Header onCerrarSesion={cerrarSesion} />);

    fireEvent.click(screen.getByRole('button', { name: 'Ver perfil' }));

    expect(screen.getByRole('dialog', { name: 'Mi Perfil' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar perfil' }));

    expect(screen.queryByRole('dialog', { name: 'Mi Perfil' })).not.toBeInTheDocument();
    expect(cerrarSesion).not.toHaveBeenCalled();
  });

  it('permite cerrar sesión desde el perfil', () => {
    const cerrarSesion = vi.fn();
    render(<Header onCerrarSesion={cerrarSesion} />);

    fireEvent.click(screen.getByRole('button', { name: 'Ver perfil' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(cerrarSesion).toHaveBeenCalledTimes(1);
  });
});
