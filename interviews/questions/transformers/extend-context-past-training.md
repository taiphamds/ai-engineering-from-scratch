---
id: extend-context-past-training
title: Take a model from 8K to 128K
card: transformers
kind: design
level: 3
roles: [inference-engineer, applied-ai-engineer]
rounds: [system-design, ml-depth]
tags: [long-context, rope, yarn, positional-encoding, fine-tuning]
minutes: 12
lessons: [phases/07-transformers-deep-dive/04-positional-encoding, phases/19-capstone-projects/32-token-positional-embeddings]
manuals: []
practice: [rope]
cheatsheet: [positional-encoding]
related: [transformers/rope-relative-from-absolute, transformers/permutation-blind-attention]
updated: 2026-11-03
---

Một mô hình được huấn luyện với ngữ cảnh 8K token. Sản phẩm giờ cần 128K. Bạn có ngân sách fine-tuning khiêm tốn và không có ngân sách pretrain lại. Trình bày các lựa chọn theo cách mô hình mã hóa vị trí, và đưa ra kế hoạch bạn sẽ chạy.

## Short answer

Câu trả lời phụ thuộc vào cơ chế vị trí, nên đọc cấu hình trước. Bảng vị trí tuyệt đối được học không có hàng nào vượt độ dài đã huấn luyện và không thể mở rộng nếu không có tham số mới. Với rotary embedding, bạn điều chỉnh cơ số hoặc nội suy vị trí, bằng NTK-aware scaling, YaRN hoặc LongRoPE, và fine-tune trên chuỗi dài; tham chiếu của bài học là một họ mô hình đã đi từ 8K lên 128K theo cách này. Linear-bias attention ngoại suy theo thiết kế, nhưng bạn không thể chuyển một mô hình đã huấn luyện sang nó mà không tốn gì.

## Full answer

### Option by scheme

| Cơ chế trong checkpoint | Có thể đạt 128K không? | Cách làm |
|---|---|---|
| Bảng tuyệt đối được học | Không nếu không có hàng mới | Thêm hàng và huấn luyện chúng, hoặc huấn luyện lại |
| Sinusoid cố định | Công thức mở rộng được, mô hình thì không | Mô hình chưa bao giờ thấy các pha đó; dự kiến chất lượng kém |
| Rotary | Có | Điều chỉnh cơ số hoặc nội suy vị trí, rồi fine-tune |
| Độ lệch tuyến tính | Có theo thiết kế | Đã ngoại suy; một lựa chọn lúc huấn luyện |

### The rotary toolbox

- **Nội suy vị trí cộng fine-tuning.** Thu nhỏ vị trí theo hệ số mở rộng để các góc nằm trong khoảng đã huấn luyện, rồi fine-tune trong 1 đến 5B token. Đơn giản và hiệu quả.
- **NTK-aware scaling.** Điều chỉnh cơ số thành `base * scale_factor ** (d / (d - 2))` khi đi từ 4K lên 16K và hơn nữa, để các cặp tần số cao không bị ép.
- **YaRN.** Sự pha trộn nội suy và ngoại suy theo từng chiều giữ nguyên entropy của attention trên ngữ cảnh dài; nó cần một giai đoạn fine-tuning.
- **LongRoPE.** Tìm kiếm trên các hệ số tỷ lệ theo từng chiều; được dùng cho ngữ cảnh rất dài.

### The plan

1. Xác nhận cơ chế từ cấu hình mô hình và đọc khối rope scaling hiện tại.
2. Chọn YaRN hoặc nội suy vị trí, đặt hệ số cho 128K, và xây dựng tập fine-tuning chuỗi dài.
3. Trước huấn luyện, đo perplexity trên các chuỗi dài hơn độ dài đã huấn luyện, có và không có scaling, theo cách bài tập của bài học làm ở các độ dài 256 và 1024.
4. Fine-tune, rồi đo lại ở độ dài mục tiêu và độ dài ban đầu, để một cải thiện trên đầu vào dài không che giấu suy giảm trên đầu vào ngắn.
5. Lập ngân sách bộ nhớ. Cache key và value tăng tuyến tính theo ngữ cảnh, và 128K bằng mười sáu lần 8K.

### What to tell the product team

Cơ chế vị trí là cổng quyết định. Mô hình rotary cho bạn một nút điều chỉnh rõ ràng và một công việc fine-tuning ngắn. Mô hình có bảng được học hoặc sinusoid cần huấn luyện lại hoặc một mô hình khác.

## Follow-ups

- **Level 3:** Tại sao mô hình rotary thất bại khi bạn chỉ chạy nó ở 128K mà không thay đổi gì? Expected: các cặp tọa độ quay nhanh đạt các góc mô hình chưa bao giờ thấy, nên điểm số ở khoảng cách xa là nhiễu.
- **Level 3:** Bạn nhất quyết yêu cầu hai phép đo nào trước khi phát hành? Expected: perplexity hoặc chất lượng tác vụ ở độ dài mới, và cùng phép đo ở độ dài ban đầu để phát hiện suy giảm.
- **Level 4:** Nhóm đề xuất chuyển mô hình sang linear-bias attention vì nó ngoại suy tốt. Câu trả lời của bạn? Expected: đó là lựa chọn lúc huấn luyện; checkpoint được huấn luyện với phép quay không thể đổi sang độ lệch điểm số mà không huấn luyện lại.
- **Level 4:** Điều gì hỏng ở phía phục vụ tại 128K dù chất lượng vẫn tốt? Expected: bộ nhớ cho key và value của từng token, tăng theo ngữ cảnh; stack attention cần grouped-query hoặc latent attention và kernel chia ô.

## Wrong answers

- "Đặt vị trí tối đa trong cấu hình cao hơn rồi phát hành." Bảng được học không có hàng cho vị trí mới, và mô hình rotary cần điều chỉnh cơ số cùng một lượt fine-tune.
- "Sinusoid mở rộng đến độ dài bất kỳ, nên mô hình hoạt động." Công thức mở rộng; mô hình chưa bao giờ được huấn luyện để đọc các pha đó và chất lượng giảm.
- "Nội suy vị trí không cần huấn luyện." Công thức của bài học là thu nhỏ vị trí rồi fine-tune trong 1 đến 5B token.

## Taught in

[Bài học về mã hóa vị trí](../../../phases/07-transformers-deep-dive/04-positional-encoding/) liệt kê các thủ thuật scaling và việc mở rộng lên 128K, còn [capstone embedding](../../../phases/19-capstone-projects/32-token-positional-embeddings/) giải thích tại sao bảng được học có giới hạn.
