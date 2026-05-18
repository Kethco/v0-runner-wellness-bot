'use client'

import { useCallback, useState } from 'react'
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { Loader2 } from 'lucide-react'

import { startCheckoutSession } from '@/app/actions/stripe'

// Load Stripe outside component to avoid recreating on every render
// This significantly speeds up checkout loading
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export function Checkout({ productId }: { productId: string }) {
  const [isLoading, setIsLoading] = useState(true)

  const fetchClientSecret = useCallback(
    async () => {
      const secret = await startCheckoutSession(productId)
      return secret
    },
    [productId],
  )

  const handleComplete = useCallback(() => {
    setIsLoading(false)
  }, [])

  return (
    <div id="checkout" className="w-full relative min-h-[400px]">
      {/* Loading spinner - shows until Stripe is ready */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading secure checkout...</p>
          </div>
        </div>
      )}
      
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{ 
          fetchClientSecret,
          onComplete: handleComplete,
        }}
      >
        <EmbeddedCheckout 
          className={isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}
        />
      </EmbeddedCheckoutProvider>
    </div>
  )
}
