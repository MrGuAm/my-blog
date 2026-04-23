"use client"

import type { ChangeEventHandler, FocusEventHandler } from "react"

interface SearchQueryInputProps {
  name?: string
  value?: string
  defaultValue?: string
  placeholder: string
  className?: string
  inputClassName?: string
  onChange?: ChangeEventHandler<HTMLInputElement>
  onFocus?: FocusEventHandler<HTMLInputElement>
  onBlur?: FocusEventHandler<HTMLInputElement>
  showClearButton?: boolean
  onClear?: () => void
}

export default function SearchQueryInput({
  name,
  value,
  defaultValue,
  placeholder,
  className = "relative min-w-0 w-full sm:w-auto",
  inputClassName = "apple-input w-full pl-9 pr-9",
  onChange,
  onFocus,
  onBlur,
  showClearButton = false,
  onClear,
}: SearchQueryInputProps) {
  return (
    <div className={className}>
      <input
        type="text"
        name={name}
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        className={inputClassName}
      />
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">🔍</span>
      {showClearButton && onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
          aria-label="清除搜索"
        >
          ✕
        </button>
      ) : null}
    </div>
  )
}
