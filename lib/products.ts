export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
  interval?: 'month' | 'year'
  trialDays?: number
  features: string[]
  popular?: boolean
}

export const PRODUCTS: Product[] = [
  {
    id: 'free_trial',
    name: 'Free Trial',
    description: '7-day free trial to experience Runner Wellness',
    priceInCents: 0,
    trialDays: 7,
    features: [
      'Daily check-ins via SMS',
      '7-day wellness trends',
      'Basic streak tracking',
      'Goal setting (1 active goal)',
    ],
  },
  {
    id: 'pro_monthly',
    name: 'Pro',
    description: 'Advanced insights for serious runners',
    priceInCents: 999, // $9.99/month
    interval: 'month',
    popular: true,
    features: [
      'Everything in Free',
      'AI-powered coaching tips',
      'Unlimited goals',
      '30-day trends & analytics',
      'Injury prevention alerts',
      'Race time predictions',
      'Export data (CSV)',
    ],
  },
  {
    id: 'pro_annual',
    name: 'Pro (Annual)',
    description: 'Best value - save 2 months!',
    priceInCents: 9999, // $99.99/year (save $20)
    interval: 'year',
    features: [
      'Everything in Free',
      'AI-powered coaching tips',
      'Unlimited goals',
      '30-day trends & analytics',
      'Injury prevention alerts',
      'Race time predictions',
      'Export data (CSV)',
    ],
  },
  {
    id: 'coach',
    name: 'Coach',
    description: 'For coaches managing multiple athletes',
    priceInCents: 2999, // $29.99/month
    interval: 'month',
    features: [
      'Everything in Pro',
      'Team dashboard (up to 25 athletes)',
      'At-risk athlete alerts',
      'Team wellness reports',
      'Athlete invitation system',
      'Priority support',
    ],
  },
]

export function getProduct(productId: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === productId)
}

export function getPaidProducts(): Product[] {
  return PRODUCTS.filter((p) => p.priceInCents > 0)
}
