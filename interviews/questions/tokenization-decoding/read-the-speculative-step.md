---
id: read-the-speculative-step
title: Read one speculative step and defend each line
card: tokenization-decoding
kind: code-reading
level: 3
roles: [inference-engineer, applied-ai-engineer]
rounds: [coding, ml-depth]
tags: [speculative-decoding, rejection-sampling, residual-distribution, bonus-token, code-reading]
minutes: 12
lessons: [phases/07-transformers-deep-dive/16-speculative-decoding, phases/10-llms-from-scratch/25-speculative-decoding]
manuals: []
practice: [speculative-decoding-acceptance]
cheatsheet: [speculative-decoding]
related: []
updated: 2026-11-03
---

Đọc bước suy đoán đồ chơi này từ bài học. `q_model` là bộ xác minh và `p_model` là draft; mỗi mô hình trả về một vector xác suất cho token tiếp theo khi biết một tiền tố.

```python
def spec_step(prefix, q_model, p_model, N, rng):
    drafts, p_probs = [], []
    ctx = list(prefix)
    for _ in range(N):
        p_dist = p_model(ctx)
        d = sample(p_dist, rng)
        drafts.append(d)
        p_probs.append(p_dist[d])
        ctx.append(d)

    q_dists = [q_model(prefix + drafts[:i]) for i in range(N + 1)]

    for i, d in enumerate(drafts):
        u = rng.random()
        if u < min(1.0, q_dists[i][d] / p_probs[i]):
            prefix = prefix + [d]
        else:
            res = residual_dist(q_dists[i], p_model(prefix))
            prefix = prefix + [sample(res, rng)]
            return prefix
    return prefix + [sample(q_dists[N], rng)]
```

Tại sao `q_dists` giữ N cộng 1 mục, điều gì xảy ra khi token draft đầu không vượt kiểm tra, và tại sao phần dư dùng `p_model(prefix)` thay vì `p_probs[i]`?

## Short answer

Bộ xác minh cho một phân phối ở mỗi vị trí được draft và thêm một phân phối, tổng cộng N cộng 1, vì khi mọi draft được chấp nhận, phân phối thêm cung cấp một token thưởng không tốn thêm chi phí bộ xác minh. Ở lần từ chối đầu tại vị trí i, mã lấy mẫu từ phần dư, phần dương của phân phối bộ xác minh trừ phân phối draft, được chuẩn hóa lại, thêm token đó và trả về, nên mọi draft sau bị bỏ. Phần dư cần toàn bộ phân phối draft ở vị trí đó, một vector, và `p_probs[i]` chỉ giữ xác suất vô hướng của token đã được draft.

## Full answer

### Why the rule is exact

Chấp nhận một token được draft với xác suất `min(1, q(d) / p(d))` và nếu không thì lấy mẫu từ `(q - p)` được chặn ở không và chuẩn hóa lại cho các mẫu có phân phối chính xác như q. Định lý giữ bất kể p kém thế nào: một draft xấu từ chối thường xuyên hơn, và phân phối đầu ra không dịch chuyển. Đó là lý do duy nhất phương pháp được cho phép trong production. Nó là một tối ưu độ trễ không đánh đổi chất lượng.

### Why N plus 1 verifier distributions

Bộ xác minh được truy vấn trên tiền tố cộng i draft đầu cho i từ không tới N. N phân phối đầu đánh giá các draft. Phân phối cuối là phân phối token tiếp theo riêng của bộ xác minh sau tất cả N draft; nếu mọi thứ được chấp nhận thì nó miễn phí, và bước phát N cộng 1 token từ một lượt bộ xác minh. Trong ví dụ đồ chơi, N cộng 1 lệnh gọi đại diện cho một lượt truyền xuôi theo batch trên tiền tố cộng các draft.

### The rejection branch

Trả về sau lần từ chối đầu. Các vị trí sau nó được draft trên một ngữ cảnh giờ được biết là sai, nên các phân phối bộ xác minh của chúng không dành cho chuỗi đang được sinh. Bước luôn tạo ít nhất một token, mẫu phần dư, và nhiều nhất N cộng 1.

### The residual needs a vector

`residual_dist(q, p)` trừ hai phân phối từng phần tử, chặn các số âm về không và chuẩn hóa lại. `p_probs[i]` là một con số, xác suất của draft cho token được draft, đủ cho kiểm tra chấp nhận và không đủ cho phần dư. Lệnh gọi `p_model(prefix)` tính lại toàn bộ phân phối draft ở vị trí đang được sửa; trong một triển khai thực, các phân phối draft được giữ từ vòng lặp draft thay vì tính lại.

### The greedy case

Ở temperature bằng không, quy tắc thu về một so sánh: chấp nhận nếu token được draft bằng argmax của bộ xác minh, nếu không thì phát argmax và dừng.

### How you would test it

Chạy bước 10,000 lần và so biểu đồ tần suất các token được tạo với các mẫu trực tiếp từ q; một kiểm định chi-square đạt trong sai số lấy mẫu. Rồi làm p lệch khỏi q và theo dõi tỷ lệ chấp nhận giảm trong khi biểu đồ tần suất giữ nguyên.

## Follow-ups

- **Level 3:** `p_probs[i]` bằng không và mã chia cho nó. Điều đó có thể xảy ra không? Expected: không, token được lấy mẫu từ p nên xác suất dương; phiên bản production vẫn bảo vệ phép chia và chấp nhận khi p bằng không.
- **Level 3:** Khi nào `residual_dist` chia cho không, và nó nên trả về gì? Expected: khi q không lớn hơn p ở đâu, nghĩa là hai phân phối bằng nhau; trả về chính q.
- **Level 4:** Một lượt bộ xác minh theo batch duy nhất làm gì với các key và value được lưu của bộ xác minh? Expected: nó mở rộng chúng thêm N mục, và một lần từ chối tại vị trí j phải rollback độ dài logic về tiền tố được chấp nhận cộng hiệu chỉnh.
- **Level 4:** Một bước phát tối thiểu và tối đa bao nhiêu token? Expected: một, mẫu phần dư ở một lần từ chối ngay; N cộng 1 khi mọi draft được chấp nhận và token thưởng được lấy mẫu.

## Wrong answers

- "Chấp nhận một draft bất cứ khi nào bộ xác minh cho nó một xác suất trên một ngưỡng." Một ngưỡng thay đổi phân phối đầu ra; kiểm tra tỷ số với phần dư là điều giữ nó chính xác.
- "Khi từ chối, lấy mẫu lại từ phân phối bộ xác minh ở vị trí đó." Điều đó đặt trọng số quá cao cho các token draft đã ưu tiên; phần dư loại chính xác khối xác suất đó.
- "Bỏ token thưởng cho an toàn." Nó là một mẫu từ phân phối riêng của bộ xác minh và không tốn gì; bỏ nó lãng phí một token mỗi bước.

## Taught in

[Bài học giải mã suy đoán](../../../phases/07-transformers-deep-dive/16-speculative-decoding/) cung cấp bước này và kiểm tra phân phối, và [bài học giải mã suy đoán Phase 10](../../../phases/10-llms-from-scratch/25-speculative-decoding/) nêu trường hợp tham lam và quy tắc từ chối.
