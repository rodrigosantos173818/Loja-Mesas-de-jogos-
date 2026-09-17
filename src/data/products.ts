export type Category = string

export type StoreCategory = {
  slug: string
  name: string
  image: string
  description: string
  order: number
  active: boolean
}

export type StoreBrand = {
  slug: string
  name: string
  description: string
  order: number
  active: boolean
}

export type Product = {
  id: string
  slug: string
  name: string
  category: Category
  brand: string
  description: string
  details: string[]
  price: number
  pixPrice: number
  promotionalPrice: number | null
  installmentCount: number
  weightKg: number
  lengthCm: number
  widthCm: number
  heightCm: number
  volumes: number
  displayOrder: number | null
  images: string[]
  featured: boolean
  premium: boolean
  active: boolean
}

export const seedBrands: StoreBrand[] = [
  {
    slug: 'arena-08',
    name: 'Arena 08',
    description: 'Mesas de jogos Arena 08',
    order: 1,
    active: true,
  },
]

export const seedCategories: StoreCategory[] = [
  {
    slug: 'sinuca',
    name: 'Sinuca',
    description: 'Estratégia em cada tacada',
    image: '/images/sinuca-hero.webp',
    order: 1,
    active: true,
  },
  {
    slug: 'futmesa',
    name: 'Futmesa',
    description: 'Controle para competir',
    image: '/images/futmesa.webp',
    order: 2,
    active: true,
  },
  {
    slug: 'ping-pong',
    name: 'Ping-Pong',
    description: 'Ritmo sem pausa',
    image: '/images/ping-pong.webp',
    order: 3,
    active: true,
  },
  {
    slug: 'pebolim',
    name: 'Pebolim',
    description: 'A disputa começa aqui',
    image: '/images/pebolim.webp',
    order: 4,
    active: true,
  },
]

export const seedProducts: Product[] = [
  {
    id: 'sinuca-pro-08',
    slug: 'mesa-de-sinuca-pro-08',
    name: 'Mesa de Sinuca Pro 08',
    category: 'sinuca',
    brand: 'arena-08',
    description:
      'Uma mesa feita para partidas memoráveis. O acabamento em madeira escura, o pano verde profundo e a estrutura robusta dão ao ambiente a presença de uma arena particular.',
    details: [
      'Estrutura em madeira com acabamento premium',
      'Pano verde de alta resistência',
      'Acompanha kit básico para começar a jogar',
    ],
    price: 7990,
    pixPrice: 7590.5,
    promotionalPrice: null,
    installmentCount: 10,
    weightKg: 180,
    lengthCm: 260,
    widthCm: 145,
    heightCm: 85,
    volumes: 1,
    displayOrder: null,
    images: ['/images/sinuca-hero.webp'],
    featured: true,
    premium: true,
    active: true,
  },
  {
    id: 'futmesa-curve-08',
    slug: 'futmesa-curve-08',
    name: 'Futmesa Curve 08',
    category: 'futmesa',
    brand: 'arena-08',
    description:
      'Curvas precisas e uma superfície de jogo responsiva para treinar domínio, reflexo e criatividade. Ideal para espaços de convivência que gostam de movimento.',
    details: [
      'Superfície curvada para jogadas dinâmicas',
      'Estrutura estável',
      'Uso interno e em áreas cobertas',
    ],
    price: 4990,
    pixPrice: 4740.5,
    promotionalPrice: null,
    installmentCount: 10,
    weightKg: 95,
    lengthCm: 300,
    widthCm: 170,
    heightCm: 85,
    volumes: 1,
    displayOrder: null,
    images: ['/images/futmesa.webp'],
    featured: true,
    premium: true,
    active: true,
  },
  {
    id: 'ping-pong-match-08',
    slug: 'mesa-de-ping-pong-match-08',
    name: 'Mesa de Ping-Pong Match 08',
    category: 'ping-pong',
    brand: 'arena-08',
    description:
      'Do saque ao ponto decisivo: uma mesa de tênis de mesa com área de jogo ampla, visual sóbrio e desempenho para partidas intensas.',
    details: ['Tampo com linhas de jogo', 'Rede inclusa', 'Estrutura firme para uso interno'],
    price: 3690,
    pixPrice: 3505.5,
    promotionalPrice: null,
    installmentCount: 10,
    weightKg: 76,
    lengthCm: 274,
    widthCm: 152,
    heightCm: 76,
    volumes: 1,
    displayOrder: null,
    images: ['/images/ping-pong.webp'],
    featured: true,
    premium: false,
    active: true,
  },
  {
    id: 'pebolim-arena-08',
    slug: 'mesa-de-pebolim-arena-08',
    name: 'Mesa de Pebolim Arena 08',
    category: 'pebolim',
    brand: 'arena-08',
    description:
      'Clássico de toda sala de jogos, com acabamento escuro e pegada esportiva para partidas rápidas, disputadas e cheias de energia.',
    details: ['Campo de jogo resistente', 'Manoplas confortáveis', 'Acabamento em madeira e preto'],
    price: 2890,
    pixPrice: 2745.5,
    promotionalPrice: null,
    installmentCount: 10,
    weightKg: 72,
    lengthCm: 142,
    widthCm: 80,
    heightCm: 90,
    volumes: 1,
    displayOrder: null,
    images: ['/images/pebolim.webp'],
    featured: true,
    premium: false,
    active: true,
  },
  {
    id: 'sinuca-club-08',
    slug: 'mesa-de-sinuca-club-08',
    name: 'Mesa de Sinuca Club 08',
    category: 'sinuca',
    brand: 'arena-08',
    description:
      'Presença marcante e jogabilidade confortável para reunir amigos em torno de uma boa partida.',
    details: ['Acabamento em madeira escura', 'Pano verde', 'Estrutura estável'],
    price: 6490,
    pixPrice: 6165.5,
    promotionalPrice: null,
    installmentCount: 10,
    weightKg: 160,
    lengthCm: 240,
    widthCm: 135,
    heightCm: 85,
    volumes: 1,
    displayOrder: null,
    images: ['/images/sinuca-hero.webp'],
    featured: false,
    premium: false,
    active: true,
  },
  {
    id: 'futmesa-play-08',
    slug: 'futmesa-play-08',
    name: 'Futmesa Play 08',
    category: 'futmesa',
    brand: 'arena-08',
    description:
      'Uma forma nova de jogar bola com amigos, em família ou na área de lazer do condomínio.',
    details: ['Tampo curvo', 'Estrutura reforçada', 'Ideal para áreas cobertas'],
    price: 4290,
    pixPrice: 4075.5,
    promotionalPrice: null,
    installmentCount: 10,
    weightKg: 88,
    lengthCm: 280,
    widthCm: 160,
    heightCm: 85,
    volumes: 1,
    displayOrder: null,
    images: ['/images/futmesa.webp'],
    featured: false,
    premium: false,
    active: true,
  },
  {
    id: 'ping-pong-competition-08',
    slug: 'mesa-de-ping-pong-competition-08',
    name: 'Mesa de Ping-Pong Competition 08',
    category: 'ping-pong',
    brand: 'arena-08',
    description: 'Um clássico para quem quer mais velocidade, mais rallys e mais partidas.',
    details: ['Tampo de jogo com linhas', 'Rede inclusa', 'Estrutura para uso interno'],
    price: 4190,
    pixPrice: 3980.5,
    promotionalPrice: null,
    installmentCount: 10,
    weightKg: 82,
    lengthCm: 274,
    widthCm: 152,
    heightCm: 76,
    volumes: 1,
    displayOrder: null,
    images: ['/images/ping-pong.webp'],
    featured: false,
    premium: true,
    active: true,
  },
  {
    id: 'pebolim-club-08',
    slug: 'mesa-de-pebolim-club-08',
    name: 'Mesa de Pebolim Club 08',
    category: 'pebolim',
    brand: 'arena-08',
    description:
      'A energia do futebol de mesa em um equipamento que dá personalidade à sala de jogos.',
    details: ['Campo de jogo resistente', 'Manoplas confortáveis', 'Estrutura estável'],
    price: 2490,
    pixPrice: 2365.5,
    promotionalPrice: null,
    installmentCount: 10,
    weightKg: 68,
    lengthCm: 135,
    widthCm: 78,
    heightCm: 88,
    volumes: 1,
    displayOrder: null,
    images: ['/images/pebolim.webp'],
    featured: false,
    premium: false,
    active: true,
  },
]

export const categoryLabel = (category: Category, categories: StoreCategory[] = seedCategories) =>
  categories.find((item) => item.slug === category)?.name ?? category

export const brandLabel = (brand: string, brands: StoreBrand[] = seedBrands) =>
  brands.find((item) => item.slug === brand)?.name ?? brand

export const salePrice = (product: Product) => product.promotionalPrice ?? product.price

export const isVisibleProduct = (
  product: Product,
  categories: StoreCategory[],
  brands: StoreBrand[] = seedBrands,
) =>
  product.active &&
  categories.some((category) => category.slug === product.category && category.active) &&
  brands.some((brand) => brand.slug === product.brand && brand.active)
