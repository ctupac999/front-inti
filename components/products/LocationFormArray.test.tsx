import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LocationFormArray from './LocationFormArray'
import type { ProductLocation } from '@/types/product'

const mockT = vi.fn((key: string) => {
  const map: Record<string, string> = {
    'newProduct.locationSection': 'Ubicación del producto',
    'newProduct.locationName': 'Nombre del lugar',
    'newProduct.addLocation': 'Agregar ubicación',
    'newProduct.useMyLocations': 'Mis ubicaciones',
    'newProduct.findPostalCode': 'Buscar CP',
    'newProduct.postalCodeModal': 'Códigos postales',
    'newProduct.postalCodeSelect': 'Seleccioná un código postal:',
    'newProduct.postalCodeNotFound': 'No encontramos códigos postales para esta localidad',
    'newProduct.postalCodeWebsite': 'Consultar sitio oficial →',
    'newProduct.community': 'Distrito / Comunidad',
    'newProduct.locationNumber': 'Ubicación',
    'common.select': 'Seleccionar',
  }
  return map[key] || key
})

const mockUser = {
  _id: 'u1',
  firstName: 'Juan',
  lastName: 'Pérez',
  email: 'juan@test.com',
  role: 'user' as const,
  locations: [
    { name: 'Finca El Roble', country: 'PE', province: 'Lima', municipality: 'Miraflores', community: 'San Isidro' },
  ],
  isActive: true,
  createdAt: '',
}

const mockGetSiteConfig = vi.fn()

vi.mock('@/contexts/language-context', () => ({
  useLanguage: () => ({ t: mockT, language: 'es', setLanguage: vi.fn() }),
}))

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({ user: mockUser, loading: false }),
}))

vi.mock('@/services/site-config-service', () => ({
  getSiteConfig: (...args: unknown[]) => mockGetSiteConfig(...args),
}))

vi.mock('@/config/location-catalog', async () => {
  const actual = await vi.importActual('@/config/location-catalog')
  return {
    ...actual,
    getPostalCodesForMunicipality: vi.fn().mockResolvedValue([]),
    getOfficialPostalWebsite: (code: string) => {
      const map: Record<string, string> = { PE: 'https://codigopostal.gob.pe', AR: 'https://www.correoargentino.com.ar/formularios/codigo-postal' }
      return map[code] ?? null
    },
  }
})

beforeEach(() => {
  vi.clearAllMocks()
  mockGetSiteConfig.mockResolvedValue({ enabledCountries: ['AR', 'PE'] })
})

function Wrapper({ initialLocations }: { initialLocations: ProductLocation[] }) {
  const [locs, setLocs] = useState(initialLocations)
  return <LocationFormArray locations={locs} onChange={setLocs} />
}

function renderWithState(locations: ProductLocation[]) {
  return render(<Wrapper initialLocations={locations} />)
}

describe('LocationFormArray', () => {
  it('renders with a single default location', () => {
    const locations: ProductLocation[] = [
      { name: '', country: 'PE', province: '', municipality: '', community: '', postalCode: '' },
    ]
    renderWithState(locations)

    expect(screen.getByText('Agregar ubicación')).toBeDefined()
    expect(screen.getByText('Ubicación del producto')).toBeDefined()
  })

  it('renders all location fields for each entry', () => {
    const locations: ProductLocation[] = [
      { name: 'Finca Test', country: 'PE', province: 'Lima', municipality: 'Miraflores', community: 'San Isidro', postalCode: '15000' },
    ]
    renderWithState(locations)

    expect(screen.getByDisplayValue('Finca Test')).toBeDefined()
    expect(screen.getByDisplayValue('Lima')).toBeDefined()
    expect(screen.getByDisplayValue('Miraflores')).toBeDefined()
    expect(screen.getByDisplayValue('San Isidro')).toBeDefined()
    expect(screen.getByDisplayValue('15000')).toBeDefined()
  })

  it('updates field value when user types', async () => {
    const locations: ProductLocation[] = [
      { name: '', country: 'PE', province: '', municipality: '', community: '', postalCode: '' },
    ]
    renderWithState(locations)

    const nameInput = screen.getByPlaceholderText('Ej: Finca El Roble')
    await userEvent.type(nameInput, 'Mi Lugar')

    expect(screen.getByDisplayValue('Mi Lugar')).toBeDefined()
  })

  it('adds a new location when add button is clicked', async () => {
    const locations: ProductLocation[] = [
      { name: 'Lugar 1', country: 'PE', province: 'Lima', municipality: 'Miraflores', community: '', postalCode: '' },
    ]
    renderWithState(locations)

    await userEvent.click(screen.getByText('Agregar ubicación'))

    const nameInputs = screen.getAllByPlaceholderText('Ej: Finca El Roble')
    expect(nameInputs).toHaveLength(2)
  })

  it('removes a location when remove button is clicked', async () => {
    const locations: ProductLocation[] = [
      { name: 'Lugar 1', country: 'PE', province: 'Lima', municipality: 'Miraflores', community: '', postalCode: '' },
      { name: 'Lugar 2', country: 'PE', province: 'Cusco', municipality: 'Urubamba', community: '', postalCode: '' },
    ]
    renderWithState(locations)

    const removeButtons = screen.getAllByRole('button', { name: 'Eliminar ubicación' })
    expect(removeButtons).toHaveLength(2)

    await userEvent.click(removeButtons[0])

    const remainingInputs = screen.getAllByDisplayValue(/Lugar/)
    expect(remainingInputs).toHaveLength(1)
    expect(remainingInputs[0]).toHaveProperty('value', 'Lugar 2')
  })

  it('does not show remove button when only one location', () => {
    const locations: ProductLocation[] = [
      { name: 'Único', country: 'PE', province: 'Lima', municipality: 'Miraflores', community: '', postalCode: '' },
    ]
    renderWithState(locations)

    expect(screen.queryByLabelText('Eliminar ubicación')).toBeNull()
  })

  it('shows "Mis ubicaciones" button when user has saved locations', () => {
    const locations: ProductLocation[] = [
      { name: '', country: 'PE', province: '', municipality: '', community: '', postalCode: '' },
    ]
    renderWithState(locations)

    expect(screen.getByText('Mis ubicaciones')).toBeDefined()
  })

  it('shows user locations panel when "Mis ubicaciones" is clicked', async () => {
    const locations: ProductLocation[] = [
      { name: '', country: 'PE', province: '', municipality: '', community: '', postalCode: '' },
    ]
    renderWithState(locations)

    await userEvent.click(screen.getByText('Mis ubicaciones'))

    expect(screen.getByText('Finca El Roble')).toBeDefined()
  })

  it('adds a user saved location when selected', async () => {
    const locations: ProductLocation[] = [
      { name: '', country: 'PE', province: '', municipality: '', community: '', postalCode: '' },
    ]
    renderWithState(locations)

    await userEvent.click(screen.getByText('Mis ubicaciones'))
    await userEvent.click(screen.getByText('Finca El Roble'))

    const nameInputs = screen.getAllByPlaceholderText('Ej: Finca El Roble')
    expect(nameInputs).toHaveLength(2)

    expect(screen.getByDisplayValue('Finca El Roble')).toBeDefined()
  })

  it('opens postal code modal when search button is clicked', async () => {
    const locations: ProductLocation[] = [
      { name: 'Test', country: 'PE', province: 'Lima', municipality: 'Miraflores', community: '', postalCode: '' },
    ]
    renderWithState(locations)

    await userEvent.click(screen.getAllByText('Buscar CP')[0])

    expect(screen.getByText('Códigos postales')).toBeDefined()
  })

  it('shows not-found state in postal code modal when no results', async () => {
    const locations: ProductLocation[] = [
      { name: 'Test', country: 'PE', province: 'Lima', municipality: 'Miraflores', community: '', postalCode: '' },
    ]
    renderWithState(locations)

    await userEvent.click(screen.getAllByText('Buscar CP')[0])

    expect(screen.getByText('Consultar sitio oficial →')).toBeDefined()
  })

  it('closes postal code modal when X is clicked', async () => {
    const locations: ProductLocation[] = [
      { name: 'Test', country: 'PE', province: 'Lima', municipality: 'Miraflores', community: '', postalCode: '' },
    ]
    renderWithState(locations)

    await userEvent.click(screen.getAllByText('Buscar CP')[0])
    expect(screen.getByText('Códigos postales')).toBeDefined()

    const modalHeading = screen.getByText('Códigos postales')
    const headingParent = modalHeading.parentElement
    const closeBtn = headingParent?.querySelector('button')
    expect(closeBtn).not.toBeNull()
    if (closeBtn) await userEvent.click(closeBtn)

    expect(screen.queryByText('Códigos postales')).toBeNull()
  })
})
