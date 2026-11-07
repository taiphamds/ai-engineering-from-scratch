---
id: speedup-from-alpha
title: From acceptance rate to tokens per pass
card: tokenization-decoding
kind: estimate
level: 3
roles: [inference-engineer, applied-ai-engineer]
rounds: [ml-depth, system-design]
tags: [speculative-decoding, acceptance-rate, draft-length, speedup, estimation]
minutes: 10
lessons: [phases/10-llms-from-scratch/25-speculative-decoding, phases/10-llms-from-scratch/15-speculative-decoding-eagle3, phases/07-transformers-deep-dive/16-speculative-decoding, phases/17-infrastructure-and-production/05-eagle3-speculative-decoding]
manuals: []
practice: [speculative-decoding-acceptance]
cheatsheet: [speculative-decoding]
related: [tokenization-decoding/read-the-speculative-step]
updated: 2026-11-03
---

Một draft được chấp nhận 80 phần trăm số lần theo từng token và đề xuất bốn token mỗi bước. Trung bình một lượt của mô hình lớn tạo bao nhiêu token, chi phí riêng của draft đi vào thế nào, và khi nào một draft dài hơn ngừng mang lợi ích?

## Short answer

Số token kỳ vọng mỗi lượt bộ xác minh là `(1 - alpha^(K + 1)) / (1 - alpha)`; ở mức chấp nhận 0.8 và K bằng 4, đó là 3.36, nên số lệnh gọi mô hình lớn ít hơn khoảng 3.36 lần. Thời gian thực mỗi token là `(K c + 1)` chia kỳ vọng đó, trong đó c là chi phí draft tương đối so với bộ xác minh, nên một draft dài hơn thêm chi phí tuyến tính trong khi chuỗi hình học bão hòa; ở mức chấp nhận 0.8 và c bằng 0.05, điểm tối ưu nằm quanh 5 đến 7 draft cho khoảng 3.2 lần. Đòn bẩy quan trọng là tỷ lệ chấp nhận: ở K cố định, một mức tăng từ 0.6 lên 0.9 khoảng gấp đôi số token kỳ vọng mỗi lượt.

## Full answer

### The formula

Mỗi token được draft được chấp nhận độc lập với xác suất alpha, và bước kết thúc ở token bị từ chối đầu, nên số draft được chấp nhận là một biến hình học bị cắt. Thêm token thưởng khi chấp nhận toàn bộ và kỳ vọng là

```text
E[tokens per verifier pass] = (1 - alpha^(K + 1)) / (1 - alpha)
```

| alpha | K | token mỗi lượt |
|---|---|---|
| 0.8 | 4 | 3.36 |

Ở K cố định, alpha cao hơn nâng mọi hạng của chuỗi, nên kỳ vọng tăng dốc khi alpha gần một.

### Where the draft's cost enters

Một bước tốn K lượt draft cộng một lượt bộ xác minh, `K c + 1` theo đơn vị bộ xác minh. Chia cho số token kỳ vọng và bạn có thời gian mỗi token. Với một bộ xác minh khoảng 30 ms và một draft khoảng 3 ms, năm draft cộng một lần xác minh là khoảng 45 ms mỗi bước. Bước phát từ một đến sáu token, nên chia 45 ms cho số token kỳ vọng mỗi lượt và so kết quả với 30 ms cho một token thuần. Khi K tăng, tử số tăng tuyến tính và kỳ vọng phẳng về `1 / (1 - alpha)`, nên có một điểm tối ưu.

| alpha | c | K tốt nhất | Tăng tốc |
|---|---|---|---|
| 0.8 | 0.05 | khoảng 5 đến 7 | khoảng 3.2 lần |
| 0.95 | 0.02 | khoảng 8 đến 10 | hướng tới 5 lần |

### What moves alpha

Phân phối draft gần phân phối bộ xác minh đến đâu, là một hàm của cách draft được xây; temperature lấy mẫu, nơi tham lam so với tham lam chấp nhận nhiều nhất; và tác vụ, nơi mã và đầu ra có cấu trúc chấp nhận nhiều hơn văn xuôi tự do.

### Where the formula stops being the whole story

Ở độ đồng thời cao, lượt xác minh không còn miễn phí: batch giải mã đã lấp băng thông bộ nhớ, và một draft bị từ chối tốn một lần xác minh và một lần lấy lại. Quy tắc của bài học production là dưới mức chấp nhận khoảng 0.55, suy đoán có lợi ích ròng âm ở độ đồng thời cao, nên đo alpha trên lưu lượng thực trước khi đặt K.

## Follow-ups

- **Level 3:** Ở mức chấp nhận 0.95 và chi phí draft 0.02, điểm tối ưu ở đâu? Expected: quanh 8 đến 10 draft, với tăng tốc hướng tới 5 lần.
- **Level 3:** Tại sao kỳ vọng bão hòa khi K tăng? Expected: nó là một chuỗi hình học; xác suất mọi draft tới vị trí K được chấp nhận giảm theo alpha mũ K, nên các vị trí muộn gần như không thêm gì.
- **Level 4:** Kích thước batch thay đổi phép tính như thế nào? Expected: công việc thêm của bộ xác minh mỗi draft không còn ẩn sau băng thông nhàn rỗi, nên chi phí hiệu dụng của xác minh và của một lần từ chối tăng, và mức chấp nhận hòa vốn tăng về 0.45 đến 0.55.
- **Level 4:** Bạn thêm một phép đo nào vào dashboard? Expected: các token draft được chấp nhận chia các token draft được đề xuất, theo từng lát lưu lượng, để alpha hiển thị ở nơi công thức cần.

## Wrong answers

- "Tăng tốc bằng độ dài draft." Chỉ nếu mọi draft được chấp nhận; chuỗi hình học và chi phí draft cắt nó xuống thấp hơn K nhiều.
- "Gấp đôi K gấp đôi thông lượng." Vượt điểm tối ưu, các draft thêm phần lớn bị từ chối và chi phí vẫn được trả.
- "Một draft rẻ hơn mười lần cho tăng tốc mười lần." Chi phí draft đặt c; tỷ lệ chấp nhận đặt kỳ vọng, và một draft rẻ thường sai thu được ít lợi ích.

## Taught in

[Bài học giải mã suy đoán Phase 10](../../../phases/10-llms-from-scratch/25-speculative-decoding/) suy ra kỳ vọng, [bài học EAGLE-3](../../../phases/10-llms-from-scratch/15-speculative-decoding-eagle3/) thêm chi phí draft và điểm tối ưu, [bài học giải mã suy đoán Phase 7](../../../phases/07-transformers-deep-dive/16-speculative-decoding/) cung cấp ví dụ mili giây, và [bài học EAGLE-3 production](../../../phases/17-infrastructure-and-production/05-eagle3-speculative-decoding/) đặt điểm hòa vốn.
