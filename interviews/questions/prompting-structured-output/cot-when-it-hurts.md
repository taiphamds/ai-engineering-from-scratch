---
id: cot-when-it-hurts
title: Where step-by-step prompting helps and where it costs
card: prompting-structured-output
kind: concept
level: 1
roles: [applied-ai-engineer, agentic-ai-engineer, ai-developer-relations-engineer]
rounds: [screen, ml-breadth]
tags: [chain-of-thought, reasoning, latency, cost]
minutes: 7
lessons: [phases/11-llm-engineering/02-few-shot-cot]
manuals: []
practice: []
cheatsheet: [prompt-engineering]
related: [prompting-structured-output/self-consistency-at-temperature-zero, prompting-structured-output/few-shot-example-count]
updated: 2026-11-03
---

Nhóm của bạn thêm "nghĩ từng bước" vào mọi prompt trong sản phẩm, gồm một bộ phân loại khối lượng cao và các lời gọi đến một mô hình suy luận. Điều đó giúp ở đâu, gây hại ở đâu, và tại sao?

## Short answer

Nó giúp trên các vấn đề nhiều bước, nơi mỗi token suy luận thành ngữ cảnh cho token tiếp theo và mô hình tính đường đến câu trả lời. Nó gây hại trên nhớ lại đơn giản và phân loại một bước, nơi nó thêm 50 đến 200 token suy luận mỗi truy vấn không có lợi ích, và trên các mô hình suy luận, vốn đã chạy một chain of thought nội bộ và có thể tệ hơn với chỉ dẫn bổ sung. Chọn kỹ thuật theo tác vụ từ yêu cầu độ chính xác, ngân sách độ trễ và chi phí.

## Full answer

### Why it works

Một transformer không có chuỗi nhìn thấy phải nén toàn bộ suy luận vào trạng thái ẩn của một lượt forward. Với chuỗi, các bước trung gian là token, và mỗi token mở rộng ngữ cảnh cho token tiếp theo. Trên benchmark toán tiểu học, bài học cho thấy một mô hình chuyển từ 78 phần trăm zero-shot lên 91 phần trăm chỉ với cụm từ và lên 95 phần trăm với các ví dụ có lời giải.

### Where it does not pay

- **Nhớ lại sự thật đơn giản và phân loại một bước.** Không có gì để suy luận qua, và chuỗi là chi phí thuần.
- **Các tác vụ thông lượng cao, độ phức tạp thấp.** 50 đến 200 token thêm trên mọi lời gọi là chi phí và độ trễ.
- **Các mô hình suy luận.** Chúng chạy chuỗi nội bộ trước khi trả lời; chỉ dẫn dư thừa và đôi khi phản tác dụng.
- **Các vấn đề tìm kiếm rộng.** Trên câu đố số học của bài học, prompting tiêu chuẩn giải 7.3 phần trăm trường hợp, một chuỗi đơn giải 4.0 phần trăm, và một tìm kiếm cây trên các nhánh giải 74 phần trăm.

### Choose per task

| Kỹ thuật | Lời gọi | Chi phí token bổ sung | Phù hợp |
|---|---|---|---|
| Zero-shot | 1 | không có | các tác vụ đơn giản |
| Few-shot | 1 | 200 đến 500 token | khớp định dạng |
| Chuỗi zero-shot | 1 | 50 đến 200 token | tăng suy luận nhanh |
| Chuỗi few-shot | 1 | 300 đến 600 token | lời gọi đơn tốt nhất |
| Self-consistency với 5 mẫu | 5 | token gấp năm | suy luận hệ trọng |

## Follow-ups

- **Level 1:** Tại sao viết các bước ra tăng độ chính xác? Expected: mỗi token suy luận thành ngữ cảnh cho token tiếp theo, nên mô hình tính câu trả lời theo bước thay vì trong một lượt.
- **Level 2:** Bộ phân loại trả gì cho cụm từ thêm? Expected: 50 đến 200 token suy luận mỗi truy vấn, ở khối lượng lớn là chi phí và độ trễ mà không tăng độ chính xác.
- **Level 2:** Tại sao bỏ cụm từ cho một mô hình suy luận? Expected: nó đã chạy chuỗi nội bộ trước câu trả lời, nên chỉ dẫn dư thừa và đôi khi phản tác dụng.
- **Level 3:** Có tác vụ nào một chuỗi đơn tệ hơn một câu trả lời thường? Expected: có, câu đố tìm kiếm của bài học, nơi chuỗi giải ít trường hợp hơn prompting tiêu chuẩn và một tìm kiếm cây giải phần lớn.

## Wrong answers

- "Nó không bao giờ gây hại, trường hợp tệ nhất là trung tính." Nó tốn token trên mọi lời gọi, và giảm độ chính xác trên câu đố tìm kiếm rộng và trên các mô hình suy luận.
- "Few-shot và chain of thought là cùng thứ." Few-shot cho ví dụ; chain of thought cho suy luận; hai thứ kết hợp thành few-shot chain of thought.
- "Luôn chạy nó ở temperature không." Một chuỗi đơn ở không ổn, nhưng lấy mẫu nhiều chuỗi cho một phiếu bầu cần temperature trên không, nếu không mọi mẫu giống hệt.

## Taught in

Bài học [few-shot và chain-of-thought](../../../phases/11-llm-engineering/02-few-shot-cot/) đưa ra cơ chế, bảng benchmark, các trường hợp chuỗi gây hại và so sánh kỹ thuật.
