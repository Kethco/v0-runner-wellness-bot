import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/contexts/auth-context'
import { ThemeProvider } from '@/components/theme-provider'
import { InstallPrompt } from '@/components/pwa/install-prompt'
import { UpdateBanner } from '@/components/update-banner'
import { TrialBanner } from '@/components/dashboard/trial-banner'
import { Toaster } from '@/components/ui/toaster'
import { TrialExpiredBlocker } from '@/components/trial-expired-blocker'
import { SplashProvider } from '@/components/splash-screen'
import { SWRProvider } from '@/components/swr-provider'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter"
});
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Runner Wellness | Your Daily Training Companion',
  description: 'Track your wellness, optimize your training. Daily check-ins for sleep, energy, soreness, and readiness to help runners perform at their best.',
  generator: 'v0.app',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Runner Wellness',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#FF6B00',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Runner Wellness" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.jpg" />
        <link rel="preconnect" href="https://js.stripe.com" />
        <link rel="preconnect" href="https://api.stripe.com" />
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        <link rel="dns-prefetch" href="https://api.stripe.com" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SWRProvider>
            <AuthProvider>
              <SplashProvider>
                <UpdateBanner />
                <TrialBanner />
                {children}
                <InstallPrompt />
                <Toaster />
                <TrialExpiredBlocker />
              </SplashProvider>
            </AuthProvider>
          </SWRProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
