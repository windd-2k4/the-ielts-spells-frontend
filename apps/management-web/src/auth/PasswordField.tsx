import { Eye, EyeSlash } from "@phosphor-icons/react";
import { useState } from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function PasswordField({ label, error, id, ...props }: Props) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;

  return (
    <div className="field-group">
      <label htmlFor={id}>{label}</label>
      <div className="password-wrap">
        <input
          {...props}
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
        <button
          className="password-toggle"
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          aria-pressed={visible}
        >
          {visible ? <EyeSlash /> : <Eye />}
        </button>
      </div>
      {error && <span className="field-error" id={errorId}>{error}</span>}
    </div>
  );
}
