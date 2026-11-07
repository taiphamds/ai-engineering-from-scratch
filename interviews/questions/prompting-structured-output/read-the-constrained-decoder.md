---
id: read-the-constrained-decoder
title: Read the constrained generation loop
card: prompting-structured-output
kind: code-reading
level: 2
roles: [applied-ai-engineer, inference-engineer, agentic-ai-engineer]
rounds: [coding, ml-depth]
tags: [constrained-decoding, logit-processor, fsm, code-reading]
minutes: 8
lessons: [phases/05-nlp-foundations-to-advanced/20-structured-outputs-constrained-decoding]
manuals: []
practice: []
cheatsheet: [structured-outputs]
related: [prompting-structured-output/answer-before-reasoning, prompting-structured-output/json-mode-is-not-a-schema]
updated: 2026-11-03
---

Đọc vòng lặp sinh có ràng buộc này từ bài học. Giải thích mask làm gì với các xác suất, trạng thái của máy ghi lại điều gì, và tại sao vòng lặp cuối cùng có thể nhanh hơn sinh không ràng buộc.

```python
def mask_logits(logits, valid_token_ids):
    mask = [float("-inf")] * len(logits)
    for tid in valid_token_ids:
        mask[tid] = logits[tid]
    return mask


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

## Short answer

Mask đặt logit của mọi token không hợp lệ thành âm vô cùng, nên sau softmax các token đó có xác suất bằng không và bộ lấy mẫu chỉ có thể chọn một token giữ đầu ra trong ngữ pháp. Máy giữ vị trí trong ngữ pháp đã đạt tới cho đến nay, và `valid_tokens` trả về các token đưa nó tiến lên mà không rời khỏi một đường dẫn chấp nhận. Nó có thể nhanh hơn vì không gian tìm kiếm thu hẹp, và vì một vị trí chỉ có một token hợp lệ hoàn toàn không cần gọi mô hình.

## Full answer

### Walk the loop

1. Mã hóa prompt và khởi động máy ở trạng thái ban đầu.
2. Cho đến khi máy chấp nhận: yêu cầu mô hình cung cấp logits của token tiếp theo trên toàn bộ từ vựng.
3. Hỏi máy những id token nào hợp lệ trong trạng thái hiện tại.
4. Thay mọi logit khác bằng âm vô cùng; các logit hợp lệ giữ nguyên giá trị.
5. Lấy mẫu từ các logits đã áp mask, thêm token, và chuyển máy sang trạng thái tiếp theo.
6. Giải mã các id.

Phần nằm giữa mô hình và bộ lấy mẫu là bộ xử lý logit. Không có gì trong mô hình thay đổi; chỉnh sửa áp dụng cho logits của một bước.

### Where the valid set comes from

Một ngữ pháp đã biên dịch. Một máy trạng thái hữu hạn được xây dựng từ regex hoặc JSON Schema cho phép tra cứu các token hợp lệ theo từng trạng thái trong thời gian hằng số. Một bộ máy ngữ pháp phi ngữ cảnh xử lý đệ quy mà máy hữu hạn không thể biểu diễn. Các máy chủ suy luận cung cấp cùng ý tưởng dưới dạng guided decoding, với các chế độ JSON, regex, lựa chọn và ngữ pháp.

### Why it can run faster

Hai lý do từ bài học. Không gian tìm kiếm token tiếp theo thu hẹp. Và một triển khai thông minh bỏ qua lệnh gọi mô hình cho các token bắt buộc: khi ngữ pháp chỉ để lại đúng một token hợp lệ, chẳng hạn phần khung của tên khóa, token được thêm vào mà không cần sinh. Mã này chưa làm điều đó.

### What this code does not fix

Một ngữ pháp quá nghiêm ngặt khiến mô hình bịa ra một giá trị, vì không có token hợp lệ nào cho phép nó nói không biết. Một enum khổng lồ biên dịch chậm. Một schema đệ quy không phù hợp với máy hữu hạn. Và một thư viện thử lại xác thực sau khi sinh không làm bất cứ điều gì trong số này; nó không bao giờ chạm vào logits.

## Follow-ups

- **Level 2:** `valid_tokens` lấy câu trả lời từ đâu? Expected: từ ngữ pháp đã biên dịch; một máy trạng thái hữu hạn cho phép tra cứu theo từng trạng thái trong thời gian hằng số.
- **Level 2:** Một triển khai production làm gì mà vòng lặp này không làm? Expected: bỏ qua các token bắt buộc; khi có đúng một token hợp lệ, nó được thêm vào mà không gọi mô hình.
- **Level 3:** Những schema nào vượt quá khả năng của máy trạng thái hữu hạn? Expected: các schema đệ quy, chẳng hạn các bình luận lồng nhau hoặc một cây cú pháp, cần một bộ máy ngữ pháp phi ngữ cảnh.
- **Level 3:** Ngữ pháp ép buộc một mẫu ngày tháng nghiêm ngặt và nguồn không có ngày tháng. Vòng lặp tạo ra gì? Expected: một ngày tháng bịa ra đúng định dạng, vì không có token hợp lệ nào cho phép mô hình nói không biết; cho phép null hoặc một giá trị sentinel trong ngữ pháp.

## Wrong answers

- "Mask thay đổi trọng số của mô hình." Nó không thay đổi gì trong mô hình; nó chỉnh sửa logits của một bước trước khi lấy mẫu.
- "Constrained decoding luôn làm chậm quá trình sinh." Bài học cho biết nó thường nhanh hơn: không gian tìm kiếm nhỏ hơn, và các token bắt buộc bỏ qua lệnh gọi mô hình.
- "Một thư viện thử lại làm cùng việc đó." Nó đưa schema vào prompt và xác thực sau khi đã sinh; nó không chạm vào logits.

## Taught in

Bài học [constrained decoding](../../../phases/05-nlp-foundations-to-advanced/20-structured-outputs-constrained-decoding/) cung cấp vòng lặp này, bộ xử lý logit, lập luận về tốc độ và các cạm bẫy của ngữ pháp.
