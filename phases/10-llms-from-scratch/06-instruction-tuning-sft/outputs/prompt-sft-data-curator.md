---
name: prompt-sft-data-curator
description: Design and curate instruction datasets for supervised fine-tuning
version: 1.0.0
phase: 10
lesson: 6
tags: [sft, instruction-tuning, fine-tuning, data-curation, alignment]
---

# SFT Data Curator

Khi thiết kế một tập tinh chỉnh chỉ dẫn cho một năng lực cụ thể (sinh mã, toán, hội thoại, an toàn), dùng khung này để lập kế hoạch thu thập dữ liệu, định nghĩa tiêu chí chất lượng và cấu trúc pipeline huấn luyện.

## Input Requirements

Cung cấp:
- **Năng lực mục tiêu** (ví dụ "sinh mã Python", "Hỏi đáp y tế", "hội thoại nhiều lượt")
- **Mô hình cơ sở** (ví dụ Llama 3 8B, Mistral 7B, Qwen 2.5 72B)
- **Ngân sách** (giờ chú giải, chi phí API cho sinh tổng hợp)
- **Ưu tiên định dạng** (Alpaca, ShareGPT, ChatML)

## Step 1: Dataset Design

### Size Guidelines

| Mức chất lượng | Số ví dụ cần | Kết quả kỳ vọng |
|--------------|----------------|------------------|
| Nguyên mẫu nghiên cứu | 1,000-5,000 | Chất lượng LIMA: tương đương tập lớn hơn nếu ví dụ do chuyên gia viết |
| Production v1 | 10,000-50,000 | Mức Stanford Alpaca: tuân theo chỉ dẫn vững trên các tác vụ phổ biến |
| Production v2 | 50,000-200,000 | Mức Vicuna/Llama 2 Chat: nhiều lượt vững, bao phủ miền |

Chất lượng luôn thắng số lượng. 1,000 ví dụ do chuyên gia viết (LIMA, tháng 5 năm 2023) ngang các mô hình được huấn luyện trên 50,000+ ví dụ. Ưu tiên:

1. **Đa dạng** -- bao phủ toàn bộ phạm vi năng lực mục tiêu
2. **Chính xác** -- mọi phản hồi phải đúng sự thật
3. **Rõ ràng** -- phản hồi nên súc tích và có cấu trúc tốt
4. **Dải độ khó** -- bao gồm ví dụ dễ, trung bình và khó

### Diversity Checklist

Với một trợ lý tổng quát:
- Câu hỏi mở (20%)
- Hỏi đáp sự thật (20%)
- Viết sáng tạo (10%)
- Sinh mã (15%)
- Suy luận và toán (15%)
- Tóm tắt (10%)
- Tuân theo chỉ dẫn có ràng buộc (10%)

Điều chỉnh phần trăm cho mô hình riêng miền. Một trợ lý lập trình có thể phân bổ 60% cho sinh mã và 20% cho giải thích mã.

## Step 2: Data Format

### Alpaca Format (single-turn)

```json
{
  "instruction": "Write a function that reverses a string in Python.",
  "input": "",
  "output": "def reverse_string(s):\n    return s[::-1]"
}
```

Dùng khi: tác vụ một lượt, cặp chỉ dẫn-phản hồi đơn giản, tạo nguyên mẫu nhanh.

### ShareGPT Format (multi-turn)

```json
{
  "conversations": [
    {"from": "system", "value": "You are a Python expert."},
    {"from": "human", "value": "How do I reverse a string?"},
    {"from": "gpt", "value": "Use slicing: s[::-1]"},
    {"from": "human", "value": "What about for a list?"},
    {"from": "gpt", "value": "Same syntax works: my_list[::-1]"}
  ]
}
```

Dùng khi: ứng dụng hội thoại, ngữ cảnh nhiều lượt quan trọng.

### ChatML Format (with special tokens)

```
<|im_start|>system
You are a Python expert.<|im_end|>
<|im_start|>user
How do I reverse a string?<|im_end|>
<|im_start|>assistant
Use slicing: s[::-1]<|im_end|>
```

Dùng khi: nhắm các mô hình dùng ChatML nguyên bản (Qwen, Yi).

## Step 3: Quality Criteria

### Per-Example Checks

1. **Sự liên quan của phản hồi**: Phản hồi có thực sự trả lời chỉ dẫn không?
2. **Độ chính xác sự thật**: Mọi tuyên bố có thể xác minh và đúng không?
3. **Tính đầy đủ**: Phản hồi có giải quyết đầy đủ chỉ dẫn không?
4. **Tính súc tích**: Cùng thông tin có thể được truyền đạt bằng ít từ hơn không?
5. **Nhất quán định dạng**: Phản hồi có theo phong cách kỳ vọng không?

### Red Flags (reject the example)

- Phản hồi tự mâu thuẫn
- Phản hồi chứa nội dung có hại mà không từ chối
- Phản hồi ảo giác sự thật hoặc trích dẫn
- Chỉ dẫn mơ hồ và phản hồi không làm rõ
- Phản hồi là một bản sao diễn đạt lại chỉ dẫn

### Dataset-Level Checks

- Không quá 5% ví dụ từ bất kỳ một nguồn/template nào
- Ít nhất 80% token phản hồi có nghĩa (không phải nội dung lấp chỗ)
- Độ dài phản hồi trung bình 50-200 token (tránh quá ngắn hoặc quá dài)
- Đa dạng system prompt: ít nhất 10 system prompt khác nhau được đại diện

## Step 4: Training Configuration

| Tham số | Phạm vi đề xuất | Ghi chú |
|-----------|------------------|-------|
| Tốc độ học | 1e-5 đến 5e-5 | Thấp hơn cho mô hình lớn hơn (1e-5 cho 70B, 5e-5 cho 7B) |
| Epoch | 1-3 | Theo dõi mất mát xác thực, dừng ở dấu hiệu tăng đầu tiên |
| Kích thước batch | 32-128 | Mở rộng bằng tích lũy gradient nếu bị giới hạn GPU |
| Khởi động | 0-5% số bước | Ít quan trọng hơn huấn luyện trước |
| Suy giảm trọng số | 0.0-0.1 | Tùy chọn cho các lần tinh chỉnh ngắn |
| Che mất mát | Chỉ token phản hồi | Che token chỉ dẫn và system prompt |
| Trộn dữ liệu huấn luyện trước | 2-5% | Trộn văn bản thô để ngăn quên thảm khốc |

## Step 5: Evaluation Protocol

Sau huấn luyện, đánh giá trên:

1. **Tỷ lệ tuân theo chỉ dẫn**: Phần trăm prompt kiểm thử mà mô hình tạo phản hồi liên quan, đầy đủ
2. **Điểm quên**: Perplexity trên một corpus văn bản tổng quát giữ lại so với mô hình cơ sở
3. **Tuân thủ định dạng**: Phần trăm phản hồi theo định dạng chat kỳ vọng
4. **MT-Bench hoặc AlpacaEval**: Benchmark tiêu chuẩn cho mô hình được tinh chỉnh chỉ dẫn
5. **Đánh giá riêng miền**: Đánh giá tùy chỉnh cho năng lực mục tiêu

### Warning Signs

- Mất mát xác thực tăng sau epoch 1: bạn đang overfit, giảm epoch hoặc tăng dữ liệu
- Điểm quên tăng > 15%: tốc độ học quá cao hoặc quá nhiều epoch
- Mô hình tái tạo nguyên văn ví dụ huấn luyện: overfit nghiêm trọng, cần dữ liệu đa dạng hơn
- Mô hình từ chối chỉ dẫn lành tính: huấn luyện quá nhiều dữ liệu an toàn, cân bằng lại tập dữ liệu
