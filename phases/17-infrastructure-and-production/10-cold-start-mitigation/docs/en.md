# Cold Start Mitigation for Serverless LLMs

> Một image mô hình 20 GB mất từ 5-10 phút (7B) đến hơn 20 phút (70B) để chuyển từ trạng thái nguội sang phục vụ. Trong một thế giới serverless thực sự, đó không phải là làm nóng — đó là gián đoạn dịch vụ. Các biện pháp giảm thiểu hoạt động ở năm lớp: image nút được nạp sẵn (Bottlerocket trên AWS, kiến trúc hai volume), truyền mô hình theo luồng (NVIDIA Run:ai Model Streamer, tích hợp sẵn trong vLLM), ảnh chụp bộ nhớ GPU (checkpoint của Modal, khởi động lại nhanh hơn tới 10x), bể nóng (`min_workers=1`), nạp theo tầng (pipeline NVMe→DRAM→HBM của ServerlessLLM, giảm độ trễ 10-200x), và di chuyển trực tiếp chuyển các token đầu vào (KB) thay vì bộ nhớ đệm KV (GB). Modal công bố khởi động nguội 2-4s là mức sàn; Baseten mặc định 5-10s, dưới một giây với làm nóng trước. Bài học này dạy bạn đo lường, phân bổ ngân sách và kết hợp năm lớp.

**Type:** Learn
**Languages:** Python (stdlib, toy cold-start path simulator)
**Prerequisites:** Phase 17 · 02 (Inference Platform Economics), Phase 17 · 03 (GPU Autoscaling)
**Time:** ~60 minutes

## Learning Objectives

- Liệt kê năm lớp giảm thiểu khởi động nguội và nêu tên một công cụ hoặc mẫu ở mỗi lớp.
- Tính tổng thời gian khởi động nguội bằng tổng của (cấp phát nút) + (tải trọng số xuống) + (nạp trọng số vào HBM) + (khởi tạo engine) cho một mô hình 70B.
- Giải thích tại sao di chuyển trực tiếp chuyển token đầu vào (KB) chứ không phải bộ nhớ đệm KV (GB) và chi phí phát sinh là gì (tính toán lại).
- Nêu sự đánh đổi của bể nóng (trả tiền cho GPU nhàn rỗi hoặc chấp nhận phần đuôi khởi động nguội) và ngưỡng SLA mà tại đó `min_workers > 0` trở thành bắt buộc.

## The Problem

Endpoint LLM serverless của bạn giảm quy mô về không qua đêm. Lúc 8 giờ sáng, lưu lượng tăng vọt. Yêu cầu đầu tiên chờ trong khi:

1. Karpenter cấp phát một nút GPU: 45-60s.
2. Container kéo một image 30 GB có trọng số: 120-300s.
3. Engine nạp trọng số vào HBM: 45-120s tùy kích thước mô hình và tốc độ lưu trữ.
4. vLLM hoặc TRT-LLM khởi tạo CUDA graph, bể bộ nhớ đệm KV, tokenizer: 10-30s.

Tổng: 220-510s (khoảng 3-8 phút) trước khi một token quay về. SLA của bạn là 2s. Bạn triển khai một bể nóng (`min_workers=1`) và vấn đề dường như biến mất — nhưng giờ bạn trả tiền cho một GPU nhàn rỗi 24x7. Nếu dịch vụ của bạn có 5 sản phẩm, mỗi sản phẩm có một bản sao nóng, thì đó là 5 × 24 × 30 = 3,600 giờ GPU/tháng dù có hay không một người dùng nào gọi.

Giảm thiểu khởi động nguội là cách giữ tính kinh tế của serverless trong khi tiến gần đến độ trễ của trạng thái luôn bật.

## The Concept

### Layer 1 — pre-seeded node images (Bottlerocket)

Trên AWS, kiến trúc hai volume của Bottlerocket tách hệ điều hành khỏi dữ liệu. Chụp volume dữ liệu với image container của bạn đã được kéo sẵn; tham chiếu ID ảnh chụp trong `EC2NodeClass` của bạn. Các nút mới khởi động với trọng số đã có trên NVMe cục bộ — bước 2 và một phần bước 3 biến mất. Hoạt động với Karpenter một cách nguyên bản. Mức tiết kiệm điển hình: 2-4 phút mỗi lần khởi động nguội đối với mô hình lớn.

Tương đương trên GCP: image VM tùy chỉnh với các lớp container được tích hợp sẵn. Trên Azure: ảnh chụp đĩa được quản lý với cùng mẫu.

### Layer 2 — model streaming (Run:ai Model Streamer)

Thay vì nạp toàn bộ file trước khi trả lời yêu cầu đầu tiên, truyền trọng số vào bộ nhớ GPU theo từng lớp và bắt đầu xử lý ngay khi block transformer đầu tiên đã nằm trong bộ nhớ. NVIDIA Run:ai Model Streamer được tích hợp sẵn trong vLLM 2026. Hoạt động với S3, GCS và NVMe cục bộ. Cắt thời gian nạp trọng số xuống khoảng một nửa đối với mô hình lớn bằng cách chồng lấp I/O với thiết lập tính toán.

### Layer 3 — GPU memory snapshots (Modal)

Modal tạo một checkpoint của trạng thái GPU (trọng số, CUDA graph, vùng bộ nhớ đệm KV) sau lần nạp đầu tiên. Những lần khởi động lại tiếp theo giải tuần tự hóa trực tiếp vào HBM — nhanh hơn 10x so với khởi tạo lại. Đây là thứ gần nhất với "khởi động một GPU nóng trong 2 giây." Sự đánh đổi: ảnh chụp gắn với từng cấu trúc liên kết GPU, vì vậy nếu Karpenter chuyển bạn sang một SKU khác, bạn tạo lại checkpoint.

### Layer 4 — warm pools (min_workers=1)

Biện pháp giảm thiểu đơn giản nhất: giữ một bản sao luôn sẵn sàng. Chi phí là giá theo giờ của một GPU 24x7. Phép tính khắc nghiệt với mô hình nhỏ (bạn trả $0.85-$1.50/giờ để tránh khởi động nguội 30s) và dễ chịu với mô hình lớn (trả $4/giờ để tránh khởi động nguội 5 phút). Ngưỡng SLA mà tại đó bể nóng trở thành bắt buộc: thường là TTFT P99 < 60s trên một mô hình 70B+.

### Layer 5 — tiered loading (ServerlessLLM)

ServerlessLLM xem lưu trữ như một hệ phân cấp: NVMe (nhanh nhưng lớn), DRAM (trung bình nhưng phân tầng), HBM (nhỏ nhưng tức thì). Trọng số được nạp trước vào DRAM; nạp theo nhu cầu vào HBM. Bài báo báo cáo mức giảm độ trễ 10-200x khi nạp nguội so với cách nạp đơn giản từ đĩa vào HBM. Việc áp dụng trong sản xuất còn sớm nhưng đã có tích hợp với vLLM.

### Layer 6 — live migration (bonus pattern)

Khi một nút trở nên không khả dụng (thu hồi spot, rút hết công việc khỏi nút), mẫu truyền thống là khởi động nguội một bản sao khác và xử lý hết hàng đợi yêu cầu. Di chuyển trực tiếp chuyển các token đầu vào (kilobyte) đến một đích đã nạp mô hình và tính toán lại bộ nhớ đệm KV tại đích. Tính toán lại rẻ hơn chuyển GB bộ nhớ đệm KV qua mạng. Áp dụng cho các triển khai tách rời.

### The warm-pool math

Đối với một dịch vụ có SLA P99 TTFT là 2s, câu hỏi không phải là "có/không có bể nóng" mà là "bao nhiêu bản sao nóng, và những đường xử lý nào nhận được chúng."

- Các đường xử lý tương tác giá trị cao (trò chuyện trực tiếp, agent giọng nói): `min_workers=1-2`.
- Các đường xử lý theo lô nền (phân loại hằng đêm): chấp nhận giảm quy mô về không, chịu được khởi động nguội 5-10 phút.
- Gói cao cấp: `min_workers` cho mỗi tenant với năng lực dành riêng.

### Measure before optimizing

Cấu tạo khởi động nguội cho một mô hình 70B trên một nút mới (minh họa):

| Giai đoạn | Thời gian | Biện pháp giảm thiểu |
|-------|------|-----------|
| Cấp phát nút | 50s | Bottlerocket + image được nạp sẵn, bể nóng |
| Kéo image | 180s | Volume dữ liệu được nạp sẵn (loại bỏ) |
| Trọng số vào HBM | 75s | Model streamer (giảm một nửa); ảnh chụp GPU (loại bỏ) |
| Khởi tạo engine | 20s | Bộ nhớ đệm CUDA graph bền vững |
| Lượt truyền xuôi đầu tiên | 3s | Độ trễ vốn có tối thiểu |
| **Tổng khi nguội** | **328s** | |
| **Tổng với các biện pháp giảm thiểu** | **~15s** | Giảm 22x |

### Numbers you should remember

- Khởi động nguội Modal: 2-4s (với ảnh chụp GPU).
- Khởi động nguội mặc định Baseten: 5-10s; dưới một giây với làm nóng trước.
- Khởi động nguội 70B thô: 3-8 phút.
- Run:ai Model Streamer: tăng tốc nạp trọng số ~2x.
- Nạp theo tầng ServerlessLLM: giảm độ trễ 10-200x (số liệu bài báo).

```figure
cold-start-pipeline
```

## Use It

`code/main.py` mô hình hóa một đường khởi động nguội có và không có từng biện pháp giảm thiểu. Báo cáo tổng thời gian khởi động nguội, chi phí bể nóng và tốc độ yêu cầu hòa vốn mà trên đó bể nóng tự bù được chi phí.

## Ship It

Bài học này tạo ra `outputs/skill-cold-start-planner.md`. Với SLA, kích thước mô hình và dạng lưu lượng, chọn các biện pháp giảm thiểu cần kết hợp.

## Exercises

1. Chạy `code/main.py`. Tính tốc độ yêu cầu hòa vốn mà trên đó một bản sao nóng rẻ hơn việc trả chi phí khởi động nguội qua các yêu cầu bị loại thêm tại SLO.
2. Bạn triển khai một mô hình 13B với SLA P99 TTFT là 3s. Chọn tập hợp biện pháp giảm thiểu tối thiểu (ít lớp nhất) đạt được nó.
3. Nạp sẵn Bottlerocket loại bỏ việc kéo image nhưng trọng số vẫn nạp từ ảnh chụp vào HBM. Tính thời gian thực cho một mô hình 70B nếu NVMe dựa trên ảnh chụp đọc ở 7 GB/s.
4. Nhà cung cấp serverless của bạn cung cấp ảnh chụp GPU (Modal) và nhóm của bạn từ chối vì "ảnh chụp làm lộ PII." Lập luận cả hai phía — rủi ro thực tế là gì, và biện pháp giảm thiểu là gì (ảnh chụp tạm thời, mã hóa, cô lập namespace)?
5. Thiết kế một chính sách bể nóng theo tầng: bao nhiêu bản sao nóng cho người dùng trả phí, người dùng dùng thử và khối lượng công việc theo lô? Trình bày phép tính.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|----------------|------------------------|
| Cold start (Khởi động nguội) | "khoảng dừng lớn" | Thời gian từ yêu cầu đến token đầu tiên trên một bản sao mới |
| Warm pool (Bể nóng) | "mức tối thiểu luôn bật" | `min_workers >= 1` để giữ ít nhất một bản sao sẵn sàng |
| Pre-seeded image (Image được nạp sẵn) | "AMI tích hợp sẵn" | Image nút có trọng số container đã nằm sẵn |
| Bottlerocket | "hệ điều hành nút AWS" | Hệ điều hành tối ưu cho container của AWS có hỗ trợ ảnh chụp hai volume |
| Model streamer (Bộ truyền mô hình theo luồng) | "nạp theo luồng" | Chồng lấp I/O trọng số với thiết lập tính toán |
| GPU snapshot (Ảnh chụp GPU) | "checkpoint vào HBM" | Tuần tự hóa trạng thái GPU sau khi nạp; giải tuần tự hóa khi khởi động lại |
| Tiered loading (Nạp theo tầng) | "NVMe + DRAM + HBM" | Hệ phân cấp các tầng lưu trữ; nạp theo nhu cầu |
| Live migration (Di chuyển trực tiếp) | "chuyển token" | Chuyển đầu vào (KB), tính toán lại KV tại đích |
| `min_workers` | "bản sao nóng" | Số lượng duy trì hoạt động tối thiểu của serverless |
| Scale-to-zero (Giảm quy mô về không) | "serverless hoàn toàn" | Không có chi phí khi nhàn rỗi; chấp nhận toàn bộ chi phí khởi động nguội |

## Further Reading

- [Modal — Cold start performance](https://modal.com/docs/guide/cold-start) — các phép đo chuẩn đã công bố và kiến trúc checkpoint của Modal.
- [AWS Bottlerocket](https://github.com/bottlerocket-os/bottlerocket) — mẫu ảnh chụp volume dữ liệu được nạp sẵn.
- [NVIDIA Run:ai Model Streamer](https://github.com/run-ai/runai-model-streamer) — chồng lấp nạp trọng số với thiết lập tính toán.
- [Baseten — Cold starts](https://docs.baseten.co/deployment/autoscaling/cold-starts) — cẩm nang làm nóng trước.
- [ServerlessLLM paper (USENIX OSDI'24)](https://www.usenix.org/conference/osdi24/presentation/fu) — thiết kế nạp theo tầng.
- [NVIDIA — Disaggregated LLM Inference on Kubernetes](https://developer.nvidia.com/blog/deploying-disaggregated-llm-inference-workloads-on-kubernetes/) — di chuyển trực tiếp cho các triển khai tách rời.
