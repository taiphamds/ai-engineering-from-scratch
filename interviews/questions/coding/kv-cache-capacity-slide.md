---
id: kv-cache-capacity-slide
title: A KV cache that loses its last slot
card: coding
kind: code-reading
level: 3
roles: [inference-engineer, applied-ai-engineer]
rounds: [coding, debugging]
tags: [kv-cache, decode, capacity, sliding-window]
minutes: 10
lessons: [phases/19-capstone-projects/35-gpt-model-assembly]
manuals: []
practice: [kv-cache-append]
cheatsheet: [inference-optimization]
related: [coding/top-k-then-sample]
updated: 2026-11-03
---

Một vòng lặp decode giữ các key và value trong một cache được cấp phát trước và cho một query attend trên tiền tố đã lưu. Việc sinh luôn dừng sớm một token so với độ dài ngữ cảnh được cấu hình, và các token đầu tiên của một prompt dài attend vào các hàng toàn số không bị dư ra. Mã cache là:

```python
class KVCache:
    def __init__(self, max_len, d_k, d_v):
        self.k = np.zeros((max_len, d_k))
        self.v = np.zeros((max_len, d_v))
        self.n = 0

    def append(self, k, v):
        k = np.atleast_2d(k)
        v = np.atleast_2d(v)
        self.n += k.shape[0]
        if self.n >= self.k.shape[0]:
            raise ValueError("cache full")
        self.k[self.n - k.shape[0]:self.n] = k
        self.v[self.n - k.shape[0]:self.n] = v

    def keys(self):
        return self.k
```

Giải thích hai triệu chứng từ mã và sửa chúng.

## Short answer

Phép kiểm tra dung lượng từ chối một lần thêm kết thúc đúng tại dung lượng, vì vậy vị trí cuối cùng không bao giờ được dùng và việc sinh dừng sớm một token. Bộ đếm cũng được cập nhật trước phép kiểm tra, vì vậy một lần thêm bị từ chối để lại độ dài sai. Hàm truy cập trả về toàn bộ buffer thay vì tiền tố đã điền, vì vậy attention thấy các hàng trống toàn số không. Kiểm tra rằng độ dài cộng số bước mới không vượt quá dung lượng trước khi đụng đến bộ đếm, và trả về các view của `n` hàng đầu tiên.

## Full answer

### Defect one: the boundary

Một lần thêm điền cache đến đúng dung lượng là hợp lệ. Phép kiểm tra chỉ được từ chối khi độ dài mới sẽ vượt quá dung lượng. Với phép so sánh nghiêm ngặt hàng cuối cùng bị bỏ không, và một vòng lặp sinh định kích thước cache từ độ dài ngữ cảnh dừng thiếu một token.

### Defect two: the counter

Cộng vào độ dài trước phép kiểm tra có nghĩa là một lần thêm thất bại khiến cache tuyên bố có những bước mà nó chưa từng lưu. Lời gọi tiếp theo khi đó ghi vượt dữ liệu thực hoặc từ chối một lần thêm hợp lệ. Quy tắc từ bài thực hành là một lần thêm bị từ chối không thay đổi gì.

### Defect three: the view

`keys()` trả về mọi hàng của buffer, đã điền hay chưa. Query khi đó attend trên các hàng toàn số không vốn mang trọng số sau softmax, làm loãng đầu ra đối với các tiền tố ngắn. Chỉ trả về `n` hàng đầu tiên.

### The corrected class

```python
    def append(self, k, v):
        k = np.atleast_2d(k)
        v = np.atleast_2d(v)
        if k.shape[0] != v.shape[0]:
            raise ValueError("keys and values differ in steps")
        if self.n + k.shape[0] > self.k.shape[0]:
            raise ValueError("cache full")
        self.k[self.n:self.n + k.shape[0]] = k
        self.v[self.n:self.n + k.shape[0]] = v
        self.n += k.shape[0]

    def keys(self):
        return self.k[:self.n]

    def values(self):
        return self.v[:self.n]
```

Việc sao chép vào buffer cũng bảo vệ cache khỏi các thay đổi về sau đối với các mảng của bên gọi.

### How this meets the generation loop

Bộ sinh của bài học lắp ráp giữ cửa sổ hoạt động bên trong độ dài ngữ cảnh bằng cách bỏ các token cũ nhất khi prompt cộng các token đã sinh sẽ vượt quá nó. Một cache có dung lượng cố định cần cùng quy tắc ở một cấp thấp hơn: hoặc từ chối lần thêm và để vòng lặp trượt cửa sổ, hoặc loại bỏ các hàng cũ nhất. Bài thực hành cố định phiên bản từ chối để ranh giới rõ ràng.

## Follow-ups

- **Level 3:** Bước decode làm gì với các key đã lưu? Expected: nó chấm điểm một query với mọi key đã lưu, chia cho căn bậc hai của kích thước key, lấy softmax và tính trọng số các value đã lưu.
- **Level 3:** Một lỗi thứ hai ghi mọi lần thêm tại hàng không. Triệu chứng là gì? Expected: các bước mới ghi đè các bước cũ, vì vậy attention chỉ bao giờ thấy lần thêm mới nhất và mô hình mất ngữ cảnh của nó.
- **Level 4:** Một cache phân trang thay đổi thiết kế này ở đâu? Expected: dung lượng trở thành một pool các block kích thước cố định được các request dùng chung, vì vậy một lần thêm cần một block mới có thể chờ hoặc giành quyền thay vì làm request thất bại.

## Wrong answers

- "Dùng lớn hơn hoặc bằng để cache không bao giờ tràn." Nó cũng từ chối việc điền vừa đúng và lãng phí vị trí cuối cùng.
- "Trả về toàn bộ buffer; các hàng toàn số không không có tác dụng." Các key bằng không vẫn nhận trọng số softmax và kéo đầu ra về các value bằng không.
- "Cập nhật số đếm trước để các chỉ số lát cắt đơn giản hơn." Một lần thêm bị từ chối khi đó làm hỏng độ dài.

## Taught in

[Bài học lắp ráp GPT](../../../phases/19-capstone-projects/35-gpt-model-assembly/) giới hạn việc sinh trong độ dài ngữ cảnh bằng một cửa sổ trượt, và [bài thực hành KV cache](../../../practice/kv-cache-append/) cố định quy tắc dung lượng và các view tiền tố đã điền.
