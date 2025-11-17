import { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: 'default' | 'bordered'
}

export function Card({ children, className, variant = 'default', ...props }: CardProps) {
  return (
    <div
      className={cn(
        'card',
        variant === 'bordered' && 'border-2',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function CardHeader({ children, className, ...props }: CardHeaderProps) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  )
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode
  as?: 'h1' | 'h2' | 'h3' | 'h4'
}

export function CardTitle({ children, className, as: Component = 'h2', ...props }: CardTitleProps) {
  return (
    <Component className={cn('text-2xl font-semibold text-white', className)} {...props}>
      {children}
    </Component>
  )
}

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function CardContent({ children, className, ...props }: CardContentProps) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  )
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function CardFooter({ children, className, ...props }: CardFooterProps) {
  return (
    <div className={cn('mt-4 pt-4 border-t border-white/20', className)} {...props}>
      {children}
    </div>
  )
}
