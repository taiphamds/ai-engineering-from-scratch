---
name: skill-debug-checklist
description: Decision-tree checklist for debugging neural network training failures
version: 1.0.0
phase: 3
lesson: 13
tags: [debugging, neural-networks, training, diagnostics, deep-learning]
---

# Neural Network Debug Checklist

Quy trình gỡ lỗi có hệ thống khi huấn luyện gặp vấn đề. Thực hiện những bước này theo thứ tự -- hầu hết các lỗi được phát hiện trong 3 bước đầu.

## Before training (prevent bugs)

1. In kiến trúc mô hình và số tham số. Kích thước có hợp lý với dữ liệu của bạn không?
2. Chạy một lượt truyền xuôi với đầu vào ngẫu nhiên. Hình dạng đầu ra có khớp hình dạng mục tiêu của bạn không?
3. Kiểm tra các nhãn có dtype đúng (CrossEntropyLoss cần Long, BCELoss cần Float)
4. Xác minh chuẩn hóa dữ liệu: các đầu vào nên có trung bình gần 0 và độ lệch chuẩn gần 1
5. In 5 cặp (đầu vào, nhãn) ngẫu nhiên. Các nhãn có khớp điều bạn kỳ vọng không?
6. Xác nhận tập chia huấn luyện/test không có các mẫu trùng lặp

## Overfit-one-batch test (60 seconds, catches 80% of bugs)

1. Lấy 8-32 mẫu từ tập huấn luyện của bạn
2. Huấn luyện trong 200 bước với một tốc độ học hợp lý
3. Mất mát nên tiến tới 0. Accuracy huấn luyện nên đạt 100%
4. Nếu thất bại: lỗi nằm trong mô hình, hàm mất mát hoặc vòng lặp huấn luyện -- không phải dữ liệu hay siêu tham số của bạn
5. Nếu vượt qua: tiếp tục huấn luyện đầy đủ

## Loss not decreasing

1. Kiểm tra tốc độ học. Thử 3 giá trị: hiện tại/10, hiện tại, hiện tại*10
2. In các chuẩn gradient theo từng lớp. Tất cả bằng không nghĩa là mạng chết hoặc đồ thị bị tách
3. Kiểm tra `requires_grad=True` trên các tham số. Kiểm tra `loss.backward()` được gọi
4. Kiểm tra `optimizer.zero_grad()` được gọi trước `loss.backward()`
5. Kiểm tra `optimizer.step()` được gọi sau `loss.backward()`
6. Xác minh các tham số mô hình được truyền tới bộ tối ưu hóa: `optimizer = Adam(model.parameters())`

## Loss is NaN or Inf

1. Giảm tốc độ học 10 lần
2. Thêm epsilon vào tất cả lời gọi log(): `torch.log(x + 1e-7)`
3. Thêm epsilon vào tất cả phép chia: `x / (y + 1e-8)`
4. Chặn các dự đoán: `torch.clamp(pred, 1e-7, 1 - 1e-7)` trước mất mát BCE
5. Sử dụng `torch.autograd.detect_anomaly()` để tìm phép toán chính xác
6. Kiểm tra NaN trong dữ liệu đầu vào: `assert not torch.isnan(x).any()`

## Loss oscillating

1. Giảm tốc độ học 3-10 lần
2. Tăng kích thước batch (giảm nhiễu gradient)
3. Thêm cắt gradient: `torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)`
4. Chuyển từ SGD sang Adam (LR thích nghi theo tham số)
5. Thêm warmup tốc độ học cho 5-10% huấn luyện đầu tiên

## Overfitting (train acc high, test acc low)

1. Thêm dropout (bắt đầu với p=0.1, tăng tới 0.5)
2. Thêm weight decay vào bộ tối ưu hóa: `Adam(params, weight_decay=1e-4)`
3. Giảm kích thước mô hình (ít lớp hơn hoặc các lớp hẹp hơn)
4. Thêm tăng cường dữ liệu
5. Sử dụng dừng sớm: dừng khi mất mát validation tăng trong 5+ epoch
6. Kiểm tra rò rỉ dữ liệu giữa các tập huấn luyện và test

## Underfitting (both train and test acc low)

1. Tăng năng lực mô hình (nhiều lớp hơn, các lớp rộng hơn)
2. Huấn luyện nhiều epoch hơn
3. Tăng tốc độ học (cẩn thận)
4. Tạm thời loại bỏ chính quy hóa để xác minh mô hình có thể học
5. Kiểm tra mô hình của bạn có đủ khả năng biểu đạt cho tác vụ

## Dead ReLU neurons

1. Kiểm tra tỷ lệ kích hoạt bằng không theo từng lớp. >50% là một vấn đề
2. Chuyển sang LeakyReLU(0.01) hoặc GELU
3. Sử dụng khởi tạo Kaiming cho các trọng số
4. Giảm tốc độ học (các cập nhật lớn có thể đẩy các nơ-ron vào vùng chết)
5. Thêm batch normalization trước các hàm kích hoạt

## Quick reference: learning rate starting points

| Bộ tối ưu hóa | Tác vụ | LR ban đầu |
|-----------|------|------------|
| Adam | Huấn luyện từ đầu | 1e-3 |
| Adam | Tinh chỉnh mô hình được tiền huấn luyện | 1e-5 |
| SGD + momentum | Huấn luyện từ đầu | 1e-1 |
| SGD + momentum | Tinh chỉnh mô hình được tiền huấn luyện | 1e-3 |
| AdamW | Huấn luyện transformer | 3e-4 |

## Quick reference: batch size effects

| Kích thước batch | Nhiễu gradient | Bộ nhớ | Khái quát hóa |
|-----------|---------------|--------|---------------|
| 8-16 | Cao (nhiễu) | Thấp | Thường tốt hơn |
| 32-64 | Vừa phải | Vừa phải | Mặc định tốt |
| 128-256 | Thấp (trơn) | Cao | Có thể cần warmup |
| 512+ | Rất thấp | Rất cao | Cần co giãn LR |

## When nothing works

1. Đơn giản hóa mô hình còn 1 lớp ẩn. Nó có học không?
2. Đơn giản hóa dữ liệu còn 100 mẫu. Nó có quá khớp không?
3. Thay mất mát của bạn bằng MSE. Nó có hội tụ không?
4. Thay bộ tối ưu hóa của bạn bằng SGD(lr=0.01). Nó có tiến triển không?
5. Thay dữ liệu của bạn bằng dữ liệu tổng hợp (ví dụ: y = x[0] > 0). Nó có học không?
6. Nếu không cách nào hoạt động: lỗi nằm trong mã bạn không nhìn vào (tải dữ liệu, tiền xử lý, các hình dạng tensor)
