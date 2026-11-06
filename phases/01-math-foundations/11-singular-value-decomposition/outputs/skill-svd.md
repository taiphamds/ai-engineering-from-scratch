---
name: skill-svd
description: Apply SVD to real problems including compression, denoising, recommendations, and least-squares solving
phase: 1
lesson: 11
---

Bạn là một chuyên gia áp dụng Phân rã Giá trị Kỳ dị cho các bài toán kỹ thuật thực tế. Khi được giao một tác vụ liên quan đến ma trận, nén dữ liệu, nhiễu, dữ liệu thiếu hoặc hệ tuyến tính, hãy xác định liệu SVD có phải công cụ phù hợp và cách áp dụng nó.

## Decision Framework

### Step 1: Identify the problem type

- **Nén dữ liệu / giảm chiều**: Sử dụng SVD cắt ngọn. Giữ k giá trị kỳ dị đứng đầu. Chọn k theo ngưỡng năng lượng (95% là mục tiêu phổ biến) hoặc theo hiệu năng tác vụ phía sau.
- **Giảm nhiễu**: Tính SVD đầy đủ. Tìm một khoảng cách trong phổ giá trị kỳ dị. Cắt ngọn bên dưới khoảng cách đó. Khoảng cách tách tín hiệu khỏi nhiễu.
- **Dữ liệu thiếu / đề xuất**: Điền các phần tử bị thiếu (trung bình hàng hoặc số không), tính SVD, tái tạo với hạng thấp. Trong sản xuất, sử dụng ALS hoặc SVD tăng dần hỗ trợ trực tiếp dữ liệu thiếu.
- **Bình phương tối thiểu / giả nghịch đảo**: Tính SVD. Nghịch đảo các giá trị kỳ dị khác không. Nhân V Sigma+ U^T với vector mục tiêu. Ổn định hơn các phương trình chuẩn.
- **Độ tương đồng văn bản / mô hình hóa chủ đề**: Xây dựng ma trận thuật ngữ-tài liệu. Áp dụng SVD (đây là LSA/LSI). Chiếu các tài liệu và thuật ngữ vào không gian hạng thấp. Sử dụng độ tương đồng cosine để so sánh.
- **Xác định hạng số**: Tính SVD. Đếm các giá trị kỳ dị trên một ngưỡng (tương đối với giá trị lớn nhất). Điều này đáng tin cậy hơn phép khử hàng.
- **Tính chuẩn ma trận**: Chuẩn phổ = giá trị kỳ dị lớn nhất. Chuẩn Frobenius = sqrt(sum of squared singular values). Chuẩn hạt nhân = tổng các giá trị kỳ dị.
- **Số điều kiện**: sigma_max / sigma_min. Cho bạn biết hệ nhạy đến mức nào với các nhiễu loạn.

### Step 2: Choose the right variant

| Tình huống | Phương pháp | Lý do |
|-----------|--------|-----|
| Ma trận dày đặc, cần phân rã đầy đủ | `np.linalg.svd(A)` / `svd(A)` trong Julia | Thuật toán tiêu chuẩn, ổn định về mặt số học |
| Chỉ cần k thành phần đứng đầu | `scipy.sparse.linalg.svds(A, k)` | Nhanh hơn SVD đầy đủ khi k nhỏ |
| Ma trận thưa | `scipy.sparse.linalg.svds` | Xử lý lưu trữ thưa hiệu quả |
| Dữ liệu theo luồng | SVD tăng dần / SVD trực tuyến | Cập nhật phân rã mà không tính lại từ đầu |
| Dữ liệu thiếu (đề xuất) | ALS, Funk SVD hoặc NMF | SVD tiêu chuẩn đòi hỏi một ma trận đầy đủ |
| Ma trận rất lớn (hàng triệu hàng) | SVD ngẫu nhiên hóa (`sklearn.utils.extmath.randomized_svd`) | O(mn log k) thay vì O(mn min(m,n)) |
| PCA trên dữ liệu đã đưa về tâm | SVD của ma trận dữ liệu đã đưa về tâm | Tương đương phân rã riêng của hiệp phương sai, nhưng ổn định hơn |

### Step 3: Choose the rank k

- **Ngưỡng năng lượng**: Tính năng lượng tích lũy = sum(sigma_1^2 ... sigma_k^2) / sum(all sigma^2). Dừng khi năng lượng vượt 0.95 (hoặc 0.99 cho các tác vụ có độ trung thực cao).
- **Phát hiện khoảng cách**: Vẽ các giá trị kỳ dị. Tìm một chỗ giảm mạnh. Khoảng cách chỉ ra ranh giới giữa tín hiệu và nhiễu.
- **Xác thực chéo**: Với các tác vụ phía sau, quét k và đo hiệu năng trên dữ liệu giữ lại.
- **Phương pháp khuỷu tay**: Vẽ sai số tái tạo theo k. Khuỷu tay là nơi thêm nhiều thành phần hơn ngừng giúp ích.
- **Kiến thức chuyên môn**: Nếu bạn biết dữ liệu có d nhân tố nền tảng, sử dụng k = d.

### Step 4: Validate results

- **Sai số tái tạo**: Tính ||A - A_k|| / ||A||. Nên nhỏ nếu việc cắt ngọn có ý nghĩa.
- **Phương sai được giải thích**: Với PCA/nén, báo cáo phần tổng phương sai (năng lượng) được nắm bắt.
- **Hiệu năng tác vụ phía sau**: Nếu SVD là một bước tiền xử lý, đo chỉ số từ đầu đến cuối.
- **Kiểm tra trực quan**: Với hình ảnh, so sánh trực quan bản gốc và bản tái tạo. Với đề xuất, kiểm tra các dự đoán với các đánh giá đã biết.

## Common Mistakes

- Tính SVD bằng phân rã riêng của A^T A. Điều này bình phương số điều kiện và làm mất độ chính xác số học. Sử dụng một thủ tục SVD chuyên dụng.
- Sử dụng SVD đầy đủ khi chỉ cần k thành phần đứng đầu. Với các ma trận lớn, sử dụng SVD cắt ngọn hoặc ngẫu nhiên hóa.
- Áp dụng SVD trực tiếp cho một ma trận có các phần tử bị thiếu. SVD tiêu chuẩn đòi hỏi một ma trận đầy đủ. Thay vào đó sử dụng các phương pháp hoàn thiện ma trận (ALS, Funk SVD).
- Bỏ qua việc đưa về tâm. Với PCA, dữ liệu phải được đưa về tâm (trừ trung bình) trước SVD. Không đưa về tâm, thành phần đầu tiên nắm bắt trung bình, không phải phương sai.
- Cắt ngọn quá mức. Nếu giữ quá ít giá trị kỳ dị, bạn mất tín hiệu. Nếu giữ quá nhiều, bạn giữ nhiễu. Sử dụng các ngưỡng năng lượng hoặc xác thực chéo.
- Nhầm SVD với phân rã riêng. SVD hoạt động trên bất kỳ ma trận nào (bất kỳ hình dạng, bất kỳ hạng). Phân rã riêng đòi hỏi một ma trận vuông với đầy đủ một tập vector riêng. Với các ma trận đối xứng nửa xác định dương chúng là cùng một thứ.

## Code Patterns

### Quick compression
```python
U, S, Vt = np.linalg.svd(A, full_matrices=False)
k = np.searchsorted(np.cumsum(S**2) / np.sum(S**2), 0.95) + 1
A_compressed = U[:, :k] @ np.diag(S[:k]) @ Vt[:k, :]
```

### Pseudoinverse for least squares
```python
U, S, Vt = np.linalg.svd(A, full_matrices=False)
S_inv = np.array([1/s if s > 1e-10 else 0 for s in S])
x = Vt.T @ np.diag(S_inv) @ U.T @ b
```

### Denoising
```python
U, S, Vt = np.linalg.svd(noisy_data, full_matrices=False)
k = find_gap(S)
clean_data = U[:, :k] @ np.diag(S[:k]) @ Vt[:k, :]
```

### Large-scale PCA
```python
from sklearn.utils.extmath import randomized_svd
U, S, Vt = randomized_svd(X_centered, n_components=50, random_state=42)
explained_variance = S**2 / (n_samples - 1)
```

## When NOT to use SVD

- Ma trận rất thưa và bạn chỉ cần một vài thành phần. Sử dụng trực tiếp các bộ giải giá trị riêng thưa.
- Bạn cần các nhân tố không âm (mô hình hóa chủ đề, tách hỗn hợp phổ). Thay vào đó sử dụng NMF.
- Dữ liệu có cấu trúc phi tuyến mạnh mà các phương pháp tuyến tính không thể nắm bắt. Sử dụng autoencoder hoặc học đa tạp.
- Bạn cần cập nhật theo thời gian thực trên dữ liệu theo luồng và ma trận thay đổi liên tục. Sử dụng SVD tăng dần/trực tuyến hoặc các phương pháp xấp xỉ.
- Ma trận vừa trong bộ nhớ nhưng lớn đến mức ngay cả SVD ngẫu nhiên hóa cũng quá chậm. Cân nhắc các phương pháp phác họa hoặc cách tiếp cận dựa trên lấy mẫu.

## Computational Cost

| Phương pháp | Thời gian | Không gian |
|--------|------|-------|
| SVD đầy đủ của ma trận m x n | O(mn min(m,n)) | O(mn) |
| SVD cắt ngọn (k đứng đầu) | O(mnk) | O((m+n)k) |
| SVD ngẫu nhiên hóa (k đứng đầu) | O(mn log k) | O((m+n)k) |
| Phép lặp lũy thừa (1 vector) | O(mn * iters) | O(m+n) |

Với một ma trận 10000 x 5000:
- SVD đầy đủ: ~250 tỷ phép toán
- SVD cắt ngọn (k=50): ~2.5 tỷ phép toán
- SVD ngẫu nhiên hóa (k=50): ~500 triệu phép toán

Chọn phương pháp khớp với các yêu cầu quy mô và độ chính xác của bạn.
