---
id: top-k-then-sample
title: Write the sampling step of a generation loop
card: coding
kind: take-home
level: 2
roles: [applied-ai-engineer, inference-engineer, ai-developer-relations-engineer]
rounds: [coding, take-home]
tags: [sampling, top-k, temperature, generation]
minutes: 20
lessons: [phases/19-capstone-projects/35-gpt-model-assembly]
manuals: []
practice: [top-k-top-p-sampling]
cheatsheet: [bert-gpt-t5, gpt-from-scratch-training]
related: [coding/temperature-knob, coding/top-p-crossing-token]
updated: 2026-11-03
---

Cho logits của vị trí cuối cùng, một temperature, một giá trị k và một bộ sinh ngẫu nhiên được đặt seed, viết hàm lấy token tiếp theo. Nêu thứ tự các thao tác, cách xử lý các trường hợp bằng nhau, và cách lần lấy dùng chính xác một số ngẫu nhiên.

## Short answer

Chia logits cho temperature, giữ k giá trị lớn nhất và đặt phần còn lại thành âm vô cực, lấy softmax, và lấy một chỉ số từ kết quả. Các trường hợp bằng nhau giữ chỉ số thấp hơn. Lần lấy gọi bộ sinh một lần, lấy tổng tích lũy của các xác suất theo thứ tự từ vựng, và trả về chỉ số đầu tiên có giá trị tích lũy vượt quá số ngẫu nhiên.

## Full answer

### The code

```python
def top_k_filter(logits, k):
    if k >= logits.shape[0]:
        return logits.copy()
    order = np.argsort(-logits, kind="stable")
    keep = order[:k]
    out = np.full_like(logits, -np.inf)
    out[keep] = logits[keep]
    return out


def sample(logits, rng, temperature=1, top_k=None):
    z = logits / temperature
    if top_k is not None:
        z = top_k_filter(z, top_k)
    probs = softmax(z)
    u = rng.random()
    c = np.cumsum(probs)
    hits = np.nonzero(u < c)[0]
    if hits.size:
        return int(hits[0])
    return int(np.nonzero(probs > 0)[0][-1])
```

### The order

Temperature trước, rồi bộ lọc, rồi softmax. Bộ lọc phải thấy logits đã điều chỉnh tỷ lệ, vì tỷ lệ thay đổi các token nào giữ khối lượng khi một ngưỡng cắt top-p được thêm về sau. Softmax chạy cuối cùng để một token bị loại có xác suất chính xác bằng không và những token được giữ lại được chuẩn hóa lại.

### Ties

Sắp xếp các logits đã đổi dấu bằng một phép sắp xếp ổn định giữ chỉ số thấp hơn trước trong số các giá trị bằng nhau. Sắp xếp tăng dần rồi đảo ngược kết quả lật điều đó, vì vậy chỉ số cao hơn thắng và đầu ra khác bản tham chiếu trong mọi trường hợp bằng nhau.

### One random number

Một bộ sinh được đặt seed chỉ cho các mẫu tái lập được nếu mỗi lời gọi tiêu thụ cùng số lần lấy. Hàm đọc một số phân phối đều, so sánh nó với tổng tích lũy, và trả về lần vượt đầu tiên. Làm tròn có thể khiến giá trị tích lũy cuối cùng thấp hơn một một chút, vì vậy nhánh dự phòng trả về token cuối cùng có xác suất dương thay vì thất bại.

### Do not change the input

Bộ lọc ghi vào một mảng mới. Ghi âm vô cực vào logits của bên gọi phá hủy các giá trị mà bước tiếp theo, hoặc một log, vẫn cần.

## Follow-ups

- **Level 2:** Top-k bằng một tạo ra điều gì? Expected: greedy decoding, argmax mỗi lần.
- **Level 2:** Tại sao bộ lọc phải chạy trước softmax chứ không phải sau? Expected: đặt các xác suất thành không sau softmax để lại một phân phối không có tổng bằng một trừ khi nó được chuẩn hóa lại; mask logits làm điều đó miễn phí.
- **Level 3:** Bài học lắp ráp giữ ngữ cảnh trong một độ dài cố định trong khi sinh. Bằng cách nào? Expected: khi prompt cộng các token đã sinh vượt quá độ dài ngữ cảnh, các token cũ nhất được bỏ để cửa sổ hoạt động vừa.
- **Level 3:** Bạn làm cho hai lần chạy với một seed tạo ra cùng văn bản như thế nào? Expected: cùng bộ sinh, một lần lấy mỗi bước, cùng quy tắc xử lý bằng nhau và cùng temperature; bất kỳ lần lấy thêm nào đều dịch chuyển mọi token về sau.

## Wrong answers

- "Gọi hàm choice của bộ sinh với các xác suất." Nó hoạt động, nhưng nó tiêu thụ các lần lấy khác nhau giữa các phiên bản và phá vỡ hợp đồng một lần lấy mà các kiểm thử cố định.
- "Áp dụng temperature sau bộ lọc." Bộ lọc khi đó chọn các token ở temperature bằng một và thiết lập thay đổi ít hơn dự định.
- "Sắp xếp giảm dần bằng cách đảo ngược một phép sắp xếp tăng dần." Các logits bằng nhau khi đó giữ chỉ số cao hơn, trái với quy tắc xử lý bằng nhau.

## Taught in

[Bài học lắp ráp GPT](../../../phases/19-capstone-projects/35-gpt-model-assembly/) mô tả bước sinh là temperature, top-k mask, softmax và lần lấy multinomial, và [bài thực hành lấy mẫu](../../../practice/top-k-top-p-sampling/) cố định thứ tự, quy tắc xử lý bằng nhau và lần lấy duy nhất.
