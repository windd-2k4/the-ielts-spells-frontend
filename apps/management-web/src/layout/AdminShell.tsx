import {
  BookOpenText, Books, CaretLeft, ChartDonut, Exam, FileAudio, List, SignOut, Student, Users, UsersThree, X,
} from "@phosphor-icons/react";
import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import logo from "../../assest/logo.jpg";

const navSections = [
  {
    title: "QUẢN LÝ",
    items: [
      { to: "/dashboard", label: "Tổng quan", icon: ChartDonut, roles: ["admin", "manager"] },
      { to: "/courses", label: "Khóa học", icon: BookOpenText, roles: ["admin", "manager"] },
    ],
  },
  {
    title: "NỘI DUNG ĐÀO TẠO",
    items: [
      { to: "/library", label: "Kho học liệu", icon: Books, roles: ["admin", "manager", "teacher"] },
      { to: "/test-bank", label: "Ngân hàng đề", icon: Exam, roles: ["admin", "manager", "teacher"] },
      { to: "/media", label: "Kho Media", icon: FileAudio, roles: ["admin", "manager", "teacher"] },
    ],
  },
  {
    title: "VẬN HÀNH & NHÂN SỰ",
    items: [
      { to: "/students", label: "Học viên", icon: Users, roles: ["admin", "manager", "admissions"] },
      { to: "/enrollments", label: "Tuyển sinh & ghi danh", icon: Student, roles: ["admin", "manager", "admissions"] },
      { to: "/staff", label: "Nhân sự", icon: UsersThree, roles: ["admin"] },
    ],
  },
];

export function AdminShell() {
  const { roles, session, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const email = session?.user.email ?? "Nhân sự";
  const role = roles[0] ?? "staff";

  // Check if current page is full screen builder (e.g. /test-builder/...)
  const isFullScreenBuilder = location.pathname.startsWith("/test-builder");

  if (isFullScreenBuilder) {
    return (
      <div className="min-h-screen bg-[#F8F6FA] text-[#211A1D]">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden text-on-surface bg-[#F8F6FA]">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:top-2 focus:left-2 focus:bg-surface focus:px-4 focus:py-2 focus:rounded-xl focus:border focus:border-primary"
        href="#admin-content"
      >
        Bỏ qua điều hướng
      </a>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-surface-container border-r border-outline-variant/60 flex flex-col py-5 overflow-y-auto shrink-0 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-5 mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-8 h-8 rounded-lg object-cover shrink-0" />
            <div>
              <h1 className="font-display text-base font-bold text-primary leading-tight">The IELTS Spells</h1>
              <p className="text-xs text-on-surface-variant font-caption">Quản trị hệ thống</p>
            </div>
          </div>
          <button
            aria-label="Đóng menu"
            onClick={() => setOpen(false)}
            className="md:hidden p-1 text-on-surface-variant hover:text-on-surface"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav aria-label="Điều hướng quản trị" className="flex-1 px-3 space-y-5">
          {navSections.map((section) => {
            const visibleItems = section.items.filter((item) =>
              item.roles.some((r) => roles.includes(r))
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-1">
                <span className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-[#746A6E]">
                  {section.title}
                </span>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center px-3.5 py-2.5 rounded-xl font-label-md text-sm transition-all duration-200 ${
                          isActive
                            ? "bg-[#8f4458] text-white shadow-sm font-bold"
                            : "text-[#493b42] hover:bg-[#e7e1e8] hover:text-[#211A1D]"
                        }`
                      }
                    >
                      <Icon size={19} className="mr-3 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="mt-auto pt-4 border-t border-outline-variant/30">
          <div className="px-5 py-3 flex items-center gap-3">
            <span className="w-9 h-9 grid place-items-center rounded-full bg-[#f7e7ec] text-[#743447] font-extrabold text-sm uppercase shrink-0">
              {email.charAt(0)}
            </span>
            <div className="flex-1 overflow-hidden">
              <p className="font-label-md text-xs text-on-surface truncate font-semibold">
                {email.split("@")[0]}
              </p>
              <p className="text-[11px] text-on-surface-variant truncate font-caption">
                {email}
              </p>
            </div>
          </div>
          <div className="px-2">
            <button
              onClick={() => void signOut()}
              className="w-full text-left text-error hover:bg-error-container/10 flex items-center px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200"
            >
              <SignOut size={18} className="mr-2.5 shrink-0" />
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
        <header className="sticky top-0 z-20 bg-surface/90 backdrop-blur-md shadow-sm px-6 py-3.5 flex justify-between items-center border-b border-outline-variant/20 shrink-0">
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
              <span>Không gian quản trị EdTech</span>
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
