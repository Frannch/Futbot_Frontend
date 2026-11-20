import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, it, expect, vi } from 'vitest';
import MiClubNav from '../components/MiClubNav';

afterEach(() => {
  cleanup();
});

describe('MiClubNav', () => {
  it('renderiza las opciones Plantilla y Comportamientos', () => {
    const cambiarSeccion = vi.fn();

    render(
      <MiClubNav
        seccionActiva="plantilla"
        cambiarSeccion={cambiarSeccion}
      />
    );

    expect(screen.getByRole('button', { name: 'Plantilla' }))
      .toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Comportamientos' }))
      .toBeInTheDocument();
  });

  it('marca Plantilla como sección activa', () => {
    const cambiarSeccion = vi.fn();

    render(
      <MiClubNav
        seccionActiva="plantilla"
        cambiarSeccion={cambiarSeccion}
      />
    );

    const botonPlantilla = screen.getByRole('button', {
      name: 'Plantilla',
    });

    expect(botonPlantilla).toHaveClass(
      'border-b-2',
      'border-green-500',
      'text-green-500'
    );
  });

  it('marca Comportamientos como sección activa', () => {
    const cambiarSeccion = vi.fn();

    render(
      <MiClubNav
        seccionActiva="comportamientos"
        cambiarSeccion={cambiarSeccion}
      />
    );

    const botonComportamientos = screen.getByRole('button', {
      name: 'Comportamientos',
    });

    expect(botonComportamientos).toHaveClass(
      'border-b-2',
      'border-green-500',
      'text-green-500'
    );
  });

  it('cambia a Plantilla al hacer click', async () => {
    const cambiarSeccion = vi.fn();
    const user = userEvent.setup();

    render(
      <MiClubNav
        seccionActiva="comportamientos"
        cambiarSeccion={cambiarSeccion}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'Plantilla' })
    );

    expect(cambiarSeccion).toHaveBeenCalledWith('plantilla');
  });

  it('cambia a Comportamientos al hacer click', async () => {
    const cambiarSeccion = vi.fn();
    const user = userEvent.setup();

    render(
      <MiClubNav
        seccionActiva="plantilla"
        cambiarSeccion={cambiarSeccion}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'Comportamientos' })
    );

    expect(cambiarSeccion).toHaveBeenCalledWith('comportamientos');
  });
});