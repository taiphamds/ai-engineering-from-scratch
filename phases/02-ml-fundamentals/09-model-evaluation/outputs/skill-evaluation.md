---
name: skill-evaluation
description: Evaluation strategy checklist for classification and regression models
version: 1.0.0
phase: 2
lesson: 9
tags: [evaluation, metrics, cross-validation, model-selection]
---

# Model Evaluation Strategy

Một danh sách kiểm tra để đánh giá đúng bất kỳ mô hình ML nào. Tuân theo trình tự này để tránh các lỗi đánh giá phổ biến nhất.

## Step 1: Split the data correctly

- Chia trước bất kỳ tiền xử lý nào (co giãn, điền khuyết, mã hóa)
- Sử dụng các phần chia phân tầng cho các tác vụ phân loại
- Dành riêng một tập kiểm tra mà bạn dùng đúng một lần vào cuối
- Với các tập dữ liệu nhỏ, sử dụng xác thực chéo 5-fold hoặc 10-fold thay vì một lần chia
- Với chuỗi thời gian, sử dụng các phần chia theo thời gian (không bao giờ xáo trộn)

## Step 2: Pick the right metric

### Classification

| Tình huống | Sử dụng chỉ số này | Lý do |
|-----------|----------------|-----|
| Các lớp cân bằng, so sánh đơn giản | Accuracy | Dễ diễn giải, có ý nghĩa khi các lớp bằng nhau |
| Dương tính giả tốn kém (bộ lọc thư rác, cảnh báo gian lận) | Precision | Đo bao nhiêu mục được đánh dấu thực sự dương |
| Âm tính giả tốn kém (sàng lọc ung thư, bảo mật) | Recall | Đo bao nhiêu trường hợp thực sự dương bạn phát hiện |
| Cần cân bằng precision và recall | Điểm F1 | Trung bình điều hòa, phạt mất cân bằng cực đoan |
| So sánh các mô hình trên các ngưỡng | AUC-ROC | Chất lượng xếp hạng độc lập với ngưỡng |
| Dữ liệu mất cân bằng | F1, AUC-ROC hoặc PR-AUC | Accuracy gây hiểu lầm với các lớp mất cân bằng |

### Regression

| Tình huống | Sử dụng chỉ số này | Lý do |
|-----------|----------------|-----|
| Hồi quy tiêu chuẩn, chấp nhận ngoại lệ | RMSE | Cùng đơn vị với mục tiêu, phạt sai số lớn |
| Đánh giá bền vững với ngoại lệ | MAE | Xử lý mọi sai số như nhau, không bị ngoại lệ chi phối |
| So sánh các mô hình trên các thang đo khác nhau | R-bình phương | Thang chuẩn hóa 0-1 (phần phương sai được giải thích) |
| Kinh doanh yêu cầu số tiền đô la | MAE hoặc RMSE | Có thể diễn giải trực tiếp thành độ lớn sai số |

## Step 3: Establish baselines

Trước khi đánh giá mô hình, tính hiệu năng mốc cơ sở:
- Phân loại: bộ dự đoán lớp đa số (luôn dự đoán lớp phổ biến nhất)
- Hồi quy: luôn dự đoán trung bình của mục tiêu huấn luyện
- Bất kỳ mô hình nào không thể vượt các mốc cơ sở này đều không học

## Step 4: Cross-validate

- Sử dụng K-fold (K=5 hoặc K=10) để có các ước lượng ổn định
- Sử dụng K-fold phân tầng cho phân loại
- Báo cáo trung bình và độ lệch chuẩn trên các fold
- Một mô hình có mean=0.85 và std=0.02 đáng tin cậy hơn mean=0.87 và std=0.10

## Step 5: Compare models statistically

- Không chọn mô hình có điểm trung bình cao nhất mà không kiểm tra ý nghĩa thống kê
- Sử dụng t-test ghép cặp trên các fold xác thực chéo
- Nếu |t| < 2.78 (với K=5, df=4, p<0.05), khác biệt có thể do ngẫu nhiên
- Cân nhắc mô hình đơn giản hơn khi các khác biệt hiệu năng không có ý nghĩa thống kê

## Step 6: Check for common mistakes

- Rò rỉ dữ liệu: có thông tin dữ liệu kiểm tra nào đi vào huấn luyện không? (co giãn trước khi chia, các đặc trưng suy ra từ mục tiêu)
- Mất cân bằng lớp: accuracy có đang che giấu hiệu năng kém trên lớp thiểu số không?
- Khớp quá mức: khoảng cách hiệu năng huấn luyện và xác thực có lớn không?
- Quá nhiều lần đánh giá: bạn đã nhìn tập kiểm tra nhiều hơn một lần chưa?

## Step 7: Report final performance

- Huấn luyện trên huấn luyện + xác thực kết hợp
- Đánh giá trên tập kiểm tra giữ riêng đúng một lần
- Báo cáo chỉ số đã chọn với các khoảng tin cậy nếu có thể
- Nêu so sánh với mốc cơ sở (tốt hơn ngẫu nhiên/trung bình bao nhiêu)
