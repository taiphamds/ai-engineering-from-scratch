---
name: skill-fine-tuning-guide
description: Decision tree for when and how to fine-tune LLMs with LoRA and QLoRA
version: 1.0.0
phase: 11
lesson: 8
tags: [fine-tuning, lora, qlora, peft, llm-engineering]
---

# Fine-Tuning Decision Guide

Trước khi fine-tune, thử những cách này theo thứ tự:

```
1. Prompt engineering (minutes, $0)
2. Few-shot examples in prompt (minutes, $0)
3. RAG for knowledge retrieval (days, $10-100/month)
4. Fine-tuning with LoRA/QLoRA (days, $5-50 per experiment)
5. Full fine-tuning (weeks, $100-10,000 per run)
```

Chỉ chuyển bước tiếp theo nếu bước trước thiếu ở mức đo được.

## When to fine-tune

- Mô hình cần phong cách hoặc định dạng đầu ra nhất quán mà prompting không đạt được
- Bạn đang chưng cất mô hình lớn hơn (chất lượng GPT-4 từ mô hình 8B)
- Độ trễ quan trọng và ví dụ few-shot thêm quá nhiều token
- Bạn cần mô hình làm theo mẫu suy luận phức tạp một cách đáng tin cậy
- Bạn có 1,000+ ví dụ chất lượng cao về hành vi đầu vào-đầu ra mong muốn

## When NOT to fine-tune

- Mô hình đã làm điều bạn muốn với prompt phù hợp
- Bạn cần mô hình biết sự kiện (dùng RAG thay thế)
- Bạn có ít hơn 500 ví dụ huấn luyện (có khả năng quá khớp)
- Tác vụ thay đổi thường xuyên (huấn luyện lại tốn kém)
- Bạn cần kiểm toán dữ liệu nào ảnh hưởng đầu ra cụ thể (fine-tuning là hộp đen)

## Method selection

| VRAM GPU | Mô hình 7B | Mô hình 13B | Mô hình 70B |
|----------|----------|-----------|-----------|
| 16GB (T4) | QLoRA | Không khả thi | Không khả thi |
| 24GB (3090/4090) | QLoRA hoặc LoRA | QLoRA | Không khả thi |
| 40GB (A100) | LoRA hoặc Toàn phần | QLoRA hoặc LoRA | QLoRA |
| 80GB (A100/H100) | Toàn phần | LoRA hoặc Toàn phần | QLoRA hoặc LoRA |

## LoRA configuration checklist

1. Bắt đầu với r=16, alpha=32 (mặc định an toàn cho hầu hết tác vụ)
2. Nhắm q_proj và v_proj trước (LoRA tối thiểu khả dụng)
3. Dùng tốc độ học 2e-4 cho QLoRA, 5e-5 cho LoRA fp16
4. Đặt lora_dropout=0.05
5. Huấn luyện 1-3 epoch (nhiều hơn có nguy cơ quá khớp)
6. Đánh giá mỗi 100 bước trên tập giữ riêng
7. Lưu checkpoint và chọn tốt nhất theo loss đánh giá

## Common mistakes

- Huấn luyện quá nhiều epoch (quá khớp sau epoch 2-3 trên bộ dữ liệu nhỏ)
- Dùng cùng tốc độ học với fine-tuning toàn phần (LoRA cần LR cao hơn)
- Quên đặt pad token (gây loss NaN với các mô hình Llama)
- Không đóng băng mô hình cơ sở (làm mất mục đích LoRA)
- Chỉ đánh giá trên dữ liệu huấn luyện (luôn giữ riêng 10-20% để đánh giá)
- Bỏ qua baseline prompt engineering (fine-tune một vấn đề prompting đã giải quyết)

## Quality verification

Sau huấn luyện, so sánh trên 200+ ví dụ giữ riêng:
1. Mô hình cơ sở với prompt tốt nhất (baseline)
2. Mô hình cơ sở với adapter LoRA (mô hình fine-tuned của bạn)
3. GPT-4 hoặc Claude với cùng prompt (trần)

Nếu mô hình LoRA không thắng baseline có prompt, dữ liệu huấn luyện hoặc cấu hình cần cải thiện, không phải thêm tính toán.

## Adapter management

- Giữ riêng adapter để phục vụ đa tác vụ (đổi adapter mỗi yêu cầu)
- Gộp adapter vào trọng số cơ sở để triển khai một tác vụ
- Lưu adapter trên Hugging Face Hub (10-100MB, dễ quản lý phiên bản và chia sẻ)
- Kiểm thử đầu ra mô hình đã gộp khớp đầu ra chưa gộp trước triển khai
- Dùng TIES-Merging hoặc DARE để kết hợp nhiều adapter thành một

## Debugging training

Nếu loss không giảm:
1. Kiểm tra tốc độ học (quá thấp cho LoRA, thử 2e-4)
2. Xác minh các lớp LoRA thực sự nhận gradient
3. Xác nhận trọng số mô hình cơ sở đã đóng băng
4. Kiểm tra định dạng dữ liệu (tokenizer phải khớp định dạng mô hình kỳ vọng)

Nếu loss giảm nhưng chất lượng đánh giá kém:
1. Vấn đề chất lượng dữ liệu huấn luyện (rác vào, rác ra)
2. Quá khớp (giảm epoch, tăng dropout, thêm dữ liệu)
3. Sai mô-đun đích (thêm lớp MLP cho tác vụ phức tạp)
4. Hạng quá thấp (thử r=32 hoặc r=64)
