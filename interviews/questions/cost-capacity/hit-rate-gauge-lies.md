---
id: hit-rate-gauge-lies
title: Two cache hit rates from one scrape
card: cost-capacity
kind: debug
level: 2
roles: [inference-engineer, applied-ai-engineer, ai-data-engineer]
rounds: [debugging, ml-breadth]
tags: [metrics, prefix-cache, prometheus, gauges]
minutes: 8
lessons: [phases/17-infrastructure-and-production/14-prompt-semantic-caching]
manuals: [sglang-101#s-the-metrics-endpoint]
practice: []
cheatsheet: [sglang-serving, llm-cost-caching]
related: [cost-capacity/two-cache-layers, inference-serving/prefix-cache-order]
updated: 2026-11-03
---

Một bảng trên dashboard hiển thị hit rate prefix cache của một máy chủ tự lưu trữ ở 94 phần trăm. Trong cùng lần chạy, các counter của máy chủ nói nó đã tính 104,057 token prompt và lấy 182,079 từ cache. Cả hai số đọc đến từ một lần scrape cùng endpoint. Bạn tin số nào cho một quyết định chi phí, và tại sao chúng khác nhau?

## Short answer

Tin các counter. Gauge giữ hit rate của khoảng prefill cuối cùng mà scheduler ghi log, và khi nhàn rỗi nó giữ giá trị từ batch cuối, là một benchmark tiền tố dùng chung. Các counter cộng mọi token prefill kể từ khi máy chủ khởi động, và tỷ số của chúng trên toàn bộ lần chạy là 0.636, không phải 0.942. Đối với một quyết định chi phí, tính rate từ các counter trong một khoảng thời gian.

## Full answer

### Three kinds of series

Một gauge là một giá trị scheduler ghi đè ở mỗi khoảng ghi log. Một lần scrape chỉ thấy giá trị mới nhất. Một counter là một tổng chỉ tăng, và bạn đọc nó dưới dạng một rate trong một khoảng thời gian. Một histogram là một tập các counter, một cho mỗi bucket, và bạn đọc các phân vị từ nó trong một khoảng thời gian.

### The two hit rates

Gauge chia các token hit của một khoảng ghi log cho các token hit cộng các token được tính của khoảng đó. Khi không có gì chạy, nó giữ giá trị cuối. Các counter mang cùng hai đại lượng kể từ khởi động, chia theo mode: input cho các token được tính, và hit device, host và storage cho các token đã cache. Trên toàn bộ lần chạy, 182,079 token đã cache so với tổng cộng 286,136 token prefill cho 0.636. Gauge ở 0.942 mô tả benchmark tiền tố dùng chung chạy cuối cùng. Cả hai đều đúng, và chúng trả lời các câu hỏi khác nhau.

### The windowed rate

Văn bản HELP của counter đưa ra công thức, và trong PromQL nó là:

```promql
sum(rate(sglang:prefill_effective_tokens_total{mode=~".*_hit"}[5m]))
  / sum(rate(sglang:prefill_effective_tokens_total[5m]))
```

Một lưu ý từ mã: các mode hit cộng số đếm hit thô, vì vậy sau một lần rút lại cùng các token có thể được đếm hai lần. Mode input loại trừ việc đếm lại. Lần chạy của tài liệu không có lần rút lại nào, vì vậy các con số của nó chính xác.

### Why this is a cost question

Một hit rate quyết định liệu bạn cấu trúc lại prompt, thêm một router nhận biết cache hay mua bộ nhớ. Một gauge từ benchmark cuối nói các prompt ổn. Các counter nói hơn một phần ba các token prompt trên lần chạy đã được tính. Bài học về kinh tế caching nói điều tương tự cho cache nhà cung cấp: đo hit rate của chính bạn từ các trường usage trên mọi phản hồi, và không coi một con số được công bố là của mình.

### What to alert on

Cảnh báo trên các counter và histogram trong một khoảng thời gian. Chỉ cảnh báo trên một gauge khi điều kiện kéo dài vài phút, chẳng hạn các request trong hàng đợi trên không hoặc mức sử dụng token gần một. Đọc văn bản HELP và mã trước khi bạn xây một bảng trên một metric. Tài liệu tìm thấy một gauge mức sử dụng giữ ở không tại phiên bản nó ghim.

## Follow-ups

- **Level 2:** Một gauge trả lời điều gì, và một counter trả lời điều gì? Expected: một gauge trả lời điều đã xảy ra trong khoảng cuối. Một counter trả lời bao nhiêu đã xảy ra kể từ đầu, và một rate trong một khoảng thời gian biến nó thành một xu hướng.
- **Level 3:** Tại sao rate dựa trên counter có thể khai quá các hit sau các lần rút lại? Expected: các mode hit cộng số đếm hit thô, vì vậy một request bị rút lại chạy lại đếm các token đã cache của nó hai lần, trong khi mode input loại trừ việc đếm lại.
- **Level 3:** Những gauge nào có thể gọi trực bạn, và theo quy tắc nào? Expected: các request trong hàng đợi trên không và mức sử dụng token gần một, chỉ khi điều kiện giữ trong vài phút, không bao giờ trên một lần scrape.
- **Level 4:** Một bảng trên máy chủ này hiển thị mức sử dụng bằng không trong một lần gián đoạn. Tại sao? Expected: gauge đó giữ ở không tại phiên bản được ghim vì một regression đã biết, vì vậy bảng hiển thị một cụm máy nhàn rỗi. Đọc văn bản HELP và mã trước khi xây trên một metric.

## Wrong answers

- "Gauge là giá trị mới nhất, vì vậy nó chính xác nhất." Nó là một snapshot của một khoảng, và nó giữ giá trị cuối khi nhàn rỗi.
- "Lấy trung bình hai con số." Chúng trả lời các câu hỏi khác nhau, và các counter đã chứa toàn bộ lần chạy.
- "Rate thực thấp hơn, vì vậy tắt cache." Một rate 0.636 có nghĩa là một phần ba các token prompt đã được tính. Cách sửa là bố trí prompt hoặc định tuyến, không phải cache.

## Taught in

[Phần metrics endpoint của SGLang 101](../../../manuals/sglang-101/sections/5-2-the-metrics-endpoint.md) đo hai hit rate trên một máy chủ, và [bài học kinh tế caching](../../../phases/17-infrastructure-and-production/14-prompt-semantic-caching/) bảo bạn tính rate từ các trường usage của chính mình.
