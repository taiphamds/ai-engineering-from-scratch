---
id: rl-engine-died-silent
title: The GPU is idle and the RL log keeps growing
card: post-training
kind: debug
level: 2
roles: [inference-engineer, ai-evaluation-reliability-engineer]
rounds: [debugging]
tags: [rl-infrastructure, rollout-engine, watchdog, miles, 503]
minutes: 10
lessons: []
manuals: [miles-101#s-add-a-watchdog, miles-101#s-troubleshoot-by-symptom, miles-101#s-write-a-custom-reward, miles-101#s-know-the-true-on-policy-limits]
practice: []
cheatsheet: [miles-rl]
related: [post-training/grpo-groups-teach-nothing]
updated: 2026-11-03
---

Bạn để một lần chạy huấn luyện RL một GPU tự chạy trong một giờ. Khi quay lại, GPU nhàn rỗi, tiến trình vẫn sống, và file log đã tăng hơn một trăm megabyte. Không gì báo cáo một thất bại. Điều gì đã xảy ra, bạn xác nhận nó như thế nào, và bạn đặt gì để nó không thể xảy ra lại?

## Short answer

Engine rollout chết và trainer không bao giờ nhận thấy. Engine thất bại trong khởi động, và client rollout tiếp tục gửi các yêu cầu đến nó, nhận một 503 từ router trên mỗi yêu cầu, và thử lại. Lần chạy thất bại trong tài liệu ghi 200,533 dòng lỗi như vậy trong 63 phút và không bao giờ báo cáo một thất bại. Xác nhận bằng cách đếm các dòng lỗi mỗi phút và đọc các dòng engine trên lỗi đầu tiên, rồi chạy mọi công việc không giám sát với một watchdog dừng container khi các lỗi không dừng.

## Full answer

### What a dead engine looks like

Lần chạy tài liệu mất yêu cầu một backend attention mà GPU không thể chạy. Engine ném một assertion trong khởi động và thoát. Tiến trình trainer giữ chạy và gửi các yêu cầu generate đến router trong một giờ, và router trả về `503 Service Unavailable` cho mỗi yêu cầu. Lỗi đầu và cuối cách nhau 63 phút.

### Confirm the cause, in this order

1. Đếm `503 Service Unavailable` trên toàn bộ log. Các lần chạy khỏe mạnh của tài liệu không có lỗi nào, với một ngoại lệ bên dưới.
2. Đếm các lỗi mỗi phút. Engine chết ghi ít nhất 2,669 trong mọi phút đầy đủ. Một engine khỏe mạnh nhưng bận ghi các đợt đến khoảng một phút rồi không gì: lần chạy với 16 câu trả lời mỗi prompt ghi 22,357 lỗi trong các đợt đến 2,209 trong một phút, client thử lại, và lần chạy hoàn tất mọi bước.
3. Đọc các dòng engine trên lỗi đầu tiên. Nguyên nhân nằm ở đó, không phải trong các dòng trainer.

### Why a count alone is not enough

Một số đếm không thể tách một đợt khỏi một cái chết, nhưng thời gian có thể. Watchdog trong tài liệu đọc 60 giây cuối của log container mỗi 30 giây và đếm lỗi. Nó chỉ dừng lần chạy khi số đếm vượt 100 trong mười lần kiểm tra liên tiếp. Phát lại trên các thời điểm lỗi thực của lần chạy bận, một quy tắc có sáu kiểm tra sẽ dừng lần chạy khỏe mạnh đó trong 17 trên 30 trường hợp, vì hai đợt đến cách nhau 45 giây. Với mười kiểm tra, nó không dừng trường hợp khỏe mạnh nào và vẫn dừng một engine chết trong khoảng năm phút.

### What the watchdog cannot see

Một lần chạy treo sau một lỗi import module reward ghi gần như không có dòng lỗi. Kiểm thử của tài liệu giữ chạy hai giờ với 44 dòng lỗi, và watchdog không kích hoạt. Với triệu chứng đó, tìm `ModuleNotFoundError` không có dòng `rollout 0` sau nó.

### Practice

- Khởi động watchdog trong một terminal thứ hai cho mọi lần chạy bạn để tự chạy, và kiểm thử nó trước trên một container cố ý in lỗi; kiểm thử của tài liệu dừng một engine chết giả trong 183 giây.
- Cấp cho mỗi lần chạy tên container riêng và file log riêng.
- Đọc mã thoát: 1 có nghĩa watchdog dừng lần chạy, 2 có nghĩa nó mất liên lạc với container runtime và lần chạy không có bảo vệ.

## Follow-ups

- **Level 2:** Tại sao trainer không thất bại khi engine đã mất? Expected: client rollout xem 503 là một lỗi tạm thời và thử lại mỗi yêu cầu; không gì trong vòng lặp giới hạn các lần thử lại hoặc thời gian nhàn rỗi.
- **Level 2:** Bạn tìm lý do engine chết ở đâu? Expected: các dòng engine trên 503 đầu tiên trong cùng log; trong trường hợp tài liệu là một assertion backend attention cho một GPU ngoài khoảng hỗ trợ.
- **Level 3:** Tại sao tài liệu tăng watchdog từ sáu kiểm tra lên mười? Expected: một lần phát lại trên một lần chạy khỏe mạnh cho thấy các đợt cách nhau 45 giây mà sáu kiểm tra nhầm là chết; mười kiểm tra không bao giờ kích hoạt trên một lần chạy khỏe mạnh và vẫn bắt một engine chết trong khoảng năm phút.
- **Level 3:** Watchdog bỏ lỡ gì, và bạn thêm gì cho nó? Expected: một lần chạy treo với ít lỗi, như một lỗi import reward; thêm một kiểm tra rằng dòng bước đầu xuất hiện trong một giới hạn thời gian.

## Wrong answers

- "Giết lần chạy ngay khi một 503 xuất hiện." Một engine bận với hàng trăm yêu cầu mở ghi các đợt lỗi này và phục hồi; lần chạy bận của tài liệu hoàn tất tất cả bước.
- "Tăng giới hạn thử lại client để lần chạy sống sót." Các lần thử lại là lý do lần chạy chết sống một giờ; engine sẽ không tự trở lại, và GPU nằm nhàn rỗi.
- "Trainer crash; xem các dòng trainer." Trainer sống và ghi log lỗi; nguyên nhân nằm trong các dòng khởi động engine trên lỗi đầu tiên.

## Taught in

[Phần 1.2 của Miles 101](../../../manuals/miles-101/sections/1-2-add-a-watchdog.md) phát lại quy tắc watchdog trên các thời điểm lỗi thực, và [phần 7.1](../../../manuals/miles-101/sections/7-1-troubleshoot-by-symptom.md) liệt kê triệu chứng cạnh sự treo sau một lỗi import reward.
