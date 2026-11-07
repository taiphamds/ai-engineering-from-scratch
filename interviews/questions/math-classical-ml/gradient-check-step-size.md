---
id: gradient-check-step-size
title: A gradient check that fails for the wrong reason
card: math-classical-ml
kind: debug
level: 3
roles: [applied-ai-engineer, inference-engineer, ai-evaluation-reliability-engineer]
rounds: [debugging, ml-depth]
tags: [gradient-checking, finite-differences, numerical-stability, autodiff]
minutes: 12
lessons: [phases/01-math-foundations/13-numerical-stability, phases/01-math-foundations/05-chain-rule-and-autodiff]
manuals: []
practice: [mlp-backprop]
cheatsheet: [information-numerics]
related: [math-classical-ml/grad-accumulate-plus-equals, math-classical-ml/variance-of-large-numbers]
updated: 2026-11-03
---

Bạn thêm một lớp mới vào một mạng từ đầu và chạy một kiểm tra gradient. Sai số tương đối giữa gradient giải tích và gradient số khoảng 1e-3 cho một trọng số. Một đồng đội nói lượt backward có một bug. Trước khi đồng ý, bạn quyết định lỗi nằm trong lượt backward hay trong chính kiểm tra như thế nào?

## Short answer

Một sai số tương đối gần 1e-3 nằm trong dải cảnh báo, nên trước tiên làm kiểm tra đáng tin cậy. Dùng sai phân hai phía, đặt bước trong khoảng từ 1e-5 đến 1e-7, chạy kiểm tra trong float64, và tính sai số tương đối với giá trị lớn nhất của cả hai độ lớn ở mẫu số. Nếu sai số giữ gần 1e-3 hoặc tăng trong những điều kiện đó, lượt backward sai; nếu nó giảm xuống dưới 1e-5, kiểm tra đã có lỗi.

## Full answer

### What the check computes

Gradient số cho một trọng số là sai phân trung tâm: loss tại trọng số cộng h, trừ loss tại trọng số trừ h, chia cho 2h. Sai số cắt cụt của nó giảm theo h bình phương, trong khi sai phân một phía chỉ giảm theo h. Sai số tương đối so sánh nó với giá trị giải tích:

```text
rel_error = |analytical - numerical| / max(|analytical|, |numerical|, 1e-8)
```

Các ngưỡng của bài học: dưới 1e-7 là khớp sạch, dưới 1e-5 là chấp nhận được, trên 1e-3 chỉ đến một bug, và trên 1 có nghĩa gradient sai.

### Ways the check lies

1. **Bước quá lớn.** Sai phân đo độ dốc của một dây cung, không phải tiếp tuyến. Giảm h.
2. **Bước quá nhỏ.** Hai loss gần bằng nhau, và phép trừ của chúng chịu triệt tiêu thảm họa: chênh lệch thật dưới nhiễu làm tròn, và nhiễu trở thành các chữ số đứng đầu. Trong float32 điều này xảy ra sớm, nên chạy kiểm tra trong float64 và giữ h giữa 1e-5 và 1e-7.
3. **Một điểm gãy tại điểm kiểm thử.** Một ReLU hoặc một max không có đạo hàm tại không, và một bước vượt qua điểm gãy đo hai độ dốc khác nhau. Kiểm tra ở các điểm xa điểm gãy, hoặc trên đầu vào mà phía hoạt động đã biết.
4. **Các phần ngẫu nhiên.** Dropout hoặc một thứ tự dữ liệu ngẫu nhiên giữa hai lần đánh giá loss thay đổi loss vì một lý do khác h. Cố định seed và chạy trong chế độ đánh giá.
5. **Một mẫu số sai.** Chỉ chia cho giá trị giải tích làm kết quả bùng lên khi nó gần không. Dùng giá trị lớn nhất của cả hai độ lớn với một ngưỡng sàn.

### Then look at the backward pass

Với một kiểm tra đáng tin cậy, một sai số 1e-3 ổn định là một bug. Kiểm tra một nhóm tham số mỗi lần để tìm lớp, và so sánh đạo hàm cục bộ của mỗi phép toán với công thức của nó. Engine của bài học autodiff so sánh mỗi phép toán mới với một sai phân hữu hạn như một phần của việc thêm nó, là thói quen ngăn tình huống này.

## Follow-ups

- **Level 3:** Tại sao ưu tiên công thức hai phía hơn một phía? Expected: sai số của nó giảm theo h bình phương thay vì h, nên một h vừa phải cho một ước lượng gần mà không có triệt tiêu.
- **Level 3:** Tại sao không chạy kiểm tra trên mọi bước huấn luyện production? Expected: nó cần hai lượt forward cho mỗi tham số, nên quá chậm; nó thuộc về unit test và gỡ lỗi.
- **Level 4:** Sai số rất nhỏ cho phần lớn trọng số và lớn cho một vài trọng số trong một lớp. Mẫu đó nói gì? Expected: lượt backward của lớp đúng nói chung và sai trên một đường, chẳng hạn một đầu vào dùng chung có các đóng góp bị ghi đè thay vì cộng, hoặc một điểm gãy tại các trọng số đó.
- **Level 4:** Bạn kiểm tra một lớp chứa một mask ngẫu nhiên như thế nào? Expected: cố định seed để cả hai lần đánh giá loss dùng cùng mask, hoặc chạy kiểm tra trong chế độ đánh giá nơi mask tắt.

## Wrong answers

- "Làm h nhỏ nhất có thể để có đạo hàm chính xác nhất." Dưới mức làm tròn, phép trừ triệt tiêu và kết quả là nhiễu. Có một ngưỡng sàn cho h, khoảng 1e-7 trong float64.
- "Một sai số tương đối 1e-3 là đủ gần, triển khai đi." Bài học đặt 1e-3 ở ranh giới bug. Một sai số ổn định ở đó có nghĩa một gradient sai sẽ làm chậm hoặc làm hỏng huấn luyện.
- "Dùng chênh lệch tuyệt đối thay vì tương đối." Một gradient lớn và một gradient rất nhỏ cần các dung sai khác nhau. Sai số tương đối với một mẫu số có ngưỡng sàn xử lý cả hai.

## Taught in

[Bài học tính ổn định số](../../../phases/01-math-foundations/13-numerical-stability/) đưa ra sai phân trung tâm, sai số tương đối và các ngưỡng của nó, và [bài học quy tắc chuỗi và autodiff](../../../phases/01-math-foundations/05-chain-rule-and-autodiff/) tích hợp kiểm tra vào engine.
