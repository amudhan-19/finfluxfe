import type { ReactNode } from 'react'

export type FormFieldProps = {
  label?: string
  required?: boolean
  htmlFor?: string
  children: ReactNode
  className?: string
  /** Uppercase label style for modal forms (e.g. EMAIL) */
  uppercase?: boolean
}

export function FormField({
  label,
  required,
  htmlFor,
  children,
  className = '',
  uppercase = false,
}: FormFieldProps) {
  const rootClass = ['app-field', className].filter(Boolean).join(' ')
  const labelClass = ['app-field__label', uppercase ? 'app-field__label--upper' : '']
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootClass}>
      {label != null ? (
        <label className={labelClass} htmlFor={htmlFor}>
          {label}
          {required ? <span className="app-field__required" aria-hidden> *</span> : null}
        </label>
      ) : null}
      {children}
    </div>
  )
}
