---
name: skill-naive-bayes-chooser
description: Choose the right Naive Bayes variant for your classification task
phase: 2
lesson: 14
---

Bạn là một chuyên gia phân loại xác suất. Khi ai đó cần chọn một biến thể Naive Bayes, hãy hướng dẫn họ qua quy trình quyết định này.

## Decision Checklist

### Step 1: What are your features?

- **Số đếm từ hoặc các giá trị TF-IDF** -> MultinomialNB
- **Các số đo liên tục (nhiệt độ, chiều cao, số đọc cảm biến)** -> GaussianNB
- **Các chỉ báo nhị phân (từ hiện diện/vắng mặt, trạng thái ô chọn)** -> BernoulliNB
- **Các kiểu hỗn hợp** -> Chia thành các tập con, hoặc chuyển tất cả về một kiểu

### Step 2: How much data do you have?

- **Dưới 1,000 mẫu**: Naive Bayes là một lựa chọn mạnh. Tiên nghiệm mạnh (giả định độc lập) ngăn khớp quá mức.
- **1,000 đến 50,000 mẫu**: NB vẫn cạnh tranh. So sánh với hồi quy logistic.
- **Trên 50,000 mẫu**: Hồi quy logistic hoặc gradient boosting có khả năng vượt NB. Sử dụng NB làm mốc cơ sở.

### Step 3: Tune smoothing

- Bắt đầu với alpha=1.0 (làm trơn Laplace).
- Nếu độ chính xác thấp và bạn có đủ dữ liệu, thử alpha=0.1 hoặc 0.01.
- Nếu mô hình khớp quá mức (độ chính xác huấn luyện >> kiểm tra), tăng alpha lên 5.0 hoặc 10.0.
- Luôn xác thực làm trơn bằng xác thực chéo, không bằng một lần chia huấn luyện/kiểm tra.

### Step 4: Check assumptions

- **MultinomialNB**: Các đặc trưng phải không âm. Nếu có các giá trị âm, dịch hoặc sử dụng GaussianNB.
- **GaussianNB**: Hoạt động tốt nhất khi các đặc trưng có dạng gần hình chuông trong mỗi lớp. Kiểm tra bằng các biểu đồ tần suất.
- **BernoulliNB**: Nhị phân hóa các đặc trưng trước. Chọn ngưỡng cẩn thận (với văn bản: present=1, absent=0).

## Common Mistakes

1. **Sử dụng GaussianNB trên dữ liệu văn bản.** Số đếm từ không phải Gaussian. Sử dụng MultinomialNB.
2. **Quên làm trơn Laplace.** Một từ chưa thấy duy nhất đặt toàn bộ xác suất về không. Luôn làm trơn.
3. **Tin các đầu ra xác suất.** Các xác suất NB được hiệu chỉnh kém. Sử dụng để xếp hạng, không làm điểm độ tự tin. Nếu cần các xác suất được hiệu chỉnh, sử dụng CalibratedClassifierCV.
4. **Bỏ qua mất cân bằng lớp.** Các tiên nghiệm NB phản ánh tần suất lớp. Với 99% âm và 1% dương, tiên nghiệm lấn át hợp lý. Điều chỉnh tiên nghiệm thủ công hoặc lấy mẫu lại.

## Quick Reference

| Câu hỏi | MultinomialNB | GaussianNB | BernoulliNB |
|----------|:---:|:---:|:---:|
| Phân loại văn bản? | Có | Không | Có thể (văn bản ngắn) |
| Các đặc trưng liên tục? | Không | Có | Không |
| Các đặc trưng nhị phân? | Không | Không | Có |
| Cần huấn luyện rất nhanh? | Có | Có | Có |
| Tập huấn luyện nhỏ? | Tốt | Tốt | Tốt |
| Cần các xác suất được hiệu chỉnh? | Không | Không | Không |

## When NOT to Use Naive Bayes

- Các đặc trưng tương quan cao và bạn có đủ dữ liệu cho một mô hình xử lý tương quan (hồi quy logistic, gradient boosting)
- Bạn cần độ chính xác tốt nhất có thể và có nhiều dữ liệu
- Các đặc trưng là hình ảnh, chuỗi hoặc đồ thị (sử dụng mạng nơ-ron)
- Bạn cần một mô hình nắm bắt các tương tác đặc trưng (sử dụng các phương pháp dựa trên cây)
