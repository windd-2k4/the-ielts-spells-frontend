"use client";

import { useState } from "react";
import { StudentSidebar } from "./StudentSidebar";
import { StudentTopbar } from "./StudentTopbar";
import { StudentMobileNav } from "./StudentMobileNav";

export function StudentHubLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F5F4] text-[#292528] flex font-sans antialiased">
      {/* Desktop Sidebar */}
      <StudentSidebar />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar Navigation */}
        <StudentTopbar onToggleMobileMenu={() => setMobileMenuOpen(true)} />

        {/* Page Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1480px] w-full mx-auto pb-20 lg:pb-10">
          {children}
        </main>
      </div>

      {/* Mobile Drawer & Bottom Navigation */}
      <StudentMobileNav
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </div>
  );
}
