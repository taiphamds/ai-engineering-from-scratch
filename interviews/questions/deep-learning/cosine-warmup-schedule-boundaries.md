---
id: cosine-warmup-schedule-boundaries
title: Warmup plus cosine schedule with pinned boundaries
card: deep-learning
kind: take-home
level: 4
roles: [applied-ai-engineer, inference-engineer, ai-data-engineer]
rounds: [take-home, coding]
tags: [learning-rate, schedules, warmup, cosine, testing]
minutes: 25
lessons: [phases/19-capstone-projects/44-cosine-lr-warmup, phases/03-deep-learning-core/09-learning-rate-schedules]
manuals: []
practice: []
cheatsheet: [optimizers-schedules]
related: [deep-learning/warmup-before-the-peak-rate, deep-learning/pick-the-peak-rate-and-schedule]
updated: 2026-11-03
---

Bài làm ở nhà. Triển khai một lịch learning rate dưới dạng một hàm của bước: một đoạn tăng tuyến tính từ không đến một đỉnh, một cosine decay từ đỉnh đến một mức sàn, và một mức sàn cố định sau bước cuối cùng. Bàn giao các kiểm thử cố định giá trị tại mọi ranh giới, chứng minh đường cong không có bước nhảy, và cho thấy một lần chạy được tiếp tục rơi vào đúng giá trị. Mô tả thiết kế và các kiểm thử của bạn.

## Short answer

Viết một hàm với ba nhánh: đến bước warmup, đỉnh nhân bước chia độ dài warmup; giữa bước warmup và tổng, mức sàn cộng một nửa khoảng cách nhân một cộng cosine của pi nhân tiến độ kể từ khi warmup kết thúc; qua tổng, mức sàn. Kiểm thử các điểm cố định: không ở bước không, đỉnh tại cuối warmup từ cả hai nhánh, mức sàn tại bước cuối và mức sàn một bước sau. Thêm một kiểm thử tính liên tục chặn mỗi thay đổi một bước, và một kiểm thử tiếp tục tính lịch từ một bước toàn cục đã lưu.

## Full answer

### The function

```text
if warmup_steps > 0 and step <= warmup_steps:
    lr = lr_max * step / warmup_steps
elif step <= total_steps:
    progress = (step - warmup_steps) / (total_steps - warmup_steps)
    lr = lr_min + 0.5 * (lr_max - lr_min) * (1 + cos(pi * progress))
else:
    lr = lr_min
```

Cosine cho giá trị 1 tại cuối warmup, cho đỉnh và khớp với điểm cuối của đoạn tăng, và -1 tại tổng, cho mức sàn. Bài học capstone nhấn mạnh rằng tính liên tục này là lý do viết một hàm trên bước thay vì ba mảnh ghép lại: một lịch ghép mất một ranh giới ngay lần đầu đỉnh hoặc một số bước thay đổi. Hai điều kiện bảo vệ: nhánh tăng chỉ chạy khi warmup trên không, vì vậy một warmup không bước bắt đầu tại đỉnh và giảm ngay, không có phép chia cho không. Hàm khởi tạo từ chối một warmup không nhỏ hơn tổng, như mã của bài học thực hiện bằng một lỗi, vì rate sẽ giữ đỉnh tại bước cuối và rơi xuống sàn một bước sau.

### Why the floor is pinned, not an error

Một trainer vượt quá tổng được cấu hình giữ một rate dùng được và ghi log một cảnh báo. Kéo dài một lần chạy có nghĩa là thay đổi tổng trong cấu hình, không chỉnh sửa vòng lặp. Mức sàn chủ ý khác không: bài học giữ nó gần 10 phần trăm đỉnh để bộ tối ưu hóa tiếp tục học trong đuôi dài, và cảnh báo rằng một mức sàn bằng không trông đẹp trên một biểu đồ và khiến mô hình được huấn luyện chưa đủ.

### The tests

1. **Các điểm cố định.** Với một warmup khác không, lr(0) là 0, lr(warmup) bằng đỉnh từ nhánh tăng và từ nhánh cosine, lr(total) bằng sàn, lr(total + 1) bằng sàn.
2. **Tính liên tục.** Với mọi bước từ 0 đến tổng, thay đổi giữa các bước liên tiếp tối đa bằng giá trị lớn hơn giữa độ dốc warmup, đỉnh chia số bước warmup, và độ dốc cosine dốc nhất, pi nhân khoảng cách chia hai lần độ dài decay. Bài tập của bài học ghi chú rằng một đoạn cosine ngắn có thể dốc hơn đoạn tăng, vì vậy chỉ độ dốc đoạn tăng không phải một giới hạn an toàn.
3. **Tiếp tục.** Lưu một checkpoint với một bước toàn cục, nạp lại, và khẳng định giá trị tiếp theo bằng lr(global step + 1). Lịch đọc một bước toàn cục đơn điệu từ checkpoint, không phải một bộ đếm epoch hoặc một biến vòng lặp, vì các dataset chia shard và các loader được khởi động lại phá ánh xạ epoch sang bước.
4. **Hình dạng.** Kết xuất lịch thành một biểu đồ văn bản và một CSV, với một hàng mỗi bước, và đưa biểu đồ vào thư mục lần chạy để một người rà soát có thể thấy đường cong mà không chạy gì.

### Production notes from the lesson

Bốn con số của lịch nằm trong một cấu hình có phiên bản, không trong mã. Warmup là một tỷ lệ của tổng, khoảng 1 đến 3 phần trăm, để hình dạng sống sót qua một lần chạy dài hơn. Hàng log là bước, learning rate, chuẩn L2 gradient và loss, theo thứ tự đó, để dashboard có thể đọc nó.

## Follow-ups

- **Level 3:** Tại sao triển khai ba vùng trong một hàm? Expected: để điểm cuối đoạn tăng và điểm bắt đầu cosine dùng chung một công thức cho đỉnh, và một thay đổi đỉnh hoặc các số bước không thể mở một khoảng hở tại một ranh giới.
- **Level 4:** Giới hạn đúng cho kiểm thử tính liên tục là gì? Expected: giá trị lớn hơn giữa độ dốc đoạn tăng, đỉnh chia số bước warmup, và độ dốc cosine dốc nhất, pi nhân khoảng cách chia hai lần độ dài decay; một đoạn cosine ngắn có thể dốc hơn đoạn tăng.
- **Level 4:** Tại sao cố định ở sàn sau bước cuối thay vì phát sinh lỗi? Expected: một trainer vượt quá giữ một rate dùng được và ghi log một cảnh báo; kéo dài huấn luyện có nghĩa là thay đổi tổng trong cấu hình, không phải vòng lặp.
- **Level 4:** Điều gì khiến một lần chạy được tiếp tục rơi vào đúng giá trị? Expected: lịch đọc một bước toàn cục đơn điệu được lưu trong checkpoint, không phải một bộ đếm epoch hoặc một biến vòng lặp cục bộ.

## Wrong answers

- "Đặt sàn bằng không để lịch kết thúc gọn gàng." Bài học giữ một sàn khác không gần 10 phần trăm đỉnh để bộ tối ưu hóa tiếp tục học trong đuôi; một sàn bằng không trông gọn gàng và khiến mô hình được huấn luyện chưa đủ.
- "Kiểm thử vài bước ở giữa, các ranh giới suy ra từ công thức." Một lỗi lệch một tại một ranh giới là lỗi mà bài học cảnh báo; nó xuất hiện sau nhiều giờ trong một lần chạy dưới dạng một rate lệch 1 phần trăm tại thời điểm nó quan trọng.
- "Tính rate từ epoch và chỉ số batch." Các dataset chia shard và các loader được khởi động lại phá ánh xạ đó; bước toàn cục là trục bền vững.

## Taught in

[Capstone cosine warmup](../../../phases/19-capstone-projects/44-cosine-lr-warmup/) xây dựng lịch này với hợp đồng ranh giới và các mẫu production của nó, và [bài học lịch learning rate](../../../phases/03-deep-learning-core/09-learning-rate-schedules/) so sánh nó với các lịch khác.
