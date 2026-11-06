---
name: skill-anomaly-detector
description: Choose the right anomaly detection approach for your problem
phase: 2
lesson: 16
---

Bạn là chuyên gia về phát hiện bất thường. Khi ai đó cần tìm các mẫu khác thường trong dữ liệu, hãy giúp họ chọn cách tiếp cận phù hợp và thiết lập đúng.

## Decision Framework

### Step 1: What kind of anomalies?

- **Bất thường điểm** (các giá trị khác thường đơn lẻ) -> Z-score, IQR, Isolation Forest hoặc LOF
- **Bất thường theo ngữ cảnh** (khác thường xét theo ngữ cảnh như thời gian) -> Thêm các đặc trưng ngữ cảnh, rồi sử dụng bất kỳ phương pháp nào
- **Bất thường tập thể** (các chuỗi khác thường) -> Các đặc trưng cửa sổ trượt + bất kỳ phương pháp nào, hoặc các mô hình chuỗi

### Step 2: Do you have labels?

- **Hoàn toàn không có nhãn** -> Không giám sát: Isolation Forest, LOF, Z-score, IQR, autoencoder
- **Một số nhãn (ít ví dụ bất thường)** -> Bán giám sát: chỉ huấn luyện trên dữ liệu bình thường, kiểm thử trên mọi thứ
- **Nhiều nhãn** -> Có giám sát: coi là phân loại mất cân bằng (nhưng các loại bất thường bạn đã huấn luyện là những loại duy nhất bạn sẽ phát hiện được)

### Step 3: What are your constraints?

| Ràng buộc | Phương pháp tốt nhất |
|-----------|------------|
| Phải giải thích tại sao nó bất thường | Z-score (đặc trưng nào, bao nhiêu độ lệch chuẩn) hoặc IQR (đặc trưng nào, cách các giới hạn bao xa) |
| Dữ liệu có số chiều rất cao (50+ đặc trưng) | Isolation Forest (xử lý các đặc trưng không liên quan) |
| Nhiều cụm có mật độ khác nhau | LOF (so sánh mật độ cục bộ) |
| Thời gian thực, xử lý một lượt | Z-score với thống kê tích lũy (thuật toán Welford) |
| Tập dữ liệu lớn (hàng triệu dòng) | Isolation Forest (lấy mẫu con) hoặc Z-score (O(n)) |
| Phải giảm thiểu báo động giả | Các ngưỡng cao hơn, điều chỉnh theo precision, sử dụng ensemble các phương pháp |

### Step 4: How to evaluate

- KHÔNG sử dụng accuracy. Với 0.1% bất thường, luôn dự đoán "bình thường" cho accuracy 99.9%.
- Sử dụng **Precision@k**: trong k điểm đáng ngờ nhất, bao nhiêu điểm là bất thường thật?
- Sử dụng **AUPRC**: diện tích dưới đường cong precision-recall.
- Sử dụng **Recall tại FPR cố định**: tại một tỷ lệ dương tính giả bạn có thể chấp nhận, bạn phát hiện được tỷ lệ bất thường bao nhiêu?
- Luôn so sánh với một đường cơ sở: chấm điểm ngẫu nhiên nên cho Precision@k bằng tỷ lệ bất thường.

### Step 5: Common Mistakes

1. **Huấn luyện trên dữ liệu bị nhiễm.** Nếu tập huấn luyện chứa các bất thường, mô hình học chúng như bình thường. Làm sạch dữ liệu huấn luyện hoặc sử dụng các phương pháp vững (Isolation Forest phần nào vững trước điều này).
2. **Sử dụng AUROC với mất cân bằng cực độ.** AUROC có thể là 0.99 ngay cả khi mô hình chỉ phát hiện 10% bất thường ở các ngưỡng thực tế. Sử dụng AUPRC thay thế.
3. **Bỏ qua ngữ cảnh thời gian.** Mức sử dụng CPU 90% là bình thường khi triển khai, bất thường lúc 3 giờ sáng. Thêm các đặc trưng thời gian.
4. **Các ngưỡng cố định trong production.** Phân phối dữ liệu trôi đi. Một ngưỡng hoạt động hôm nay có thể không hoạt động vào tháng tới. Giám sát phân phối điểm và điều chỉnh.
5. **Phát hiện đơn biến trên dữ liệu đa biến.** Kiểm tra độc lập từng đặc trưng bỏ sót các bất thường chỉ khác thường khi xét các đặc trưng cùng nhau. Sử dụng Isolation Forest hoặc LOF để phát hiện đa biến.

## Quick Reference

| Phương pháp | Tốc độ | Khả năng diễn giải | Đa biến | Vững trước ngoại lệ trong huấn luyện |
|--------|-------|-----------------|-------------|-------------------------------|
| Z-score | Rất nhanh | Cao | Chỉ theo từng đặc trưng | Không |
| IQR | Rất nhanh | Cao | Chỉ theo từng đặc trưng | Phần nào |
| Isolation Forest | Nhanh | Thấp | Có | Phần nào |
| LOF | Chậm | Trung bình | Có | Không |
| Autoencoder | Trung bình | Thấp | Có | Không |
| One-Class SVM | Trung bình | Thấp | Có | Không |
