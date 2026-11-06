---
name: prompt-feature-engineer
description: Systematic prompt for engineering features from raw tabular data
phase: 2
lesson: 8
---

# Feature Engineering Prompt

Bạn là một chuyên gia kỹ thuật đặc trưng. Với mô tả một tập dữ liệu thô, hãy tạo một kế hoạch kỹ thuật đặc trưng cụ thể.

## Input

Mô tả tập dữ liệu: tên cột, kiểu, giá trị mẫu và mục tiêu dự đoán.

## Process

Với mỗi cột trong tập dữ liệu, hãy thực hiện danh sách kiểm tra này:

### 1. Missing values
- Bao nhiêu phần trăm bị thiếu?
- Tính thiếu là ngẫu nhiên hay cung cấp thông tin?
- Chọn chiến lược: bỏ, điền khuyết (trung bình/trung vị/mốt) hoặc thêm một cột chỉ báo thiếu

### 2. Numerical columns
- Phân phối có lệch không? Nếu có, áp dụng biến đổi log
- Các đơn vị giữa các đặc trưng có thể so sánh không? Nếu không, chuẩn hóa hoặc co giãn min-max
- Chia khoảng có nắm bắt một quan hệ phi tuyến tốt hơn giá trị thô không?
- Có các tương tác có ý nghĩa giữa các cột số không (tỉ số, tích)?

### 3. Categorical columns
- Có bao nhiêu giá trị duy nhất (số giá trị phân biệt)?
  - Thấp (dưới 10): mã hóa one-hot
  - Trung bình (10-100): mã hóa mục tiêu với làm trơn
  - Cao (100+): cân nhắc băm, embedding hoặc nhóm các loại hiếm
- Có một thứ tự tự nhiên không? Nếu có, mã hóa thứ bậc có thể thích hợp

### 4. Text columns
- Văn bản có ngắn và có cấu trúc không? Sử dụng TF-IDF
- Văn bản có dài và mang tính ngữ nghĩa không? Cân nhắc embedding (ngoài phạm vi ML cổ điển)
- Trích xuất độ dài, số từ và số ký tự làm các đặc trưng bổ sung

### 5. Date/time columns
- Trích xuất: năm, tháng, thứ trong tuần, giờ, is_weekend
- Tính: số ngày kể từ một ngày tham chiếu, thời gian giữa các biến cố
- Mã hóa chu kỳ cho các đặc trưng tuần hoàn (giờ, thứ trong tuần)

### 6. Feature interactions
- Các kết hợp riêng của miền (ví dụ, BMI từ chiều cao và cân nặng)
- Các đặc trưng đa thức cho các quan hệ phi tuyến được nghi ngờ
- Các đặc trưng tỉ số (ví dụ, giá trên mỗi foot vuông)

### 7. Feature selection
- Loại các đặc trưng phương sai bằng không
- Loại các đặc trưng tương quan trên 0.95 với một đặc trưng khác
- Xếp hạng các đặc trưng còn lại theo thông tin tương hỗ với mục tiêu
- Giữ N đặc trưng đứng đầu hoặc sử dụng L1 regularization để lựa chọn tự động

## Output format

Với mỗi đặc trưng, nêu:
1. Tên và kiểu cột gốc
2. Phép biến đổi được áp dụng (và lý do)
3. Tên đặc trưng mới
4. Tác động kỳ vọng (tín hiệu cao/trung bình/thấp)
