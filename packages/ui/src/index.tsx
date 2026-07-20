import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

export function BrandMark() {
  return <span aria-label="The IELTS Spells" style={{ fontWeight: 900, letterSpacing: "-.04em" }}>The <span style={{ color: "var(--brand-pink)" }}>IELTS Spells</span> ✦</span>;
}

export function Button({ children, style, ...props }: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) {
  return <button {...props} style={{ border: 0, borderRadius: 999, padding: "12px 18px", background: "var(--brand-pink)", color: "white", fontWeight: 750, cursor: "pointer", ...style }}>{children}</button>;
}

export function Card({ children }: PropsWithChildren) {
  return <section style={{ background: "white", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 20, boxShadow: "var(--shadow)" }}>{children}</section>;
}
