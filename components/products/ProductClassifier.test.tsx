import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProductClassifier from './ProductClassifier'

const mockSearch = vi.fn()

vi.mock('@/services/product-classification-service', () => ({
  searchClassifications: (...args: unknown[]) => mockSearch(...args),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

function getInput() {
  return screen.getByRole('combobox', { name: '' })
}

function getListbox() {
  return screen.queryByRole('listbox')
}

describe('ProductClassifier', () => {
  it('renders input with placeholder', () => {
    render(<ProductClassifier />)
    const input = getInput()
    expect(input).toBeDefined()
    expect(input.getAttribute('placeholder')).toBe('Ej: papa, tomate, manzana...')
  })

  it('shows custom placeholder', () => {
    render(<ProductClassifier placeholder="Buscar frutas..." />)
    expect(getInput().getAttribute('placeholder')).toBe('Buscar frutas...')
  })

  it('has combobox ARIA attributes', () => {
    render(<ProductClassifier />)
    const input = getInput()
    expect(input.getAttribute('role')).toBe('combobox')
    expect(input.getAttribute('aria-autocomplete')).toBe('list')
    expect(input.getAttribute('aria-haspopup')).toBe('listbox')
    expect(input.getAttribute('aria-expanded')).toBe('false')
  })

  it('shows dropdown when results arrive after typing', async () => {
    mockSearch.mockResolvedValue([
      { _id: '1', name: 'papa', category: 'verduras' },
      { _id: '2', name: 'papaya', category: 'frutas' },
    ])

    render(<ProductClassifier />)

    const input = getInput()
    await userEvent.type(input, 'pa')

    await act(async () => {
      await new Promise((r) => setTimeout(r, 350))
    })

    const listbox = getListbox()
    expect(listbox).toBeDefined()
    expect(listbox?.getAttribute('role')).toBe('listbox')

    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(2)
    expect(options[0].getAttribute('aria-selected')).toBe('false')
  })

  it('calls onSelect when option is clicked', async () => {
    const onSelect = vi.fn()
    mockSearch.mockResolvedValue([
      { _id: '1', name: 'papa', category: 'verduras' },
    ])

    render(<ProductClassifier onSelect={onSelect} />)

    const input = getInput()
    await userEvent.type(input, 'pa')

    await act(async () => {
      await new Promise((r) => setTimeout(r, 350))
    })

    const option = screen.getByRole('option')
    await userEvent.click(option)

    expect(onSelect).toHaveBeenCalledWith('papa', 'verduras')
    expect(getListbox()).toBeNull()
  })

  it('supports keyboard navigation', async () => {
    mockSearch.mockResolvedValue([
      { _id: '1', name: 'papa', category: 'verduras' },
      { _id: '2', name: 'papaya', category: 'frutas' },
    ])

    render(<ProductClassifier />)

    const input = getInput()
    await userEvent.type(input, 'pa')

    await act(async () => {
      await new Promise((r) => setTimeout(r, 350))
    })

    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(2)

    await userEvent.keyboard('{ArrowDown}')
    expect(options[0].getAttribute('aria-selected')).toBe('true')

    await userEvent.keyboard('{ArrowDown}')
    expect(options[1].getAttribute('aria-selected')).toBe('true')

    await userEvent.keyboard('{ArrowUp}')
    expect(options[0].getAttribute('aria-selected')).toBe('true')

    await userEvent.keyboard('{Escape}')
    expect(getListbox()).toBeNull()
  })

  it('hides dropdown on click outside', async () => {
    mockSearch.mockResolvedValue([
      { _id: '1', name: 'papa', category: 'verduras' },
    ])

    render(<div><div data-testid="outside" /><ProductClassifier /></div>)

    const input = getInput()
    await userEvent.type(input, 'pa')

    await act(async () => {
      await new Promise((r) => setTimeout(r, 350))
    })

    expect(getListbox()).toBeDefined()

    await userEvent.click(screen.getByTestId('outside'))
    expect(getListbox()).toBeNull()
  })

  it('does not show dropdown when no results', async () => {
    mockSearch.mockResolvedValue([])

    render(<ProductClassifier />)

    const input = getInput()
    await userEvent.type(input, 'xyz')

    await act(async () => {
      await new Promise((r) => setTimeout(r, 350))
    })

    expect(getListbox()).toBeNull()
  })
})
