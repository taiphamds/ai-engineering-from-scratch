---
id: mdi-ranks-noise-feature
title: A forest that ranks a user id as its top feature
card: math-classical-ml
kind: debug
level: 3
roles: [ai-data-engineer, ai-evaluation-reliability-engineer, applied-ai-engineer]
rounds: [debugging, ml-depth]
tags: [random-forest, feature-importance, permutation-importance, leakage]
minutes: 12
lessons: [phases/02-ml-fundamentals/04-decision-trees]
manuals: []
practice: [gini-best-split]
cheatsheet: [classical-ml]
related: [math-classical-ml/gini-for-a-mixed-node, math-classical-ml/bag-or-boost-the-base-model]
updated: 2026-11-03
---

Độ quan trọng đặc trưng của một random forest đặt một cột user id gần đầu danh sách. Cột là một số nguyên có giá trị khác nhau ở gần như mọi hàng. Nhóm muốn xây dựng một quy tắc sản phẩm quanh nó. Bạn nói gì với họ, và bạn kiểm tra như thế nào?

## Short answer

Độ quan trọng mặc định là mức giảm độ không thuần trung bình, được lấy tổng trên mọi phép chia đã dùng đặc trưng. Một cột khác biệt trên gần như mọi hàng cung cấp một số lượng khổng lồ các ngưỡng ứng viên, nên các cây chia trên nó để tình cờ tách ra các nhóm nhỏ thuần, và các mức giảm độ không thuần đó cộng dồn trên dữ liệu huấn luyện. Thay vào đó chạy một kiểm tra độ quan trọng hoán vị: xáo trộn cột trên dữ liệu giữ lại, đo mức giảm độ chính xác, và kỳ vọng gần không cho một id.

## Full answer

### What the default number measures

```text
importance(feature) = sum over nodes that split on it of
                      (samples at node / total samples) * impurity decrease
```

Con số là một sản phẩm phụ của huấn luyện, nên không tốn gì, và nó thiên lệch theo hai cách bài học nêu: về các đặc trưng có nhiều giá trị khác nhau, và về các đặc trưng có nhiều điểm chia khả dĩ. Một cột id là trường hợp cực đoan của cả hai. Mỗi cây có thể tìm một ngưỡng cô lập một ít hàng có cùng nhãn, gain trông có thật trên mẫu bootstrap, và không có gì trong công thức hỏi liệu nó có áp dụng được hay không.

### The check that does ask

Phương pháp hoán vị xáo trộn các giá trị của một đặc trưng trên dữ liệu mô hình chưa huấn luyện và đo điểm giảm bao nhiêu. Một đặc trưng mô hình cần tạo ra một mức giảm lớn. Một đặc trưng chỉ hấp thụ nhiễu huấn luyện không tạo ra gì. Nó tốn một lần đánh giá mỗi đặc trưng mỗi lần lặp, chậm hơn mặc định, nhưng nó trả lời câu hỏi nhóm đang hỏi. Bài học đặt chính trường hợp này làm một bài tập: một đặc trưng nhiễu có lực lượng lớn mà phương pháp độ không thuần xếp cao còn phương pháp hoán vị thì không.

### What to tell the team

1. Thứ hạng họ thấy không có nghĩa id dự đoán bất cứ điều gì.
2. Chạy kiểm tra hoán vị trên một tập validation với nhiều lần xáo trộn và lấy trung bình.
3. Huấn luyện lại không có id và so sánh điểm validation. Nếu điểm giữ nguyên, id không mang gì.
4. Nếu kiểm tra hoán vị cũng chấm id cao, xem nó là leakage: các id tương quan với mục tiêu qua thời gian hoặc nguồn dữ liệu sẽ không giữ trong production, và không quy tắc sản phẩm nào nên dựa vào chúng.

## Follow-ups

- **Level 3:** Tại sao nhiều giá trị khác nhau khiến một cây dễ tìm một phép chia trông tốt? Expected: nhiều ngưỡng hơn có nghĩa nhiều cơ hội hơn để một ngưỡng tách một vài hàng nhờ may mắn; gain có thật trên mẫu huấn luyện và vắng mặt trên dữ liệu mới.
- **Level 3:** Độ quan trọng hoán vị cho id gần không và điểm validation ổn. Điều đó nói gì? Expected: id không mang tín hiệu mà mô hình phụ thuộc vào; nó hấp thụ nhiễu huấn luyện, và các đặc trưng khác làm công việc.
- **Level 4:** Độ quan trọng hoán vị của id cũng lớn. Bây giờ làm gì? Expected: nghi ngờ leakage; id theo dõi mục tiêu qua thời gian hoặc nguồn, và liên kết đó gãy trong production.
- **Level 4:** Bạn tính độ quan trọng hoán vị như thế nào để nó không lạc quan? Expected: trên dữ liệu giữ lại, chỉ xáo trộn một cột đó, lặp nhiều lần và lấy trung bình, và giữ mọi cột khác cố định.

## Wrong answers

- "Forest thấy id hữu ích, nên nó hữu ích." Tổng độ không thuần đếm các phép chia khớp nhiễu huấn luyện; một cột có nhiều giá trị khác nhau tích lũy chúng.
- "Bỏ mọi cột số nguyên cho chắc." Các số nguyên như số đếm mang tín hiệu thực. Kiểm tra một cột đó bằng một hoán vị.
- "Hai phương pháp độ quan trọng luôn đồng ý." Bài tập của bài học xây dựng một trường hợp mà phương pháp độ không thuần xếp một đặc trưng nhiễu cao còn phương pháp hoán vị thì không.

## Taught in

[Bài học cây quyết định](../../../phases/02-ml-fundamentals/04-decision-trees/) định nghĩa cả hai phép đo độ quan trọng và nêu thiên lệch của phương pháp độ không thuần.
