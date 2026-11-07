---
id: cloud-sandbox-clock-and-bill
title: A build that takes a day, on a sandbox that lives an hour
card: sandboxes
kind: estimate
level: 3
roles: [agentic-ai-engineer, forward-deployed-ai-engineer, applied-ai-engineer]
rounds: [system-design, screen]
tags: [sandbox, cloud, ttl, cost, capacity]
minutes: 8
lessons: []
manuals: [docker-sandboxes-101#s-sbx-cloud-run-move-and-ttl]
practice: []
cheatsheet: [docker-sandboxes]
related: [sandboxes/template-or-kit-for-the-toolchain]
updated: 2026-11-03
---

Một bản build mất khoảng một ngày thời gian thực, và bạn muốn nó trên một cloud sandbox vì đóng nắp laptop kết thúc các lần chạy cục bộ. Ước lượng điều xảy ra nếu bạn chấp nhận mọi mặc định, rồi đặt đồng hồ và cấu hình, và đưa bậc độ lớn của hóa đơn với lập luận được trình bày.

## Short answer

Với các mặc định, sandbox là cấu hình `small`, 2 vCPU và 4096 MiB, với TTL một giờ từ lúc tạo và không có `--on-timeout`, nên server dừng nó nếu có thể tiếp tục nó và xóa nó nếu không, và bản build chết sau một giờ. Đặt `--ttl` lên tới trần 24 giờ từ lúc tạo với `--on-timeout stop`, gia hạn bằng `sbx --cloud ttl +2h` nếu cần, và chọn `xl`, 16 vCPU và 32768 MiB, ở mức $1.12 mỗi giờ trong blog ra mắt. Một ngày trên cấu hình đó là nhỉnh hơn số giờ trong một ngày nhân khoảng một đô la, nên dưới ba mươi đô la, nằm thoải mái trong khoản tín dụng khuyến mại $250, và một sandbox đã dừng không bị tính phí tính toán.

## Full answer

### The shapes

| Cấu hình | vCPU | Bộ nhớ | Giá mỗi giờ, blog ra mắt |
|---|---|---|---|
| `micro` | 1 | 2048 MiB | $0.07 |
| `small`, mặc định | 2 | 4096 MiB | $0.14 |
| `medium` | 4 | 8192 MiB | $0.28 |
| `large` | 8 | 16384 MiB | $0.56 |
| `xl` | 16 | 32768 MiB | $1.12 |

Cặp `--cpus` và `--memory` phải nêu một trong năm cấu hình. Giá đến từ blog ra mắt và cây tài liệu không in giá nào, nên hóa đơn là một ước lượng, không phải báo giá. Blog đo tính toán theo từng giây, và tài liệu chỉ xác nhận rằng một sandbox đã dừng không bị tính phí tính toán.

### The clock

TTL mặc định là một giờ và nhiều nhất 24 giờ từ lúc tạo. `ttl +2h` gia hạn dưới trần đó và không bao giờ rút ngắn. `--on-timeout` chọn `stop`, `restart` hoặc `delete`; `restart` cần một `--ttl` ít nhất một giờ, và một sandbox dựa trên volume phải dùng `delete`. Một sandbox đã dừng báo `stopped`, và đồng hồ của nó khởi động lại khi tiếp tục. Vì vậy một công việc dài hơn trần cần một checkpoint: lưu một template hoặc để công việc nằm trong một volume, vốn là một snapshot được chụp khi sandbox thoát, nơi sandbox thoát cuối ghi đè nó.

### Quotas and what moves

Một tài khoản bắt đầu với 10 sandbox đồng thời, 50 sandbox đã lưu, 100 volume, 100 bí mật và 3 image đang chuẩn bị. `sbx move NAME --to cloud` chụp hệ thống file thành một image và bắt đầu một sandbox mới với một id mới; tiến trình build không di chuyển, nên agent chạy lại build. Các quy tắc mạng kit và môi trường cục bộ đi bên trong image. Các bí mật, mount host, các quy tắc chính sách cục bộ, các binding cổng host và các tiến trình đang chạy ở lại, và các file thông tin xác thực được ghi bởi một lần đăng nhập tương tác di chuyển trừ khi bị xóa trước. Cloud có kho riêng cho các bí mật và chính sách, từ chối các quy tắc phương thức HTTP và hồ sơ quản trị, và một cổng được công bố trở thành một URL HTTPS công khai cần xác thực riêng. Bạn cần `sbx` 0.45.1 trở lên và một gói trả theo sử dụng.

## Follow-ups

- **Level 3:** Hóa ra bản build cần hơn một ngày. Bạn làm gì? Expected: chia nó bằng một checkpoint, một lần lưu template hoặc một volume, vì TTL không thể vượt 24 giờ từ lúc tạo.
- **Level 3:** Bạn di chuyển sandbox laptop giữa lúc build. Bản build có tiếp tục trong cloud không? Expected: không; chỉ hệ thống file di chuyển, tiến trình ở lại, và agent chạy lại nó.
- **Level 4:** Bạn sẽ xóa những file nào trước khi di chuyển? Expected: các file thông tin xác thực từ các lần đăng nhập tương tác, vì snapshot sao chép các file thông thường và kho bí mật không di chuyển.
- **Level 4:** Tại sao hóa đơn của bạn là một ước lượng thay vì một con số bạn báo giá cho tài chính? Expected: giá đến từ một blog chứ không phải tài liệu, đo theo từng giây là một khẳng định blog, và chỉ quy tắc đã-dừng-không-tính-phí nằm trong tài liệu.

## Wrong answers

- "TTL mặc định là một ngày." Nó là một giờ; ngày là trần.
- "Rút ngắn TTL bằng một gia hạn âm." `ttl` chỉ gia hạn và không bao giờ rút ngắn.
- "`sbx move` mang bản build đang chạy." Nó mang image hệ thống file, và tiến trình bị mất.

## Taught in

[Phần cloud](../../../manuals/docker-sandboxes-101/sections/7-1-sbx-cloud-run-move-and-ttl.md) liệt kê các cấu hình, các quy tắc TTL, các hạn ngạch và những gì `sbx move` để lại.
