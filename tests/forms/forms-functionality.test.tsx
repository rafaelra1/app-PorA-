/**
 * Testes de Funcionalidade de Formulários
 * ========================================
 *
 * Este arquivo testa se todos os formulários estão funcionando corretamente,
 * validando inputs, submissões, e comportamentos esperados.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '../utils/test-utils';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import {
  ToggleGroup,
  DocumentUploadZone,
  RatingInput,
  PriceInput,
  CategorySelector,
} from '../../components/ui/FormComponents';

// =============================================================================
// Input Component Tests
// =============================================================================

describe('Input Component Functionality', () => {
  it('should handle text input correctly', async () => {
    const handleChange = vi.fn();
    const { user } = render(
      <Input
        label="Nome"
        id="name"
        onChange={handleChange}
      />
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'João Silva');

    expect(handleChange).toHaveBeenCalled();
    expect(input).toHaveValue('João Silva');
  });

  it('should handle email input with validation', async () => {
    const { user } = render(
      <Input
        label="Email"
        type="email"
        id="email"
      />
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'test@example.com');

    expect(input).toHaveValue('test@example.com');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('should handle number input correctly', async () => {
    const handleChange = vi.fn();
    const { user } = render(
      <Input
        label="Quantidade"
        type="number"
        id="quantity"
        onChange={handleChange}
      />
    );

    const input = screen.getByRole('spinbutton');
    await user.type(input, '42');

    expect(handleChange).toHaveBeenCalled();
    expect(input).toHaveValue(42);
  });

  it('should handle password input correctly', async () => {
    const { user } = render(
      <Input
        label="Senha"
        type="password"
        id="password"
      />
    );

    const input = document.querySelector('input[type="password"]');
    expect(input).toBeInTheDocument();

    await user.type(input!, 'secretpassword');
    expect(input).toHaveValue('secretpassword');
  });

  it('should handle required attribute', () => {
    render(
      <Input
        label="Campo Obrigatório"
        id="required"
        required
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('required');
  });

  it('should handle maxLength attribute', async () => {
    const { user } = render(
      <Input
        label="Código"
        id="code"
        maxLength={5}
      />
    );

    const input = screen.getByRole('textbox');
    await user.type(input, '1234567890');

    // maxLength should limit input
    expect(input).toHaveValue('12345');
  });

  it('should handle placeholder text', () => {
    render(
      <Input
        label="Busca"
        id="search"
        placeholder="Digite para buscar..."
      />
    );

    const input = screen.getByPlaceholderText('Digite para buscar...');
    expect(input).toBeInTheDocument();
  });

  it('should forward ref correctly', () => {
    const ref = { current: null } as React.RefObject<HTMLInputElement>;
    render(
      <Input
        label="Test"
        id="test"
        ref={ref}
      />
    );

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});

// =============================================================================
// Select Component Tests
// =============================================================================

describe('Select Component Functionality', () => {
  const statusOptions = [
    { value: 'planning', label: 'Planejando' },
    { value: 'confirmed', label: 'Confirmado' },
    { value: 'completed', label: 'Concluído' },
  ];

  it('should handle selection correctly', async () => {
    const handleChange = vi.fn();
    const { user } = render(
      <Select
        label="Status"
        options={statusOptions}
        onChange={handleChange}
        id="status"
      />
    );

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'confirmed');

    expect(handleChange).toHaveBeenCalled();
    expect(select).toHaveValue('confirmed');
  });

  it('should show placeholder as first option', () => {
    render(
      <Select
        label="Status"
        options={statusOptions}
        placeholder="Selecione..."
        id="status"
      />
    );

    const placeholder = screen.getByText('Selecione...');
    expect(placeholder).toHaveAttribute('disabled');
  });

  it('should disable specific options', () => {
    const optionsWithDisabled = [
      ...statusOptions,
      { value: 'archived', label: 'Arquivado', disabled: true }
    ];

    render(
      <Select
        label="Status"
        options={optionsWithDisabled}
        id="status"
      />
    );

    const archivedOption = screen.getByRole('option', { name: 'Arquivado' });
    expect(archivedOption).toBeDisabled();
  });

  it('should handle controlled value', () => {
    render(
      <Select
        label="Status"
        options={statusOptions}
        value="confirmed"
        onChange={() => {}}
        id="status"
      />
    );

    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('confirmed');
  });

  it('should render fullWidth when prop is set', () => {
    const { container } = render(
      <Select
        label="Status"
        options={statusOptions}
        fullWidth
        id="status"
      />
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('w-full');
  });
});

// =============================================================================
// Textarea Component Tests
// =============================================================================

describe('Textarea Component Functionality', () => {
  it('should handle text input correctly', async () => {
    const handleChange = vi.fn();
    const { user } = render(
      <Textarea
        label="Descrição"
        id="description"
        onChange={handleChange}
      />
    );

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Uma descrição longa');

    expect(handleChange).toHaveBeenCalled();
    expect(textarea).toHaveValue('Uma descrição longa');
  });

  it('should handle rows attribute', () => {
    render(
      <Textarea
        label="Notas"
        id="notes"
        rows={5}
      />
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('rows', '5');
  });

  it('should enforce maxLength', async () => {
    const { user } = render(
      <Textarea
        label="Resumo"
        id="summary"
        maxLength={10}
      />
    );

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Esta é uma mensagem muito longa');

    expect(textarea).toHaveValue('Esta é uma');
  });

  it('should update character count', () => {
    render(
      <Textarea
        label="Bio"
        id="bio"
        value="Hello"
        showCharCount
        onChange={() => {}}
      />
    );

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should show character count with maxLength', () => {
    render(
      <Textarea
        label="Bio"
        id="bio"
        value="Hello World"
        maxLength={100}
        onChange={() => {}}
      />
    );

    expect(screen.getByText('11/100')).toBeInTheDocument();
  });
});

// =============================================================================
// ToggleGroup Component Tests
// =============================================================================

describe('ToggleGroup Component Functionality', () => {
  const modeOptions = [
    { value: 'manual', label: 'Manual' },
    { value: 'ai', label: 'IA' },
  ];

  it('should call onChange with correct value', async () => {
    const handleChange = vi.fn();
    const { user } = render(
      <ToggleGroup
        options={modeOptions}
        value="manual"
        onChange={handleChange}
      />
    );

    await user.click(screen.getByRole('button', { name: 'IA' }));
    expect(handleChange).toHaveBeenCalledWith('ai');
  });

  it('should highlight the selected option', () => {
    render(
      <ToggleGroup
        options={modeOptions}
        value="ai"
        onChange={() => {}}
      />
    );

    const aiButton = screen.getByRole('button', { name: 'IA' });
    expect(aiButton).toHaveClass('bg-white');
  });

  it('should render icons when provided', () => {
    const optionsWithIcons = [
      { value: 'edit', label: 'Editar', icon: 'edit' },
      { value: 'view', label: 'Ver', icon: 'visibility' },
    ];

    render(
      <ToggleGroup
        options={optionsWithIcons}
        value="edit"
        onChange={() => {}}
      />
    );

    const editButton = screen.getByRole('button', { name: /Editar/i });
    expect(editButton.querySelector('.material-symbols-outlined')).toBeInTheDocument();
  });
});

// =============================================================================
// DocumentUploadZone Component Tests
// =============================================================================

describe('DocumentUploadZone Component Functionality', () => {
  it('should call onFileSelect when file is selected', async () => {
    const handleFileSelect = vi.fn();
    render(
      <DocumentUploadZone
        isProcessing={false}
        onFileSelect={handleFileSelect}
      />
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

    Object.defineProperty(fileInput, 'files', {
      value: [file],
    });

    fireEvent.change(fileInput);

    expect(handleFileSelect).toHaveBeenCalledWith(file);
  });

  it('should show processing state', () => {
    render(
      <DocumentUploadZone
        isProcessing={true}
        onFileSelect={() => {}}
        processingTitle="Analisando documento..."
        processingSubtitle="Extraindo informações"
      />
    );

    expect(screen.getByText('Analisando documento...')).toBeInTheDocument();
    expect(screen.getByText('Extraindo informações')).toBeInTheDocument();
  });

  it('should show default state', () => {
    render(
      <DocumentUploadZone
        isProcessing={false}
        onFileSelect={() => {}}
        title="Envie seu documento"
        subtitle="PDF, imagem ou captura"
      />
    );

    expect(screen.getByText('Envie seu documento')).toBeInTheDocument();
    expect(screen.getByText('PDF, imagem ou captura')).toBeInTheDocument();
  });

  it('should accept correct file types', () => {
    render(
      <DocumentUploadZone
        isProcessing={false}
        onFileSelect={() => {}}
        accept="image/*,.pdf"
      />
    );

    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toHaveAttribute('accept', 'image/*,.pdf');
  });

  it('should be activatable via keyboard', async () => {
    const handleFileSelect = vi.fn();
    const { user } = render(
      <DocumentUploadZone
        isProcessing={false}
        onFileSelect={handleFileSelect}
      />
    );

    const uploadZone = screen.getByRole('button');
    await user.tab();
    expect(uploadZone).toHaveFocus();
  });
});

// =============================================================================
// RatingInput Component Tests
// =============================================================================

describe('RatingInput Component Functionality', () => {
  it('should handle rating change', async () => {
    const handleChange = vi.fn();
    const { user } = render(
      <RatingInput
        value={3}
        onChange={handleChange}
      />
    );

    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '4.5');

    expect(handleChange).toHaveBeenCalled();
  });

  it('should respect min and max values', () => {
    render(
      <RatingInput
        value={3}
        onChange={() => {}}
        max={5}
      />
    );

    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('min', '1');
    expect(input).toHaveAttribute('max', '5');
  });

  it('should render with custom label', () => {
    render(
      <RatingInput
        label="Avaliação do Hotel"
        value={4}
        onChange={() => {}}
      />
    );

    expect(screen.getByText('Avaliação do Hotel')).toBeInTheDocument();
  });

  it('should display star icon', () => {
    const { container } = render(
      <RatingInput
        value={4}
        onChange={() => {}}
      />
    );

    const starIcon = container.querySelector('.material-symbols-outlined');
    expect(starIcon).toHaveTextContent('star');
  });
});

// =============================================================================
// PriceInput Component Tests
// =============================================================================

describe('PriceInput Component Functionality', () => {
  it('should handle price input correctly', async () => {
    const handleChange = vi.fn();
    const { user } = render(
      <PriceInput
        value=""
        onChange={handleChange}
      />
    );

    const input = screen.getByRole('spinbutton');
    await user.type(input, '199.99');

    expect(handleChange).toHaveBeenCalled();
  });

  it('should display currency prefix', () => {
    render(
      <PriceInput
        value="100"
        onChange={() => {}}
        currency="R$"
      />
    );

    expect(screen.getByText('R$')).toBeInTheDocument();
  });

  it('should display custom currency', () => {
    render(
      <PriceInput
        value="100"
        onChange={() => {}}
        currency="€"
      />
    );

    expect(screen.getByText('€')).toBeInTheDocument();
  });

  it('should handle step attribute for decimals', () => {
    render(
      <PriceInput
        value="0"
        onChange={() => {}}
      />
    );

    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('step', '0.01');
  });

  it('should show required indicator', () => {
    render(
      <PriceInput
        label="Preço"
        value=""
        onChange={() => {}}
        required
      />
    );

    expect(screen.getByText('Preço *')).toBeInTheDocument();
  });
});

// =============================================================================
// CategorySelector Component Tests
// =============================================================================

describe('CategorySelector Component Functionality', () => {
  const categories = [
    { value: 'food', label: 'Comida', icon: 'restaurant', color: 'text-orange-500', bgColor: 'bg-orange-50', borderColor: 'border-orange-300' },
    { value: 'transport', label: 'Transporte', icon: 'directions_car', color: 'text-blue-500', bgColor: 'bg-blue-50', borderColor: 'border-blue-300' },
    { value: 'hotel', label: 'Hotel', icon: 'hotel', color: 'text-purple-500', bgColor: 'bg-purple-50', borderColor: 'border-purple-300' },
  ];

  it('should call onChange with correct category', async () => {
    const handleChange = vi.fn();
    const { user } = render(
      <CategorySelector
        categories={categories}
        selected="food"
        onChange={handleChange}
      />
    );

    await user.click(screen.getByRole('button', { name: /Transporte/i }));
    expect(handleChange).toHaveBeenCalledWith('transport');
  });

  it('should apply selected styles to active category', () => {
    render(
      <CategorySelector
        categories={categories}
        selected="hotel"
        onChange={() => {}}
      />
    );

    const hotelButton = screen.getByRole('button', { name: /Hotel/i });
    expect(hotelButton).toHaveClass('border-purple-300');
    expect(hotelButton).toHaveClass('bg-purple-50');
  });

  it('should render all categories', () => {
    render(
      <CategorySelector
        categories={categories}
        selected="food"
        onChange={() => {}}
      />
    );

    categories.forEach(cat => {
      expect(screen.getByRole('button', { name: new RegExp(cat.label) })).toBeInTheDocument();
    });
  });

  it('should render with custom label', () => {
    render(
      <CategorySelector
        label="Tipo de Despesa"
        categories={categories}
        selected="food"
        onChange={() => {}}
      />
    );

    expect(screen.getByText('Tipo de Despesa')).toBeInTheDocument();
  });

  it('should render icons for each category', () => {
    render(
      <CategorySelector
        categories={categories}
        selected="food"
        onChange={() => {}}
      />
    );

    categories.forEach(cat => {
      const button = screen.getByRole('button', { name: new RegExp(cat.label) });
      const icon = button.querySelector('.material-symbols-outlined');
      expect(icon).toHaveTextContent(cat.icon);
    });
  });
});

// =============================================================================
// Form Integration Tests
// =============================================================================

describe('Form Integration Tests', () => {
  it('should handle complete form with multiple input types', async () => {
    const handleSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());

    const { user } = render(
      <form onSubmit={handleSubmit}>
        <Input label="Nome" id="name" required />
        <Input label="Email" type="email" id="email" required />
        <Select
          label="Status"
          options={[
            { value: 'active', label: 'Ativo' },
            { value: 'inactive', label: 'Inativo' }
          ]}
          id="status"
        />
        <Textarea label="Observações" id="notes" />
        <button type="submit">Enviar</button>
      </form>
    );

    // Fill form using getAllByRole due to accessibility gap (labels not associated)
    const textInputs = screen.getAllByRole('textbox');
    await user.type(textInputs[0], 'João Silva');
    await user.type(textInputs[1], 'joao@email.com');
    await user.selectOptions(screen.getByRole('combobox'), 'active');
    await user.type(textInputs[2], 'Algumas notas');

    // Submit form
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(handleSubmit).toHaveBeenCalled();
  });

  it('should show validation errors correctly', () => {
    render(
      <form>
        <Input
          label="Email"
          type="email"
          id="email"
          error="Email inválido"
        />
        <Select
          label="Status"
          options={[{ value: 'active', label: 'Ativo' }]}
          id="status"
          error="Selecione uma opção"
        />
        <Textarea
          label="Descrição"
          id="description"
          error="Descrição obrigatória"
        />
      </form>
    );

    expect(screen.getByText('Email inválido')).toBeInTheDocument();
    expect(screen.getByText('Selecione uma opção')).toBeInTheDocument();
    expect(screen.getByText('Descrição obrigatória')).toBeInTheDocument();
  });

  it('should handle form reset', async () => {
    const { user } = render(
      <form>
        <Input label="Nome" id="name" defaultValue="" />
        <button type="reset">Limpar</button>
      </form>
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'Teste');
    expect(input).toHaveValue('Teste');

    await user.click(screen.getByRole('button', { name: 'Limpar' }));
    expect(input).toHaveValue('');
  });

  it('should handle disabled form elements', () => {
    render(
      <form>
        <Input label="Nome" id="name" disabled />
        <Select
          label="Status"
          options={[{ value: 'active', label: 'Ativo' }]}
          id="status"
          disabled
        />
        <Textarea label="Notas" id="notes" disabled />
        <button type="submit" disabled>Enviar</button>
      </form>
    );

    const textboxes = screen.getAllByRole('textbox');
    expect(textboxes[0]).toBeDisabled(); // Input
    expect(screen.getByRole('combobox')).toBeDisabled();
    expect(textboxes[1]).toBeDisabled(); // Textarea
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
