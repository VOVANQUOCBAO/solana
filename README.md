# EduLink Hub

Nền tảng kết nối sinh viên, doanh nghiệp và Mentor, gồm frontend Next.js và backend Laravel.

## Mã nguồn

- `blockchian/`: frontend, giao diện sinh viên và dashboard Doanh nghiệp / Mentor / Admin.
- `EduLink Hub/`: Laravel API, xác thực, công việc, milestone, matching và tranh chấp.
- Mã nguồn được lưu trực tiếp trong hai thư mục trên, thay cho các bản ZIP trước đây.

## Chạy local

Yêu cầu Node.js tương thích Next.js 16, PHP >= 8.4.1 và Composer.

### Backend

```sh
cd "EduLink Hub"
composer install
cp .env.example .env
php artisan key:generate
```

Cấu hình database trong `.env`, sau đó:

```sh
php artisan migrate
php artisan serve --host=127.0.0.1 --port=8000
```

Chỉ với database demo riêng, có thể tạo tài khoản thử bằng `php artisan db:seed --class=WorkspaceDemoSeeder`.

### Frontend

```sh
cd blockchian
cp .env.example .env.local
npm ci
npm run build
npm start -- --hostname 127.0.0.1 --port 3000
```

Mở http://127.0.0.1:3000/login. Địa chỉ API được cấu hình bởi `NEXT_PUBLIC_API_URL` trước khi build.

## Tài liệu và trạng thái

Xem [bàn giao phần của Bảo](blockchian/docs/bao-workspace.md) để biết chức năng, tài khoản demo, kiểm thử và các phần cần tích hợp tiếp.

Dashboard Doanh nghiệp, Mentor và Admin đã kết nối API. Thanh toán mặc định ở chế độ mô phỏng; chuyển token thực tế, giải ngân tranh chấp và tích hợp xác thực sinh viên còn thuộc các phần việc tiếp theo. Đưa mã lên GitHub không đồng nghĩa ứng dụng đã được triển khai lên hosting.

Không commit `.env`, khóa bí mật, database, thư viện cài đặt hoặc dữ liệu runtime.
