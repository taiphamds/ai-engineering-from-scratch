# Multi-Region LLM Serving and KV Cache Locality

> Cân bằng tải luân phiên chủ động gây hại cho suy luận LLM có bộ nhớ đệm. Một yêu cầu không đến nút đang giữ tiền tố của nó phải trả toàn bộ chi phí prefill — khoảng 800 ms ở P50 trên một prompt dài so với ~80 ms khi trúng bộ nhớ đệm. Năm 2026, mẫu trong sản xuất là bộ định tuyến nhận biết bộ nhớ đệm (vLLM Router bằng Rust, bộ định tuyến llm-d) tiêu thụ các sự kiện bộ nhớ đệm KV và định tuyến theo khớp hash tiền tố. Nghiên cứu gần đây (GORGO) đưa độ trễ mạng xuyên vùng thành một số hạng tường minh trong mục tiêu định tuyến. Các dịch vụ thương mại "suy luận xuyên vùng" (suy luận xuyên vùng Bedrock, gateway đa cụm GKE) xem suy luận như một hộp đen — chúng xử lý tính khả dụng, không phải TTFT. JPMorgan và Mayo Clinic thực hiện chuyển đổi dự phòng us-east-1 vào tháng 11 năm 2024 trong ~22 phút. Thực tế DR: 32% lỗi DR của LLM là do các nhóm sao lưu trọng số nhưng quên file tokenizer hoặc cấu hình lượng tử hóa.

**Type:** Learn
**Languages:** Python (stdlib, toy prefix-cache-aware router simulator)
**Prerequisites:** Phase 17 · 04 (vLLM Serving), Phase 17 · 06 (SGLang RadixAttention)
**Time:** ~60 minutes

## Learning Objectives

- Giải thích tại sao cân bằng tải luân phiên phá vỡ suy luận có bộ nhớ đệm và định lượng chi phí TTFT phát sinh.
- Vẽ sơ đồ bộ định tuyến nhận biết bộ nhớ đệm: đầu vào (sự kiện bộ nhớ đệm KV), thuật toán (khớp hash tiền tố), tiêu chí phá hòa (mức sử dụng GPU).
- Nêu nguyên nhân gây ra 32% lỗi DR của LLM (thiếu file tokenizer / cấu hình lượng tử hóa) và nêu danh sách kiểm tra DR ba file.
- Phân biệt các dịch vụ xuyên vùng thương mại (Bedrock CRI, GKE Multi-Cluster Gateway) với định tuyến nhận biết KV.

## The Problem

Dịch vụ của bạn chạy ở us-east-1, us-west-2 và eu-west-1. Bạn đặt một ALB phía trước với cơ chế luân phiên. Tỷ lệ trúng bộ nhớ đệm tiền tố trong sản xuất giảm xuống 8%. TTFT P50 tăng gấp ba. Log vLLM của bạn cho thấy mọi yêu cầu đều trả toàn bộ chi phí prefill.

Luân phiên là tối ưu cho các dịch vụ không trạng thái. Suy luận LLM có trạng thái theo thiết kế — bộ nhớ đệm KV mã hóa mọi thứ mô hình đã thấy. Định tuyến mù là định tuyến vào sai bộ nhớ đệm.

Riêng biệt, nhóm của bạn có kế hoạch DR. Bạn sao lưu trọng số mô hình vào S3 xuyên vùng. Một sự cố ngừng hoạt động vùng xảy ra; bạn thử chuyển đổi dự phòng; bản sao từ chối khởi động. Bạn quên rằng tokenizer.json, cấu hình lượng tử hóa và cấu hình mở rộng RoPE nằm trong một bucket riêng mà bạn không đồng bộ.

Phục vụ LLM đa vùng là vấn đề bộ nhớ đệm, vấn đề định tuyến và vấn đề giữ gìn DR — không phải vấn đề bộ cân bằng tải.

## The Concept

### Cache-aware routing

Yêu cầu đến với một prompt. Bộ định tuyến hash tiền tố (chẳng hạn, 512 token đầu tiên); nó hỏi từng bản sao "bạn có tiền tố này trong bộ nhớ đệm không?". Các bản sao công bố sự kiện bộ nhớ đệm KV trên một kênh pub/sub khi cấp phát và loại bỏ block. Bộ định tuyến chọn bản sao khớp, chuyển sang tiêu chí phá hòa dựa trên mức sử dụng GPU nếu không bản sao nào có.

**vLLM Router** (Rust, production-stack 2026): đăng ký các sự kiện `kv.cache.block_added`, duy trì một chỉ mục hash tiền tố → bản sao, định tuyến bằng tra cứu $O(1)$. Chuyển sang độ sâu hàng đợi nhỏ nhất khi không khớp.

**llm-d router**: cùng mẫu, nguyên bản Kubernetes. Công bố sự kiện qua API ControlPlane.

**SGLang RadixAttention** (Giai đoạn 17 · 06) là cơ chế tương đương bên trong bản sao. Định tuyến giữa các bản sao hoàn toàn nằm phía trước.

### Numbers

TTFT P50 trên một prompt 2K token, Llama 3.3 70B FP8, H100:
- Trúng bộ nhớ đệm (cùng bản sao, tiền tố đã nằm trong bộ nhớ): ~80 ms.
- Trượt bộ nhớ đệm (prefill nguội): ~800 ms.

Chênh lệch 10x. Nếu bộ định tuyến của bạn trúng 60-80% bộ nhớ đệm tiền tố trên các bản sao, bạn tiến gần hiệu năng một bản sao ở năng lực N bản sao. Nếu nó trúng 10%, bạn tiến gần mở rộng quy mô đơn giản.

### Cross-region has a new constraint — network latency

RTT liên vùng:
- us-east-1 ↔ us-west-2: ~65 ms.
- us-east-1 ↔ eu-west-1: ~75 ms.
- us-east-1 ↔ ap-southeast-1: ~220 ms.

Nếu định tuyến đưa một yêu cầu từ us-east-1 đến một prefix nóng ở ap-southeast-1, prefill tiết kiệm được (800 → 80 ms, tức 720 ms) co lại còn khoảng 500 ms khi trả chi phí RTT ~220 ms, và biên lợi ích biến mất nếu vùng từ xa xếp yêu cầu vào hàng đợi hoặc đã loại prefix. GORGO (nghiên cứu năm 2026) làm điều này rõ ràng — cùng tối thiểu hóa `prefill_time + network_latency`, không chỉ prefill. Thường câu trả lời là giữ định tuyến trong vùng trừ với các prefix khổng lồ nhiều MB nơi prefill chiếm ưu thế.

### Commercial "cross-region inference" does not help here

Suy luận xuyên vùng AWS Bedrock tự động định tuyến yêu cầu sang các vùng khác khi có áp lực năng lực. Nó tối ưu tính khả dụng, không phải TTFT, và xem suy luận như một hộp đen. GKE Multi-Cluster Gateway cũng vậy — chuyển đổi dự phòng cấp dịch vụ, không nhận biết bộ nhớ đệm KV.

Bạn vẫn cần một bộ định tuyến nhận biết bộ nhớ đệm ở lớp ứng dụng ngay cả khi dùng chúng. Chúng xử lý trường hợp "us-east-1 đang bốc cháy". Định tuyến nhận biết bộ nhớ đệm xử lý trường hợp TTFT.

### DR hygiene — the 32% missing-files problem

Thống kê năm 2026 được trích dẫn rộng rãi: 32% lỗi DR của LLM xảy ra vì các nhóm sao lưu trọng số nhưng quên:

- `tokenizer.json` hoặc `tokenizer.model`
- Cấu hình lượng tử hóa (`quantize_config.json`, các hệ số tỷ lệ AWQ, các điểm không GPTQ)
- Cấu hình riêng của mô hình (mở rộng RoPE, mặt nạ attention, mẫu chat)
- Cấu hình engine (`vllm_config.yaml`, mặc định lấy mẫu, manifest adapter LoRA)

Giải pháp là một manifest DR tối thiểu ba file:

1. Tất cả file trong repo mô hình HF (trọng số + cấu hình + tokenizer).
2. Cấu hình phục vụ riêng của engine.
3. Manifest triển khai (YAML K8s, Dockerfile, khóa phụ thuộc).

Thêm nữa: thực hiện diễn tập DR hằng quý. Cuộc diễn tập us-east-1 của JPMorgan đạt thời gian khôi phục 22 phút vào tháng 11 năm 2024 chỉ vì cẩm nang đã được diễn tập.

### Data residency is orthogonal

PHI của khách hàng EU không thể rời EU. Nếu bộ định tuyến nhận biết bộ nhớ đệm của bạn gửi một yêu cầu xuất phát từ Paris đến us-east-1 để khớp tiền tố, bạn đã vi phạm GDPR bất kể lợi ích TTFT. Phân vùng bộ định tuyến theo ranh giới lưu trú trước khi tối ưu bộ nhớ đệm.

### Numbers you should remember

- Chênh lệch TTFT trúng so với trượt bộ nhớ đệm: ~10x (80 ms so với 800 ms trên prompt 2K).
- RTT liên vùng Mỹ-EU: ~75 ms.
- Lỗi DR: 32% thiếu cấu hình tokenizer/lượng tử hóa.
- Chuyển đổi dự phòng us-east-1 của JPMorgan tháng 11 năm 2024: 22 phút (SLA 30 phút).

```figure
cache-aware-router
```

## Use It

`code/main.py` mô phỏng ba chiến lược định tuyến (luân phiên, nhận biết bộ nhớ đệm trong vùng, nhận biết bộ nhớ đệm toàn cầu) trên một khối lượng công việc đa vùng. Báo cáo tỷ lệ trúng bộ nhớ đệm, TTFT P50/P99 và hóa đơn xuyên vùng.

## Ship It

Bài học này tạo ra `outputs/skill-multi-region-router.md`. Với các vùng, ràng buộc lưu trú và SLA, thiết kế một kế hoạch định tuyến.

## Exercises

1. Chạy `code/main.py`. Ở độ dài prompt nào định tuyến xuyên vùng vượt định tuyến chỉ cục bộ, với RTT 75 ms?
2. Tỷ lệ trúng bộ nhớ đệm của bạn giảm từ 70% xuống 12%. Chẩn đoán ba nguyên nhân có thể và các đại lượng quan sát xác nhận từng nguyên nhân.
3. Thiết kế một manifest DR cho một mô hình 70B lượng tử hóa AWQ được phục vụ trong vLLM với 5 adapter LoRA. Liệt kê mọi file và cấu hình.
4. Lập luận liệu suy luận xuyên vùng Bedrock có "đủ" cho một fintech có SLO TTFT nghiêm ngặt hay không. Trích dẫn các hành vi cụ thể.
5. Một yêu cầu xuất phát từ Paris khớp một tiền tố ở us-east-1. Bạn có định tuyến nó không? Viết chính sách.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|----------------|------------------------|
| Cache-aware routing (Định tuyến nhận biết bộ nhớ đệm) | "LB thông minh" | Định tuyến theo khớp hash tiền tố đến bản sao giữ bộ nhớ đệm KV |
| KV-cache events (Sự kiện bộ nhớ đệm KV) | "pub-sub bộ nhớ đệm" | Các bản sao công bố thêm/loại bỏ block; bộ định tuyến lập chỉ mục |
| Prefix hash (Hash tiền tố) | "khóa bộ nhớ đệm" | Hash của N token đầu tiên được dùng để tra cứu ở bộ định tuyến |
| GORGO | "nghiên cứu định tuyến xuyên vùng" | arXiv 2602.11688; độ trễ mạng là số hạng tường minh |
| Cross-region inference (Suy luận xuyên vùng) | "Bedrock CRI" | Sản phẩm AWS; chuyển đổi dự phòng cho tính khả dụng, không nhận biết TTFT |
| DR manifest (Manifest DR) | "danh sách sao lưu" | Mọi file cần để khôi phục — không chỉ trọng số |
| Data residency (Lưu trú dữ liệu) | "ranh giới GDPR" | Ràng buộc pháp lý về vùng nào thấy dữ liệu người dùng |
| RTT | "thời gian khứ hồi" | Độ trễ mạng; 75 ms Mỹ-EU, 220 ms Mỹ-APAC |
| LLM-aware LB (LB nhận biết LLM) | "LB trúng bộ nhớ đệm" | Bộ định tuyến nhận biết bộ nhớ đệm như một danh mục sản phẩm |

## Further Reading

- [BentoML — Multi-cloud and cross-region inference](https://bentoml.com/llm/infrastructure-and-operations/multi-cloud-and-cross-region-inference)
- [arXiv — GORGO (2602.11688)](https://arxiv.org/html/2602.11688v1) — tái sử dụng bộ nhớ đệm KV xuyên vùng với số hạng độ trễ mạng.
- [TianPan — Multi-Region LLM Serving Cache Locality](https://tianpan.co/blog/2026-04-17-multi-region-llm-serving-data-residency-routing)
- [AWS Bedrock Cross-Region Inference](https://docs.aws.amazon.com/bedrock/latest/userguide/cross-region-inference.html) — tài liệu chuyển đổi dự phòng cho tính khả dụng.
- [vLLM Production Stack Router](https://github.com/vllm-project/production-stack) — mã nguồn bộ định tuyến nhận biết bộ nhớ đệm.
