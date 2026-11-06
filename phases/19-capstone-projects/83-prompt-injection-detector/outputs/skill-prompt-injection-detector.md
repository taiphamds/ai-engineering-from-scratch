---
name: skill-prompt-injection-detector
description: Layered detector pipeline that returns a category and confidence for any prompt, with measurable precision and recall
version: 1.0.0
phase: 19
lesson: 83
tags: [safety, detector, prompt-injection]
---

# Prompt Injection Detector

Một bộ phát hiện ở đây là một hàm từ prompt sang kết luận. Một kết luận mang một hạng mục từ hệ phân loại bài 82 và một độ tin cậy trong [0, 1].

## Pipeline

1. Chuẩn hóa - bỏ các ký tự độ rộng bằng không, hoàn tác các ký tự đồng hình, giải mã base64/hex, quy các chữ số leet-speak, thử rot13 với một kiểm tra hợp lý từ phổ biến.
2. Các quy tắc chuỗi con - các chuỗi cần tìm viết tay như `ignore previous`, `from now on you are`, `decode this base64`.
3. Các quy tắc regex - các mẫu ở mức token như `\bignor\w*\s+(all|prior|previous|earlier)\b`.

Tổng hợp giữ điểm tối đa theo hạng mục và trả về hạng mục có điểm lớn nhất, hoặc `benign` nếu không gì kích hoạt.

## Adding a rule

Chỉnh sửa `code/rules.py`. Một quy tắc là một từ điển với `name`, `category` (một trong sáu hạng mục hệ phân loại), `score` (float 0 đến 1), và một trong `substring` hoặc `regex`. Chạy lại `main.py` để thấy tác động lên precision và recall theo hạng mục.

## Artifact

`outputs/detector_report.json` là file chỉ số theo hạng mục. Cổng đầu cuối trong bài 87 đọc nó để đặt ngưỡng độ tin cậy.
