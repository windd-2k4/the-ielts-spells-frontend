import "@ielts/design-tokens/theme.css";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "The IELTS Spells", description: "Cast the Spells, Claim the Band" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
