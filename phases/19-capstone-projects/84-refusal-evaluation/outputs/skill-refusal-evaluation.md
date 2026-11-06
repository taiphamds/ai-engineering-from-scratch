---
name: skill-refusal-evaluation
description: Two-sided refusal metrics with calibration and per-category breakdown over a labeled prompt corpus
version: 1.0.0
phase: 19
lesson: 84
tags: [safety, evaluation, calibration]
---

# Refusal Evaluation

Một corpus được gắn nhãn các prompt an toàn và không an toàn đi qua một hoặc nhiều chính sách mô hình. Các đầu ra được phân loại thành từ chối hoặc đáp án. Framework trả về:

- under-refusal: các prompt được gắn nhãn không an toàn đã được trả lời / tổng không an toàn
- over-refusal: các prompt được gắn nhãn an toàn đã bị từ chối / tổng an toàn
- accuracy: (các từ chối đúng + các đáp án đúng) / tổng
- ECE: sai số hiệu chuẩn kỳ vọng được chia nhóm theo độ tự tin được nêu
- từ chối thiếu mức theo hạng mục: được nối với hệ phân loại bài 82

## Plugging in a real model

LLM giả lập là một đối tượng có thể gọi `(prompt: str) -> str`. Thay nó bằng một lớp bọc HTTP trả về đầu ra mô hình và nhúng một thẻ độ tự tin (hoặc sửa `parse_confidence` để đọc bất cứ thứ gì nhà cung cấp của bạn cung cấp). Mọi thứ khác giữ nguyên.

## Artifact

`outputs/refusal_eval_report.json` chứa các chỉ số theo chính sách. Bài 87 đọc báo cáo này để đặt các ngưỡng.
