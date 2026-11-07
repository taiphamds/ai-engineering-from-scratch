---
id: kv-scales-silently-at-one
title: The FP8 KV scales that never loaded
card: gpu-memory-quantization
kind: debug
level: 3
roles: [inference-engineer, ai-evaluation-reliability-engineer]
rounds: [debugging, ml-depth]
tags: [fp8, kv-cache, scales, accuracy, checkpoint]
minutes: 8
lessons: []
manuals: [vllm-101#s-fit-more-users-with-an-fp8-kv-cache, sglang-101#s-quantization]
practice: []
cheatsheet: []
related: []
updated: 2026-11-03
---

Bạn bật một KV cache FP8 trên một checkpoint cung cấp các scale được hiệu chuẩn, và độ chính xác trên đánh giá của bạn giảm. Log khởi động chứa một dòng về hệ số tỷ lệ. Điều gì xảy ra, bạn xác nhận như thế nào, và các lựa chọn là gì?

## Short answer

Server chạy cache với scale 1.0, vì loader không dùng các scale trong checkpoint: vLLM in `Using KV cache scaling factor 1.0` khi vậy. SGLang in `Using FP8 KV cache but no scaling factors provided` bất cứ khi nào không truyền `--quantization-param-path`, vì vậy chỉ cảnh báo của nó không cho thấy các scale server dùng. Xác nhận trường hợp vLLM bằng cách tìm trong weight index của checkpoint các tensor kết thúc bằng `k_scale` hoặc `v_scale`; nếu chúng có và vLLM vẫn in cảnh báo, loader đã bỏ chúng, điều xảy ra tại 0.31.0 cho cả một họ mô hình và cho một draft loader trong các issue đang mở. Các lựa chọn là một checkpoint hoặc phiên bản khác nạp được scale, một file scale truyền qua đường dẫn tham số lượng tử hóa trên SGLang, hoặc cache BF16 cho đến khi nạp được, với một lần chạy độ chính xác trên nhiệm vụ riêng sau mỗi thay đổi.

## Full answer

### What a scale does

FP8 cần một scale cho mỗi tensor để ánh xạ phạm vi key và value vào định dạng. Không có scale, mọi scale là 1.0. Nhóm vLLM coi đó là trường hợp tệ nhất cho độ chính xác. Trong các kiểm thử cache chưa hiệu chuẩn của họ phần lớn mô hình giữ gần BF16, và một họ mô hình trên một backend latent-attention không hoạt động tốt khi không có scale được hiệu chuẩn. Một cách sửa trong SGLang cho các scale bị bỏ trên checkpoint compressed-tensors đo GSM8K ở 0.960 khi scale bị bỏ và 0.965 khi được nạp, trên một checkpoint có scale gần 1.0; một checkpoint có scale xa 1.0 mất nhiều hơn.

### Confirm it in three steps

1. Tìm scale trong checkpoint. Tìm weight index cho các tên tensor kết thúc bằng `k_scale` hoặc `v_scale`:

```bash
grep -oE '"[^"]*(k|v)_scale"' model.safetensors.index.json | sort -u
```

Không có đầu ra nghĩa là checkpoint không có scale. Một checkpoint với một file trọng số không có index; thay vào đó liệt kê các tên tensor bằng gói safetensors.

2. Đọc log khởi động. Trong vLLM cảnh báo hệ số tỷ lệ với các scale hiện diện trong checkpoint nghĩa là loader bỏ chúng. Trong SGLang cảnh báo scale được cung cấp in bất cứ khi nào bạn không truyền file scale, vì vậy chỉ nó không nói server dùng scale nào; một cảnh báo về tham số `k_scale` hoặc `v_scale` bị thiếu có nói loader đã bỏ chúng.

3. Chạy các prompt riêng có và không có cache FP8 và so sánh các câu trả lời trước khi lên production.

### The loaders at the pinned versions

Tại vLLM 0.31.0 một họ mô hình không bao giờ nạp KV scale, và một speculative draft loader cũng bỏ chúng; cả hai issue đang mở. SGLang bỏ KV scale của các checkpoint compressed-tensors trước một bản sửa được gộp ngày 2026-08-20, và log báo cáo mỗi tham số `k_scale` là không tìm thấy; bản sửa có trong v0.5.22. Một bản phát hành vLLM sau cũng sửa một trường hợp nơi sleep mức 2 xóa các scale được hiệu chuẩn và request đầu sau nạp lại trả các giá trị sai.

### Weight scales are not KV scales

Checkpoint FP8 của Qwen3-30B-A3B liệt kê các weight scale và không có KV scale trong index, vì vậy cache của nó chạy với scale 1.0 trên GB10 của tài liệu. Một checkpoint FP8 không nói gì về cache của nó cho đến khi bạn nhìn.

### What the manual measured without scales

Qwen3-8B không có KV scale, vì vậy các lần chạy KV FP8 của tài liệu dùng scale 1.0. Trên 500 câu hỏi GSM8K, 8-shot và greedy, vLLM đạt 90.8 phần trăm với cache FP8 so với 91.8 ở BF16, và SGLang 91.6 so với 91.6. Mọi khoảng đều chồng nhau. Đó không phải giấy phép: 500 câu hỏi không thể loại trừ mất vài điểm, đó là một mô hình và một benchmark, và một mô hình có bố trí attention khác có thể mất nhiều hơn.

### The options

- Một checkpoint khác, hoặc phiên bản engine khác, nạp được scale; đọc log sau thay đổi.
- Trên SGLang, một file scale qua `--quantization-param-path`.
- Một cache BF16 cho đến khi scale nạp được, và năng lực từ trọng số FP8 thay vào đó.
- Trong mọi trường hợp, lần chạy độ chính xác trên nhiệm vụ riêng, với cảnh báo cache được đọc như một khuyết điểm cần theo dõi.

## Follow-ups

- **Level 3:** Checkpoint có một file trọng số và không có index. Bạn tìm scale như thế nào? Expected: liệt kê các tên tensor bằng gói safetensors thay vì tìm index, và tìm tên kết thúc bằng k_scale hoặc v_scale.
- **Level 3:** Cảnh báo in, nhưng lần chạy GSM8K không cho thấy tổn thất. Bạn đã xong chưa? Expected: chưa; 500 câu hỏi không thể loại trừ mất vài điểm, tổn thất phụ thuộc mô hình và bố trí attention, và một họ cần các scale được hiệu chuẩn trong khi phần lớn không cần; chạy nhiệm vụ riêng và theo dõi cảnh báo như một khuyết điểm.
- **Level 4:** Tại sao scale được hiệu chuẩn quan trọng hơn cho một số bố trí attention so với số khác? Expected: scale ánh xạ phạm vi key và value vào phạm vi FP8, và một bố trí có các giá trị trải rộng hơn định dạng bị cắt hoặc mất độ chính xác ở scale 1.0; nhóm vLLM nêu một họ latent-attention không hoạt động tốt khi chưa hiệu chuẩn trong khi phần lớn mô hình giữ gần BF16, vì vậy bố trí và hiệu chuẩn quyết định cùng nhau.

## Wrong answers

- "Checkpoint là FP8, vì vậy KV scale được nạp." Weight scale và KV scale là các tensor khác nhau, và một checkpoint có KV scale vẫn có thể bị loader bỏ chúng; cảnh báo cho bạn biết server dùng gì.
- "Cảnh báo chỉ để thông tin." Trên vLLM nó nghĩa là mọi scale KV là 1.0, điều nhóm vLLM coi là trường hợp tệ nhất cho độ chính xác; với scale trong checkpoint nó nghĩa là loader bỏ chúng.
- "Scale 1.0 hoạt động cho Qwen3-8B, vì vậy nó hoạt động." Nó cho các khoảng chồng nhau trên 500 câu hỏi GSM8K cho một mô hình, không thể loại trừ mất vài điểm, và một họ khác mất độ chính xác ở 1.0.
- "Truyền --quantization fp8 để nạp scale." Phương pháp trọng số và scale cache riêng biệt; trên SGLang scale đến từ checkpoint hoặc file đường dẫn tham số lượng tử hóa, và một cờ trọng số không khớp checkpoint phát sinh lỗi lúc khởi động.

## Taught in

[Cho thêm người dùng vừa với một KV cache FP8](../../../manuals/vllm-101/sections/2-4-fit-more-users-with-an-fp8-kv-cache.md) và [phần lượng tử hóa SGLang](../../../manuals/sglang-101/sections/4-3-quantization.md) cho thấy các cảnh báo scale và cách kiểm tra scale nạp.
