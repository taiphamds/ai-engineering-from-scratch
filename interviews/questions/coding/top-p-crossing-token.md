---
id: top-p-crossing-token
title: Nucleus sampling that drops the token which reaches p
card: coding
kind: debug
level: 3
roles: [applied-ai-engineer, inference-engineer, ai-developer-relations-engineer]
rounds: [coding, debugging]
tags: [sampling, top-p, nucleus, generation]
minutes: 10
lessons: [phases/19-capstone-projects/35-gpt-model-assembly]
manuals: []
practice: [top-k-top-p-sampling]
cheatsheet: [bert-gpt-t5]
related: [coding/top-k-then-sample, coding/temperature-knob]
updated: 2026-11-03
---

Một bộ lọc nucleus được rà soát vì một nhóm sản phẩm nói các giá trị p nhỏ cho một phân phối rỗng trên một số prompt:

```python
def top_p_filter(logits, p):
    probs = softmax(logits)
    c = np.cumsum(probs)
    out = np.where(c <= p, logits, -np.inf)
    return out
```

Tìm hai lỗi và giải thích bộ lọc phải tương tác với temperature trong bộ lấy mẫu đầy đủ như thế nào.

## Short answer

Tổng tích lũy chạy theo thứ tự từ vựng thay vì theo thứ tự xác suất giảm dần, vì vậy tập được giữ lại hoàn toàn không phải tiền tố có xác suất cao nhất. Phép so sánh cũng bỏ token làm tổng đạt p, điều này với một p nhỏ không để lại gì và tạo ra một phân phối rỗng. Sắp xếp theo xác suất trước, giữ tiền tố ngắn nhất có tổng đạt p gồm cả token vượt ngưỡng, và chạy bộ lọc trên logits đã điều chỉnh theo temperature.

## Full answer

### Bug one: the order

Nucleus sampling giữ tập nhỏ nhất gồm các token có xác suất cao nhất mà khối lượng đạt p. Điều đó yêu cầu sắp xếp theo xác suất, cao nhất trước, trước tổng tích lũy. Theo thứ tự từ vựng tổng vượt p ở một chỗ tùy ý và tập được giữ lại là một tiền tố của từ vựng, không phải của thứ hạng.

### Bug two: the crossing token

Token mà việc thêm nó làm tổng tích lũy đạt p là một phần của nucleus. Một phép so sánh nghiêm ngặt loại trừ nó. Khi chỉ riêng token đứng đầu mang nhiều khối lượng hơn p, không có gì qua được và softmax của toàn âm vô cực là NaN. Giữ tiền tố đến và bao gồm chỉ số đầu tiên nơi tổng ít nhất bằng p, và nếu làm tròn khiến tổng không bao giờ đạt p, giữ mọi token.

### The fix

```python
def top_p_filter(logits, p):
    probs = softmax(logits)
    order = np.argsort(-probs, kind="stable")
    c = np.cumsum(probs[order])
    cut = np.searchsorted(c, p, side="left")
    keep = order[: min(cut + 1, logits.shape[0])]
    out = np.full_like(logits, -np.inf)
    out[keep] = logits[keep]
    return out
```

Phép sắp xếp ổn định trên các xác suất đã đổi dấu giữ chỉ số thấp hơn trước khi bằng nhau.

### Temperature comes first

Bộ lấy mẫu đầy đủ chia cho temperature, áp dụng top-k, áp dụng top-p cho kết quả đó, và lấy softmax cuối cùng. Nếu temperature được áp dụng sau các bộ lọc, nucleus được chọn ở temperature bằng một và một thiết lập nóng hoặc lạnh thay đổi ít hơn người dùng yêu cầu. Bài học lắp ráp liệt kê nucleus sampling làm phần mở rộng của vòng lặp sinh top-k của nó, với phép kiểm tra rằng tổng các xác suất được giữ lại ít nhất bằng p.

## Follow-ups

- **Level 3:** Tại sao bộ lọc trả về logits có âm vô cực thay vì các xác suất? Expected: để softmax cuối cùng chuẩn hóa lại các token được giữ và cho các token bị loại chính xác bằng không, và để top-k và top-p kết hợp được.
- **Level 3:** P bằng một giữ gì? Expected: mọi token, trừ khi làm tròn khiến tổng còn thiếu, trong trường hợp đó quy tắc giữ tất cả các token được áp dụng.
- **Level 4:** Top-k và top-p đều được đặt. Cái nào tác động trước và tại sao điều đó quan trọng? Expected: top-k trước, rồi top-p trên các token còn lại; thứ tự ngược có thể giữ một tập khác vì khối lượng nucleus được tính trên các ứng viên khác nhau.

## Wrong answers

- "Dùng một phép so sánh nghiêm ngặt để không bao giờ vượt p." Định nghĩa là tiền tố nhỏ nhất đạt p; loại trừ token vượt ngưỡng phá vỡ nó và có thể để lại một tập rỗng.
- "Lấy tổng tích lũy theo thứ tự chỉ số; từ vựng đã được sắp xếp theo tần suất." Các token id không được sắp xếp theo xác suất cho một ngữ cảnh nhất định.
- "Áp dụng temperature sau bộ lọc để nucleus ổn định." Nucleus khi đó được chọn ở temperature sai và núm mất phần lớn tác dụng của nó.

## Taught in

[Bài học lắp ráp GPT](../../../phases/19-capstone-projects/35-gpt-model-assembly/) thêm nucleus sampling bên cạnh top-k trong các bài tập của nó, và [bài thực hành lấy mẫu](../../../practice/top-k-top-p-sampling/) cố định token vượt ngưỡng và thứ tự các thao tác.
