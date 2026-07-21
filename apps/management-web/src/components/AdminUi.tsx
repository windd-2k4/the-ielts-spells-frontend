import { ArrowClockwise, MagnifyingGlass, Plus, X } from "@phosphor-icons/react";
import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <header className="page-heading"><div><span>{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</header>;
}

export function PrimaryAction({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button className="admin-primary" onClick={onClick}><Plus size={19} weight="bold" />{children}</button>;
}

export function SearchField({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="admin-search"><MagnifyingGlass size={19} /><span className="sr-only">Tìm kiếm</span><input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} /></label>;
}

export function LoadState({ loading, error, empty, onRetry }: { loading: boolean; error: string; empty: boolean; onRetry: () => void }) {
  if (loading) return <div className="admin-skeleton" aria-label="Đang tải"><i /><i /><i /></div>;
  if (error) return <div className="admin-state error" role="alert"><strong>Không tải được dữ liệu</strong><p>{error}</p><button onClick={onRetry}><ArrowClockwise />Thử lại</button></div>;
  if (empty) return <div className="admin-state"><strong>Chưa có dữ liệu</strong><p>Hãy tạo bản ghi đầu tiên để bắt đầu quản lý.</p></div>;
  return null;
}

export function Drawer({ title, description, children, onClose }: { title: string; description: string; children: ReactNode; onClose: () => void }) {
  return <div className="admin-drawer-layer" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><aside className="admin-drawer" role="dialog" aria-modal="true" aria-label={title}><header><div><h2>{title}</h2><p>{description}</p></div><button aria-label="Đóng" onClick={onClose}><X /></button></header>{children}</aside></div>;
}

export function StatusBadge({ value, children }: { value: string; children: ReactNode }) { return <span className={`admin-badge badge-${value.toLowerCase()}`}>{children}</span>; }
