---
id: multi-lora-serving-cost
title: What many LoRA adapters cost one server
card: inference-serving
kind: design
level: 2
roles: [inference-engineer, applied-ai-engineer]
rounds: [system-design, screen]
tags: [lora, adapters, max-loras, prefix-cache, cuda-graphs]
minutes: 8
lessons: [phases/17-infrastructure-and-production/09-production-quantization]
manuals: [vllm-101#s-serve-many-fine-tunes-with-multi-lora, sglang-101#s-prefix-friendly-prompts]
practice: []
cheatsheet: []
related: []
updated: 2026-11-03
---

Bạn có hai mươi bản fine-tune của một mô hình nền, mỗi bản là một adapter LoRA, và bạn muốn phục vụ chúng từ một máy chủ vLLM. Bạn đặt gì, điều gì quyết định chi phí, và điều gì khác trong máy chủ thay đổi khi LoRA được bật?

## Short answer

Bật LoRA khi khởi động bằng `--enable-lora`, đặt tên các adapter bằng `--lora-modules`, và để mỗi yêu cầu chọn một adapter trong trường `model` của nó. Ba giới hạn quyết định chi phí: `--max-loras`, mặc định là 1 và giới hạn các adapter chạy trong một batch, `--max-lora-rank`, mặc định là 16 và dành bộ nhớ cho rank lớn nhất, và `--max-cpu-loras` cho các adapter được giữ trong bộ nhớ CPU sẵn sàng nạp. LoRA cũng thay đổi prefix cache, vì adapter là một phần của mọi khóa block, nên hai adapter không bao giờ chia sẻ các block đã cache, và nó thêm CUDA graph cho mỗi adapter, nên khởi động lâu hơn và dùng nhiều bộ nhớ hơn.

## Full answer

### Start it

```bash
vllm serve Qwen/Qwen3-8B \
  --enable-lora \
  --lora-modules support=/adapters/support legal=/adapters/legal \
  --max-loras 4 --max-lora-rank 64
```

Mỗi đường dẫn là một thư mục theo định dạng PEFT mà phần lớn thư viện huấn luyện ghi: `adapter_config.json` và trọng số trong `adapter_model.safetensors`, hoặc `adapter_model.bin`. Một yêu cầu chọn adapter theo tên của nó trong trường `model`, và `/v1/models` liệt kê mô hình nền cùng mỗi adapter. Các yêu cầu cho các adapter khác nhau có thể chạy trong cùng batch. Tài liệu chạy cách này với Qwen3-0.6B và hai adapter công khai có rank 8 và rank 64, và một yêu cầu chat đến mỗi adapter trả về HTTP 200.

### Size the three limits

| Cờ | Mặc định | Nó giới hạn gì |
|---|---|---|
| `--max-loras` | 1 | các adapter có thể chạy trong một batch trên GPU |
| `--max-lora-rank` | 16 | rank adapter lớn nhất mà máy chủ chấp nhận |
| `--max-cpu-loras` | chưa đặt | các adapter được giữ trong bộ nhớ CPU, sẵn sàng nạp |

Mặc định một adapter mỗi batch là thấp cho một máy chủ có nhiều adapter. Các yêu cầu cho adapter thứ hai chờ đến khi batch của adapter đầu tiên hoàn tất. Tăng `--max-loras` lên số adapter bận cùng lúc. Đặt `--max-lora-rank` bằng rank lớn nhất trong các adapter của bạn và không cao hơn: máy chủ dành bộ nhớ cho rank lớn nhất mà nó chấp nhận, và tài liệu khuyên không dùng một mặc định lớn như 256. Các adapter trong bộ nhớ CPU nạp nhanh khi một yêu cầu gọi tên chúng, nên định cỡ `--max-cpu-loras` cho các adapter đã được làm nóng.

### Load adapters while the server runs

Với `VLLM_ALLOW_RUNTIME_LORA_UPDATING=True` bạn có thể post đến `/v1/load_lora_adapter` với một tên và một đường dẫn, và đến `/v1/unload_lora_adapter` để gỡ nó. Chỉ bật điều này khi bạn tin cậy mọi bên gọi máy chủ, vì route nạp file từ một đường dẫn do bên gọi cung cấp.

### What changes elsewhere

- **Prefix cache.** Adapter là một phần của mỗi khóa block trong vLLM và của khóa cây trong SGLang. Hai adapter không bao giờ chia sẻ các block đã cache, ngay cả với cùng prompt. Một system prompt dùng chung được cache một lần cho mỗi adapter, không phải một lần.
- **CUDA graph.** vLLM capture các graph riêng cho các batch có adapter. Nhiều adapter hơn và nhiều kích thước graph hơn làm tăng thời gian khởi động và bộ nhớ.
- **Tên.** Từ 0.31 một adapter không thể có tên của một mô hình được phục vụ.

Tài liệu không đo chi phí của số lượng adapter hoặc rank trên phần cứng của nó.

### Pick the base format with LoRA in mind

Hướng dẫn lựa chọn của bài học nói rằng một mô hình nền GPTQ 4-bit hỗ trợ các adapter LoRA trong vLLM, với các kernel Marlin nhanh, trong khi các định dạng microscaling 4-bit không hỗ trợ LoRA vào đầu năm 2026. Với một mô hình nền cộng nhiều biến thể fine-tune, GPTQ là hướng 4-bit; AWQ là lựa chọn khi không có LoRA, và FP8 khi chất lượng không được thay đổi.

## Follow-ups

- **Level 2:** Hai tenant gửi cùng system prompt dài qua hai adapter khác nhau. Yêu cầu thứ hai có cache hit không? Expected: không; adapter là một phần của khóa block trong vLLM và của khóa cây trong SGLang, nên hai adapter không bao giờ chia sẻ block ngay cả với các token giống hệt nhau.
- **Level 3:** Các yêu cầu cho adapter thứ hai chờ dù GPU nhàn rỗi. Tại sao? Expected: giới hạn adapter mặc định là 1, nên chỉ một adapter chạy trong một batch và các yêu cầu cho adapter khác chờ đến khi batch đó hoàn tất; tăng nó lên số adapter bận cùng lúc.
- **Level 3:** Tại sao không đặt giới hạn rank là 256 cho chắc? Expected: máy chủ dành bộ nhớ cho rank lớn nhất mà nó chấp nhận, nên giới hạn cao lấy bộ nhớ từ pool KV cho những adapter bạn không có; đặt nó bằng rank lớn nhất của bạn.
- **Level 4:** Bạn cũng muốn trọng số 4-bit cho mô hình nền. Định dạng nào, và nó loại trừ điều gì? Expected: một mô hình nền GPTQ 4-bit, vì nó hỗ trợ các adapter LoRA trong vLLM với các kernel Marlin; các định dạng microscaling 4-bit không hỗ trợ LoRA vào đầu năm 2026, nên chúng bị loại cho đến khi hỗ trợ.

## Wrong answers

- "Một máy chủ cho mỗi adapter thì đơn giản hơn." Mỗi máy chủ sẽ giữ bản sao riêng của mô hình nền và pool riêng của nó; một mô hình nền với adapter theo yêu cầu chia sẻ cả hai, và các yêu cầu cho các adapter khác nhau có thể chạy trong cùng batch.
- "Các giới hạn mặc định là ổn." Một adapter mỗi batch khiến các yêu cầu cho adapter thứ hai chờ, và một giới hạn rank 16 từ chối một adapter rank-64; đặt cả hai từ các adapter bạn phục vụ.
- "Bật nạp adapter lúc chạy để người vận hành có thể thêm adapter mà không khởi động lại." Route nạp đọc file từ một đường dẫn do bên gọi cung cấp, nên chỉ bật nó khi bạn tin cậy mọi bên gọi máy chủ.
- "LoRA không tốn gì cho prefix cache vì mô hình nền giống nhau." Adapter thay đổi các key và value, nên nó là một phần của khóa block, và hai adapter không bao giờ chia sẻ các block đã cache.

## Taught in

[Phục vụ nhiều bản fine-tune bằng multi-LoRA](../../../manuals/vllm-101/sections/3-7-serve-many-fine-tunes-with-multi-lora.md) đưa ra các cờ và giới hạn, [Prompt thân thiện với prefix](../../../manuals/sglang-101/sections/3-4-prefix-friendly-prompts.md) lưu ý khóa cây, và [bài học lượng tử hóa production](../../../phases/17-infrastructure-and-production/09-production-quantization/docs/en.md) ghép một mô hình nền 4-bit với các adapter.
