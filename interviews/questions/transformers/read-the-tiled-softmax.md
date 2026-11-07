---
id: read-the-tiled-softmax
title: Read the running softmax and find the fragile line
card: transformers
kind: code-reading
level: 3
roles: [inference-engineer, applied-ai-engineer]
rounds: [coding, ml-depth]
tags: [flash-attention, online-softmax, running-max, numerical-stability, code-reading]
minutes: 12
lessons: [phases/07-transformers-deep-dive/12-kv-cache-flash-attention]
manuals: []
practice: [flash-attention-online-softmax]
cheatsheet: [attention-variants]
related: [transformers/flash-attention-is-exact]
updated: 2026-11-03
---

Đọc hàm này từ bài học. Nó tính đầu ra attention cho một query với các key và value theo khối bốn phần tử.

```python
def tiled_softmax_dot(q, K, V, tile=4):
    m = float("-inf")
    s = 0.0
    out = [0.0] * len(V[0])
    for start in range(0, len(K), tile):
        k_block = K[start:start + tile]
        v_block = V[start:start + tile]
        scores = [sum(qi * ki for qi, ki in zip(q, k)) for k in k_block]
        new_m = max(m, *scores)
        exp_old = math.exp(m - new_m) if m != float("-inf") else 0.0
        exp_new = [math.exp(sc - new_m) for sc in scores]
        s = s * exp_old + sum(exp_new)
        for j in range(len(out)):
            out[j] = out[j] * exp_old + sum(e * v[j] for e, v in zip(exp_new, v_block))
        m = new_m
    return [o / s for o in out]
```

Giải thích vai trò của `exp_old`, lập luận rằng kết quả bằng `softmax(qK^T) V` tính một lần, và chỉ ra đầu vào làm mã này tạo NaN.

## Short answer

Vòng lặp giữ cực đại lũy tiến `m` và tổng lũy tiến `s` trên các khối đã thấy cho đến lúc đó. Khi một khối nâng cực đại, `exp_old` là hàm mũ của cực đại cũ trừ cực đại mới, và nó điều chỉnh tổng cùng đầu ra từng phần để mọi số hạng trước được biểu diễn theo cực đại mới; khối không nâng cực đại cho `exp_old` bằng một. Cuối cùng mỗi trọng số là hàm mũ của điểm số trừ cực đại toàn cục, chia tổng toàn cục, chính là softmax ổn định. Đầu vào dễ gây lỗi là khối đầu tiên có điểm số đều là âm vô cực, như khối bị che hoàn toàn: `new_m` vẫn là âm vô cực, và `exp_new` tính âm vô cực trừ âm vô cực, là NaN.

## Full answer

### The invariant

Sau mỗi khối, `out` chứa tổng trên tất cả key đã thấy của `exp(score - m) * v`, và `s` chứa tổng của `exp(score - m)`, cả hai tương đối với `m` hiện tại. Đẳng thức làm phép điều chỉnh đúng là

```text
exp(score - m_new) = exp(score - m_old) * exp(m_old - m_new)
```

nên nhân các bộ tích lũy cũ với `exp(m_old - m_new)` chuyển chúng sang điểm tham chiếu mới mà không chạm lại bất kỳ điểm số riêng lẻ nào. Khối đầu tiên không có tham chiếu cũ, đó là lý do `exp_old` bằng không khi `m` vẫn là âm vô cực: các bộ tích lũy rỗng không đóng góp gì.

### Why the final division is exact

Phép chia cho `s` xảy ra một lần, ở cuối, với cực đại toàn cục trong mọi hàm mũ. Đó là định nghĩa của softmax ổn định số trên toàn bộ hàng, được tính mà không bao giờ giữ toàn bộ hàng. Tập làm việc là một khối key và value cùng một vector đầu ra. Kernel thực làm điều này cho mỗi khối query, với các khối key và value được truyền qua bộ nhớ trên chip, và ghi mỗi ô đầu ra một lần.

### The NaN

Kernel nhân quả bỏ qua các khối nằm hoàn toàn phía trên đường chéo; kernel áp dụng mask bằng cách đặt điểm số về âm vô cực phải bảo vệ trường hợp mọi điểm số trong khối đều là âm vô cực. Ở đây `max(-inf, -inf, ...)` là âm vô cực, và `exp(-inf - (-inf))` là NaN, sau đó làm nhiễm `s` và `out`. Cách bảo vệ: bỏ qua khối có cực đại là âm vô cực, hoặc kiểm tra `new_m` trước khi tính `exp_new`.

### What a reviewer tests

1. Bằng softmax tính một lần trên đầu vào ngẫu nhiên, trong dung sai dấu phẩy động.
2. Khối thứ hai có điểm số đều thấp hơn cực đại của khối đầu, để nhánh điều chỉnh với `exp_old` bằng một được thực thi.
3. Một khối có điểm số đều cao hơn, để `exp_old` nhỏ hơn một và các số hạng trước co lại.
4. Khối đầu tiên bị che hoàn toàn, không được tạo NaN.

## Follow-ups

- **Level 3:** Ô nhỏ hơn tốn gì và được gì? Expected: thêm bước điều chỉnh và chi phí vòng lặp đổi lấy tập làm việc nhỏ hơn trên chip; kernel thực chọn ô để vừa bộ nhớ trên chip.
- **Level 3:** Tại sao `exp_old` được đặt về không chứ không phải một ở khối đầu? Expected: không có số hạng trước để mang theo; các bộ tích lũy rỗng, và `exp(-inf - new_m)` dù sao cũng bằng không với `new_m` hữu hạn.
- **Level 4:** Causal mask thay đổi vòng lặp trong kernel production như thế nào? Expected: các khối hoàn toàn phía trên đường chéo được bỏ qua thay vì che, và các khối bị che một phần áp dụng âm vô cực theo từng phần tử trước khi lấy cực đại.
- **Level 4:** Lượt truyền ngược lấy các giá trị softmax cần thiết ở đâu? Expected: nó tính lại chúng từ cực đại hàng và tổng hàng đã lưu thay vì lưu ma trận N nhân N.

## Wrong answers

- "`exp_old` là hệ số suy giảm như learning rate." Nó là thay đổi điểm tham chiếu chính xác; đầu ra giống hệt công thức tính một lần.
- "Bạn có thể lưu điểm số rồi chuẩn hóa ở cuối." Điều đó lưu toàn bộ hàng, là chi phí bộ nhớ mà kernel tồn tại để tránh.
- "Mỗi khối nên được chuẩn hóa bằng tổng riêng." Chuẩn hóa theo từng khối phá vỡ softmax toàn cục; chỉ phép chia cuối cùng là đúng.

## Taught in

[Bài học về KV cache và Flash Attention](../../../phases/07-transformers-deep-dive/12-kv-cache-flash-attention/) đưa ra hàm này làm bước xây dựng softmax chia ô.
