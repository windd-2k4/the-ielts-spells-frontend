import "@ielts/design-tokens/theme.css";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The IELTS Spells | Chinh phục IELTS bằng Phép thuật Học thuật",
  description:
    "Lộ trình luyện thi IELTS tinh gọn, hiệu quả cao kết hợp phương pháp học thuật hiện đại và đội ngũ giảng viên IELTS 8.0-8.5. Cam kết đầu ra bằng hợp đồng.",
  keywords: ["IELTS", "Luyện thi IELTS", "The IELTS Spells", "IELTS 7.0+", "Học IELTS hiệu quả"],
  authors: [{ name: "The IELTS Spells Academic Team" }],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
