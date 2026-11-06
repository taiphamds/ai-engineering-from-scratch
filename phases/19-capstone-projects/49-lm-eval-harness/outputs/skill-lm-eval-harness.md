---
name: lm-eval-harness
description: Minimal language model evaluation harness with JSONL task spec, five metrics, swappable adapter, and leaderboard JSON output.
version: 1.0.0
phase: 19
lesson: 49
tags: [evaluation, metrics, leaderboard, harness]
---

## When to use

So sánh hai mô hình, hai checkpoint, hoặc hai mẫu prompt với một tập tác vụ cố định. Bất cứ thứ gì được cung cấp và bạn cần giám sát theo thời gian.

## Task spec

Một dòng JSONL mỗi ví dụ:

```json
{"id": "ex-001", "prompt": "...", "targets": ["..."], "metric": "exact_match", "extras": {}}
```

Mọi ví dụ trong một file dùng chung một chỉ số. Tên file là tên tác vụ.

## Metrics

| Chỉ số | Chữ ký | Dùng cho |
|--------|-----------|---------|
| exact_match | chuẩn hóa chữ thường + khoảng trắng, so bằng | Số học, các đáp án sự kiện ngắn |
| substring_contains | đích phải xuất hiện trong dự đoán được chuẩn hóa | Sinh dạng tự do với các từ neo |
| multiple_choice | khớp chữ cái đầu | Các câu hỏi kiểu A/B/C/D |
| rouge_l | F1 LCS trên văn bản được phân tách token | Tóm tắt, diễn đạt lại |
| code_exec | chạy `f` của dự đoán trên io_pairs, đếm các kết quả khớp | Sinh mã |

Mọi chỉ số trả về float trong [0.0, 1.0]. Điểm tác vụ là trung bình.

## Adapter

```python
class Adapter(Protocol):
    name: str
    def generate(self, prompts: list[str]) -> list[str]: ...
```

Adapter là mã đặc thù mô hình duy nhất.

## Leaderboard JSON

Chuỗi schema, mốc thời gian, các điểm và độ trễ theo tác vụ, trung bình tổng thể. Bao gồm các bản ghi theo ví dụ khi so sánh các lần chạy để các lỗi thoái lui ở mức dự đoán có thể thấy.

## Failure modes

- Chỉ số trả về ngoài [0, 1]: điểm tổng thể trở nên không thể diễn giải.
- Trộn các chỉ số trong một file tác vụ: khẳng định kích hoạt; giữ một chỉ số mỗi file.
- code_exec không có không gian tên bị hạn chế: thực thi mã tùy ý.
- Không có chuỗi schema: phát triển định dạng phá các bảng điều khiển hạ nguồn.
