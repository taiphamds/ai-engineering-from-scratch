---
id: choose-the-draft-for-a-new-model
title: Bake in the draft, train it after, or borrow a small model
card: tokenization-decoding
kind: design
level: 4
roles: [inference-engineer, applied-ai-engineer]
rounds: [system-design, design-review]
tags: [speculative-decoding, multi-token-prediction, eagle, draft-model, acceptance-rate]
minutes: 15
lessons: [phases/10-llms-from-scratch/18-multi-token-prediction, phases/10-llms-from-scratch/15-speculative-decoding-eagle3, phases/17-infrastructure-and-production/05-eagle3-speculative-decoding, phases/19-capstone-projects/14-speculative-decoding-server]
manuals: []
practice: []
cheatsheet: [speculative-decoding]
related: [tokenization-decoding/mtp-sequential-vs-parallel, tokenization-decoding/hidden-state-drafts]
updated: 2026-11-03
---

Bạn sắp tiền huấn luyện một mô hình sau đó sẽ phục vụ một khối lượng lớn bằng giải mã suy đoán. Có ba cách lấy một draft trên bàn: tích hợp các mô-đun multi-token tuần tự vào tiền huấn luyện, huấn luyện một draft head trạng thái ẩn sau tiền huấn luyện, hoặc dùng lại một mô hình nhỏ cùng họ. Đưa quyết định với các chi phí, và nêu cổng bạn đo trước khi phát hành cờ.

## Short answer

Nếu tôi kiểm soát tiền huấn luyện và kích thước ẩn ít nhất 4096, tôi tích hợp các mô-đun tuần tự: huấn luyện chậm hơn khoảng 10 phần trăm đổi lấy một tín hiệu giám sát dày hơn và một draft chấp nhận 80 phần trăm trở lên ở độ sâu một. Nếu các trọng số đã tồn tại, tôi huấn luyện một head được huấn luyện sau trên các feature của bộ xác minh với khoảng 60 đến 200B token; nó tương thích ngược và đạt mức chấp nhận 0.88 đến 0.92 trên chat chung. Một mô hình nhỏ cùng họ không cần huấn luyện và nằm quanh 0.55 đến 0.70. Bất kể tôi chọn gì, cổng là sự chấp nhận được đo trên hỗn hợp lưu lượng riêng ở độ đồng thời production, với cờ tắt dưới khoảng 0.55 và độ trễ đuôi được theo dõi, không phải trung bình.

## Full answer

### The three options

| Lựa chọn | Khi huấn luyện | Hoạt động với các trọng số hiện có | Các tham số draft | Sự chấp nhận | Lợi ích thêm |
|---|---|---|---|---|---|
| Các mô-đun tuần tự trong tiền huấn luyện | trong tiền huấn luyện | không | một block cùng một phép chiếu mỗi độ sâu | 0.80 trở lên ở độ sâu một | tín hiệu huấn luyện dày hơn |
| Head được huấn luyện sau trên các feature bộ xác minh | sau tiền huấn luyện | có | một hoặc hai lớp, được huấn luyện trên khoảng 60 đến 200B token | 0.88 đến 0.92 trên chat | không có ngoài tốc độ |
| Mô hình nhỏ cùng họ | không | có | một mô hình nhỏ đầy đủ | 0.55 đến 0.70 | không có, và nó tốn bộ nhớ |

### The decision tree

1. **Bạn có sở hữu tiền huấn luyện không?** Nếu có và mô hình đủ lớn, các mô-đun là lựa chọn duy nhất cải thiện mô hình và việc phục vụ cùng lúc; báo cáo giới thiệu chúng đo thông lượng sinh khoảng 1.8 lần chỉ từ draft. Ở quy mô 1B, overhead gây hại nhiều hơn giúp.
2. **Các trọng số đã tồn tại chưa?** Khi đó là head được huấn luyện sau. Nó là một công việc huấn luyện nhẹ so với bộ xác minh, và nó không chạm các đầu ra của bộ xác minh.
3. **Hoàn toàn không ngân sách huấn luyện?** Mô hình nhỏ, như một prototype, biết rằng trần chấp nhận thấp và mô hình thứ hai tốn bộ nhớ.

### The gate

Suy đoán là opt-in trên engine production, và quy tắc của bài học production là bật cờ mà không đo sự chấp nhận trên lưu lượng thực là một anti-pattern. Kế hoạch:

1. Phục vụ đích thuần và ghi thời gian tới token đầu, độ trễ liên token và thông lượng ở độ đồng thời mục tiêu.
2. Bật draft và chạy lại cùng benchmark.
3. Đọc các token draft được chấp nhận và các token draft được đề xuất theo từng yêu cầu từ engine và chia số đầu cho số sau để có sự chấp nhận.
4. Dưới khoảng 0.55 ở độ đồng thời production, tắt cờ hoặc huấn luyện một head riêng cho lĩnh vực.
5. Xác nhận độ trễ liên token đuôi không tệ hơn, vì một draft bị từ chối tốn một lần xác minh và một lần lấy lại.

### Traffic mix

Một head được huấn luyện trên chat chung nằm ở 0.6 đến 0.8 ở đó và giảm xuống 0.4 đến 0.6 trên lưu lượng mã, y tế hoặc pháp lý. Đặt trọng số sự chấp nhận theo tỷ lệ lưu lượng trước khi quyết định, và đo riêng từng lát; một con số pha trộn có thể giấu một lát nơi suy đoán có lợi ích ròng âm. Bài tập của capstone hỏi đúng điều này cho một hỗn hợp 70 phần trăm chat và 30 phần trăm mã với các mức chấp nhận 0.7 và 0.4.

### Operate it

Sự chấp nhận trôi dạt khi đích thay phiên bản và draft không thay, nên cảnh báo theo từng lát, và giữ một fallback không draft hoặc n-gram cho các lát nơi head ngừng mang lợi ích.

## Follow-ups

- **Level 3:** Lưu lượng là 70 phần trăm chat ở mức chấp nhận 0.7 và 30 phần trăm mã ở 0.4. Bạn quyết định bằng cách nào? Expected: đặt trọng số theo tỷ lệ lưu lượng, rồi kiểm tra từng lát theo sàn; riêng mã dưới sàn, nên định tuyến mã tới giải mã thuần hoặc huấn luyện một head mã.
- **Level 4:** Đích có một phiên bản mới quý tới. Điều gì xảy ra với mỗi lựa chọn? Expected: các mô-đun tích hợp di chuyển cùng mô hình; head được huấn luyện sau phải được huấn luyện lại theo đích mới; mô hình nhỏ trôi xa hơn; cảnh báo sự chấp nhận theo từng phiên bản.
- **Level 4:** Một head trạng thái ẩn đọc gì trong thế hệ hiện tại? Expected: các feature từ nhiều lớp đích, không chỉ lớp cuối, đó là một phần lý do sự chấp nhận tăng.
- **Level 4:** Lựa chọn mô hình nhỏ vẫn thắng ở đâu? Expected: một prototype không ngân sách huấn luyện, hoặc một triển khai CPU nơi engine chỉ cung cấp đường draft thuần.

## Wrong answers

- "Luôn dùng draft trạng thái ẩn mới nhất; nó tốt nhất tuyệt đối." Nó cần huấn luyện theo đích của bạn và sự chấp nhận trên lưu lượng lĩnh vực có thể giảm tới 0.4; các mô-đun tích hợp cho bạn một draft và một mô hình tốt hơn nếu bạn sở hữu tiền huấn luyện.
- "Tích hợp các mô-đun sau bằng một fine-tune." Chúng là một lựa chọn tiền huấn luyện; một mô hình dense hiện có nhận một head được huấn luyện sau thay vào đó.
- "Chọn theo mức tăng tốc trên một benchmark công khai." Sự chấp nhận phụ thuộc lưu lượng của bạn; cổng được đo trên hỗn hợp riêng ở độ đồng thời riêng.

## Taught in

[Bài học multi-token prediction](../../../phases/10-llms-from-scratch/18-multi-token-prediction/) và [bài học EAGLE-3](../../../phases/10-llms-from-scratch/15-speculative-decoding-eagle3/) cung cấp hai lựa chọn được huấn luyện và các chi phí, [bài học EAGLE-3 production](../../../phases/17-infrastructure-and-production/05-eagle3-speculative-decoding/) đặt cổng đo lường, và [capstone server giải mã suy đoán](../../../phases/19-capstone-projects/14-speculative-decoding-server/) bao phủ drift và fallback.
