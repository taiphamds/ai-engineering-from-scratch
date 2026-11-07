---
id: scaler-fit-before-split
title: A test score that production never reaches
card: math-classical-ml
kind: debug
level: 2
roles: [ai-data-engineer, ai-evaluation-reliability-engineer, applied-ai-engineer]
rounds: [debugging, ml-breadth]
tags: [data-leakage, train-test-split, cross-validation, preprocessing]
minutes: 8
lessons: [phases/02-ml-fundamentals/09-model-evaluation]
manuals: []
practice: []
cheatsheet: [classical-ml]
related: [math-classical-ml/negative-r-squared, math-classical-ml/compare-two-models-with-folds]
updated: 2026-11-03
---

Một đồng đội chuẩn hóa toàn bộ bảng bằng một scaler, rồi chia nó thành các hàng huấn luyện, validation và kiểm thử, và báo cáo một điểm kiểm thử. Trong production, điểm thấp hơn nhiều con số đó. Nêu lỗi trong pipeline và mô tả một thiết lập nơi con số kiểm thử dự đoán production.

## Short answer

Scaler đã thấy các hàng kiểm thử, nên trung bình và độ lệch chuẩn mang thông tin từ tập kiểm thử vào huấn luyện. Đó là data leakage, và nó khiến điểm được báo cáo lạc quan. Chia trước, chỉ khớp mọi bước tiền xử lý trên các hàng huấn luyện, và áp dụng phép biến đổi đã khớp cho hai tập còn lại.

## Full answer

### What leaked

Chuẩn hóa trừ một trung bình và chia cho một độ lệch chuẩn. Cả hai là các thống kê của những hàng scaler đã thấy. Khi các hàng đó bao gồm tập kiểm thử, dữ liệu huấn luyện đã được định hình bởi dữ liệu kiểm thử. Bài học đánh giá nêu đây là ví dụ đầu tiên về leakage, cạnh hai ví dụ khác ẩn sau cùng thói quen: các hàng tương lai trong một chuỗi thời gian đã được xáo trộn trước phép chia, và một đặc trưng được tính từ mục tiêu.

### The three sets and their jobs

| Tập | Tỷ phần | Công việc |
|---|---|---|
| Huấn luyện | 60-70 phần trăm | mô hình khớp các hàng này |
| Validation | 15-20 phần trăm | chọn các siêu tham số và mô hình |
| Kiểm thử | 15-20 phần trăm | báo cáo điểm cuối cùng, một lần |

Tập kiểm thử là một bảo đảm giữ lại. Sau khi bạn xem điểm của nó và thay đổi mô hình, nó là một tập validation thứ hai, và điểm của nó không còn dự đoán dữ liệu chưa thấy.

### A pipeline that holds

1. Chia trước khi bất kỳ thống kê nào được tính. Với một chuỗi thời gian, chia theo thời gian.
2. Khớp scaler, encoder và bất kỳ phép điền thiếu nào trên các hàng huấn luyện. Biến đổi các hàng khác bằng những giá trị đã khớp đó.
3. Trong cross-validation, lặp việc khớp bên trong mỗi fold huấn luyện. Một phép biến đổi được khớp trên tất cả hàng trước các fold làm rò rỉ qua mọi fold.
4. Dùng một phép chia phân tầng khi các lớp mất cân bằng, để mỗi fold giữ tỷ lệ lớp.
5. Kiểm tra các hàng trùng lặp giữa các phần chia.
6. Chạm tập kiểm thử một lần, ở cuối.

## Follow-ups

- **Level 2:** Cùng lỗi xuất hiện bên trong k-fold cross-validation như thế nào? Expected: một phép biến đổi được khớp trên tất cả hàng trước các fold làm rò rỉ qua mọi fold; khớp nó bên trong mỗi fold huấn luyện.
- **Level 2:** Tại sao đọc điểm kiểm thử nhiều lần cũng làm tăng nó? Expected: mỗi thay đổi sau một lần xem khớp tập kiểm thử, nên nó trở thành một tập validation thứ hai.
- **Level 3:** Dữ liệu có một trục thời gian. Điều gì thay đổi trong phép chia? Expected: chia theo thời gian, để mô hình không bao giờ huấn luyện trên các hàng sau những hàng nó dự đoán; một phép chia xáo trộn đưa các hàng tương lai vào huấn luyện.
- **Level 4:** Bạn tinh chỉnh các siêu tham số và vẫn báo cáo một con số trung thực như thế nào? Expected: cross-validation lồng nhau với một vòng trong cho tinh chỉnh và một vòng ngoài cho ước lượng, hoặc một tập validation cho tinh chỉnh và một tập kiểm thử dùng một lần.

## Wrong answers

- "Scaling là một phép biến đổi vô hại, nên thứ tự không quan trọng." Trung bình và độ lệch chuẩn là các thống kê của dữ liệu. Khớp chúng trên các hàng kiểm thử chuyển thông tin kiểm thử vào huấn luyện.
- "Một rò rỉ nhỏ như vậy không thể thay đổi điểm nhiều." Độ lớn chưa biết đến khi bạn loại bỏ nó, và các rò rỉ khác, chẳng hạn một đặc trưng suy ra từ mục tiêu, ẩn sau cùng thói quen.
- "Chạy tập kiểm thử sau mỗi thay đổi cho chắc." Mỗi lần xem và thay đổi khớp tập kiểm thử, và con số ngừng dự đoán production.

## Taught in

[Bài học đánh giá mô hình](../../../phases/02-ml-fundamentals/09-model-evaluation/) liệt kê các sai lầm đánh giá phổ biến và xây dựng các phần chia và các fold từ đầu.
