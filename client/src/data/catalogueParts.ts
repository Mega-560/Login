export interface CataloguePart {
  id: string
  name: string
  category: string
  vehicle: string
  price: number
  stock: number
  warranty: string
  image: string
  imageAlt: string
  description: string
}

export const catalogueParts: CataloguePart[] = [
  { id: 'NF-BRK-2041', name: 'Ceramic brake pad kit', category: 'Braking', vehicle: 'Nexus Sedan 2020–25', price: 89.5, stock: 24, warranty: '24 months', image: '/catalogue/brake-kit.svg', imageAlt: 'Illustration of a vented brake rotor and ceramic brake pad', description: 'Low-dust ceramic compound designed for quiet, consistent everyday braking.' },
  { id: 'NF-WHL-1807', name: '18-inch forged alloy wheel', category: 'Wheels & tyres', vehicle: 'Nexus Sedan / Tourer', price: 329, stock: 8, warranty: '36 months', image: '/catalogue/alloy-wheel.svg', imageAlt: 'Illustration of a silver five-spoke alloy wheel', description: 'Lightweight five-spoke forged wheel with a durable corrosion-resistant finish.' },
  { id: 'NF-FLT-3210', name: 'High-flow air filter', category: 'Filters', vehicle: 'Nexus SUV 2018–25', price: 42, stock: 41, warranty: '12 months', image: '/catalogue/air-filter.svg', imageAlt: 'Illustration of a pleated automotive air filter', description: 'Pleated replacement filter engineered to provide dependable engine air flow.' },
  { id: 'NF-IGN-1104', name: 'Iridium spark plug set', category: 'Ignition', vehicle: 'Nexus Sedan / Hatch', price: 64.95, stock: 17, warranty: '24 months', image: '/catalogue/spark-plug.svg', imageAlt: 'Illustration of an iridium spark plug', description: 'Long-life iridium electrode set for reliable ignition and smooth starts.' },
  { id: 'NF-FLT-2077', name: 'Premium oil filter', category: 'Filters', vehicle: 'Nexus Sedan 2016–25', price: 18.75, stock: 56, warranty: '12 months', image: '/catalogue/oil-filter.svg', imageAlt: 'Illustration of a premium red oil filter', description: 'High-efficiency filtration media helps protect engine components between services.' },
  { id: 'NF-BRK-2093', name: 'Performance brake rotor', category: 'Braking', vehicle: 'Nexus SUV 2021–25', price: 148, stock: 12, warranty: '24 months', image: '/catalogue/brake-kit.svg', imageAlt: 'Illustration of a vented brake rotor and ceramic brake pad', description: 'Vented replacement rotor designed to help manage heat under repeated braking.' },
  { id: 'NF-WHL-1932', name: '17-inch touring alloy wheel', category: 'Wheels & tyres', vehicle: 'Nexus Hatch 2019–24', price: 284, stock: 15, warranty: '36 months', image: '/catalogue/alloy-wheel.svg', imageAlt: 'Illustration of a silver five-spoke alloy wheel', description: 'Comfort-focused alloy wheel with a clean finish for daily touring.' },
  { id: 'NF-IGN-1188', name: 'Long-life iridium spark plug', category: 'Ignition', vehicle: 'Nexus SUV / Tourer', price: 19.5, stock: 32, warranty: '24 months', image: '/catalogue/spark-plug.svg', imageAlt: 'Illustration of an iridium spark plug', description: 'Individual long-life spark plug with a fine-wire iridium tip.' },
]

export const catalogueCurrency = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' })
export const catalogueCategories = ['All parts', ...new Set(catalogueParts.map(({ category }) => category))]
