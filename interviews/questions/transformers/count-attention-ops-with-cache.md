---
id: count-attention-ops-with-cache
title: Count the attention work for 100 generated tokens
card: transformers
kind: estimate
level: 1
roles: [inference-engineer, applied-ai-engineer]
rounds: [screen, ml-depth]
tags: [kv-cache, autoregressive, complexity, decoding]
minutes: 6
lessons: [phases/07-transformers-deep-dive/12-kv-cache-flash-attention, phases/07-transformers-deep-dive/07-gpt-causal-language-modeling]
manuals: []
practice: [kv-cache-append]
cheatsheet: [inference-optimization]
related: [transformers/causal-mask-minus-infinity, inference-serving/kv-pool-users-fit]
updated: 2026-11-03
---

Một decoder sinh lần lượt 100 token từ một prompt rỗng. Đếm các trạng thái token mà mỗi vòng lặp tính cho tiền tố: một vòng lặp đơn giản, và một vòng lặp cache các vector key và value của token trước. Sau đó đếm các phép so sánh query-key còn lại khi có kho lưu trữ, và nêu thứ mà kho lưu trữ cố ý bỏ ra ngoài.

## Short answer

Vòng lặp đơn giản chạy lại mọi token tiền tố qua lớp ở mọi bước, nên nó tính 1 cộng 2 cộng 3 và cứ thế đến 100 trạng thái token, bằng 5050 và tăng theo bình phương độ dài. Với key và value được lưu, mỗi bước chỉ tính trạng thái của token mới, tổng cộng 100. Query mới vẫn gặp mọi key đã lưu, nên vòng lặp có cache vẫn thực hiện 5050 phép so sánh query-key: kho lưu trữ loại bỏ các vector key và value bị tính lại, không loại bỏ các phép so sánh. Kho lưu trữ không chứa query, vì token quá khứ không bao giờ hỏi lại; chỉ token mới nhất làm điều đó.

## Full answer

### Why the prefix can be reused

Mỗi trạng thái ẩn của token tiền tố là xác định một khi đã được tính, và causal mask có nghĩa nó không bao giờ phụ thuộc vào token phía sau. Vì vậy key và value của token t ở bước t cộng một giống như ở bước t. Tính lại chúng hoàn toàn là lãng phí.

### The two loops

```text
naive:   step t recomputes t token states       -> 1 + 2 + ... + N = N (N + 1) / 2
cached:  step t computes one new token state    -> N
cached:  its one query meets t stored keys      -> N (N + 1) / 2 comparisons
```

Với N bằng 100, số đếm đơn giản là 5050 trạng thái token và số đếm có cache là 100. Mã của bài học chạy ví dụ mười token và thay vào đó đếm các phép so sánh query-key: nó in cùng số đếm cho cả hai vòng lặp và xác nhận đầu ra khớp nhau. Ở 100 token, các phép so sánh đó tổng cộng 5050 trong cả hai vòng lặp, nên bản thân bước attention vẫn tăng theo độ dài ở mỗi bước. Với phản hồi dài vài nghìn token, số trạng thái token của cách đơn giản lên đến hàng triệu, phần lớn là dư thừa.

### What is stored

Trên mỗi lớp và mỗi head, hai danh sách tăng dần: key và value của mọi token cho đến lúc đó.

```python
class KVCache:
    def append(self, layer, head, k, v):
        self.K[layer][head].append(k)
        self.V[layer][head].append(v)
```

Bộ nhớ tăng tuyến tính theo độ dài đã sinh; đó là cái giá để không tính lại tiền tố.

### Why queries are not stored

Query của token được dùng một lần, tại bước mà token đó là token mới nhất. Sau đó, token chỉ được tra cứu, không bao giờ đi tìm. Lưu query sẽ tốn bộ nhớ và không mang lại gì.

### What does not go away

Quá trình sinh vẫn tuần tự: bước t cần token từ bước t trừ một. Bài học gọi đây là thuế tự hồi quy. Huấn luyện tránh nó bằng cách xử lý cả chuỗi trong một lượt có mask; suy luận không thể.

## Follow-ups

- **Level 1:** Thứ gì tăng trong bộ nhớ khi quá trình sinh diễn ra? Expected: các key và value được lưu, trên mỗi lớp và mỗi head, một mục cho mỗi token được sinh.
- **Level 2:** Tại sao key của token tiền tố vẫn hợp lệ sau khi có token mới? Expected: causal mask có nghĩa trạng thái ẩn của nó chỉ từng phụ thuộc vào các token trước, nên token phía sau không thể thay đổi nó.
- **Level 2:** Bạn sửa một từ ở giữa prompt. Điều gì xảy ra với kho lưu trữ? Expected: mọi thứ từ vị trí đó trở đi không hợp lệ và phải được tính lại; phần trước nó vẫn hợp lệ.
- **Level 3:** Khi nào attention bị giới hạn bởi lưu lượng bộ nhớ thay vì số học? Expected: khi ma trận điểm số N nhân N đủ lớn để việc di chuyển nó qua bộ nhớ chi phối; bài học đặt mức đó ở khoảng 2K token trở lên.

## Wrong answers

- "Kho lưu trữ giữ các trọng số attention." Nó giữ key và value; các trọng số được tính lại từ query mới ở mỗi bước.
- "Kho lưu trữ tiết kiệm bộ nhớ." Nó tốn bộ nhớ và tiết kiệm tính toán; sự đánh đổi là bộ nhớ cho các vector key và value bị tính lại.
- "Query cũng phải được lưu." Query của token quá khứ không bao giờ được dùng lại.

## Taught in

[Bài học về KV cache](../../../phases/07-transformers-deep-dive/12-kv-cache-flash-attention/) đếm cả hai vòng lặp và [bài học về mô hình hóa ngôn ngữ nhân quả](../../../phases/07-transformers-deep-dive/07-gpt-causal-language-modeling/) giải thích tại sao quá trình sinh là tuần tự.
