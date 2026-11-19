import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Nosotros from './Nosotros';

describe('<Nosotros />', () => {
  it('renderiza la historia institucional de Sonido Vivo', () => {
    render(
      <MemoryRouter>
        <Nosotros />
      </MemoryRouter>
    );

    expect(screen.getByText('Nuestra Historia')).toBeInTheDocument();
    expect(screen.getByText(/Fundada en 2015 en el corazón comercial de Viña del Mar/i)).toBeInTheDocument();
  });

  it('muestra la misión, visión y los valores fundamentales', () => {
    render(
      <MemoryRouter>
        <Nosotros />
      </MemoryRouter>
    );

    expect(screen.getByText('Misión')).toBeInTheDocument();
    expect(screen.getByText('Visión')).toBeInTheDocument();
    expect(screen.getByText('Stock Real y Garantizado')).toBeInTheDocument();
  });

  it('renderiza los sellos de identidad de la tienda', () => {
    render(
      <MemoryRouter>
        <Nosotros />
      </MemoryRouter>
    );

    expect(screen.getByText(/Asesoría Técnica Personalizada/i)).toBeInTheDocument();
    expect(screen.getByText(/Alianza Formativa Duoc UC/i)).toBeInTheDocument();
  });
});
