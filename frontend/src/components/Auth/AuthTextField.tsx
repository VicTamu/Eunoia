import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Eye, EyeOff } from 'lucide-react';

export type AuthTextFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  placeholder?: string;
  /** Used when not in password mode */
  inputType?: 'email' | 'text';
  leadingIcon: LucideIcon;
  helperText?: React.ReactNode;
  password?: {
    visible: boolean;
    onToggle: () => void;
    toggleLabels: { show: string; hide: string };
  };
};

const AuthTextField: React.FC<AuthTextFieldProps> = ({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
  inputType = 'email',
  leadingIcon: Leading,
  helperText,
  password,
}) => {
  const hideLeading = Boolean(value);
  const resolvedType = password ? (password.visible ? 'text' : 'password') : inputType;

  return (
    <div className="auth-field">
      <label htmlFor={id} className="auth-label">
        {label}
      </label>
      <div className="auth-input-shell">
        <Leading
          className={`auth-leading-icon h-5 w-5 ${hideLeading ? 'auth-leading-icon-hidden' : ''}`}
          aria-hidden
        />
        <input
          id={id}
          type={resolvedType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={`auth-input ${password ? 'auth-input-with-toggle' : ''}`}
        />
        {password ? (
          <button
            type="button"
            onClick={password.onToggle}
            className="auth-toggle"
            aria-label={password.visible ? password.toggleLabels.hide : password.toggleLabels.show}
          >
            {password.visible ? (
              <EyeOff className="h-5 w-5" aria-hidden />
            ) : (
              <Eye className="h-5 w-5" aria-hidden />
            )}
          </button>
        ) : null}
      </div>
      {helperText ? <div className="field-helper">{helperText}</div> : null}
    </div>
  );
};

export default AuthTextField;
