import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Blogs from './Blogs';
import { ARTICULOS_BLOG } from '../data/blogs';

describe('<Blogs />', () => {
  it('renderiza el encabezado principal del blog', () => {
    render(
      <MemoryRouter>
        <Blogs />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: /Blog & Novedades Musicales/i })).toBeInTheDocument();
  });

  it('renderiza todos los artículos de blog disponibles', () => {
    render(
      <MemoryRouter>
        <Blogs />
      </MemoryRouter>
    );

    ARTICULOS_BLOG.forEach((articulo) => {
      expect(screen.getByText(articulo.titulo)).toBeInTheDocument();
    });
  });
});
