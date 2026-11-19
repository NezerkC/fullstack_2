import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ModalCrearObjeto from './ModalCrearObjeto';

describe('<ModalCrearObjeto />', () => {
  it('renderiza correctamente el título, campos y opciones', () => {
    const onGuardar = vi.fn();
    const onCerrar = vi.fn();

    render(<ModalCrearObjeto onGuardar={onGuardar} onCerrar={onCerrar} />);

    expect(screen.getByText(/Registrar Nuevo Objeto \/ Servicio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre del Objeto \/ Servicio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Categoría:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Precio \(CLP\):/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Descripción del Servicio \/ Especificación:/i)).toBeInTheDocument();
  });

  it('muestra mensajes de error cuando se intenta enviar formulario vacío', () => {
    const onGuardar = vi.fn();
    const onCerrar = vi.fn();

    render(<ModalCrearObjeto onGuardar={onGuardar} onCerrar={onCerrar} />);

    const submitBtn = screen.getByTestId('btn-guardar-nuevo-objeto');
    fireEvent.click(submitBtn);

    expect(screen.getByText(/El nombre del servicio\/objeto es obligatorio/i)).toBeInTheDocument();
    expect(screen.getByText(/Ingresa un precio válido mayor a \$0/i)).toBeInTheDocument();
    expect(screen.getByText(/La descripción es obligatoria/i)).toBeInTheDocument();
    expect(onGuardar).not.toHaveBeenCalled();
  });

  it('envía los datos correctamente al completar todos los campos válidos', () => {
    const onGuardar = vi.fn();
    const onCerrar = vi.fn();

    render(<ModalCrearObjeto onGuardar={onGuardar} onCerrar={onCerrar} />);

    fireEvent.change(screen.getByLabelText(/Nombre del Objeto \/ Servicio/i), {
      target: { value: 'Afinación de Piano' },
    });
    fireEvent.change(screen.getByLabelText(/Precio \(CLP\):/i), {
      target: { value: '75000' },
    });
    fireEvent.change(screen.getByLabelText(/Descripción del Servicio \/ Especificación:/i), {
      target: { value: 'Servicio a domicilio con afinador certificado Duoc.' },
    });

    const submitBtn = screen.getByTestId('btn-guardar-nuevo-objeto');
    fireEvent.click(submitBtn);

    expect(onGuardar).toHaveBeenCalledTimes(1);
    expect(onGuardar).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: 'Afinación de Piano',
        precio: 75000,
        descripcion: 'Servicio a domicilio con afinador certificado Duoc.',
        estado: 'Disponible',
      })
    );
  });

  it('ejecuta onCerrar al hacer clic en el botón cancelar o en la cruz', () => {
    const onGuardar = vi.fn();
    const onCerrar = vi.fn();

    render(<ModalCrearObjeto onGuardar={onGuardar} onCerrar={onCerrar} />);

    const closeBtn = screen.getByLabelText(/Cerrar modal/i);
    fireEvent.click(closeBtn);
    expect(onCerrar).toHaveBeenCalledTimes(1);

    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    fireEvent.click(cancelBtn);
    expect(onCerrar).toHaveBeenCalledTimes(2);
  });
});
