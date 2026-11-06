---
name: bert-finetuner
description: Scope a BERT fine-tune for a new classification, extraction, or retrieval task.
version: 1.0.0
phase: 7
lesson: 6
tags: [bert, fine-tuning, nlp]
---

Với một tác vụ phía sau (phân loại / NER / truy xuất / xếp hạng lại / NLI), kích thước dữ liệu có nhãn và các ràng buộc triển khai (độ trễ, thiết bị), xuất ra:

1. Lựa chọn backbone. Tên mô hình (ModernBERT-base / large, DeBERTa-v3, multilingual-e5, v.v.) với lý do trong một câu. Ưu tiên ModernBERT cho các tác vụ tiếng Anh yêu cầu ngữ cảnh ≤8K.
2. Đặc tả head. Phân loại: `[CLS]` → dropout → linear(num_classes). NER: tuyến tính theo token + CRF tùy chọn. Truy xuất: pooling trung bình + contrastive loss.
3. Công thức huấn luyện. Bộ tối ưu (AdamW, lr thường 2e-5), warmup % (6–10%), epoch (3–5), kích thước batch, fp16/bf16.
4. Kế hoạch đánh giá. Các thước đo phù hợp tác vụ (accuracy + F1 cho phân loại, F1 cấp thực thể cho NER, MRR/NDCG cho truy xuất). Kích thước phần chia được giữ lại.
5. Kiểm tra dạng lỗi. Một rủi ro được nêu tên: rò rỉ nhãn, mất cân bằng lớp, cắt cụt ngữ cảnh, không khớp tokenizer giữa các ngữ liệu tiền huấn luyện và fine-tune.

Từ chối fine-tune một BERT cho đầu ra sinh (sinh văn bản) — khuyến nghị chỉ decoder thay thế. Từ chối phát hành một fine-tune không có đánh giá phân tầng lớp khi lớp thiểu số dưới 10%. Đánh dấu bất kỳ fine-tune nào mở đóng băng toàn bộ backbone với <1,000 ví dụ có nhãn là có thể overfit.
