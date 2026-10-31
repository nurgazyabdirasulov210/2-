import { forwardRef, type ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost' | 'quiet' | 'safelight'
type Size = 'sm' | 'md' | 'lg'

const base =
  'relative inline-flex items-center justify-center gap-2 select-none whitespace-nowrap font-sans font-medium ' +
  'transition-[transform,background-color,box-shadow,color,border-color] duration-200 ease-out-quint ' +
  'active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none cursor-pointer'

const variants: Record<Variant, string> = {
  primary: 'bg-text-1 text-bg hover:bg-white shadow-md',
  ghost: 'border border-border-strong text-text-1 hover:bg-surface-2 hover:border-text-3',
  quiet: 'text-text-2 hover:text-text-1 hover:bg-surface-2',
  safelight:
    'bg-safelight text-white shadow-[0_0_0_1px_rgba(224,69,58,.5),0_10px_40px_-6px_var(--safelight-glow)] hover:brightness-110',
}
const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-body-sm rounded-full',
  md: 'h-11 px-5 text-body rounded-full',
  lg: 'h-14 px-7 text-body-lg rounded-full',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className = '', ...rest },
  ref,
) {
  return <button ref={ref} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest} />
})
