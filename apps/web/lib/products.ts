import { CardProduct } from '@envitra/shared/types'

export const fallbackProducts: CardProduct[] = [
  {
    id: 'prod-solid-classic',
    name: 'Solid Classic',
    slug: 'solid-classic',
    product_type: 'solid_color',
    price_inr: 49900, // ₹499
    material: 'Matte PVC',
    description: 'A premium solid colored NFC card with a beautiful matte finish. Built to last.',
    is_active: true,
    available_colors: [
      { name: 'Midnight Black', hex: '#111111' },
      { name: 'Royal Blue', hex: '#1E3A8A' },
      { name: 'Emerald Green', hex: '#047857' },
      { name: 'Deep Purple', hex: '#5B21B6' },
      { name: 'Burgundy Red', hex: '#7F1D1D' },
    ],
    image_url: '/placeholder_solid.png',
    created_at: new Date().toISOString(),
  },
  {
    id: 'prod-eco-bamboo',
    name: 'Eco Bamboo',
    slug: 'eco-bamboo',
    product_type: 'solid_color',
    price_inr: 149900, // ₹1,499
    material: 'Sustainably Harvested Bamboo',
    description: 'Handcrafted wood card from natural bamboo. Eco-friendly, biodegradable, and unique wood grain texture.',
    is_active: true,
    available_colors: [
      { name: 'Natural Bamboo', hex: '#D5C4A1' },
      { name: 'Dark Walnut Wood', hex: '#3E2723' },
    ],
    image_url: '/placeholder_bamboo.png',
    created_at: new Date().toISOString(),
  },
  {
    id: 'prod-botanica-design',
    name: 'Botanica Design',
    slug: 'botanica-design',
    product_type: 'design',
    price_inr: 129900, // ₹1,299
    material: 'Recycled PVC',
    description: 'Modern botanical aesthetic featuring minimalist abstract plant outlines. Sophisticated and organic.',
    is_active: true,
    available_colors: [],
    image_url: '/placeholder_botanica.png',
    created_at: new Date().toISOString(),
  },
  {
    id: 'prod-cyberpunk-design',
    name: 'Cyberpunk Design',
    slug: 'cyberpunk-design',
    product_type: 'design',
    price_inr: 129900, // ₹1,299
    material: 'Recycled PVC',
    description: 'Neon accents and structural circuit-board lines for tech enthusiasts and developers.',
    is_active: true,
    available_colors: [],
    image_url: '/placeholder_cyber.png',
    created_at: new Date().toISOString(),
  },
  {
    id: 'prod-custom-card',
    name: 'Fully Custom Card',
    slug: 'fully-custom',
    product_type: 'custom',
    price_inr: 199900, // ₹1,999
    material: 'Premium Recycled PVC',
    description: 'Upload your background graphics, photos, company logos, brand colors, and control text positions.',
    is_active: true,
    available_colors: [],
    image_url: '/placeholder_custom.png',
    created_at: new Date().toISOString(),
  },
]
