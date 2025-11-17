import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'

export const metadata: Metadata = {
  title: 'ML Insights Platform - SmartCamp.AI',
  description: 'Train, evaluate, and deploy machine learning models without coding expertise',
  keywords: ['machine learning', 'ML', 'AI', 'data science', 'predictive analytics'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
