'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface HeaderProps {
  user?: { email: string; name?: string } | null
  onSignOut?: () => void
}

export function Header({ user, onSignOut }: HeaderProps) {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <header className="w-full bg-black/30 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2">
            <div className="text-white font-bold text-2xl">
              <span className="gradient-text">ML Insights</span>
            </div>
          </Link>

          {/* Navigation */}
          {user && (
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/dashboard"
                className={cn(
                  'text-white/80 hover:text-white transition-colors',
                  isActive('/dashboard') && 'text-white font-semibold'
                )}
              >
                Dashboard
              </Link>
              <Link
                href="/datasets"
                className={cn(
                  'text-white/80 hover:text-white transition-colors',
                  isActive('/datasets') && 'text-white font-semibold'
                )}
              >
                Datasets
              </Link>
              <Link
                href="/models"
                className={cn(
                  'text-white/80 hover:text-white transition-colors',
                  isActive('/models') && 'text-white font-semibold'
                )}
              >
                Models
              </Link>
            </nav>
          )}

          {/* User menu */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="hidden sm:inline text-white/80 text-sm">
                  {user.name || user.email}
                </span>
                <Button variant="outline" size="sm" onClick={onSignOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="outline" size="sm">
                    Log In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button variant="jungle" size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
