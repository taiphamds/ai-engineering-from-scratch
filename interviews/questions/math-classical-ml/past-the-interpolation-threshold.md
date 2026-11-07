---
id: past-the-interpolation-threshold
title: Test error that falls, spikes and falls again
card: math-classical-ml
kind: concept
level: 4
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer, ai-data-engineer]
rounds: [ml-depth, system-design]
tags: [bias-variance, double-descent, overparameterization, regularization]
minutes: 15
lessons: [phases/02-ml-fundamentals/10-bias-variance]
manuals: []
practice: [lab-bias-variance]
cheatsheet: [ml-model-comparison]
related: [math-classical-ml/bag-or-boost-the-base-model, math-classical-ml/compare-two-models-with-folds]
updated: 2026-11-03
---

Một nhóm tiếp tục tăng một mô hình. Sai số kiểm thử giảm, rồi tăng vọt khi số tham số tiến gần số hàng huấn luyện, rồi giảm lại khi họ tiếp tục. Đường cong chữ U cổ điển dự đoán sự tăng vọt nhưng không dự đoán lần giảm thứ hai. Giải thích đường cong cho thấy gì, và đưa cho nhóm một quy tắc về kích thước mô hình.

## Short answer

Đỉnh nằm ở ngưỡng nội suy, nơi mô hình có vừa đủ năng lực để khớp mọi hàng huấn luyện và bị buộc vào một nghiệm cụ thể, nhạy với nhiễu, nên variance đạt đỉnh. Qua nó, nhiều nghiệm khớp dữ liệu huấn luyện và regularization ngầm của gradient descent chọn một nghiệm đơn giản, nên sai số giảm lại. Đó là double descent. Quy tắc: ở hẳn dưới ngưỡng với regularization tường minh, hoặc đi hẳn qua nó; nơi tệ nhất để ở là ngay trên nó.

## Full answer

### The classical picture

Sai số kỳ vọng là bias bình phương cộng variance cộng nhiễu không thể giảm. Khi năng lực tăng, bias giảm và variance tăng, và tổng có một cực tiểu. Quy tắc cổ điển là nhiều năng lực hơn qua điểm đó luôn gây hại.

### The three regimes

| Chế độ | Tham số so với hàng | Hành vi |
|---|---|---|
| Thiếu tham số | ít hơn nhiều | sự đánh đổi cổ điển áp dụng |
| Ngưỡng nội suy | gần bằng | variance đạt đỉnh, sai số kiểm thử tăng vọt |
| Dư tham số | nhiều hơn nhiều | regularization ngầm, sai số kiểm thử giảm |

Ở ngưỡng, mô hình chỉ vừa đủ đi qua mọi điểm huấn luyện, và một thay đổi nhỏ trong dữ liệu làm phép khớp thay đổi nhiều. Qua nó, dữ liệu huấn luyện không còn cố định một nghiệm, và thuật toán học chọn trong số nhiều nghiệm khớp. Gradient descent có xu hướng chọn một nghiệm đơn giản, và thiên lệch về tính đơn giản đó là lý do các mạng dư tham số nặng tổng quát hóa.

### What the lesson adds

- Mẫu này xuất hiện trong các mô hình tuyến tính, cây quyết định và mạng nơ-ron.
- Thêm dữ liệu có thể gây hại gần ngưỡng, vì thêm hàng di chuyển ngưỡng bên dưới một mô hình cố định. Đó là dạng theo mẫu. Huấn luyện lâu hơn có thể tạo cùng đường cong theo epoch.
- Regularization làm mượt và hạ đỉnh nhưng không loại bỏ nó.

### The rule for the team

Đo ngưỡng ở đâu: sai số huấn luyện đạt không và sai số kiểm thử đạt đỉnh ở gần cùng kích thước. Sau đó định cỡ mô hình xa nó về phía này hoặc phía kia. Dưới nó, dùng regularization tường minh và các chẩn đoán cổ điển. Trên nó, tiếp tục và xác minh bằng các đường cong học thay vì trực giác cổ điển.

## Follow-ups

- **Level 3:** Bạn nhận ra ngưỡng trong một log huấn luyện như thế nào? Expected: sai số huấn luyện đạt không và sai số kiểm thử ở mức tệ nhất ở gần cùng kích thước mô hình hoặc epoch.
- **Level 4:** Tại sao thêm dữ liệu có thể gây hại trong chế độ này? Expected: nhiều hàng hơn di chuyển ngưỡng; một mô hình cố định đã qua nó có thể rơi ngay vào nó, là dạng theo mẫu.
- **Level 4:** Regularization làm gì với đỉnh? Expected: nó làm mượt và hạ đỉnh nhưng không loại bỏ nó.
- **Level 4:** Điều này có khiến sự đánh đổi bias-variance sai không? Expected: không; nó đúng dưới ngưỡng và không đầy đủ trên nó, nơi bias ngầm của bộ tối ưu tiếp quản.

## Wrong answers

- "Lần giảm thứ hai là một lỗi đo." Nó xuất hiện trong các mô hình tuyến tính, cây và mạng, và trong cả dạng theo mẫu và theo epoch.
- "Làm mô hình lớn nhất ngân sách cho phép và ngừng nghĩ về nó." Lớn hơn qua ngưỡng hoạt động, nhưng nằm ngay trên ngưỡng là kết quả tệ nhất; cố ý định cỡ mô hình xa nó.
- "Regularization loại bỏ vấn đề." Nó làm mượt và hạ đỉnh; nó không loại bỏ nó.

## Taught in

[Bài học bias-variance](../../../phases/02-ml-fundamentals/10-bias-variance/) suy ra phân rã và mô tả double descent cùng ba chế độ của nó.
