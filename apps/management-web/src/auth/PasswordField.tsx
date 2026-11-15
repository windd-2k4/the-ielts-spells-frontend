import { Eye, EyeSlash } from "@phosphor-icons/react";
import { useState } from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  required?: boolean;
};

export function PasswordField({ label, error, id, required, ...props }: Props) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;

  return (
    <div className="field-group">
      <label htmlFor={id}>
        {label} {required && <span className="field-required">*</span>}
      </label>
      <div className="password-wrap">
        <input
          {...props}
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          required={required}
        />
        <button
          className="password-toggle"
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          aria-pressed={visible}
        >
          {visible ? <EyeSlash size={19} weight="regular" /> : <Eye size={19} weight="regular" />}
        </button>
      </div>
      {error && <span className="field-error" id={errorId}>{error}</span>}
    </div>
  );
}
