
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import ListaLigas from '../components/ListaLigas';
import useWebSocketLigas from '../hooks/useWebSocketLigas';

vi.mock('../hooks/useWebSocketLigas', () => ({
  default: vi.fn(),
}));

describe('ListaLigas', () => {
  const ligasEjemplo = [
    {
      id: 1,
      nombre: 'Liga de prueba',
      cantidadEquipos: 8,
      cuposOcupados: 5,
      duracionPartido: 10,
      esPrivada: false,
    },
    {
      id: 2,
      nombre: 'Liga completa',
      cantidadEquipos: 4,
      cuposOcupados: 4,
      duracionPartido: 15,
      esPrivada: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });


  it('muestra el mensaje de carga mientras espera el listado', () => {
    useWebSocketLigas.mockReturnValue({
      ligas: [],
      estado: 'conectando',
      error: null,
      listadoRecibido: false,
    });

    render(<ListaLigas />);

    expect(screen.getByText('Conectando y cargando ligas...')).toBeInTheDocument();
  });

  it('muestra el mensaje de reconexión durante la carga', () => {
    useWebSocketLigas.mockReturnValue({
      ligas: [],
      estado: 'reconectando',
      error: null,
      listadoRecibido: false,
    });

    render(<ListaLigas />);

    expect(screen.getByText('Reconectando con el servidor de ligas...')).toBeInTheDocument();
  });

  it('muestra un error cuando no se pudo cargar el listado', () => {
    useWebSocketLigas.mockReturnValue({
      ligas: [],
      estado: 'error',
      error: 'Error de conexión',
      listadoRecibido: false,
    });

    render(<ListaLigas />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('No se pudo cargar el listado de ligas.')).toBeInTheDocument();
    expect(screen.getByText('Error de conexión')).toBeInTheDocument();
  });

  it('muestra un mensaje cuando no hay ligas disponibles', () => {
    useWebSocketLigas.mockReturnValue({
      ligas: [],
      estado: 'conectado',
      error: null,
      listadoRecibido: true,
    });

    render(<ListaLigas />);

    expect( screen.getByText('No hay ligas disponibles') ).toBeInTheDocument();
    expect( screen.getByText( 'Cuando una liga entre en espera, aparecerá aquí automáticamente.' )).toBeInTheDocument();
  });

  it('renderiza los datos de las ligas recibidas', () => {
    useWebSocketLigas.mockReturnValue({
      ligas: ligasEjemplo,
      estado: 'conectado',
      error: null,
      listadoRecibido: true,
    });

    render(<ListaLigas />);

    expect(screen.getByText('Liga de prueba')).toBeInTheDocument();
    expect(screen.getByText('Liga completa')).toBeInTheDocument();

    expect(screen.getByText('5 / 8')).toBeInTheDocument();
    expect(screen.getByText('4 / 4')).toBeInTheDocument();

    expect(screen.getByText('10 min')).toBeInTheDocument();
    expect(screen.getByText('15 min')).toBeInTheDocument();
  });

  it('muestra los encabezados de la tabla', () => {
    useWebSocketLigas.mockReturnValue({
      ligas: ligasEjemplo,
      estado: 'conectado',
      error: null,
      listadoRecibido: true,
    });

    render(<ListaLigas />);

    const tabla = screen.getByRole('table');

    for (const encabezado of [
      'Nombre',
      'Cupos',
      'Duración',
      'Tipo',
      'Estado',
      'Acciones',
    ]) {
      expect(
        within(tabla).getByRole('columnheader', { name: encabezado })
      ).toBeInTheDocument();
    }
  });

  it('identifica correctamente las ligas públicas y privadas', () => {
    useWebSocketLigas.mockReturnValue({
      ligas: ligasEjemplo,
      estado: 'conectado',
      error: null,
      listadoRecibido: true,
    });

    render(<ListaLigas />);

    expect(screen.getByText('Pública')).toBeInTheDocument();
    expect(screen.getByText('Privada')).toBeInTheDocument();
  });

  it('muestra el estado de cada liga según sus cupos', () => {
    useWebSocketLigas.mockReturnValue({
      ligas: ligasEjemplo,
      estado: 'conectado',
      error: null,
      listadoRecibido: true,
    });

    render(<ListaLigas />);

    expect(screen.getByText('En espera')).toBeInTheDocument();
    expect(screen.getByText('Completa')).toBeInTheDocument();
  });

  it('habilita el botón de una liga disponible cuando no se proporciona onUnirse', () => {
    useWebSocketLigas.mockReturnValue({
      ligas: [ligasEjemplo[0]],
      estado: 'conectado',
      error: null,
      listadoRecibido: true,
    });
  
    render(<ListaLigas />);
  
    expect(screen.getByRole('button', { name: 'Unirse' })).toBeEnabled();
  });

  it('notifica la liga seleccionada al hacer clic en Unirse', () => {
    const onUnirse = vi.fn();
    useWebSocketLigas.mockReturnValue({
      ligas: [ligasEjemplo[0]],
      estado: 'conectado',
      error: null,
      listadoRecibido: true,
    });

    render(<ListaLigas onUnirse={onUnirse} />);
    screen.getByRole('button', { name: 'Unirse' }).click();

    expect(onUnirse).toHaveBeenCalledWith(ligasEjemplo[0]);
  });

  it('muestra Lobby en naranja y abre la liga ya inscripta', () => {
    const onIrAlLobby = vi.fn();
    localStorage.setItem('clubId', '15');
    localStorage.setItem('ligasClub-15', JSON.stringify([
      { id: 1, nombre: 'Liga de prueba', esCreador: true },
    ]));
    useWebSocketLigas.mockReturnValue({
      ligas: [ligasEjemplo[0]],
      estado: 'conectado',
      error: null,
      listadoRecibido: true,
    });

    render(<ListaLigas onIrAlLobby={onIrAlLobby} />);

    const boton = screen.getByRole('button', { name: 'Lobby' });
    expect(boton).toHaveClass('border-orange-400', 'text-orange-300');
    boton.click();
    expect(onIrAlLobby).toHaveBeenCalledWith({ ...ligasEjemplo[0], esCreador: true });
  });

  it('no muestra el botón de inscripción para una liga en curso', () => {
    useWebSocketLigas.mockReturnValue({
      ligas: [{
        ...ligasEjemplo[0],
        estado: 'en curso',
      }],
      estado: 'conectado',
      error: null,
      listadoRecibido: true,
    });

    render(<ListaLigas onUnirse={vi.fn()} />);

    expect(screen.getByText('En curso')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Unirse' })).not.toBeInTheDocument();
  });

  it('no muestra el botón de inscripción para una liga completa', () => {
    useWebSocketLigas.mockReturnValue({
      ligas: [ligasEjemplo[1]],
      estado: 'conectado',
      error: null,
      listadoRecibido: true,
    });

    render(<ListaLigas onUnirse={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Unirse' })).not.toBeInTheDocument();
  });

  it('muestra un aviso de reconexión y conserva las ligas recibidas', () => {
    useWebSocketLigas.mockReturnValue({
      ligas: [ligasEjemplo[0]],
      estado: 'reconectando',
      error: null,
      listadoRecibido: true,
    });

    render(<ListaLigas />);

    expect(
      screen.getByRole('status')
    ).toHaveTextContent('Se perdió la conexión. Intentando reconectar...');

    expect(screen.getByText('Liga de prueba')).toBeInTheDocument();

    expect(screen.getByText('Se conserva el último listado recibido mientras se recupera la conexión.')).toBeInTheDocument();
  });

  it('conserva las ligas y muestra el error si se pierde la conexión', () => {
    useWebSocketLigas.mockReturnValue({
      ligas: [ligasEjemplo[0]],
      estado: 'error',
      error: 'Conexión interrumpida',
      listadoRecibido: true,
    });

    render(<ListaLigas />);

    expect(screen.getByRole('status')).toHaveTextContent('Conexión interrumpida');
    expect(screen.getByText('Liga de prueba')).toBeInTheDocument();
  });
});
