---
id: constrained-decoding-how
title: How a grammar edits the logits and why it can be faster
card: tokenization-decoding
kind: concept
level: 2
roles: [applied-ai-engineer, agentic-ai-engineer, forward-deployed-ai-engineer]
rounds: [ml-depth, system-design]
tags: [constrained-decoding, logit-processor, json-schema, finite-state-machine, structured-output]
minutes: 8
lessons: [phases/05-nlp-foundations-to-advanced/20-structured-outputs-constrained-decoding]
manuals: []
practice: []
cheatsheet: [structured-outputs]
related: []
updated: 2026-11-03
---

Một prompt phân loại yêu cầu một trong ba nhãn và mô hình trả lời bằng một đoạn văn, nên parser gặp sự cố. Có ba lớp sửa. Giải thích lớp mạnh nhất hoạt động thế nào ở cấp logits, và tại sao nó thường nhanh hơn sinh tự do, không phải chậm hơn.

## Short answer

Prompting hỏi lịch sự, structured-output API của một nhà cung cấp làm trên server, và constrained decoding làm cục bộ bằng cách chỉnh logits. Ở mỗi bước, một bộ xử lý logit tính các token từ vựng nào có thể tiến ngữ pháp mục tiêu, một JSON schema, một regex hoặc một ngữ pháp phi ngữ cảnh được biên dịch thành một máy trạng thái, và đặt mọi logit khác thành âm vô cùng, nên softmax chỉ đặt xác suất trên các phần tiếp nối hợp lệ và một đầu ra không hợp lệ không thể đạt tới. Nó có thể nhanh hơn vì không gian tìm kiếm thu hẹp và vì các token mà ngữ pháp ép buộc, như một tên khóa cố định, được phát ra không cần một bước mô hình.

## Full answer

### The three layers

1. **Prompting.** "Chỉ trả về đối tượng JSON." Bài học đặt mức này ở khoảng 80 phần trăm tuân thủ trên các mô hình mạnh và thấp hơn trên các mô hình nhỏ. Không phải một hợp đồng.
2. **Đầu ra có cấu trúc gốc.** Provider chạy ràng buộc phía họ. Đáng tin cậy cho các schema được hỗ trợ; khóa vào provider đó.
3. **Constrained decoding.** Ràng buộc chạy trong vòng lặp giải mã riêng và hoạt động với bất kỳ mô hình cục bộ nào.

### The loop

```python
def generate_constrained(model, tokenizer, prompt, fsm):
    ids = tokenizer.encode(prompt)
    state = fsm.initial_state
    while not fsm.is_accept(state):
        logits = model.next_token_logits(ids)
        valid = fsm.valid_tokens(state, tokenizer)
        logits = mask_logits(logits, valid)
        tok = sample(logits)
        ids.append(tok)
        state = fsm.transition(state, tok)
    return tokenizer.decode(ids)
```

Máy trạng thái theo dõi ngữ pháp đã được thỏa mãn bao nhiêu. `valid_tokens` trả về các token từ vựng giữ máy trên một đường dẫn chấp nhận; mask đặt phần còn lại thành âm vô cùng. Từ vựng khoảng 100k token, nên mask được tính trước theo từng trạng thái.

### State machine or grammar engine

Một regex hoặc một JSON schema phẳng biên dịch thành một máy trạng thái hữu hạn với một phép tra các token hợp lệ theo từng trạng thái trong thời gian hằng số. Các schema đệ quy, các bình luận lồng nhau hoặc một cây cú pháp, cần một bộ máy ngữ pháp phi ngữ cảnh, xử lý đệ quy với overhead giải mã gần không trong các triển khai hiện tại. Các server suy luận cung cấp cả hai dưới dạng guided decoding.

### Why it can be faster

Ít token ứng viên hơn nghĩa là một tìm kiếm hiệu dụng nhỏ hơn ở mỗi bước. Quan trọng hơn, các đoạn dài của đầu ra được ngữ pháp xác định hoàn toàn: dấu ngoặc nhọn mở, một khóa có dấu ngoặc kép, dấu hai chấm. Một triển khai tốt bỏ mô hình cho các token đó và chỉ gọi nó ở nơi ngữ pháp để lại một lựa chọn.

### The library that does not touch logits

Một client dựa trên thử lại đưa schema vào prompt, parse đầu ra, và thử lại khi xác thực thất bại, mặc định 3 lần. Nó hoạt động qua các provider, và mỗi lần thử lại tốn độ trễ và tiền. Nó là một cơ chế khác, không phải một phiên bản yếu hơn của cùng cơ chế.

## Follow-ups

- **Level 2:** Khi nào một máy trạng thái hữu hạn không đủ? Expected: cho các schema đệ quy; máy làm phẳng đệ quy tới một độ sâu cố định, và cần một bộ máy ngữ pháp phi ngữ cảnh.
- **Level 3:** Chế độ JSON thuần của một provider bảo đảm gì, và không bảo đảm gì? Expected: cú pháp JSON hợp lệ, không phải tuân thủ schema của bạn; luôn gửi một schema đầy đủ.
- **Level 3:** Thư viện thử lại khác bộ xử lý logit bằng cách nào? Expected: nó không bao giờ thay đổi phân phối của mô hình; nó xác thực sau đó và thử lại, thêm độ trễ và chi phí mỗi lỗi.
- **Level 4:** Schema có một enum với 10,000 lựa chọn và biên dịch hết thời gian chờ. Bạn làm gì? Expected: dự đoán một danh sách ngắn ứng viên bằng một retriever trước, rồi ràng buộc giải mã vào các ứng viên đó.

## Wrong answers

- "Constrained decoding khiến câu trả lời đúng." Nó khiến câu trả lời hợp lệ với ngữ pháp; một câu trả lời sai đúng định dạng vẫn qua.
- "Kiểm tra ngữ pháp ở mọi token khiến sinh chậm hơn." Các tập token hợp lệ được tính trước theo từng trạng thái, và các token bắt buộc bỏ qua mô hình, nên nó thường nhanh hơn.
- "Đủ ví dụ trong prompt đạt tuân thủ đầy đủ." Con số của bài học cho chỉ prompting là khoảng 80 phần trăm; một hợp đồng cần logits hoặc server.

## Taught in

[Bài học structured outputs](../../../phases/05-nlp-foundations-to-advanced/20-structured-outputs-constrained-decoding/) xây bộ xử lý logit và so sánh ba lớp.
