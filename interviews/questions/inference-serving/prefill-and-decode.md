---
id: prefill-and-decode
title: The two phases of one request
card: inference-serving
kind: concept
level: 1
roles: [inference-engineer, applied-ai-engineer]
rounds: [screen, ml-breadth]
tags: [prefill, decode, ttft, tpot, itl]
minutes: 6
lessons: [phases/17-infrastructure-and-production/04-vllm-serving-internals]
manuals: [vllm-101#s-understand-what-happens-to-your-request]
practice: []
cheatsheet: []
related: []
updated: 2026-11-03
---

Một người dùng gửi một yêu cầu chat đến một engine phục vụ và câu trả lời được truyền về, chậm lúc đầu rồi từng từ một. Mô tả GPU làm gì từ lúc yêu cầu đến cho đến token cuối cùng. Nêu tên các pha, và nêu tên các con số bạn sẽ đưa lên dashboard cho từng pha.

## Short answer

Một yêu cầu có hai pha. Prefill đọc toàn bộ prompt trong một lượt và ghi các key và value của nó vào KV cache, nên GPU bận tính toán. Decode sau đó ghi một token cho mỗi yêu cầu mỗi bước, và mỗi bước đọc tất cả trọng số để làm điều đó, nên GPU chờ bộ nhớ. Bốn con số đo chúng: TTFT cho thời gian chờ trước token đầu tiên, TPOT và ITL cho luồng, và số token đầu ra mỗi giây cho toàn máy chủ.

## Full answer

### Prefill

Prefill xử lý nhiều token prompt trong một bước. Các key và value của mọi token prompt đi vào KV cache. Bước đó thực hiện nhiều phép toán cho mỗi byte nó đọc, nên nó bị giới hạn bởi tính toán. Một prompt dài làm token đầu tiên đến muộn.

### Decode

Decode tạo một token mới cho mỗi yêu cầu đang chạy trong mỗi bước. Bước đó đọc tất cả trọng số mô hình một lần để làm điều đó, bất kể kích thước batch. Bước đó di chuyển nhiều byte cho ít phép toán, nên nó bị giới hạn bởi bộ nhớ. Đây là lý do một batch lớn hơn gần như không tốn thêm mỗi bước trên một mô hình dense: các trọng số được đọc một lần cho tất cả yêu cầu trong bước đó.

### The four numbers

| Con số | Nó đo gì | Ai cảm nhận nó |
|---|---|---|
| TTFT | thời gian chờ từ yêu cầu đến token đầu tiên, chủ yếu là thời gian hàng đợi và prefill | người chờ câu trả lời bắt đầu |
| TPOT | thời gian trung bình giữa các token sau token đầu tiên | người đọc một câu trả lời dài |
| ITL | mỗi khoảng cách giữa hai token; P99 của nó cho thấy những lần khựng tệ nhất | người thấy luồng dừng rồi chạy |
| Thông lượng | số token đầu ra mỗi giây cho tất cả người dùng cùng nhau | người trả tiền cho GPU |

Báo cáo cả bốn cùng nhau. Một con số thông lượng riêng lẻ che giấu độ trễ mà người dùng cảm nhận.

### What load does to them

Tài liệu đo Qwen/Qwen3-30B-A3B với vLLM 0.31.0 từ một người dùng đến 64 người dùng cùng lúc:

| Người dùng cùng lúc | TTFT trung vị | TPOT trung vị | Token đầu ra mỗi giây |
|---|---|---|---|
| 1 | 257 ms | 32.3 ms | 29.5 |
| 64 | 965 ms | 243.8 ms | 239.3 |

Với 64 người dùng, máy chủ ghi số token mỗi giây nhiều gấp khoảng tám lần. Mỗi người dùng chờ token đầu tiên lâu gần gấp bốn lần, và mỗi token mất thời gian lâu hơn khoảng 7.5 lần. Một máy chủ bận rẻ hơn trên mỗi token và chậm hơn cho mỗi người dùng. Mỗi lựa chọn tinh chỉnh thay đổi một trong bốn con số này và đánh đổi một con số khác.

### One scheduler, not two stages

Engine không chạy hai pha như các giai đoạn riêng. Trong vLLM, mỗi bước của bộ lập lịch có một ngân sách token. Các yêu cầu đang chạy nhận token decode tiếp theo trước. Phần ngân sách còn lại dành cho token prompt, theo chunk. Một prefill chỉ là một yêu cầu còn nhiều token phải tính.

## Follow-ups

- **Level 1:** Con số nào trong bốn con số quan trọng nhất với người đọc một câu trả lời dài? Expected: TPOT, khoảng cách trung bình giữa các token, cùng với P99 ITL cho những lần khựng tệ nhất.
- **Level 2:** Tại sao decode bị giới hạn bởi bộ nhớ còn prefill bởi phép toán? Expected: một bước decode đọc mọi trọng số để tạo một token mỗi yêu cầu, nên số byte di chuyển chiếm ưu thế; một bước prefill xử lý hàng trăm token prompt mỗi lượt, nên lượng phép toán mỗi byte cao.
- **Level 3:** Trong lần chạy của tài liệu, 64 người dùng nhận đầu ra gấp khoảng tám lần một người dùng. Tại sao chi phí mỗi token và thời gian chờ mỗi người dùng chuyển động theo hai hướng ngược nhau? Expected: mỗi bước decode đọc trọng số một lần cho tất cả yêu cầu đang chạy, nên nhiều yêu cầu hơn chia sẻ một lần đọc; mỗi yêu cầu khi đó chờ một bước dài hơn.
- **Level 4:** Bài học mô tả một pha prefill và một pha decode. Thay vào đó, bộ lập lịch vLLM có gì? Expected: một ngân sách token mỗi bước; các yêu cầu đang chạy lấy token tiếp theo trước và các chunk prompt lấp phần còn lại, nên một prefill là một yêu cầu còn nhiều token phải tính.

## Wrong answers

- "Thông lượng là con số cần tối ưu, và phần còn lại tự theo sau." Thông lượng là thứ chủ GPU trả tiền cho; người dùng cảm nhận TTFT và các khoảng cách giữa token, và ở 64 người dùng, máy chủ của tài liệu ghi số token gấp tám lần trong khi mỗi người dùng chờ lâu hơn khoảng 7.5 lần mỗi token.
- "Prefill và decode chạy như hai giai đoạn riêng trong engine." Bộ lập lịch vLLM có một ngân sách token mỗi bước; các yêu cầu đang chạy nhận một token decode trước và các chunk prompt lấp phần còn lại, nên hai pha trộn trong một bước.
- "TPOT và ITL là cùng một con số." TPOT là thời gian trung bình mỗi token đầu ra cho một yêu cầu; ITL là mỗi khoảng cách giữa hai token, và P99 của nó cho thấy những lần khựng mà trung bình che giấu.

## Taught in

Luồng yêu cầu nằm trong [phần vLLM 101 về điều gì xảy ra với yêu cầu của bạn](../../../manuals/vllm-101/sections/1-3-understand-what-happens-to-your-request.md) và trong [bài học về nội bộ engine phục vụ](../../../phases/17-infrastructure-and-production/04-vllm-serving-internals/docs/en.md).
