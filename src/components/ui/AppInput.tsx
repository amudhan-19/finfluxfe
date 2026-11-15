import { useId, type InputHTMLAttributes, type ReactNode } from 'react'

export type AppInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> & {
  label?: string
  required?: boolean
  error?: string
  helperText?: string
  prefixIcon?: ReactNode
  suffixIcon?: ReactNode
}

export function AppInput({
  label,
  required,
  error,
  helperText,
  prefixIcon,
  suffixIcon,
  id: idProp,
  className = '',
  ...rest
}: AppInputProps) {
  const autoId = useId()
  const id = idProp ?? autoId
  const errorId = error ? `${id}-error` : undefined
  const helperId = helperText ? `${id}-helper` : undefined

  const inputClasses = [
    'app-input',
    error ? 'app-input--error' : '',
    prefixIcon ? 'app-input--has-prefix' : '',
    suffixIcon ? 'app-input--has-suffix' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className="app-field">
      {label != null && (
        <label className="app-field__label" htmlFor={id}>
          {label}
          {required ? <span className="app-field__required" aria-hidden>*</span> : null}
        </label>
      )}
      <div className="app-input-wrap">
        {prefixIcon ? (
          <span className="app-input__affix app-input__affix--prefix" aria-hidden>
            {prefixIcon}
          </span>
        ) : null}
        <input
          id={id}
          className={inputClasses}
          aria-invalid={error ? true : undefined}
          aria-describedby={[errorId, helperId].filter(Boolean).join(' ') || undefined}
          aria-required={required || undefined}
          {...rest}
        />
        {suffixIcon ? (
          <span className="app-input__affix app-input__affix--suffix" aria-hidden>
            {suffixIcon}
          </span>
        ) : null}
      </div>
      {error ? (
        <span id={errorId} className="app-field__error" role="alert">
          {error}
        </span>
      ) : helperText ? (
        <span id={helperId} className="app-field__helper">
          {helperText}
        </span>
      ) : null}
    </div>
  )
}
