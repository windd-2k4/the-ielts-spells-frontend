import {
  BookOpenText, Books, CaretLeft, ChartDonut, Exam, FileAudio, Heart, List, Megaphone, SignOut,
  SlidersHorizontal, Student, Users, UsersThree, X,
} from "@phosphor-icons/react";
import type { UserRole } from "@ielts/contracts";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import logo from "../../assest/logo.jpg";

type AdminDensity = "auto" | "compact" | "comfortable";

const densityStorageKey = "ielts-management-density";
const compactViewportQuery = "(min-width: 1024px) and (max-height: 900px)";

const densityOptions: Array<{ value: AdminDensity; label: string }> = [
  { value: "auto", label: "Tự động" },
  { value: "compact", label: "Gọn" },
  { value: "comfortable", label: "Thoải mái" },
];

function storedDensity(): AdminDensity {
  try {
    const value = window.localStorage.getItem(densityStorageKey);
    return value === "compact" || value === "comfortable" ? value : "auto";
  } catch {
    return "auto";
  }
}

function useAdminDensity() {
  const [density, setDensity] = useState<AdminDensity>(storedDensity);
  const [compactViewport, setCompactViewport] = useState(() => window.matchMedia(compactViewportQuery).matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia(compactViewportQuery);
    const updateViewportDensity = (event: MediaQueryListEvent) => setCompactViewport(event.matches);
    mediaQuery.addEventListener("change", updateViewportDensity);
    return () => mediaQuery.removeEventListener("change", updateViewportDensity);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(densityStorageKey, density);
    } catch {
      // Keep the current-session preference when storage is unavailable.
    }
  }, [density]);

  return {
    density,
    resolvedDensity: density === "auto" && compactViewport ? "compact" : density === "auto" ? "comfortable" : density,
    setDensity,
  } as const;
}

const navSections: Array<{ title: string; items: Array<{ to: string; label: string; icon: typeof BookOpenText; roles: UserRole[] }> }> = [
  {
    title: "QUẢN LÝ",
    items: [
      { to: "/dashboard", label: "Tổng quan", icon: ChartDonut, roles: ["admin"] },
      { to: "/courses", label: "Khóa học", icon: BookOpenText, roles: ["admin"] },
    ],
  },
  {
    title: "NỘI DUNG ĐÀO TẠO",
    items: [
      { to: "/library", label: "Kho học liệu", icon: Books, roles: ["admin", "teacher"] },
      { to: "/test-bank", label: "Ngân hàng đề", icon: Exam, roles: ["admin", "teacher"] },
      { to: "/media", label: "Kho Media", icon: FileAudio, roles: ["admin", "teacher"] },
      { to: "/cms", label: "Nội dung truyền thông", icon: Megaphone, roles: ["admin", "social_media"] },
    ],
  },
  {
    title: "VẬN HÀNH & NHÂN SỰ",
    items: [
      { to: "/students", label: "Học viên", icon: Users, roles: ["admin", "admissions"] },
      { to: "/enrollments", label: "Tuyển sinh & ghi danh", icon: Student, roles: ["admin", "admissions"] },
      { to: "/support/courses", label: "Học viên được hỗ trợ", icon: Heart, roles: ["student_support"] },
      { to: "/staff", label: "Nhân sự", icon: UsersThree, roles: ["admin"] },
    ],
  },
];

export function AdminShell() {
  const { roles, session, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const { density, resolvedDensity, setDensity } = useAdminDensity();
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
    <div
      className="admin-shell flex h-screen overflow-hidden bg-[#F8F6FA] text-on-surface"
      data-density={density}
      data-density-resolved={resolvedDensity}
    >
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:top-2 focus:left-2 focus:bg-surface focus:px-4 focus:py-2 focus:rounded-xl focus:border focus:border-primary"
        href="#admin-content"
      >
        Bỏ qua điều hướng
      </a>

      {/* Sidebar */}
      <aside
        className={`admin-sidebar fixed inset-y-0 left-0 z-40 flex shrink-0 flex-col overflow-y-auto border-r border-outline-variant/60 bg-surface-container transition-transform duration-200 ease-in-out md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="admin-sidebar-brand flex items-center justify-between gap-3">
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
        <nav aria-label="Điều hướng quản trị" className="admin-sidebar-nav flex-1">
          {navSections.map((section) => {
            const visibleItems = section.items.filter((item) =>
              item.roles.some((r) => roles.includes(r))
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="admin-nav-section space-y-1">
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
                        `admin-nav-item flex items-center rounded-xl font-label-md text-sm transition-all duration-200 ${
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
        <div className="admin-sidebar-footer mt-auto border-t border-outline-variant/30 pt-4">
          <div className="admin-sidebar-profile flex items-center gap-3 px-5 py-3">
            <span className="admin-sidebar-avatar grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f7e7ec] text-sm font-extrabold uppercase text-[#743447]">
              {email.charAt(0)}
            </span>
            <div className="flex-1 overflow-hidden">
              <p className="admin-sidebar-user truncate font-label-md text-xs font-semibold text-on-surface">
                {email.split("@")[0]}
              </p>
              <p className="admin-sidebar-email truncate font-caption text-[11px] text-on-surface-variant">
                {email}
              </p>
            </div>
          </div>
          <div className="px-2">
            <button
              onClick={() => void signOut()}
              className="admin-sidebar-signout flex w-full items-center rounded-xl px-3.5 py-2 text-left text-xs font-bold text-error transition-all duration-200 hover:bg-error-container/10"
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
      <div className="admin-workspace flex h-screen flex-1 flex-col overflow-hidden bg-surface-container-lowest">
        {/* Top bar */}
        <header className="admin-topbar sticky top-0 z-20 flex shrink-0 items-center justify-between border-b border-outline-variant/20 bg-surface/90 shadow-sm backdrop-blur-md">
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
            <label className="admin-density-control" title="Điều chỉnh mật độ hiển thị của trang quản trị">
              <span className="sr-only">Mật độ hiển thị</span>
              <SlidersHorizontal aria-hidden="true" size={17} />
              <select
                aria-label="Mật độ hiển thị"
                value={density}
                onChange={(event) => setDensity(event.target.value as AdminDensity)}
              >
                {densityOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border bg-primary-container/20 text-primary border-primary/20 capitalize">
              {role.replaceAll("_", " ")}
            </span>
          </div>
        </header>

        {/* Content Canvas */}
        <main id="admin-content" className="admin-content flex-1 overflow-y-auto outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
