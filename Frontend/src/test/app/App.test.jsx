import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../app/App.jsx';

const desconectarWebSocket = vi.fn();

vi.mock('../services/websocket.jsx', () => ({
  useWebSocket: () => ({ desconectarWebSocket }),
}));

vi.mock('../pages/Login.jsx', () => ({
  default: ({ cambiarPantalla }) => (
    <button onClick={() => cambiarPantalla('amistosos')}>Pantalla de login</button>
  ),
}));

vi.mock('../pages/MiClub.jsx', () => ({
  default: ({ cerrarSesion }) => (
    <>
      <p>Pantalla de mi club</p>
      <button onClick={cerrarSesion}>Cerrar sesión</button>
    </>
  ),
}));

vi.mock('../pages/Amistosos.jsx', () => ({
  default: ({ cerrarSesion }) => (
    <button onClick={cerrarSesion}>Pantalla de amistosos</button>
  ),
}));

vi.mock('../pages/Cancha.jsx', () => ({
  default: () => <p>Pantalla de cancha</p>,
}));

vi.mock('../pages/ExploradorLigas.jsx', () => ({
  default: ({ irAlLobby, ligaActiva }) => (
    <>
      <p>Pantalla de ligas</p>
      <button onClick={() => irAlLobby(21, 'Liga de prueba', true, 4)}>
        Simular creación de liga
      </button>
      <output data-testid="liga-activa">{JSON.stringify(ligaActiva)}</output>
    </>
  ),
}));

vi.mock('../pages/CrearClub.jsx', () => ({
  default: ({ cerrarSesion }) => (
    <button onClick={cerrarSesion}>Pantalla de crear club</button>
  ),
}));

vi.mock('../pages/Registro.jsx', () => ({
  default: () => <p>Pantalla de registro</p>,
}));

vi.mock('../pages/PartidosEnVivo.jsx', () => ({
  default: () => <p data-testid="partidos-en-vivo-real">Partidos en Vivo actualizado</p>,
}));

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    desconectarWebSocket.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('muestra login cuando no existe una sesión guardada', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: 'Pantalla de login' })).toBeInTheDocument();
  });

  it('muestra la vista de verificación desde su ruta directa', () => {
    window.history.replaceState({}, '', '/verificacion?estado=ok');

    render(<App />);

    expect(screen.getByText('Correo verificado')).toBeInTheDocument();
    window.history.replaceState({}, '', '/');
  });

  it('vuelve al login desde la ruta directa de reenvío de verificación', () => {
    window.history.replaceState({}, '', '/reenviar-verificacion');

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Volver a iniciar sesión' }));

    expect(window.location.pathname).toBe('/');
    expect(screen.getByRole('button', { name: 'Pantalla de login' })).toBeInTheDocument();
  });

  it('restaura mi-club cuando existe un club guardado', () => {
    localStorage.setItem('token', 'token-de-prueba');
    localStorage.setItem('userId', 'usuario-1');
    localStorage.setItem('clubId', '10');
    localStorage.setItem('pantallaActual', 'CrearClub');

    render(<App />);

    expect(screen.getByText('Pantalla de mi club')).toBeInTheDocument();
  });

  it('migra la pantalla antigua miClub a mi-club', () => {
    localStorage.setItem('token', 'token-de-prueba');
    localStorage.setItem('userId', 'usuario-1');
    localStorage.setItem('pantallaActual', 'miClub');

    render(<App />);

    expect(screen.getByText('Pantalla de mi club')).toBeInTheDocument();
  });

  it('cierra la sesión, desconecta el WebSocket y limpia las credenciales', () => {
    localStorage.setItem('token', 'token-de-prueba');
    localStorage.setItem('userId', 'usuario-1');
    localStorage.setItem('clubId', '10');
    localStorage.setItem('pantallaActual', 'mi-club');

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(desconectarWebSocket).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('userId')).toBeNull();
    expect(localStorage.getItem('clubId')).toBeNull();
    expect(localStorage.getItem('pantallaActual')).toBeNull();
    expect(screen.getByRole('button', { name: 'Pantalla de login' })).toBeInTheDocument();
  });

  it('muestra las pantallas guardadas de crear club, amistosos, ligas y lobby', () => {
    const casos = [
      ['CrearClub', 'Pantalla de crear club'],
      ['amistosos', 'Pantalla de amistosos'],
      ['ligas', 'Pantalla de ligas'],
      ['lobby', 'Pantalla de ligas']
    ];

    casos.forEach(([pantalla, texto]) => {
      localStorage.clear();
      localStorage.setItem('token', 'token-de-prueba');
      localStorage.setItem('userId', 'usuario-1');
      localStorage.setItem('pantallaActual', pantalla);
      const { unmount } = render(<App />);
      expect(screen.getByText(texto)).toBeInTheDocument();
      unmount();
    });

  });

  it('renderiza el hub real de partidos en vivo', () => {
    localStorage.setItem('token', 'token-de-prueba');
    localStorage.setItem('userId', 'usuario-1');
    localStorage.setItem('pantallaActual', 'partidos-en-vivo');

    render(<App />);

    expect(screen.getByTestId('partidos-en-vivo-real')).toHaveTextContent(
      'Partidos en Vivo actualizado',
    );
  });

  it('permite navegar desde login y persiste la pantalla seleccionada', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Pantalla de login' }));

    expect(screen.getByRole('button', { name: 'Pantalla de amistosos' })).toBeInTheDocument();
    expect(localStorage.getItem('pantallaActual')).toBe('amistosos');
  });

  it('no agrega clubes ficticios al entrar al lobby de una liga nueva', () => {
    localStorage.setItem('token', 'token-de-prueba');
    localStorage.setItem('userId', 'usuario-1');
    localStorage.setItem('pantallaActual', 'ligas');

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Simular creación de liga' }));

    const ligaActiva = JSON.parse(screen.getByTestId('liga-activa').textContent);
    expect(ligaActiva.cuposOcupados).toBe(0);
    expect(ligaActiva.clubes).toEqual([]);
    expect(ligaActiva.fechas).toEqual([]);
  });
});