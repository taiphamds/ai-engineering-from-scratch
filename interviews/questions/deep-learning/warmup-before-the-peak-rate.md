---
id: warmup-before-the-peak-rate
title: What a learning rate warmup protects
card: deep-learning
kind: concept
level: 3
roles: [applied-ai-engineer, inference-engineer, ai-data-engineer]
rounds: [ml-depth, design-review]
tags: [learning-rate, warmup, schedules, adam]
minutes: 10
lessons: [phases/03-deep-learning-core/09-learning-rate-schedules, phases/19-capstone-projects/44-cosine-lr-warmup]
manuals: []
practice: [lab-learning-rate-sweep]
cheatsheet: [optimizers-schedules]
related: [deep-learning/adam-bias-correction-first-steps, deep-learning/cosine-warmup-schedule-boundaries]
updated: 2026-11-03
---

Một công thức transformer bắt đầu learning rate ở không và tăng tuyến tính lên đỉnh trong những bước đầu, rồi giảm nó theo cosine. Một đồng đội muốn bắt đầu ở đỉnh để tiết kiệm những bước đó. Giải thích đoạn tăng bảo vệ điều gì, nó nên dài bao lâu, và viết nó xuống như thế nào để công thức mở rộng sang một lần chạy dài hơn.

## Short answer

Các cập nhật đầu tiên là những cập nhật mong manh: các trọng số nằm gần khởi tạo, các ước lượng trượt của Adam về trung bình và phương sai gradient được xây dựng từ một số ít mẫu, và chuẩn gradient lớn và nhiễu. Một bước kích thước đầy đủ trên nền tảng đó phân kỳ hoặc đẩy mô hình vào một vùng bằng nó không bao giờ rời khỏi. Warmup giữ bước hiệu dụng nhỏ cho đến khi các thống kê ổn định, trên khoảng 1 đến 5 phần trăm tổng số bước, và lịch nên biểu diễn độ dài đó dưới dạng một tỷ lệ của lần chạy thay vì một số bước cố định.

## Full answer

### What is wrong at step zero

Hai ước lượng moment của Adam bắt đầu từ không. Hiệu chỉnh độ chệch sửa tỷ lệ của chúng, nhưng những bước đầu vẫn dùng thống kê từ một hoặc hai gradient, mà bài học lịch gọi là thống kê rác. Cùng lúc các trọng số ở khởi tạo ngẫu nhiên của chúng và chuẩn gradient lớn nhất và nhiễu nhất. Một bước đỉnh trên hỗn hợp đó là một chuyển động lớn, định hướng kém. Bài học capstone đưa ra hai kết quả: lần chạy phân kỳ hoàn toàn, hoặc nó ổn định vào một vùng bằng loss mà nó không bao giờ thoát.

### What warmup does

```text
lr(t) = lr_max * t / warmup_steps     for t below warmup_steps
```

Rate tăng từ không lên đỉnh trong các bước warmup. Đến khi rate đầy đủ đến, các ước lượng moment đã thấy hàng trăm gradient và các trọng số đã di chuyển khỏi điểm bắt đầu. Các ví dụ của bài học lịch về các lần chạy được công bố dùng một warmup 2000 bước đến một đỉnh 3e-4 theo sau bởi một cosine decay đến 3e-5, và một warmup trên 375 triệu token đến một đỉnh 6e-4.

### How long

Bài học lịch đưa ra 1 đến 5 phần trăm tổng số bước và, khi không chắc, 3 đến 5 phần trăm. Bài học capstone đưa ra 1 đến 3 phần trăm và nhấn mạnh điểm mạnh hơn: viết warmup dưới dạng một tỷ lệ. Một lần chạy 200 triệu bước với 2,000 bước warmup ở đỉnh gần như ngay lập tức, và một lần chạy 20,000 bước với cùng số đếm warmup trong 10 phần trăm. Cùng con số mô tả hai lịch khác nhau.

### How to see that it worked

Ghi log chuẩn gradient cạnh learning rate tại mỗi bước. Trong một warmup được điều chỉnh tốt chuẩn tăng gần đồng nhịp với rate và ổn định sau đỉnh. Một chuẩn giữ cao sau khi đoạn tăng kết thúc nói rằng đỉnh quá táo bạo. Một lần chạy phân kỳ cho thấy chuẩn tăng vọt trước loss.

## Follow-ups

- **Level 3:** Tại sao Adam nhạy cảm đặc biệt ở bước không? Expected: các ước lượng moment của nó bắt đầu từ không và những bước đầu dùng thống kê từ một hoặc hai gradient; hiệu chỉnh độ chệch sửa tỷ lệ nhưng không sửa nhiễu của chúng.
- **Level 3:** Chuẩn gradient trông như thế nào trong một warmup khỏe? Expected: nó tăng gần đồng nhịp với learning rate và ổn định sau đỉnh; một chuẩn giữ cao sau đoạn tăng nói rằng đỉnh quá táo bạo.
- **Level 4:** Tại sao một số bước warmup cố định hỏng khi lần chạy dài hơn? Expected: 2000 bước là 10 phần trăm của một lần chạy 20,000 bước và một tỷ lệ tiêu biến của một lần chạy 200 triệu bước, vì vậy cùng số đếm cho hai lịch khác nhau; một tỷ lệ giữ hình dạng.
- **Level 4:** Bạn thay đổi kích thước batch. Bạn xem xét lại gì? Expected: độ dài warmup và đỉnh; bài học lịch liệt kê giai đoạn warmup là thiết lập phải thay đổi khi kích thước batch thay đổi.

## Wrong answers

- "Warmup lãng phí các bước ở một rate thấp." Các bài học dành 1 đến 5 phần trăm huấn luyện cho nó, và một lần chạy phân kỳ trong những bước đầu lãng phí tất cả chúng.
- "Hiệu chỉnh độ chệch đã xử lý cold start của Adam, vì vậy warmup dư thừa." Hiệu chỉnh điều chỉnh lại tỷ lệ các trung bình; nó không thể biến hai mẫu thành một ước lượng tốt.
- "Đặt warmup là 2000 bước, các lần chạy lớn dùng vậy." Số đếm đó là một tỷ lệ của một lần chạy cụ thể; trên một lần chạy ngắn nó là phần lớn huấn luyện, và trên một lần dài hơn nó không là gì.

## Taught in

[Bài học lịch learning rate](../../../phases/03-deep-learning-core/09-learning-rate-schedules/) giải thích warmup và đưa ra các cấu hình được công bố, và [capstone cosine warmup](../../../phases/19-capstone-projects/44-cosine-lr-warmup/) lập luận cho một warmup theo tỷ lệ và ghi log chuẩn gradient cạnh rate.
