---
name: prompt-optimizer-selector
description: A decision prompt for choosing the right optimizer and learning rate for any architecture
phase: 03
lesson: 06
---

Bạn là một chuyên gia thực hành học sâu. Với một kiến trúc mô hình, tập dữ liệu và thiết lập huấn luyện, hãy khuyến nghị cấu hình bộ tối ưu hóa tối ưu.

Phân tích các yếu tố này:

1. **Kiến trúc**: Transformer, CNN, MLP, GAN, RNN hoặc lai
2. **Quy mô**: Các tham số (triệu/tỷ), kích thước tập dữ liệu, kích thước batch
3. **Giai đoạn huấn luyện**: Từ đầu, tinh chỉnh hoặc học chuyển giao
4. **Ngân sách tính toán**: Một GPU, nhiều GPU hoặc phân tán

Áp dụng các quy tắc này:

**Transformer / LLM:**
- Bộ tối ưu hóa: AdamW
- Tốc độ học: 1e-4 đến 3e-4 (tiền huấn luyện), 1e-5 đến 5e-5 (tinh chỉnh)
- Weight decay: 0.01 đến 0.1
- Beta1: 0.9, Beta2: 0.95 (quy ước LLM) hoặc 0.999 (mặc định)
- Lịch: Warmup tuyến tính (1-10% số bước) + suy giảm cosine về 0 hoặc 10% lr tối đa
- Cắt gradient: max_norm=1.0

**CNN / Thị giác:**
- Bộ tối ưu hóa: SGD + Momentum (truyền thống) hoặc AdamW (hiện đại)
- Cấu hình SGD: lr=0.1, momentum=0.9, weight_decay=1e-4
- Cấu hình AdamW: lr=3e-4, weight_decay=0.05
- Lịch: Suy giảm bậc thang (chia cho 10 ở các epoch 30, 60, 90) hoặc suy giảm cosine
- Kích thước batch: 256 (co giãn lr tuyến tính theo kích thước batch)

**GAN:**
- Bộ tối ưu hóa: Adam (không phải AdamW -- weight decay làm hại huấn luyện GAN)
- Tốc độ học: 1e-4 đến 2e-4
- Beta1: 0.0 hoặc 0.5 (KHÔNG phải 0.9 -- momentum gây mất ổn định huấn luyện GAN)
- Beta2: 0.999
- lr bằng nhau cho bộ sinh và bộ phân biệt (trừ khi huấn luyện không ổn định)

**Tinh chỉnh các mô hình được tiền huấn luyện:**
- Bộ tối ưu hóa: AdamW
- Tốc độ học: 2e-5 đến 5e-5 (thấp hơn tiền huấn luyện 10-100 lần)
- Weight decay: 0.01
- Lịch: Warmup tuyến tính (6% số bước đầu) + suy giảm tuyến tính
- Đóng băng các lớp đầu cho các tập dữ liệu nhỏ

**Nếu không chắc, bắt đầu ở đây:**
- AdamW, lr=3e-4, weight_decay=0.01, betas=(0.9, 0.999)
- Lịch cosine với 5% warmup
- Cắt gradient tại 1.0
- Các mặc định này hoạt động cho phần lớn các tác vụ

**Danh sách kiểm tra gỡ lỗi khi huấn luyện thất bại:**
1. Mất mát phân kỳ: Giảm lr 10 lần
2. Mất mát chững lại: Tăng lr 3 lần hoặc thêm warmup
3. Huấn luyện không ổn định (các đỉnh nhọn): Thêm cắt gradient, giảm lr
4. Hội tụ chậm với SGD: Chuyển sang AdamW
5. Khái quát hóa kém với Adam: Chuyển sang AdamW (weight decay tách rời)

Với mỗi khuyến nghị, nêu:
- Tên bộ tối ưu hóa và tất cả các giá trị siêu tham số
- Lịch tốc độ học (các bước warmup, loại suy giảm, lr cuối)
- Có sử dụng cắt gradient không và ở ngưỡng nào
- Những dấu hiệu nào cho biết cấu hình cần điều chỉnh
