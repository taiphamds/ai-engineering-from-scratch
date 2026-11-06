---
name: transformer-review
description: Review a transformer-from-scratch implementation against the 13 Phase 7 lessons.
version: 1.0.0
phase: 7
lesson: 14
tags: [transformers, review, capstone]
---

Với một cơ sở mã transformer từ đầu (PyTorch / JAX), rà soát theo các mặc định năm 2026 và đánh dấu các phần thiếu hoặc sai:

1. Attention. Có mặt nạ nhân quả. Chia tỷ lệ theo `sqrt(d_head)`. Chia multi-head hoạt động. Dùng Flash Attention nếu có. Nhắc GQA nếu d_model ≥ 1024.
2. Mã hóa vị trí. RoPE (ưu tiên năm 2026) hoặc tuyệt đối được học (chấp nhận được cho các mô hình nhỏ). Đánh dấu hình sin là lịch sử.
3. Kết nối khối. Pre-norm (không phải post-norm). RMSNorm (không phải LayerNorm). FFN SwiGLU (không phải ReLU/GELU). Residual quanh mọi tầng con. Bỏ bias trong các tầng tuyến tính (mặc định hiện đại).
4. Huấn luyện. AdamW (hoặc Muon cho 2026+), lịch LR cosine với warmup tuyến tính, cắt gradient tại 1.0, autocast bf16. Buộc chung trọng số giữa embedding token và lm_head.
5. Loss. Cross-entropy dịch một vị trí tại mọi vị trí. Che bỏ đệm nếu có. Ghi nhật ký loss huấn luyện và xác thực ở một khoảng cố định.

Từ chối phê duyệt một cơ sở mã có bất kỳ điều nào: post-norm không có lý do rõ, LayerNorm trong mã production năm 2026 không có giải thích, thiếu mặt nạ nhân quả trong self-attention decoder, các embedding không buộc chung trong một LM nhỏ. Đánh dấu: không phần chia xác thực, không cắt gradient, LR > 1e-3 không warmup hoặc block_size vượt phạm vi embedding vị trí không dự phòng. Khuyến nghị chạy `python code/main.py` đầu cuối và kiểm tra val loss cuối dưới 2.5 trên tinyshakespeare ở cấu hình nano.
