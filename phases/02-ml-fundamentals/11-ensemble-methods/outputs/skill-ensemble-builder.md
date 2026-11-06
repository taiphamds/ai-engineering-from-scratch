---
name: skill-ensemble-builder
description: Choose the right ensemble method and configure it for your problem
version: 1.0.0
phase: 2
lesson: 11
tags: [ensemble, bagging, boosting, random-forest, xgboost, stacking]
---

# Ensemble Method Selection Guide

Các tập hợp kết hợp nhiều mô hình để tạo các dự đoán tốt hơn bất kỳ mô hình đơn lẻ nào. Câu hỏi luôn là: loại tập hợp nào và khi nào?

## Decision Checklist

1. Vấn đề chính với mô hình hiện tại của bạn là gì?
   - Phương sai cao (khớp quá mức): sử dụng bagging (Rừng Ngẫu nhiên)
   - Độ chệch cao (khớp chưa đủ): sử dụng boosting (Gradient Boosting, XGBoost)
   - Cả hai, hoặc bạn muốn độ chính xác tối đa: sử dụng stacking

2. Bạn có bao nhiêu dữ liệu?
   - Dưới 1,000 hàng: Rừng Ngẫu nhiên (bền vững, khó cấu hình sai)
   - 1,000 đến 100,000: XGBoost hoặc LightGBM (tốt nhất tổng thể cho dạng bảng)
   - Trên 100,000: LightGBM (gradient boosting nhanh nhất, xử lý dữ liệu lớn tốt)

3. Bạn có thể đầu tư bao nhiêu thời gian điều chỉnh?
   - Tối thiểu: Rừng Ngẫu nhiên với các mặc định (hầu như luôn hoạt động)
   - Vừa phải: XGBoost với learning_rate=0.1, điều chỉnh n_estimators bằng dừng sớm
   - Tối đa: LightGBM hoặc XGBoost với tìm kiếm siêu tham số Bayes

4. Bạn có cần khả năng diễn giải không?
   - Có: một cây quyết định đơn lẻ hoặc Rừng Ngẫu nhiên nhỏ với độ quan trọng đặc trưng
   - Một phần: gradient boosting với các giá trị SHAP
   - Không: stacking hoặc các tập hợp sâu

5. Dữ liệu có nhiễu với nhiều ngoại lệ không?
   - Có: Rừng Ngẫu nhiên (bagging bền vững với nhiễu)
   - Không: gradient boosting (có thể đẩy độ chính xác cao hơn trên dữ liệu sạch)

## When to use each method

**Rừng Ngẫu nhiên (Bagging)**: lựa chọn đầu tiên an toàn. Huấn luyện nhiều cây trên các mẫu bootstrap và lấy trung bình. Giảm phương sai mà không tăng độ chệch. Gần như không thể khớp quá mức trên dữ liệu vừa. Cần điều chỉnh tối thiểu: đặt n_estimators=100-500 và giữ các mặc định.

**AdaBoost**: boosting tuần tự với điều chỉnh lại trọng số mẫu. Hoạt động tốt với các bộ học cơ sở đơn giản (decision stump). Nhạy với ngoại lệ và các nhãn nhiễu vì nó tăng trọng số các điểm bị phân loại sai. Phần lớn được thay thế bởi gradient boosting trong thực tế.

**Gradient Boosting**: khớp mỗi cây mới với các phần dư của tập hợp đến lúc đó. Giảm độ chệch. Phương pháp mạnh nhất cho dữ liệu dạng bảng. Cần điều chỉnh: learning_rate, n_estimators, max_depth, min_child_weight, subsample.

**XGBoost**: gradient boosting với regularization, tối ưu hóa bậc hai và các tăng tốc cấp hệ thống. Hỗ trợ trực tiếp giá trị thiếu. Mặc định cho các cuộc thi Kaggle và ML sản xuất trên dữ liệu dạng bảng.

**LightGBM**: gradient boosting với phát triển theo lá (thay vì theo mức). Nhanh hơn XGBoost trên các tập dữ liệu lớn. Sử dụng các phép chia dựa trên biểu đồ tần suất. Tốt nhất cho các tập dữ liệu trên 50k hàng.

**CatBoost**: gradient boosting với xử lý trực tiếp các đặc trưng phân loại. Không cần mã hóa one-hot. Tốt khi có nhiều đặc trưng phân loại.

**Stacking**: huấn luyện một bộ học meta trên các dự đoán của nhiều mô hình cơ sở đa dạng. Sử dụng khi cần độ chính xác tuyệt đối tốt nhất và có tài nguyên tính toán dư. Luôn tạo các dự đoán mô hình cơ sở qua xác thực chéo để tránh rò rỉ.

**Bỏ phiếu**: tập hợp đơn giản nhất. Bỏ phiếu cứng (lớp đa số) hoặc bỏ phiếu mềm (các xác suất trung bình). Cách nhanh để kết hợp 2-3 mô hình đa dạng mà không có bộ học meta.

## Common mistakes

- Sử dụng gradient boosting mà không dừng sớm (nó sẽ khớp quá mức nếu bạn để chạy quá nhiều vòng)
- Đặt learning_rate quá cao (trên 0.3 thường gây bất ổn)
- Không điều chỉnh max_depth cho gradient boosting (mặc định không giới hạn hoặc các cây rất sâu khớp quá mức)
- Stacking với các mô hình đều cùng loại (độ đa dạng là mục đích của stacking)
- Sử dụng AdaBoost trên dữ liệu nhiễu (các ngoại lệ nhận trọng số ngày càng cao mỗi vòng)
- Kỳ vọng Rừng Ngẫu nhiên sửa khớp chưa đủ (nó giảm phương sai, không phải độ chệch)

## Tuning priorities by method

**Rừng Ngẫu nhiên:**
1. n_estimators: 100-500 (nhiều hơn hiếm khi tệ hơn, chỉ chậm hơn)
2. max_depth: None (để cây phát triển đầy đủ) hoặc chặn ở 10-20 để có tốc độ
3. max_features: "sqrt" cho phân loại, "log2" hoặc n/3 cho hồi quy

**XGBoost / LightGBM:**
1. learning_rate: 0.01-0.3 (thấp hơn tốt hơn nếu bạn có tài nguyên tính toán cho thêm cây)
2. n_estimators: sử dụng dừng sớm trên một tập xác thực thay vì đoán
3. max_depth: 3-8 (bắt đầu với 6)
4. min_child_weight / min_data_in_leaf: 1-20 (cao hơn ngăn khớp quá mức)
5. subsample: 0.7-1.0
6. colsample_bytree: 0.7-1.0
7. reg_alpha (L1) và reg_lambda (L2): 0-10

## Quick reference

| Phương pháp | Giảm | Tốc độ | Công sức điều chỉnh | Tốt nhất cho |
|--------|---------|-------|--------------|----------|
| Rừng Ngẫu nhiên | Phương sai | Nhanh | Thấp | Dữ liệu nhiễu, mốc cơ sở nhanh |
| AdaBoost | Độ chệch | Nhanh | Thấp | Các bộ học cơ sở đơn giản, dữ liệu sạch |
| Gradient Boosting | Độ chệch | Trung bình | Cao | Dữ liệu dạng bảng, các cuộc thi |
| XGBoost | Cả hai | Nhanh | Cao | ML dạng bảng trong sản xuất |
| LightGBM | Cả hai | Nhanh nhất | Cao | Các tập dữ liệu lớn (50k+ hàng) |
| CatBoost | Cả hai | Trung bình | Trung bình | Nhiều đặc trưng phân loại |
| Stacking | Cả hai | Chậm | Cao | Độ chính xác tối đa, các mô hình đa dạng |
| Bỏ phiếu | Phương sai | Nhanh | Không có | Kết hợp nhanh 2-3 mô hình |
