# The IELTS Spells Frontend

Một Git repository dùng pnpm workspace, chứa hai ứng dụng triển khai độc lập:

- `apps/main-web`: website công khai và cổng học viên (Next.js).
- `apps/management-web`: hệ thống quản lý dành cho admin/giáo viên (React + Vite).
- `packages/*`: design tokens, UI, API client và kiểu dữ liệu dùng chung.

## Chạy local

```bash
pnpm install
pnpm dev:main
pnpm dev:management
```

Sao chép `.env.example` thành `.env.local` trong app cần chạy và cập nhật URL backend.
