export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
  interval?: 'month' | 'year'
  trialDays?: number
  features: string[]
  popular?: boolean
  maxAthletes?: number // For coach plans
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
    id: 'coach_trial',
    name: 'Coach Free Trial',
    description: 'Try Coach Pro free for 7 days - no credit card required',
    priceInCents: 0,
    trialDays: 7,
    maxAthletes: 30,
    features: [
      'Full Coach Pro access for 7 days',
      'Team dashboard',
      'Up to 30 athletes',
      'At-risk athlete alerts',
      'AI training recommendations',
      'Team wellness reports',
      'SMS invitations',
    ],
  },
  {
    id: 'coach_starter',
    name: 'Coach Starter',
    description: 'Perfect for small teams and JV squads',
    priceInCents: 2999, // $29.99/month
    interval: 'month',
    maxAthletes: 15,
    features: [
      'Team dashboard',
      'Up to 15 athletes',
      'At-risk athlete alerts',
      'Team wellness reports',
      'SMS invitations',
    ],
  },
  {
    id: 'coach_pro',
    name: 'Coach Pro',
    description: 'Ideal for varsity teams',
    priceInCents: 4999, // $49.99/month
    interval: 'month',
    maxAthletes: 30,
    popular: true,
    features: [
      'Everything in Starter',
      'Up to 30 athletes',
      'AI training recommendations',
      'Weekly team reports',
      'Priority support',
    ],
  },
  {
    id: 'coach_elite',
    name: 'Coach Elite',
    description: 'For large programs and clubs',
    priceInCents: 7999, // $79.99/month
    interval: 'month',
    maxAthletes: 50,
    features: [
      'Everything in Pro',
      'Up to 50 athletes',
      'Multiple team support',
      'Advanced analytics',
      'Dedicated support',
    ],
  },
]

export function getProduct(productId: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === productId)
}

export function getPaidProducts(): Product[] {
  return PRODUCTS.filter((p) => p.priceInCents > 0)
}
