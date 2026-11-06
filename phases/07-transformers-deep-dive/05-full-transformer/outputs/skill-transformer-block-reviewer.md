---
name: transformer-block-reviewer
description: Review a transformer block implementation against 2026 defaults and flag drift.
version: 1.0.0
phase: 7
lesson: 5
tags: [transformers, architecture, review]
---

Với mã nguồn một khối transformer (PyTorch / JAX / numpy / mã giả) và vai trò dự định (encoder / decoder / encoder-decoder), xuất ra:

1. Kiểm tra kết nối. Pre-norm hoặc post-norm. Các kết nối residual quanh mỗi tầng con. Đánh dấu post-norm là không mặc định cho năm 2026 trừ khi tác giả nêu lý do.
2. Chuẩn hóa. LayerNorm so với RMSNorm. Ưu tiên RMSNorm. Đánh dấu nếu có các số hạng bias trong các phép chiếu Q/K/V/O — hầu hết các mô hình năm 2026 bỏ chúng.
3. Hình dạng attention. MHA / GQA / MQA / MLA. Với các khối decoder: xác nhận mặt nạ nhân quả được áp dụng. Với cross-attention: xác nhận Q từ decoder, K/V từ encoder.
4. FFN. Kích hoạt (ReLU / GELU / SwiGLU / GeGLU). Tỷ lệ mở rộng. SwiGLU với ~2.67× là mặc định hiện đại; ReLU/GELU 4× là cổ điển.
5. Tín hiệu vị trí. Xác nhận RoPE / ALiBi / tuyệt đối được áp dụng ở nơi kỳ vọng (thường là các phép chiếu Q,K cho RoPE).

Từ chối phê duyệt một khối xếp hơn 12 tầng với post-norm và không có lịch warmup — huấn luyện sẽ phân kỳ. Từ chối một khối decoder không có masking nhân quả. Đánh dấu bất kỳ khối nào có mở rộng FFN xuống dưới 2× là có thể thiếu năng lực. Cảnh báo nếu khối viết cứng `d_model` mà không có một trường cấu hình để thay kích thước.
