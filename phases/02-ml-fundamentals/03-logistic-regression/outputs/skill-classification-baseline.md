---
name: skill-classification-baseline
description: Establish a strong classification baseline before reaching for complex models
version: 1.0.0
phase: 2
lesson: 3
tags: [classification, logistic-regression, baseline, preprocessing]
---

# Classification Baseline Guide

Trước khi thử các mô hình phức tạp, thiết lập một mốc cơ sở bằng hồi quy logistic. Nó huấn luyện trong vài giây, tạo ra xác suất và có thể diễn giải hoàn toàn. Một số lượng đáng ngạc nhiên các bài toán thực tế không bao giờ cần thứ gì cầu kỳ hơn.

## Decision Checklist

1. Biên quyết định có khả năng tuyến tính không?
   - Có: hồi quy logistic có lẽ sẽ đủ
   - Không: bạn vẫn muốn nó làm mốc cơ sở để đo cải thiện

2. Bạn có bao nhiêu đặc trưng?
   - Dưới 50: hồi quy logistic tiêu chuẩn hoạt động tốt
   - 50 đến 10,000: thêm L2 regularization (Ridge)
   - Trên 10,000 (ví dụ, các đặc trưng văn bản TF-IDF): sử dụng L1 regularization (Lasso) hoặc LinearSVC

3. Tập dữ liệu có mất cân bằng không?
   - Tỉ lệ dưới 5:1: có lẽ ổn mà không cần điều chỉnh
   - 5:1 đến 50:1: sử dụng `class_weight="balanced"` trong sklearn
   - Trên 50:1: kết hợp trọng số lớp với chỉ số thích hợp (precision, recall hoặc F1)

4. Các đặc trưng có các thang đo khác nhau không?
   - Luôn chuẩn hóa trước hồi quy logistic. Nó sử dụng tối ưu hóa dựa trên gradient, và các đặc trưng chưa co giãn làm chậm hội tụ hoặc làm méo biên quyết định.

5. Có giá trị thiếu không?
   - Điền khuyết trước khi khớp. Hồi quy logistic không thể xử lý NaN.
   - Sử dụng điền khuyết trung vị cho các cột số, mốt cho các cột phân loại.

## When logistic regression is good enough

- Phân loại nhị phân với các quan hệ đặc trưng phần lớn tuyến tính
- Bạn cần các đầu ra xác suất (không chỉ nhãn lớp)
- Khả năng diễn giải là bắt buộc (các hệ số cho biết hướng độ quan trọng đặc trưng và độ lớn tương đối sau chuẩn hóa)
- Dữ liệu huấn luyện nhỏ (hàng trăm đến vài nghìn mẫu)
- Bạn cần một mô hình nhanh để phục vụ theo thời gian thực (một tích vô hướng duy nhất lúc suy luận)
- Các yêu cầu quản lý hoặc tuân thủ đòi hỏi khả năng giải thích

## When to upgrade

- Độ chính xác chững lại thấp hơn mục tiêu nhiều và bạn đã thử kỹ thuật đặc trưng
- Quan hệ giữa đặc trưng và mục tiêu rõ ràng phi tuyến (kiểm tra các đồ thị phần dư)
- Bạn có dữ liệu dạng bảng lớn (10k+ hàng): thử gradient boosting (XGBoost hoặc LightGBM)
- Các đặc trưng có các tương tác phức tạp mà các đặc trưng đa thức không thể nắm bắt
- Bạn có dữ liệu hình ảnh, văn bản hoặc tuần tự: hồi quy logistic trên đầu vào thô sẽ không hoạt động

## Preprocessing steps for a classification baseline

1. **Chia huấn luyện/kiểm tra** trước, trước bất kỳ tiền xử lý nào. Điều này ngăn rò rỉ dữ liệu.
2. **Xử lý các giá trị thiếu**: điền khuyết trung vị cho số, điền khuyết mốt cho phân loại.
3. **Mã hóa các biến phân loại**: one-hot cho số giá trị phân biệt thấp (dưới 10 giá trị), mã hóa mục tiêu cho mức cao hơn. Chỉ khớp mã hóa mục tiêu trên các fold huấn luyện (sử dụng mã hóa ngoài fold để ngăn rò rỉ).
4. **Co giãn các biến số**: StandardScaler (trung bình không, phương sai đơn vị). Khớp trên huấn luyện, biến đổi cả hai.
5. **Khớp hồi quy logistic** với `C=1.0` (regularization mặc định).
6. **Đánh giá**: ma trận nhầm lẫn, precision, recall, F1. Không chỉ accuracy.
7. **Điều chỉnh ngưỡng**: mặc định 0.5 hiếm khi tối ưu. Quét từ 0.1 đến 0.9 và chọn ngưỡng khớp ưu tiên precision/recall của bạn.

## Common mistakes

- Chỉ đánh giá accuracy trên dữ liệu mất cân bằng (một mô hình dự đoán lớp đa số đạt điểm cao nhưng vô ích)
- Quên co giãn đặc trưng (hồi quy logistic với các đặc trưng chưa co giãn huấn luyện chậm và hội tụ về một nghiệm kém hơn)
- Sử dụng tập kiểm tra để điều chỉnh ngưỡng quyết định (sử dụng xác thực hoặc xác thực chéo)
- Bỏ qua mốc cơ sở và nhảy thẳng đến XGBoost (bạn mất khả năng diễn giải và không có điểm tham chiếu)
- Không kiểm tra đa cộng tuyến (các đặc trưng tương quan cao làm tăng phương sai hệ số)

## Quick reference

| Tình huống | Mô hình | Regularization | Thiết lập chính |
|----------|-------|---------------|-------------|
| Ít đặc trưng, có thể diễn giải | LogisticRegression | L2 (mặc định) | C=1.0 |
| Nhiều đặc trưng, một số không liên quan | LogisticRegression | L1 | penalty="l1", solver="saga" |
| Thưa nhiều chiều (văn bản) | SGDClassifier | L1 hoặc ElasticNet | loss="log_loss" |
| Các lớp mất cân bằng | LogisticRegression | L2 | class_weight="balanced" |
| Cần xác suất | LogisticRegression | L2 | predict_proba() |
| Chỉ cần nhãn lớp | LinearSVC | L2 | Nhanh hơn LR với dữ liệu lớn |
