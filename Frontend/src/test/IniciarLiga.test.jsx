import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import IniciarLiga from '../components/IniciarLiga';
import { iniciarLiga } from '../services/ligas';

vi.mock('../services/ligas', () => ({ iniciarLiga: vi.fn() }));

describe('IniciarLiga', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'token-test');
    iniciarLiga.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('no muestra el control si el usuario no es el creador', () => {
    render(<IniciarLiga esCreador={false} equiposDisponibles={4} />);

    expect(screen.queryByRole('button', { name: 'Iniciar Liga' })).not.toBeInTheDocument();
  });

  it('mantiene el control bloqueado hasta que haya cuatro equipos', () => {
    render(<IniciarLiga esCreador equiposDisponibles={3} />);

    expect(screen.getByRole('button', { name: 'Iniciar Liga' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Faltan 1 club para poder iniciar');
  });

  it('habilita el control con cuatro equipos aunque el máximo configurado sea cinco', () => {
    render(<IniciarLiga esCreador equiposDisponibles={4} />);

    expect(screen.getByRole('button', { name: 'Iniciar Liga' })).toBeEnabled();
  });

  it('usa el mínimo de cuatro aunque no reciba la cantidad máxima de equipos', () => {
    render(<IniciarLiga esCreador equiposDisponibles={4} />);

    expect(screen.getByRole('button', { name: 'Iniciar Liga' })).toBeEnabled();
  });

  it('oculta el control cuando la liga ya está iniciada', () => {
    render(<IniciarLiga esCreador equiposDisponibles={4} yaIniciada />);

    expect(screen.queryByRole('button', { name: 'Iniciar Liga' })).not.toBeInTheDocument();
  });

  it('muestra un error si falta el ID de la liga', async () => {
    render(<IniciarLiga esCreador equiposDisponibles={4} idLiga={null} />);
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar Liga' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No se encontró el ID de la liga.');
    expect(iniciarLiga).not.toHaveBeenCalled();
  });

  it('muestra un error si falta el token', async () => {
    localStorage.removeItem('token');
    render(<IniciarLiga esCreador equiposDisponibles={4} idLiga={7} />);
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar Liga' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No se encontró el token de autenticación.');
    expect(iniciarLiga).not.toHaveBeenCalled();
  });

  it('inicia la liga, notifica al padre y oculta el control', async () => {
    const alIniciar = vi.fn();
    const liga = { id: 7, estado: 'iniciada' };
    iniciarLiga.mockResolvedValue({ liga });
    render(<IniciarLiga esCreador equiposDisponibles={4} idLiga={7} alIniciar={alIniciar} />);

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar Liga' }));

    await waitFor(() => expect(alIniciar).toHaveBeenCalledWith(liga));
    expect(iniciarLiga).toHaveBeenCalledWith(7);
    expect(screen.queryByRole('button', { name: 'Iniciar Liga' })).not.toBeInTheDocument();
  });

  it('muestra el error del servicio si no puede iniciar la liga', async () => {
    iniciarLiga.mockRejectedValue(new Error('La liga ya no está disponible.'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<IniciarLiga esCreador equiposDisponibles={4} idLiga={7} />);

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar Liga' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('La liga ya no está disponible.');
    expect(screen.getByRole('button', { name: 'Iniciar Liga' })).toBeEnabled();
  });
});