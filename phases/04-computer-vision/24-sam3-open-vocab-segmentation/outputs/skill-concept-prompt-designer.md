---
name: skill-concept-prompt-designer
description: Turn user utterances into well-formed SAM 3 concept prompts with splitting, disambiguation, and fallbacks
version: 1.0.0
phase: 4
lesson: 24
tags: [sam3, open-vocab, prompt-engineering, segmentation]
---

# Concept Prompt Designer

Accuracy SAM 3 phụ thuộc nhiều cách diễn đạt prompt khái niệm. Skill này chuẩn hóa phát ngôn tự do người dùng thành prompt SAM 3 xử lý tốt.

## When to use

- Xây giao diện nhận truy vấn đối tượng ngôn ngữ tự nhiên.
- Cung cấp SAM 3 qua API nơi bên gọi phía trước gửi câu.
- Gỡ lỗi các kết quả khớp SAM 3 kém — thường prompt sai dạng, không phải mô hình.

## Inputs

- `utterance`: chuỗi thô người dùng.
- `context`: gợi ý lĩnh vực tùy chọn (ví dụ "giám sát", "y tế", "bán lẻ").
- `max_concepts`: số khái niệm tối đa trích mỗi phát ngôn; mặc định 5.

## Rules SAM 3 prefers

- **Cụm danh từ ngắn, không phải câu.** `"cat"` thắng `"there is a cat"`.
- **Danh từ cụ thể.** `"skateboard"` thắng `"thing to ride on"`.
- **Từ bổ nghĩa ngay trước danh từ.** `"red car"` thắng `"car that is red"`.
- **Chữ thường.** SAM 3 vững nhưng theo thực nghiệm tốt hơn một chút trên đầu vào chữ thường.
- **Số ít hoặc số nhiều.** Cả hai hoạt động; số nhiều giúp khi kỳ vọng nhiều thực thể.

## Steps

1. **Token hóa theo dấu phân cách phổ biến** — dấu phẩy, chấm phẩy, "và", "hoặc", "&".
2. **Bỏ tiền tố thừa** — "tìm", "cho tôi thấy", "phân đoạn", "phát hiện", "định vị", "a", "an", "the".
3. **Giữ các bổ nghĩa giới từ** chỉ khi trực quan — `"striped red umbrella"` có, `"umbrella from yesterday"` không (`"from yesterday"` không nằm trong ảnh).
4. **Khử mơ hồ các xung đột** bằng `context` tùy chọn:
   - `"window"` trong ngữ cảnh giám sát -> `"building window"`.
   - `"window"` trong ngữ cảnh y tế -> thường là lỗi; đề nghị người dùng làm rõ.
5. **Dự phòng** về đúng chuỗi nếu tách không được khái niệm nào *và* phát ngôn chứa ít nhất một danh từ cụ thể. Nếu không thể trích danh từ cụ thể, không xuất khái niệm — chỉ trả cảnh báo và yêu cầu người dùng làm rõ (xem Rules).
6. **Giới hạn ở `max_concepts`.** Nếu trích nhiều khái niệm hơn bên gọi yêu cầu, giữ `max_concepts` đầu theo thứ tự phát ngôn và xuất phần còn lại dưới `dropped` với lý do `"exceeded max_concepts"`. Điều này giữ độ trễ bị chặn khi người dùng dán liệt kê dài.

## Output format

```
[designed prompts]
  utterance:    <original>
  concepts:     ["concept_1", "concept_2", ...]
  dropped:      ["filler_1", ...]
  warnings:     ["concept too abstract", "may match many classes", ...]

[sam3 calls]
  For each concept run: sam3.detect(image, concept)
  Merge outputs with distinct concept tags per detection.
```

## Examples

```
in:  "can you find me a cat or two dogs?"
out: ["cat", "dogs"]
dropped: ["can you find me", "a", "or two", "?"]
note: "dogs" kept plural because the utterance says "two dogs" — plural hint preserved.

in:  "segment the big red truck and the blue sedan"
out: ["big red truck", "blue sedan"]
dropped: ["segment", "the", "and"]

in:  "thing near the door"
out: ["door"]
warnings: ["'thing' is too abstract for SAM 3; fell back to 'door'"]

in:  "striped red umbrella, green hat, pink balloon"
out: ["striped red umbrella", "green hat", "pink balloon"]
```

## Rules

- Không bao giờ truyền câu dài hơn 8 từ vào SAM 3 — accuracy giảm trên mức đó.
- Khi phát ngôn không có danh từ cụ thể trích được, không chạy SAM 3; trả cảnh báo và hỏi làm rõ.
- Không tách theo dấu câu trong chuỗi trích dẫn; giữ `"black and white cat"` như một khái niệm nếu được trích dẫn.
- Luôn ghi phát ngôn gốc và các khái niệm suy ra để gỡ lỗi production.
