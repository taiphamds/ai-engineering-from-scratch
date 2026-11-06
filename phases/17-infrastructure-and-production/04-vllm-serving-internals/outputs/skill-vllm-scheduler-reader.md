---
name: vllm-scheduler-reader
description: Diagnose a vLLM serving config by reading the scheduler-level knobs and identifying which of PagedAttention, continuous batching, and chunked prefill is the bottleneck.
version: 1.0.0
phase: 17
lesson: 04
tags: [vllm, paged-attention, continuous-batching, chunked-prefill, serving, scheduler]
---

Với một cấu hình phục vụ vLLM (mô hình, dtype, phần cứng, `--gpu-memory-utilization`, `--max-num-batched-tokens`, `--enable-chunked-prefill`, `--speculative-config`, mức đồng thời tối đa, và một tập chỉ số quan sát gồm TTFT trung bình/P99, ITL trung bình/P99, thông lượng tok/s), tạo một chẩn đoán cấp bộ lập lịch.

Tạo ra:

1. Đọc cấu hình. Với mỗi cờ, nêu hành vi bộ lập lịch nó kiểm soát và mặc định năm 2026. Gắn cờ bất kỳ cờ nào được đặt ở giá trị không mặc định và chỉ ra vì sao.
2. Nhận diện nút thắt. Phân loại nút thắt là một trong: PagedAttention cấp phát thiếu (đói block KV), đình trệ gom lô liên tục (hàng đợi WAITING tăng), prefill chia khối sai kích thước (đuôi TTFT tăng vọt), decode bị giới hạn bởi tính toán (sàn ITL), hoặc bị giới hạn bởi HBM (không chứa được lô). Giải thích bằng các chỉ số được báo cáo.
3. Các khuyến nghị núm điều chỉnh. Các hành động cụ thể, có thứ tự — đảo cờ nào, thử giá trị nào, và theo dõi chỉ số nào. Đừng gợi ý “thử nhiều GPU hơn” trước khi khai thác hết điều chỉnh cấp bộ lập lịch.
4. Kiểm tra tương thích. Kiểm tra mọi cặp tính năng đã bật theo ma trận tương thích cho đúng phiên bản vLLM trong cấu hình. Với v0.18.0 ma trận đánh dấu giải mã suy đoán tương thích với prefill chia khối và lưu đệm tiền tố.
5. Đọc gì tiếp theo. Chỉ tới một trong các ghi chú phát hành vLLM v0.18.0, bài báo PagedAttention, hoặc hướng dẫn bộ lập lịch V1 của Aleksa Gordic tùy những gì chẩn đoán bộc lộ.

Các trường hợp loại bỏ dứt khoát:
- Chẩn đoán không có bốn chỉ số cốt lõi (TTFT, ITL, thông lượng, mức đồng thời). Từ chối và yêu cầu tập chỉ số.
- Khuyến nghị `--enable-chunked-prefill` mà không kiểm tra cấu hình giải mã suy đoán.
- Coi `DCGM_FI_DEV_GPU_UTIL` là tín hiệu mở rộng. vLLM cấp phát trước KV; các con số chu kỳ hoạt động gây hiểu lầm.

Các quy tắc từ chối:
- Nếu thông lượng được báo cáo dưới 100 tok/s trên một H100, nút thắt có khả năng không phải vLLM — kiểm tra tokenizer phía máy khách, Python GIL, hoặc tuần tự hóa cấp yêu cầu.
- Nếu `--gpu-memory-utilization` được đặt dưới 0.7, từ chối điều chỉnh thêm — người vận hành chọn để HBM chưa tận dụng và cách sửa là nâng trần trước khi đảo các cờ bộ lập lịch.
- Nếu người vận hành yêu cầu một công thức giải mã suy đoán + prefill chia khối, kiểm tra tổ hợp theo ma trận tương thích cho phiên bản vLLM của họ trước khi trả lời, và chỉ tới EAGLE-3 trong Giai đoạn 17 · 05 cho phương pháp nháp.

Đầu ra: một chẩn đoán bộ lập lịch một trang liệt kê các cờ, nút thắt, các khuyến nghị có thứ tự, ghi chú tương thích, và một chỉ dẫn đọc tiếp. Kết thúc bằng một đoạn “đo gì tiếp theo” nêu một trong P99 ITL, tốc độ cấp phát block, hoặc độ sâu hàng đợi WAITING, tùy nút thắt được nhận diện.
