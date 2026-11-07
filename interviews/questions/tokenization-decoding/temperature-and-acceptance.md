---
id: temperature-and-acceptance
title: Speculation flies on code and stalls on creative writing
card: tokenization-decoding
kind: tradeoff
level: 2
roles: [inference-engineer, applied-ai-engineer]
rounds: [ml-depth, screen]
tags: [speculative-decoding, temperature, sampling, acceptance-rate, greedy]
minutes: 8
lessons: [phases/07-transformers-deep-dive/16-speculative-decoding, phases/10-llms-from-scratch/25-speculative-decoding, phases/10-llms-from-scratch/15-speculative-decoding-eagle3, phases/17-infrastructure-and-production/05-eagle3-speculative-decoding]
manuals: []
practice: [lab-sampling-temperature]
cheatsheet: [speculative-decoding]
related: [tokenization-decoding/speedup-from-alpha]
updated: 2026-11-03
---

Sản phẩm viết sáng tạo của bạn lấy mẫu ở temperature cao và giải mã suy đoán hoàn toàn không cho tăng tốc, trong khi cùng cấu hình chạy rất nhanh trên hoàn thành mã. Giải thích khác biệt, và mô tả kiểm tra chấp nhận trở thành gì ở temperature bằng không.

## Short answer

Sự chấp nhận phụ thuộc vào mức thường xuyên bộ xác minh đồng ý với những gì draft lấy mẫu. Ở temperature cao, phân phối đích phẳng, các mẫu draft trải trên nhiều token, và tỷ số chấp nhận của xác suất bộ xác minh so với draft giảm về một chia kích thước từ vựng, nên gần như mọi draft bị từ chối và chi phí draft được trả vô ích. Mã và đầu ra có cấu trúc có thể dự đoán, nên sự chấp nhận tăng trên 0.9. Ở temperature bằng không, quy tắc trở thành một so sánh: chấp nhận nếu token được draft bằng token có khả năng nhất của bộ xác minh, nếu không thì phát token đó và dừng.

## Full answer

### Why temperature is the lever

Kiểm tra chấp nhận là `u < min(1, q(d) / p(d))`. Khi cả hai phân phối tập trung trên cùng token, tỷ số gần một và draft được chấp nhận. Tăng temperature và cả hai phân phối phẳng đi: draft giờ lấy mẫu các token mà bộ xác minh cho ít xác suất, các tỷ số thu nhỏ, và các lần từ chối chồng lên. Bài tập của bài học chạy vòng lặp ở temperature 1.5 để cho thấy sự sụp đổ, nơi thuật toán trở nên chậm hơn giải mã thuần vì overhead draft giữ lại và các token được chấp nhận biến mất.

### Why the task matters

| Workload | Tăng tốc được đo trong bài học |
|---|---|
| chat | 2 đến 3 lần |
| sinh mã | 3 đến 5 lần |
| viết sáng tạo | gần không |

Mã và đầu ra có cấu trúc có token tiếp theo rất dễ dự đoán, nên ngay cả một draft không hoàn hảo cũng đồng ý với bộ xác minh phần lớn số lần; bài học EAGLE-3 đặt sự chấp nhận trên 0.9 trên đầu ra như vậy. Văn xuôi mở ở temperature cao có nhiều phần tiếp nối chấp nhận được, và draft hiếm khi chọn đúng token mà bộ xác minh sẽ chọn.

### The greedy case

Với temperature bằng không, cả hai mô hình xác định. Kiểm tra rút gọn thành `argmax(q) == d`: chấp nhận khi khớp, nếu không xuất `argmax(q)` và dừng. Phân phối phần dư không cần, vì lựa chọn của bộ xác minh là một token duy nhất.

### What to do about it

- Tắt suy đoán theo từng yêu cầu khi temperature cao, hoặc định tuyến các yêu cầu như vậy tới một pool giải mã thuần; bài học EAGLE-3 liệt kê chuyển đổi nhận biết temperature như một núm tinh chỉnh.
- Cũng không tiêu draft cho các đầu ra rất ngắn từ 1 đến 5 token; overhead chi phối.
- Đo tỷ lệ chấp nhận theo từng bề mặt sản phẩm và giữ suy đoán ở nơi có lợi; sàn của bài học production là khoảng 0.55 ở độ đồng thời cao.

## Follow-ups

- **Level 2:** Tỷ số chấp nhận trở thành gì khi draft và bộ xác minh đồng ý chính xác? Expected: một, nên mọi draft được chấp nhận và mỗi lượt cho toàn bộ draft cộng token thưởng.
- **Level 3:** Draft có được lấy mẫu ở một temperature khác bộ xác minh không? Expected: có, miễn p là phân phối mà draft thực sự lấy mẫu từ đó; đầu ra vẫn theo phân phối bộ xác minh, nhưng một sự không khớp hạ sự chấp nhận.
- **Level 3:** Bạn triển khai công tắc trong một lớp phục vụ bằng cách nào? Expected: đọc temperature và độ dài đầu ra của yêu cầu, và tắt suy đoán trên một ngưỡng temperature hoặc dưới một ngưỡng độ dài, với các ngưỡng được đặt từ sự chấp nhận được đo.
- **Level 4:** Tại sao tổn thất tệ hơn ở độ đồng thời cao so với công thức gợi ý? Expected: một draft bị từ chối tốn một lần xác minh và một lần lấy lại nối tiếp dưới một batch đầy, và batch đã lấp băng thông bộ nhớ mà suy đoán khai thác, nên độ trễ đuôi chịu thiệt.

## Wrong answers

- "Hạ temperature để suy đoán hoạt động." Sản phẩm chọn temperature vì một lý do; thay đường giải mã cho các yêu cầu đó, không phải sản phẩm.
- "Draft quá nhỏ; dùng một draft lớn hơn." Kích thước không phải vấn đề khi phân phối đích phẳng; một draft lớn hơn vẫn không thể đoán token nào trong nhiều token chấp nhận được mà bộ xác minh lấy mẫu.
- "Ở temperature cao, suy đoán thay đổi đầu ra." Quy tắc từ chối giữ phân phối đầu ra chính xác ở mọi temperature; điều thay đổi là tốc độ.

## Taught in

[Bài học giải mã suy đoán Phase 7](../../../phases/07-transformers-deep-dive/16-speculative-decoding/) gắn sự chấp nhận với chiến lược giải mã, [bài học giải mã suy đoán Phase 10](../../../phases/10-llms-from-scratch/25-speculative-decoding/) cung cấp trường hợp tham lam và bảng workload, [bài học EAGLE-3](../../../phases/10-llms-from-scratch/15-speculative-decoding-eagle3/) nêu núm chuyển đổi, và [bài học EAGLE-3 production](../../../phases/17-infrastructure-and-production/05-eagle3-speculative-decoding/) đặt sàn chấp nhận.
