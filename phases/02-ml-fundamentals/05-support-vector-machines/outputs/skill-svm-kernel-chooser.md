---
name: skill-svm-kernel-chooser
description: Choose the right SVM kernel and tune C and gamma for your problem
version: 1.0.0
phase: 2
lesson: 5
tags: [svm, kernel, classification, hyperparameter-tuning]
---

# SVM Kernel Selection Guide

SVM được xác định bởi hai lựa chọn: kernel (quyết định hình dạng của biên quyết định) và các tham số regularization (điều khiển sự đánh đổi giữa độ rộng lề và các lỗi phân loại). Chọn đúng chúng là sự khác biệt giữa một mô hình vô ích và một mô hình mạnh.

## Decision Checklist

1. Dữ liệu có phân tách tuyến tính được không (hoặc gần như vậy)?
   - Có: sử dụng kernel tuyến tính. Nó nhanh hơn và có thể diễn giải hơn.
   - Không: đến bước 2.

2. Bao nhiêu đặc trưng so với mẫu?
   - Đặc trưng >> mẫu (ví dụ, văn bản với TF-IDF): sử dụng kernel tuyến tính. Dữ liệu nhiều chiều thường phân tách tuyến tính được. RBF thêm độ phức tạp mà không có lợi ích.
   - Mẫu >> đặc trưng (ví dụ, dữ liệu dạng bảng có 10-50 đặc trưng): kernel RBF là lựa chọn mặc định.

3. Biên quyết định có được kỳ vọng là trơn không?
   - Biên trơn, liên tục: kernel RBF
   - Biên có dạng đa thức: kernel đa thức (bắt đầu với bậc 2 hoặc 3)
   - Kiến thức chuyên môn gợi ý các số hạng tương tác cụ thể: kernel đa thức với bậc tương ứng

4. Tập dữ liệu lớn đến mức nào?
   - Dưới 10,000 mẫu: bất kỳ kernel nào cũng hoạt động, RBF là mặc định an toàn
   - 10,000 đến 100,000: kernel tuyến tính hoặc LinearSVC (dạng bài toán gốc, O(n) mỗi epoch)
   - Trên 100,000: không sử dụng SVM kernel. Chuyển sang SVM tuyến tính, gradient boosting hoặc mạng nơ-ron.

5. Bạn đã co giãn các đặc trưng chưa?
   - SVM đòi hỏi co giãn đặc trưng. Luôn chuẩn hóa (trung bình không, phương sai đơn vị) trước khi khớp. Các đặc trưng chưa co giãn làm méo hình học lề.

## Kernel selection flowchart

```
Start
  |
  v
Features > 1000 or features >> samples?
  Yes --> Linear kernel (LinearSVC for speed)
  No  --> Dataset < 10k samples?
            Yes --> Try RBF first (best general-purpose kernel)
            No  --> Linear kernel (kernel SVMs are O(n^2) to O(n^3))
```

Nếu RBF không hoạt động tốt, thử đa thức bậc 2-3. Nếu cách đó thất bại, bài toán có thể không phù hợp với SVM.

## Tuning C (regularization)

C điều khiển hình phạt cho các phân loại sai. Nó có quan hệ nghịch với cường độ regularization.

| Giá trị C | Tác động | Khi nào sử dụng |
|---------|--------|-------------|
| 0.001 - 0.01 | Lề rộng, cho phép nhiều vi phạm | Dữ liệu nhiễu, muốn tổng quát hóa |
| 0.1 - 1.0 | Cân bằng | Khoảng bắt đầu tốt |
| 10 - 1000 | Lề hẹp, ít vi phạm | Dữ liệu sạch, cần độ chính xác cao |

Chiến lược điều chỉnh:
- Bắt đầu với C=1.0
- Tìm kiếm trên thang log: [0.001, 0.01, 0.1, 1, 10, 100, 1000]
- Sử dụng xác thực chéo để chọn giá trị tốt nhất
- Nếu C tốt nhất ở rìa khoảng của bạn, mở rộng khoảng theo hướng đó

## Tuning gamma (RBF kernel)

Gamma điều khiển ảnh hưởng của một điểm huấn luyện duy nhất vươn xa đến đâu. Nó xác định độ rộng của Gaussian.

| Giá trị gamma | Tác động | Khi nào sử dụng |
|-------------|--------|-------------|
| Nhỏ (0.001) | Mỗi điểm ảnh hưởng một vùng lớn. Biên trơn, đơn giản | Khớp chưa đủ hoặc ít đặc trưng |
| Trung bình (auto: 1/n_features) | Mặc định sklearn. Điểm bắt đầu hợp lý | Sử dụng chung |
| Lớn (10+) | Mỗi điểm chỉ ảnh hưởng các điểm gần đó. Biên phức tạp, ngoằn ngoèo | Nguy cơ khớp quá mức |

Chiến lược điều chỉnh:
- Bắt đầu với gamma="scale" (1 / (n_features * X.var()), mặc định sklearn)
- Tìm kiếm trên thang log: [0.001, 0.01, 0.1, 1, 10]
- Gamma thấp + C cao có xu hướng khớp quá mức
- Gamma cao + C thấp có xu hướng khớp chưa đủ

## Joint C and gamma tuning

C và gamma tương tác. Luôn điều chỉnh chúng cùng nhau, không độc lập.

Cách tiếp cận được đề xuất:
1. Tìm kiếm lưới thô: C trong [0.01, 0.1, 1, 10, 100], gamma trong [0.001, 0.01, 0.1, 1, 10] (25 tổ hợp)
2. Tìm vùng tốt nhất
3. Tìm kiếm lưới tinh quanh vùng tốt nhất (ví dụ, C trong [5, 10, 20, 50], gamma trong [0.05, 0.1, 0.2])
4. Sử dụng xác thực chéo 5-fold xuyên suốt

## Common mistakes

- Sử dụng kernel RBF trên dữ liệu thưa nhiều chiều (tuyến tính tốt hơn và nhanh hơn 100 lần)
- Quên co giãn đặc trưng (lỗi SVM phổ biến nhất)
- Đặt C quá cao trên dữ liệu nhiễu (ghi nhớ nhiễu thay vì học biên)
- Sử dụng SVM kernel trên các tập dữ liệu trên 50k mẫu (thời gian huấn luyện quá lớn)
- Không điều chỉnh C và gamma cùng nhau (chúng bù cho nhau)
- Mặc định đa thức bậc 5+ (khớp quá mức mạnh, thử 2 hoặc 3 trước)

## Quick reference

| Kernel | Khi nào sử dụng | Các tham số chính | Độ phức tạp huấn luyện |
|--------|------------|----------------|-------------------|
| Tuyến tính | Văn bản/TF-IDF, nhiều đặc trưng, dữ liệu lớn | Chỉ C | O(n) mỗi epoch |
| RBF | Mục đích chung, dưới 10k mẫu | C, gamma | O(n^2) đến O(n^3) |
| Đa thức | Các quan hệ đa thức đã biết | C, degree, coef0 | O(n^2) đến O(n^3) |
| Sigmoid | Hiếm khi hữu ích (tương đương mạng nơ-ron hai lớp) | C, gamma, coef0 | O(n^2) đến O(n^3) |
