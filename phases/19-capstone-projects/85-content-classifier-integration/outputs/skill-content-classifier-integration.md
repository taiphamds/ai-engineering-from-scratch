---
name: skill-content-classifier-integration
description: Three output-side classifiers (toxicity, PII, instruction-leakage) behind a single severity router with block, redact, warn, log actions
version: 1.0.0
phase: 19
lesson: 85
tags: [safety, classifier, output-filter]
---

# Content Classifier Integration

Ba bộ phân loại, một bộ định tuyến, bốn hành động.

## Verdict structure

```text
ClassifierVerdict
  name: str
  severity: none | low | medium | high
  score: float in [0, 1]
  findings: list[str]
```

## Action table

| Mức độ nghiêm trọng | Hành động | Hiệu ứng |
|---|---|---|
| high | block | đầu ra được thay bằng một từ chối chính sách |
| medium | redact | các bộ che theo bộ phân loại được áp dụng theo thứ tự |
| low | warn | đầu ra được cung cấp với một thông báo nhẹ được thêm |
| none | log | đầu ra được cung cấp không đổi, kết luận được ghi nhật ký |

## Per-classifier behavior

- toxicity - các từ quấy rối với ranh giới khoảng trắng và một kiểm tra phủ định cửa sổ trái nhỏ; che thành `[redacted-language]`
- pii - email, điện thoại, SSN, thẻ được xác thực Luhn, IPv4; mức nghiêm trọng tăng cho SSN và thẻ; che mỗi hình thức thành một thẻ
- instruction-leakage - cosine trigram so với một prompt hệ thống đã biết; mức nghiêm trọng biến thiên theo chồng lấn; che dòng prompt hệ thống đầu tiên

## Artifact

`outputs/classifier_report.json` mang động từ hành động, mức độ nghiêm trọng, đầu ra được che, và danh sách kết luận đầy đủ theo trường hợp.
