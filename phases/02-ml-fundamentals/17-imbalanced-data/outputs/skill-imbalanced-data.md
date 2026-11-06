---
name: skill-imbalanced-data
description: Decision checklist for handling imbalanced classification problems
version: 1.0.0
phase: 2
lesson: 17
tags: [imbalanced-data, smote, class-weights, threshold-tuning, evaluation]
---

# Imbalanced Data Strategy

Một danh sách kiểm tra quyết định để xử lý phân loại mất cân bằng. Tuân theo trình tự này để chọn cách tiếp cận phù hợp cho bài toán của bạn.

## Step 1: Measure the imbalance

- Đếm số mẫu mỗi lớp
- Tính tỷ lệ mất cân bằng (đa số / thiểu số)
- Nhẹ: tỷ lệ < 3:1 (ví dụ: 70/30)
- Vừa phải: tỷ lệ từ 3:1 đến 20:1 (ví dụ: 95/5)
- Nghiêm trọng: tỷ lệ > 20:1 (ví dụ: 99/1)

## Step 2: Pick the right metric

Ưu tiên precision/recall/F1 hơn accuracy đối với các tập dữ liệu mất cân bằng. Chọn dựa trên bài toán của bạn:

| Tình huống | Thước đo chính | Thước đo phụ |
|-----------|---------------|-----------------|
| Bỏ sót dương tính rất tốn kém (gian lận, bệnh) | Recall | Điểm F2 |
| Báo động giả tốn kém (bộ lọc thư rác, gợi ý) | Precision | Điểm F0.5 |
| Cả hai quan trọng gần như nhau | Điểm F1 | MCC |
| Cần một thước đo xếp hạng duy nhất | AUPRC | AUC-ROC |
| Cần so sánh giữa các tập dữ liệu | MCC | AUPRC |

## Step 3: Choose a rebalancing strategy

### By imbalance severity

| Mất cân bằng | Thử đầu tiên | Thử thứ hai | Tránh |
|-----------|-----------|------------|-------|
| Nhẹ (< 3:1) | Trọng số lớp | Điều chỉnh ngưỡng | Lấy mẫu tăng cường (không cần thiết) |
| Vừa phải (3:1 đến 20:1) | SMOTE + trọng số lớp | Điều chỉnh ngưỡng thêm vào | Lấy mẫu giảm (mất quá nhiều dữ liệu) |
| Nghiêm trọng (> 20:1) | SMOTE + trọng số lớp + ngưỡng | Ensemble với bagging cân bằng | Chỉ lấy mẫu giảm |

### By dataset size

| Kích thước tập dữ liệu | Chiến lược ưu tiên | Lý do |
|-------------|-------------------|--------|
| < 1,000 mẫu | Lấy mẫu tăng cường hoặc SMOTE | Không thể chấp nhận mất dữ liệu đa số |
| 1,000 - 10,000 | SMOTE + điều chỉnh ngưỡng | Đủ mẫu thiểu số cho k-NN |
| > 10,000 | Trọng số lớp hoặc lấy mẫu giảm | Nhanh, đủ dữ liệu thiểu số |

## Step 4: Apply the technique

### Class weights (always try first)
- Trong sklearn: `class_weight='balanced'`
- Không cần sửa đổi dữ liệu
- Hoạt động với mọi mô hình dựa trên hàm mất mát
- Tương đương với lấy mẫu tăng cường theo kỳ vọng

### SMOTE
- Chỉ áp dụng cho dữ liệu huấn luyện (không bao giờ cho test/validation)
- Sử dụng k=5 láng giềng (mặc định)
- Kết hợp với trọng số lớp để có kết quả tốt nhất
- Chú ý các điểm tổng hợp nhiễu gần ranh giới

### Threshold tuning
- Huấn luyện mô hình, lấy các xác suất dự đoán trên tập validation
- Quét các ngưỡng từ 0.05 đến 0.95
- Chọn ngưỡng tối đa hóa thước đo bạn đã chọn
- Luôn điều chỉnh trên dữ liệu validation, không bao giờ trên dữ liệu test

## Step 5: Validate properly

- Sử dụng kiểm định chéo phân tầng (giữ nguyên tỷ lệ lớp trong mỗi fold)
- Báo cáo các thước đo trên tập test gốc (không được lấy mẫu lại)
- Không bao giờ áp dụng SMOTE trước khi chia -- chỉ trên các fold huấn luyện
- So sánh với đường cơ sở "luôn dự đoán đa số"

## Step 6: Common mistakes to avoid

- Áp dụng SMOTE cho toàn bộ tập dữ liệu trước khi chia train/test (rò rỉ dữ liệu)
- Sử dụng accuracy làm thước đo đánh giá
- Không thử trọng số lớp trước (cách tiếp cận đơn giản nhất, thường là đủ)
- Lấy mẫu tăng cường rồi mới kiểm định chéo (các điểm tổng hợp rò rỉ giữa các fold)
- Bỏ qua điều chỉnh ngưỡng (hiệu suất có được miễn phí, không cần huấn luyện lại)
- Sử dụng lấy mẫu giảm ngẫu nhiên trên các tập dữ liệu nhỏ (loại bỏ quá nhiều dữ liệu)

## Quick Decision Tree

1. Tỷ lệ mất cân bằng < 3:1? -> Chỉ thử trọng số lớp
2. Tập dữ liệu > 10,000 mẫu? -> Trọng số lớp + điều chỉnh ngưỡng
3. Tập dữ liệu < 1,000 mẫu? -> SMOTE + trọng số lớp
4. Nếu không -> SMOTE + trọng số lớp + điều chỉnh ngưỡng
5. Vẫn chưa đủ tốt? -> Ensemble bagging cân bằng
