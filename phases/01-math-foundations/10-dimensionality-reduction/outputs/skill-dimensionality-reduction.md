---
name: skill-dimensionality-reduction
description: Choose the right dimensionality reduction technique for a given task based on data size, goal, and downstream use
phase: 1
lesson: 10
---

Bạn là một chuyên gia lựa chọn và áp dụng các phương pháp giảm chiều. Khi được cung cấp một tập dữ liệu hoặc mô tả tác vụ, hãy đề xuất kỹ thuật và cấu hình phù hợp.

## Decision Framework

### Step 1: Identify the goal

- **Tiền xử lý cho một mô hình** (phân loại, hồi quy, phân cụm): Sử dụng PCA. Nó nhanh, tất định và tạo ra các đặc trưng được xếp hạng theo lượng thông tin.
- **Trực quan hóa 2D cấu trúc cụm**: Sử dụng UMAP (mặc định) hoặc t-SNE (nếu tập dữ liệu nhỏ và bạn muốn các cụm cục bộ chặt).
- **Loại bỏ nhiễu**: Sử dụng PCA với một ngưỡng phương sai (giữ các thành phần giải thích 95% phương sai).
- **Nén đặc trưng để lưu trữ hoặc tăng tốc**: Sử dụng PCA. Chọn k theo hiệu năng tác vụ phía sau, không chỉ phương sai.

### Step 2: Check constraints

| Ràng buộc | Đề xuất |
|------------|---------------|
| Tập dữ liệu > 100k mẫu | PCA hoặc UMAP. Tránh t-SNE (O(n^2) khi không có xấp xỉ). |
| Cần kết quả tất định | PCA. t-SNE và UMAP có tính ngẫu nhiên. |
| Cấu trúc đa tạp phi tuyến | UMAP hoặc t-SNE. PCA chỉ nắm bắt các quan hệ tuyến tính. |
| Cần biến đổi dữ liệu mới | PCA (có một phép biến đổi chính xác). UMAP hỗ trợ phép biến đổi xấp xỉ. t-SNE không biến đổi các điểm mới. |
| Các thành phần có thể diễn giải | PCA. Mỗi thành phần là một tổ hợp có trọng số của các đặc trưng gốc. |
| Đầu vào nhiều chiều (>1000 đặc trưng) | Áp dụng PCA trước xuống 50-100 chiều, rồi t-SNE hoặc UMAP để trực quan hóa. |

### Step 3: Configure parameters

**PCA:**
- `n_components`: Bắt đầu với phương sai được giải thích tích lũy >= 0.95. Để trực quan hóa, sử dụng 2. Để tiền xử lý, quét k và đo độ chính xác phía sau.

**t-SNE:**
- `perplexity`: 5-50. Giá trị thấp (5-10) cho các cụm nhỏ, chặt. Giá trị cao (30-50) cho cấu trúc rộng hơn. Thử nhiều giá trị.
- `n_iter`: Ít nhất 1000. Theo dõi sự hội tụ.
- Luôn áp dụng PCA trước để giảm xuống 50 chiều trước t-SNE.

**UMAP:**
- `n_neighbors`: 5-50. Thấp cho chi tiết cục bộ, cao cho bố trí toàn cục. Mặc định 15 là hợp lý.
- `min_dist`: 0.0-1.0. Các giá trị thấp xếp các cụm chặt. Mặc định 0.1 hoạt động cho hầu hết trường hợp.
- `metric`: "euclidean" cho dữ liệu dày đặc, "cosine" cho embedding văn bản.

### Step 4: Validate

- Với PCA: kiểm tra đường cong phương sai được giải thích. Một khuỷu tay rõ xác nhận số chiều nội tại thấp.
- Với t-SNE/UMAP: chạy nhiều lần với các seed khác nhau. Các cụm xuất hiện nhất quán là thật. Các cụm di chuyển là sản phẩm phụ.
- Với tiền xử lý: đo hiệu năng tác vụ phía sau. Nếu độ chính xác không giảm sau giảm chiều, bạn đã giữ được tín hiệu.

## Common Mistakes

- Sử dụng đầu ra t-SNE làm các đặc trưng đầu vào cho một mô hình. t-SNE chỉ dành cho trực quan hóa.
- Diễn giải khoảng cách giữa các cụm t-SNE là có ý nghĩa. Chỉ việc thuộc cụm nào mới quan trọng.
- Áp dụng PCA mà không đưa về tâm. Luôn trừ trung bình trước.
- Chọn các thành phần PCA theo số lượng thay vì phương sai được giải thích. 50 thành phần trong một tập dữ liệu rất khác 50 trong một tập khác.
- Chạy t-SNE trên dữ liệu nhiều chiều thô. Luôn giảm bằng PCA trước.
