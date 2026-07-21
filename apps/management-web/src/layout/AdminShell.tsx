import { BookOpenText, Buildings, CaretLeft, ChartDonut, List, SignOut, Student, UsersThree, X } from "@phosphor-icons/react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const nav = [
  { to: "/dashboard", label: "Tổng quan", icon: ChartDonut, roles: ["admin", "manager"] },
  { to: "/courses", label: "Khóa học", icon: BookOpenText, roles: ["admin", "manager"] },
  { to: "/classes", label: "Lớp học", icon: Buildings, roles: ["admin", "manager"] },
  { to: "/enrollments", label: "Ghi danh", icon: Student, roles: ["admin", "manager", "admissions"] },
  { to: "/staff", label: "Nhân sự", icon: UsersThree, roles: ["admin"] },
];

export function AdminShell() {
  const { roles, session, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const email = session?.user.email ?? "Nhân sự";
  const role = roles[0] ?? "staff";
  return <div className="admin-shell">
    <a className="skip-link" href="#admin-content">Bỏ qua điều hướng</a>
    <aside className={`admin-sidebar${open ? " is-open" : ""}`}>
      <div className="admin-brand"><img src="/brand/the-ielts-spells-logo.png" alt="The IELTS Spells" /><div><strong>The IELTS Spells</strong><span>Management Portal</span></div><button aria-label="Đóng menu" onClick={() => setOpen(false)}><X /></button></div>
      <nav aria-label="Điều hướng quản trị">{nav.filter(item => item.roles.some(value => roles.includes(value))).map(item => { const Icon = item.icon; return <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)}><Icon size={21} /><span>{item.label}</span></NavLink>; })}</nav>
      <div className="admin-sidebar-footer"><div className="admin-account"><span>{email.slice(0, 1).toUpperCase()}</span><div><strong>{email}</strong><small>{role.replaceAll("_", " ")}</small></div></div><button onClick={() => void signOut()}><SignOut />Đăng xuất</button></div>
    </aside>
    {open && <button className="admin-sidebar-scrim" aria-label="Đóng menu" onClick={() => setOpen(false)} />}
    <div className="admin-workspace"><header className="admin-topbar"><button className="admin-menu" aria-label="Mở menu" onClick={() => setOpen(true)}><List /></button><div><CaretLeft size={15} /><span>Không gian quản trị</span></div><span className="admin-role-chip">{role.replaceAll("_", " ")}</span></header><main id="admin-content" className="admin-content" tabIndex={-1}><Outlet /></main></div>
  </div>;
}
