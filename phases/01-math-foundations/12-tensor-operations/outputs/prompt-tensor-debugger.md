---
name: prompt-tensor-debugger
description: Step-by-step debugging prompt for tensor shape errors in deep learning code
phase: 1
lesson: 12
---

Tôi gặp lỗi hình dạng tensor trong mã học sâu của mình. Hãy giúp tôi sửa nó.

**Thông báo lỗi:** [dán lỗi vào đây]

**Các hình dạng tensor của tôi:**
- [tên]: [hình dạng]
- [tên]: [hình dạng]

**Phép toán tôi đang cố thực hiện:** [mô tả nó]

---

Khi gỡ lỗi, hãy làm theo chính xác quy trình này:

**Bước 1: Xác định loại phép toán.**
Phép toán nào tạo ra lỗi? Ánh xạ nó đến một trong các loại sau:
- Nhân ma trận / Lớp Linear (các chiều bên trong phải khớp)
- Broadcasting (căn chỉnh từ phải, mỗi chiều phải bằng nhau hoặc là 1)
- Ghép nối (tất cả các chiều khớp trừ chiều cat)
- Tích chập (yêu cầu hạng và vị trí kênh cụ thể)
- Reshape (tổng số phần tử phải được bảo toàn)

**Bước 2: Viết ra hợp đồng hình dạng.**
Với phép toán đã xác định, viết tường minh các hình dạng kỳ vọng:
```
matmul(A, B): A is (..., m, k), B is (..., k, n) -> (..., m, n)
broadcast(A, B): align right, each pair must be (equal) or (one is 1)
cat([A, B], dim=d): all dims match except dim d
Linear(in_f, out_f): input last dim must equal in_f
Conv2d(in_c, out_c, k): input must be (B, in_c, H, W)
```

**Bước 3: Tìm sự không khớp.**
So sánh các hình dạng thực tế với hợp đồng. Xác định chính xác chiều vi phạm quy tắc.

**Bước 4: Chọn cách sửa tối thiểu.**
Chọn từ bảng này:

| Triệu chứng | Cách sửa |
|---|---|
| Thiếu chiều batch | `.unsqueeze(0)` |
| Thiếu chiều kênh | `.unsqueeze(1)` |
| Thừa chiều kích thước 1 | `.squeeze(dim)` |
| Các chiều bên trong sai cho matmul | `.transpose(-1, -2)` hoặc kiểm tra hình dạng trọng số |
| Cần NCHW từ NHWC | `.permute(0, 3, 1, 2)` |
| Cần NHWC từ NCHW | `.permute(0, 2, 3, 1)` |
| Làm phẳng các chiều không gian cho linear | `.flatten(1)` hoặc `.reshape(B, -1)` |
| Tách head: (B,T,D) thành (B,H,T,D/H) | `.reshape(B, T, H, D//H).transpose(1, 2)` |
| Gộp head: (B,H,T,D/H) thành (B,T,D) | `.transpose(1, 2).reshape(B, T, H*(D//H))` |
| Tensor không liên tục với .view() | `.contiguous().view(...)` hoặc sử dụng `.reshape(...)` |

**Bước 5: Xác minh cách sửa.**
Trình bày các hình dạng kết quả tại mỗi bước. Xác nhận tổng số phần tử được bảo toàn qua bất kỳ reshape nào. Xác nhận hợp đồng hình dạng của phép toán giờ được thỏa mãn.

**Bước 6: Kiểm tra lỗi âm thầm.**
Ngay cả khi hình dạng khớp, hãy xác minh:
- Broadcasting đang diễn ra dọc theo trục dự định (không phải vô tình)
- Phép rút gọn đang lấy tổng theo đúng chiều
- Chiều batch (chiều 0) tồn tại qua toàn bộ lượt truyền xuôi
- Transpose + reshape được sử dụng (không chỉ reshape) khi thứ tự chiều có ý nghĩa

Định dạng câu trả lời của bạn như sau:
```
OPERATION: [what operation failed]
EXPECTED: [shape contract]
ACTUAL: [what shapes were provided]
MISMATCH: [which dimension, why]
FIX: [exact code]
RESULT: [shapes after fix]
```
