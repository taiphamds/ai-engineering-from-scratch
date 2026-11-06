---
name: skill-feature-selector
description: Quick reference decision tree for choosing the right feature selection method
version: 1.0.0
phase: 2
lesson: 18
tags: [feature-selection, mutual-information, rfe, lasso, tree-importance]
---

# Feature Selection Strategy

Một tài liệu tham khảo nhanh để chọn và áp dụng phương pháp lựa chọn đặc trưng phù hợp.

## Step 1: Start with cleanup

Trước khi áp dụng bất kỳ phương pháp nào, loại bỏ các đặc trưng rõ ràng vô dụng:

- **Các đặc trưng hằng**: phương sai = 0. Loại bỏ chúng.
- **Các đặc trưng gần hằng**: phương sai < 0.01 (hoặc ngưỡng của bạn). Loại bỏ chúng.
- **Các đặc trưng trùng lặp**: các cột giống hệt nhau. Giữ một, loại bỏ phần còn lại.
- **Các cột ID**: duy nhất theo từng dòng, không mang thông tin có thể khái quát hóa. Loại bỏ chúng.

Việc này mất vài giây và có thể loại bỏ 10-30% đặc trưng trong các tập dữ liệu thực tế lộn xộn.

## Step 2: Choose a method based on your situation

### Quick Decision Tree

1. **< 50 đặc trưng?** Bắt đầu với xếp hạng thông tin tương hỗ. Giữ K cao nhất.
2. **50 - 500 đặc trưng?** Sử dụng ngưỡng phương sai trước, rồi L1 (Lasso) nếu sử dụng mô hình tuyến tính, hoặc độ quan trọng cây nếu sử dụng cây.
3. **> 500 đặc trưng?** Nối các phương pháp: ngưỡng phương sai -> bộ lọc thông tin tương hỗ (50% cao nhất) -> RFE trên các đặc trưng còn lại.
4. **Cần khả năng diễn giải?** Chính quy hóa L1 cho bạn các giá trị đúng bằng không/khác không. Độ quan trọng cây cho các điểm được xếp hạng.
5. **Cần nắm bắt các quan hệ phi tuyến?** Thông tin tương hỗ hoặc độ quan trọng dựa trên cây. Tránh L1 (chỉ tuyến tính).
6. **Cần tương tác đặc trưng?** RFE hoặc độ quan trọng dựa trên cây. Các phương pháp lọc bỏ sót tương tác.

### Method Reference

| Phương pháp | Khi nào sử dụng | Khi nào tránh |
|--------|------------|---------------|
| Ngưỡng phương sai | Luôn luôn, như bước đầu tiên | Không bao giờ bỏ qua bước này |
| Thông tin tương hỗ | Xếp hạng nhanh, các quan hệ phi tuyến | Khi bạn cần phát hiện tương tác đặc trưng |
| RFE | Lựa chọn kỹ lưỡng, số lượng đặc trưng vừa phải | Các mô hình rất tốn kém, > 1000 đặc trưng |
| L1 / Lasso | Mô hình tuyến tính, lựa chọn nhúng nhanh | Các bài toán phi tuyến, các đặc trưng tương quan cao |
| Độ quan trọng cây | Các quan hệ phi tuyến, tương tác đặc trưng | Bị thiên lệch bởi các đặc trưng có cardinality cao |
| Độ quan trọng hoán vị | Validation độc lập với mô hình, kiểm tra cuối cùng | Quá chậm để sàng lọc ban đầu |

## Step 3: Validate your selection

- So sánh hiệu suất mô hình với các đặc trưng đã chọn và tất cả các đặc trưng
- Sử dụng kiểm định chéo, không phải một lần chia train/test duy nhất
- Nếu hiệu suất giảm hơn 1-2%, bạn có thể đã loại bỏ các đặc trưng hữu ích
- Nếu hiệu suất cải thiện, bạn đã loại bỏ nhiễu thành công

## Step 4: Handle common pitfalls

### Correlated features
- L1 chọn tùy ý một đặc trưng từ một nhóm tương quan và đưa các đặc trưng khác về không
- Tính ma trận tương quan trước và quyết định giữ những đặc trưng tương quan nào
- Độ quan trọng cây phân tán độ quan trọng giữa các đặc trưng tương quan

### Data leakage
- Chỉ khớp lựa chọn đặc trưng trên dữ liệu huấn luyện
- Áp dụng cùng lựa chọn cho dữ liệu test
- Trong kiểm định chéo, lựa chọn đặc trưng phải diễn ra bên trong mỗi fold

### Overfitting to feature selection
- RFE với quá nhiều lần lặp có thể quá khớp tập huấn luyện
- Validation trên dữ liệu được giữ lại, không phải dữ liệu được sử dụng để lựa chọn
- Sử dụng lựa chọn ổn định (lặp lại trên các mẫu con) để có kết quả vững hơn

## Step 5: Production checklist

- [ ] Đã áp dụng ngưỡng phương sai làm bộ lọc đầu tiên
- [ ] Đã khớp lựa chọn đặc trưng chỉ trên dữ liệu huấn luyện
- [ ] Đã ghi lại các đặc trưng được chọn (tên, phương pháp sử dụng, điểm số)
- [ ] Đã so sánh hiệu suất: các đặc trưng đã chọn và tất cả các đặc trưng
- [ ] Đã kiểm định chéo, không phải đánh giá bằng một lần chia
- [ ] Đã tích hợp lựa chọn đặc trưng vào pipeline huấn luyện (không làm thủ công)
- [ ] Đã thiết lập giám sát độ trôi đặc trưng (các đặc trưng đã chọn có thể trở nên lỗi thời)
