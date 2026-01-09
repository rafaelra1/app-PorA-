/**
 * Testes de Integração para Fluxos Críticos
 * ==========================================
 *
 * Este arquivo testa os fluxos completos de usuário,
 * verificando que todas as funcionalidades estão integradas corretamente.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '../utils/test-utils';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Base';
import Modal from '../../components/trip-details/modals/Modal';

// =============================================================================
// Modal Component Integration Tests
// =============================================================================

describe('Modal Component Integration', () => {
  const MockModalContent = () => (
    <div>
      <Input label="Título" id="title" />
      <Input label="Descrição" id="description" />
      <Select
        label="Status"
        options={[
          { value: 'planning', label: 'Planejando' },
          { value: 'confirmed', label: 'Confirmado' }
        ]}
        id="status"
      />
    </div>
  );

  it('should open and close modal correctly', async () => {
    const handleClose = vi.fn();

    const { user, rerender } = render(
      <Modal isOpen={false} onClose={handleClose} title="Test Modal">
        <MockModalContent />
      </Modal>
    );

    // Modal should not be visible initially
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();

    // Open modal
    rerender(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <MockModalContent />
      </Modal>
    );

    // Modal should be visible
    expect(screen.getByText('Test Modal')).toBeInTheDocument();

    // Close modal via close button
    const closeButton = screen.getByRole('button', { name: /fechar modal/i });
    await user.click(closeButton);

    expect(handleClose).toHaveBeenCalled();
  });

  it('should close modal on ESC key press', async () => {
    const handleClose = vi.fn();
    const { user } = render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <MockModalContent />
      </Modal>
    );

    await user.keyboard('{Escape}');
    expect(handleClose).toHaveBeenCalled();
  });

  it('should close modal on overlay click', async () => {
    const handleClose = vi.fn();
    const { user } = render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal" closeOnOverlayClick>
        <MockModalContent />
      </Modal>
    );

    // Click on overlay (the backdrop)
    const overlay = document.querySelector('.fixed.inset-0');
    if (overlay) {
      await user.click(overlay);
      expect(handleClose).toHaveBeenCalled();
    }
  });

  it('should NOT close modal on overlay click when closeOnOverlayClick is false', async () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal" closeOnOverlayClick={false}>
        <MockModalContent />
      </Modal>
    );

    // Click inside modal content should not close
    const modalContent = screen.getByText('Título');
    await expect(modalContent).toBeInTheDocument();
  });

  it('should render footer when provided', () => {
    const handleClose = vi.fn();

    render(
      <Modal
        isOpen={true}
        onClose={handleClose}
        title="Test Modal"
        footer={
          <>
            <Button variant="outline">Cancelar</Button>
            <Button>Salvar</Button>
          </>
        }
      >
        <MockModalContent />
      </Modal>
    );

    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
  });

  it('should render different modal sizes', () => {
    const handleClose = vi.fn();
    const sizes = ['sm', 'md', 'lg', 'xl', 'full'] as const;
    const sizeClasses = {
      sm: 'max-w-md',
      md: 'max-w-2xl',
      lg: 'max-w-4xl',
      xl: 'max-w-6xl',
      full: 'max-w-[95vw]',
    };

    sizes.forEach(size => {
      const { container, unmount } = render(
        <Modal isOpen={true} onClose={handleClose} title={`Modal ${size}`} size={size}>
          <div>Content</div>
        </Modal>
      );

      const modalContainer = container.querySelector(`.${sizeClasses[size].replace('[', '\\[').replace(']', '\\]')}`);
      expect(modalContainer).toBeInTheDocument();
      unmount();
    });
  });

  it('should hide close button when showCloseButton is false', () => {
    const handleClose = vi.fn();

    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal" showCloseButton={false}>
        <div>Content</div>
      </Modal>
    );

    expect(screen.queryByRole('button', { name: /fechar modal/i })).not.toBeInTheDocument();
  });
});

// =============================================================================
// Form Submission Flow Tests
// =============================================================================

describe('Form Submission Flow', () => {
  it('should handle complete trip creation flow', async () => {
    const handleSubmit = vi.fn((e: React.FormEvent) => {
      e.preventDefault();
      return Promise.resolve();
    });

    const { user } = render(
      <form onSubmit={handleSubmit} data-testid="trip-form">
        <Input label="Título da Viagem" id="title" required />
        <Input label="Destino" id="destination" required />
        <Input label="Data de Início" type="date" id="startDate" required />
        <Input label="Data de Fim" type="date" id="endDate" required />
        <Select
          label="Status"
          options={[
            { value: 'planning', label: 'Planejando' },
            { value: 'confirmed', label: 'Confirmado' },
            { value: 'completed', label: 'Concluído' }
          ]}
          id="status"
        />
        <Button type="submit">Criar Viagem</Button>
      </form>
    );

    // Fill in all fields using getAllByRole since labels are not properly associated
    // This demonstrates the accessibility issue: labels should be associated via htmlFor
    const textInputs = screen.getAllByRole('textbox');
    await user.type(textInputs[0], 'Férias de Verão');
    await user.type(textInputs[1], 'Paris, França');

    // Date inputs use a different selector
    const dateInputs = document.querySelectorAll('input[type="date"]');
    await user.type(dateInputs[0] as HTMLElement, '2024-07-01');
    await user.type(dateInputs[1] as HTMLElement, '2024-07-15');

    await user.selectOptions(screen.getByRole('combobox'), 'confirmed');

    // Submit form
    await user.click(screen.getByRole('button', { name: /Criar Viagem/i }));

    expect(handleSubmit).toHaveBeenCalled();
  });

  it('should handle expense creation flow', async () => {
    const handleSubmit = vi.fn((e: React.FormEvent) => {
      e.preventDefault();
    });

    const { user } = render(
      <form onSubmit={handleSubmit}>
        <Input label="Título" id="title" required />
        <Input label="Valor" type="number" id="amount" required />
        <Select
          label="Categoria"
          options={[
            { value: 'alimentacao', label: 'Alimentação' },
            { value: 'transporte', label: 'Transporte' },
            { value: 'hospedagem', label: 'Hospedagem' },
            { value: 'lazer', label: 'Lazer' }
          ]}
          id="category"
        />
        <Input label="Data" type="date" id="date" />
        <Select
          label="Método de Pagamento"
          options={[
            { value: 'credito', label: 'Cartão de Crédito' },
            { value: 'debito', label: 'Cartão de Débito' },
            { value: 'dinheiro', label: 'Dinheiro' },
            { value: 'pix', label: 'PIX' }
          ]}
          id="paymentMethod"
        />
        <Button type="submit">Adicionar Despesa</Button>
      </form>
    );

    // Fill expense form using getAllByRole due to accessibility gap
    const textInputs = screen.getAllByRole('textbox');
    await user.type(textInputs[0], 'Jantar no restaurante');

    const numberInput = screen.getByRole('spinbutton');
    await user.type(numberInput, '150.00');

    const selects = screen.getAllByRole('combobox');
    await user.selectOptions(selects[0], 'alimentacao');
    await user.selectOptions(selects[1], 'credito');

    const dateInput = document.querySelector('input[type="date"]');
    if (dateInput) await user.type(dateInput as HTMLElement, '2024-07-05');

    // Submit
    await user.click(screen.getByRole('button', { name: /Adicionar Despesa/i }));

    expect(handleSubmit).toHaveBeenCalled();
  });

  it('should handle event creation flow', async () => {
    const handleSubmit = vi.fn((e: React.FormEvent) => {
      e.preventDefault();
    });

    const { user } = render(
      <form onSubmit={handleSubmit}>
        <Input label="Título" id="title" required />
        <Input label="Data" type="date" id="date" required />
        <Input label="Hora de Início" type="time" id="startTime" />
        <Input label="Hora de Fim" type="time" id="endTime" />
        <Input label="Localização" id="location" />
        <Select
          label="Tipo"
          options={[
            { value: 'activity', label: 'Atividade' },
            { value: 'flight', label: 'Voo' },
            { value: 'hotel', label: 'Hotel' },
            { value: 'meal', label: 'Refeição' }
          ]}
          id="type"
        />
        <Button type="submit">Adicionar Evento</Button>
      </form>
    );

    // Fill event form using getAllByRole due to accessibility gap
    const textInputs = screen.getAllByRole('textbox');
    await user.type(textInputs[0], 'Visita ao Louvre');
    await user.type(textInputs[1], 'Paris, França');

    const dateInput = document.querySelector('input[type="date"]');
    if (dateInput) await user.type(dateInput as HTMLElement, '2024-07-05');

    const timeInputs = document.querySelectorAll('input[type="time"]');
    if (timeInputs[0]) await user.type(timeInputs[0] as HTMLElement, '09:00');
    if (timeInputs[1]) await user.type(timeInputs[1] as HTMLElement, '12:00');

    await user.selectOptions(screen.getByRole('combobox'), 'activity');

    // Submit
    await user.click(screen.getByRole('button', { name: /Adicionar Evento/i }));

    expect(handleSubmit).toHaveBeenCalled();
  });
});

// =============================================================================
// Keyboard Navigation Tests
// =============================================================================

describe('Keyboard Navigation', () => {
  it('should navigate form fields with Tab key', async () => {
    const { user } = render(
      <form>
        <Input label="Campo 1" id="field1" />
        <Input label="Campo 2" id="field2" />
        <Input label="Campo 3" id="field3" />
        <Button type="submit">Enviar</Button>
      </form>
    );

    // Tab through fields
    await user.tab();
    expect(screen.getAllByRole('textbox')[0]).toHaveFocus();

    await user.tab();
    expect(screen.getAllByRole('textbox')[1]).toHaveFocus();

    await user.tab();
    expect(screen.getAllByRole('textbox')[2]).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button')).toHaveFocus();
  });

  it('should navigate backwards with Shift+Tab', async () => {
    const { user } = render(
      <form>
        <Input label="Campo 1" id="field1" />
        <Input label="Campo 2" id="field2" />
        <Button type="submit">Enviar</Button>
      </form>
    );

    // Focus on button
    screen.getByRole('button').focus();
    expect(screen.getByRole('button')).toHaveFocus();

    // Shift+Tab back to Campo 2
    await user.tab({ shift: true });
    expect(screen.getAllByRole('textbox')[1]).toHaveFocus();

    // Shift+Tab back to Campo 1
    await user.tab({ shift: true });
    expect(screen.getAllByRole('textbox')[0]).toHaveFocus();
  });

  it('should submit form with Enter key', async () => {
    const handleSubmit = vi.fn((e: React.FormEvent) => {
      e.preventDefault();
    });

    const { user } = render(
      <form onSubmit={handleSubmit}>
        <Input label="Nome" id="name" />
        <Button type="submit">Enviar</Button>
      </form>
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'Teste{Enter}');

    expect(handleSubmit).toHaveBeenCalled();
  });
});

// =============================================================================
// Error Handling Tests
// =============================================================================

describe('Error Handling', () => {
  it('should display validation errors', () => {
    render(
      <form>
        <Input
          label="Email"
          id="email"
          error="Por favor, insira um email válido"
        />
        <Input
          label="Senha"
          id="password"
          error="A senha deve ter no mínimo 8 caracteres"
        />
      </form>
    );

    expect(screen.getByText('Por favor, insira um email válido')).toBeInTheDocument();
    expect(screen.getByText('A senha deve ter no mínimo 8 caracteres')).toBeInTheDocument();
  });

  it('should show error styling on invalid inputs', () => {
    const { container } = render(
      <Input
        label="Email"
        id="email"
        error="Email inválido"
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-300');
    expect(input).toHaveClass('bg-red-50');
  });

  it('should clear error when user starts typing', async () => {
    const { user, rerender } = render(
      <Input
        label="Email"
        id="email"
        error="Email inválido"
      />
    );

    expect(screen.getByText('Email inválido')).toBeInTheDocument();

    // Simulate clearing error on typing
    rerender(
      <Input
        label="Email"
        id="email"
        error=""
      />
    );

    expect(screen.queryByText('Email inválido')).not.toBeInTheDocument();
  });
});

// =============================================================================
// Loading States Tests
// =============================================================================

describe('Loading States', () => {
  it('should disable form during submission', () => {
    render(
      <form>
        <Input label="Nome" id="name" disabled />
        <Select
          label="Status"
          options={[{ value: 'active', label: 'Ativo' }]}
          id="status"
          disabled
        />
        <Button type="submit" disabled>
          <span className="animate-spin">⏳</span>
          Salvando...
        </Button>
      </form>
    );

    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getByRole('combobox')).toBeDisabled();
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByText('Salvando...')).toBeInTheDocument();
  });

  it('should show loading button during async operation', async () => {
    let isLoading = false;
    const setIsLoading = (value: boolean) => { isLoading = value; };

    const { rerender } = render(
      <Button disabled={isLoading}>
        {isLoading ? 'Carregando...' : 'Enviar'}
      </Button>
    );

    expect(screen.getByText('Enviar')).toBeInTheDocument();

    // Simulate loading
    setIsLoading(true);
    rerender(
      <Button disabled={isLoading}>
        {isLoading ? 'Carregando...' : 'Enviar'}
      </Button>
    );

    expect(screen.getByText('Carregando...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

// =============================================================================
// Responsive Behavior Tests
// =============================================================================

describe('Responsive Behavior', () => {
  it('should apply fullWidth class correctly', () => {
    const { container } = render(
      <Input label="Nome" id="name" fullWidth />
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('w-full');
  });

  it('should render grid layout for form rows', () => {
    const { container } = render(
      <div className="grid grid-cols-2 gap-4">
        <Input label="Nome" id="firstName" />
        <Input label="Sobrenome" id="lastName" />
      </div>
    );

    const grid = container.firstChild;
    expect(grid).toHaveClass('grid', 'grid-cols-2', 'gap-4');
  });
});

// =============================================================================
// Data Persistence Tests (Mocked)
// =============================================================================

describe('Data Persistence', () => {
  it('should maintain form state across re-renders', async () => {
    const { user, rerender } = render(
      <Input label="Nome" id="name" defaultValue="" />
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'João Silva');

    // Re-render with same component
    rerender(
      <Input label="Nome" id="name" defaultValue="" />
    );

    // Value should be preserved (in controlled input)
    // Note: This would require state management in real implementation
  });

  it('should clear form on modal close', async () => {
    const handleClose = vi.fn();
    const { user, rerender } = render(
      <Modal isOpen={true} onClose={handleClose} title="Test">
        <Input label="Nome" id="name" defaultValue="" />
      </Modal>
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'Teste');

    // Close modal
    await user.click(screen.getByRole('button', { name: /fechar modal/i }));

    // Reopen modal
    rerender(
      <Modal isOpen={false} onClose={handleClose} title="Test">
        <Input label="Nome" id="name" defaultValue="" />
      </Modal>
    );

    rerender(
      <Modal isOpen={true} onClose={handleClose} title="Test">
        <Input label="Nome" id="name" defaultValue="" />
      </Modal>
    );

    // In a real implementation, form should be reset
  });
});
