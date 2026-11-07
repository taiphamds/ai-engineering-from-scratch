---
id: the-cost-of-batch-invariance
title: What determinism costs a live server
card: inference-serving
kind: tradeoff
level: 3
roles: [inference-engineer, ai-evaluation-reliability-engineer]
rounds: [design-review, ml-depth]
tags: [batch-invariance, determinism, throughput, prefix-cache, evaluation]
minutes: 10
lessons: []
manuals: [vllm-101#s-get-reproducible-outputs, sglang-101#s-deterministic-inference-and-logprobs]
practice: []
cheatsheet: []
related: []
updated: 2026-11-03
---

Nhóm đánh giá của bạn muốn các đầu ra giống hệt từng bit từ máy chủ đang hoạt động và yêu cầu bạn bật batch invariance cho toàn bộ lưu lượng. Nó thay đổi gì, nó tốn gì, và bạn sẽ nói gì?

## Short answer

Chế độ thay các kernel chia tổng theo kích thước batch bằng các kernel giữ một thứ tự rút gọn, nên một yêu cầu cho cùng logit khi riêng lẻ và trong một batch. Nó tốn tốc độ, nhiều nhất ở mức đồng thời thấp: trên L4 của chúng tôi, mô hình nhỏ trả thời gian mỗi token gấp 2.4 lần ở một người dùng và 1.4 lần ở 32, và Qwen3-8B trả 1.4 lần ở 8 người dùng với đầu ra ít hơn 27 phần trăm. Tôi sẽ bật nó cho các máy chủ đánh giá và rollout và để nó tắt cho lưu lượng production, sau khi đo chi phí ở mức đồng thời chúng tôi phục vụ, vì trên SGLang với backend mặc định nó cũng tắt prefix caching.

## Full answer

### What the mode switches

Trên vLLM, `VLLM_BATCH_INVARIANT=1` cần một GPU có compute capability 8.0 hoặc cao hơn, bao gồm L4 và GB10, và nó tắt các tính năng tốc độ thay đổi thứ tự các tổng, chẳng hạn all-reduce tùy chỉnh với tensor parallelism. Ở 0.31.0 nó đang beta.

Trên SGLang, `--enable-deterministic-inference` thay nhân ma trận, log-softmax, trung bình, RMS norm và nhân theo batch bằng các kernel batch-invariant, buộc backend lấy mẫu thông thường, đặt all-reduce thành một cây để các tổng tensor-parallel cộng theo thứ tự cố định, chỉ chấp nhận một số backend attention, tắt radix cache trừ khi backend là một backend hỗ trợ nó, và cấp cho mọi yêu cầu không có `sampling_seed` seed 42. Quy tắc cache quan trọng nhất: với backend mặc định trên GB10, log nói radix cache không tương thích, nên mọi prefix lặp lại trả toàn bộ prefill lần nữa. Trên L4, chế độ chọn một backend khác giữ cache bật.

### What the manual measured

vLLM trên L4 với xung nhịp khóa ở 900 MHz, Qwen3-0.6B, các lần chạy theo thứ tự mặc định, batch-invariant, mặc định lần nữa, mỗi loại hai seed với đặt lại cache trước mỗi lần chạy:

| Người dùng | TPOT trung vị, mặc định / batch-invariant | Token đầu ra/s, mặc định / batch-invariant |
|---|---|---|
| 1 | 6.9 / 16.9 ms (2.4x) | 140.6 / 58.7 (thấp hơn 58%) |
| 8 | 9.9 / 18.2 ms (1.8x) | 755 / 420 (thấp hơn 44%) |
| 32 | 18.8 / 25.9 ms (1.4x) | 1,565 / 1,154 (thấp hơn 26%) |

Trên Qwen3-8B ở 8 người dùng, thời gian mỗi token dài hơn 1.4 lần và đầu ra thấp hơn 27 phần trăm; ở 32 người dùng là 1.3 lần và 23 phần trăm. Chi phí tương đối giảm khi nhiều người dùng hơn chia sẻ mỗi bước, và nó lớn hơn trên mô hình nhỏ.

SGLang trên GB10 với Qwen3-30B-A3B, một lần chạy mỗi máy chủ ở mức đồng thời 8: đầu ra giảm từ 78.92 xuống 64.83 token mỗi giây, 18 phần trăm, và thời gian trung vị mỗi token tăng từ 97.30 lên 117.43 ms. Radix cache tắt trong lần chạy đó, nên một workload có prefix dùng chung trả nhiều hơn con số này cho thấy.

### What other teams measured

Một bài viết về tính không xác định chạy 1,000 yêu cầu Qwen3-8B trên vLLM trong 26 s theo mặc định, 55 s với các kernel batch-invariant, và 42 s với một kernel attention tốt hơn. Một nghiên cứu năm 2026 đo các kernel batch-invariant có độ trễ hơn gấp đôi và thông lượng thấp hơn đến 74 phần trăm. Một nghiên cứu xác minh tìm thấy rằng các chế độ của cả hai engine cho logit khác nhau dưới một số thay đổi thực thi, chẳng hạn chia chunk prompt và tái sử dụng KV cache. Tài liệu không tự đo những điều này.

### What the mode does not cover

Ở 0.31.0, một mô hình vLLM tự chọn backend attention của nó bỏ qua kiểm tra, nên đầu ra của nó vẫn có thể phụ thuộc vào batch; bản phát hành tiếp theo kiểm tra mọi lớp attention, và một bản sửa cho các mô hình expert với data, tensor và expert parallelism dưới compile không nằm trong đó. Trên SGLang, một mô hình hybrid state-space được báo cáo là không batch-invariant, một số kiến trúc mới hơn chưa được hỗ trợ, một kernel sliding-window cho vài đầu ra tham lam trong chế độ prefix với issue vẫn mở, và một thuật toán speculative cho văn bản khác sau khi khởi động lại vì autotuning kernel chọn các tactic khác nhau ở mỗi lần khởi động.

### What I would say

Dùng chế độ ở nơi các bit giống nhau là sản phẩm: các rollout học tăng cường và các đánh giá phải tái lập. Giữ lưu lượng production trên các kernel mặc định, nơi prefix caching và các kernel nhanh hơn đáng giá hơn các bit giống nhau. Đo chi phí ở mức đồng thời bạn phục vụ, không phải ở một điểm, và kiểm thử thiết lập chính xác: mô hình, backend attention, bố trí song song, kích thước chunk và thiết lập cache. Xóa cache giữa hai lần chạy bạn so sánh, và giữ dtype giống nhau.

## Follow-ups

- **Level 3:** Tại sao chi phí tương đối giảm ở mức đồng thời cao hơn? Expected: các kernel bất biến từ bỏ các cách chia nhanh mà một GPU nhàn rỗi sẽ dùng, và mất mát đó là tỷ phần lớn hơn của một bước nhỏ; với nhiều hàng hơn mỗi bước, thứ tự cố định tốn một tỷ phần nhỏ hơn, 1.4 lần ở 32 người dùng so với 2.4 ở một người dùng.
- **Level 3:** Trên SGLang, con số 18 phần trăm đánh giá thấp chi phí cho một workload chat. Tại sao? Expected: với backend attention mặc định, chế độ xác định tắt radix cache, nên mọi prefix lặp lại trả toàn bộ prefill lần nữa; chọn một backend giữ cache ở nơi GPU hỗ trợ nó.
- **Level 4:** Hai máy chủ đều chạy chế độ và vẫn cho văn bản tham lam khác nhau cho một prompt. Nêu ba nguyên nhân. Expected: phần cứng hoặc phiên bản engine khác nhau; một đường mô hình mà chế độ không bao quát, chẳng hạn một lớp attention tự chọn backend hoặc một lớp hybrid state-space; và autotuning kernel chọn các tactic khác nhau ở mỗi lần khởi động.

## Wrong answers

- "Chế độ không tốn gì khi GPU nhàn rỗi." Chi phí lớn nhất ở mức đồng thời thấp, thời gian mỗi token gấp 2.4 lần ở một người dùng trên mô hình nhỏ, vì các kernel bất biến từ bỏ các cách chia nhanh mà một GPU nhàn rỗi sẽ dùng.
- "Bật nó cho production, vì tính đúng đắn đến trước." Lưu lượng production được lợi từ prefix caching và kernel nhanh nhiều hơn từ các bit giống nhau; quan điểm của tài liệu là dùng chế độ cho rollout và đánh giá và đo chi phí ở mức đồng thời bạn phục vụ.
- "Cờ bao quát mọi mô hình." Ở 0.31.0, một mô hình tự chọn backend attention bỏ qua kiểm tra, các lớp hybrid state-space không được bao quát, và một bản sửa cho các mô hình expert dưới compile không có trong bản phát hành tiếp theo; kiểm thử thiết lập chính xác.
- "Seed 42 khiến các yêu cầu lấy mẫu có thể tái lập." Nó khiến mọi yêu cầu không có sampling_seed rút cùng số ngẫu nhiên, có thể tái lập và cũng giống nhau giữa các người dùng; đặt một sampling_seed cho mỗi yêu cầu phải tái lập.

## Taught in

[Nhận đầu ra có thể tái lập](../../../manuals/vllm-101/sections/3-8-get-reproducible-outputs.md) đo chi phí trên L4, và [phần suy luận xác định của SGLang](../../../manuals/sglang-101/sections/4-6-deterministic-inference-and-logprobs.md) liệt kê những gì cờ chuyển đổi.
