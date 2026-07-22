import { BookOpenText, CaretLeft, ChartDonut, List, SignOut, Student, Users, UsersThree, X } from "@phosphor-icons/react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import logo from "../../assest/logo.jpg";

const nav = [
  { to: "/dashboard", label: "Tổng quan", icon: ChartDonut, roles: ["admin", "manager"] },
  { to: "/courses", label: "Khóa học", icon: BookOpenText, roles: ["admin", "manager"] },
  { to: "/students", label: "Học viên", icon: Users, roles: ["admin", "manager", "admissions"] },
  { to: "/enrollments", label: "Tuyển sinh & xếp lớp", icon: Student, roles: ["admin", "manager", "admissions"] },
  { to: "/staff", label: "Nhân sự", icon: UsersThree, roles: ["admin"] },
];

export function AdminShell() {
  const { roles, session, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const email = session?.user.email ?? "Nhân sự";
  const role = roles[0] ?? "staff";

  const visibleNav = nav.filter(item => item.roles.some(value => roles.includes(value)));

  return (
    <div className="flex h-screen overflow-hidden text-on-surface bg-background">
      <a className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:top-2 focus:left-2 focus:bg-surface focus:px-4 focus:py-2 focus:rounded-xl focus:border focus:border-primary" href="#admin-content">
        Bỏ qua điều hướng
      </a>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-surface-container border-r border-outline-variant/60 flex flex-col py-6 overflow-y-auto shrink-0 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-6 mb-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-8 h-8 rounded-lg object-cover shrink-0" />
            <div>
              <h1 className="font-display text-lg font-bold text-primary leading-tight">The IELTS Spells</h1>
              <p className="text-xs text-on-surface-variant font-caption">Quản trị hệ thống</p>
            </div>
          </div>
          {/* Close Sidebar button on mobile */}
          <button
            aria-label="Đóng menu"
            onClick={() => setOpen(false)}
            className="md:hidden p-1 text-on-surface-variant hover:text-on-surface"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav aria-label="Điều hướng quản trị" className="flex-1 px-2 space-y-1">
          {visibleNav.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `mx-2 my-1 flex items-center px-4 py-2.5 rounded-xl font-label-md text-label-md transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-on-primary translate-x-1 shadow-sm"
                      : "text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface"
                  }`
                }
              >
                <Icon size={20} className="mr-3" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="mt-auto pt-4 border-t border-outline-variant/30">
          <div className="px-6 py-4 flex items-center gap-3">
            <img
              alt="Admin Avatar"
              className="w-10 h-10 rounded-full sticker-avatar object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAEEVHfcUnKZnu63JjT76PhIS09rGVoVefekjtkS1M-Mo5DJh4zXJm95Y6vmFaOE9sEbt1PfJCk9BrEFzvqxN0-rraqNKmhUIQAmYnrd1YRL94hP7didKkDasnSlbzWsPOS9u8O3QDAKCxKbaorEvLFv0eo_SNaLEvAFzpKwjvslJqzjIXw92o2n3pvtRMM0rZiVCOI5dFipx8Va5EsUHAx6uES8YKFqshPkAkBMttXCohxUEQSrakgaukj7Lt-ZKVWuhcnltrjfQ"
            />
            <div className="flex-1 overflow-hidden">
              <p className="font-label-md text-label-md text-on-surface truncate font-semibold">
                {email.split("@")[0]}
              </p>
              <p className="text-xs text-on-surface-variant truncate font-caption">
                {email}
              </p>
            </div>
          </div>
          <div className="px-2">
            <button
              onClick={() => void signOut()}
              className="w-full text-left text-error hover:bg-error-container/10 mx-2 flex items-center px-4 py-2.5 rounded-xl font-label-md text-label-md transition-all duration-200"
            >
              <SignOut size={20} className="mr-3" />
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      {/* Scrim for Mobile Sidebar */}
      {open && (
        <button
          className="fixed inset-0 z-30 bg-on-background/40 md:hidden"
          aria-label="Đóng menu"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main Workspace */}
      <div className="flex-1 md:pl-64 flex flex-col h-screen overflow-hidden bg-surface-container-lowest">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-surface/90 backdrop-blur-md shadow-sm px-6 py-4 flex justify-between items-center border-b border-outline-variant/20 shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden flex items-center justify-center p-2 rounded-lg hover:bg-surface-container text-on-surface"
              aria-label="Mở menu"
              onClick={() => setOpen(true)}
            >
              <List size={22} />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
              <CaretLeft size={14} />
              <span>Không gian quản trị</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border bg-primary-container/20 text-primary border-primary/20 capitalize">
              {role.replaceAll("_", " ")}
            </span>
          </div>
        </header>

        {/* Content Canvas */}
        <main id="admin-content" className="flex-1 overflow-y-auto p-6 md:p-8 outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
