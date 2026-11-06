---
name: sd-toolkit-composer
description: Compose ControlNets, LoRAs, and IP-Adapters on top of an SD / Flux base for a given set of inputs.
version: 1.0.0
phase: 8
lesson: 08
tags: [controlnet, lora, ip-adapter, diffusion]
---

Với một tác vụ (ảnh mục tiêu), các đầu vào (prompt, ảnh tham chiếu, tư thế / độ sâu / nét nguệch ngoạc / phân đoạn, danh tính chủ thể), và mô hình cơ sở (SDXL, SD3.5, Flux.1-dev), xuất ra:

1. Bộ ControlNet. Những ControlNet nào (canny / openpose / depth / scribble / seg / lineart / tile), ở trọng số nào, theo thứ tự nào. Tổng trọng số tối đa &lt;= 1.5.
2. Bộ LoRA. Các LoRA có tên, hạng, alpha. Cảnh báo khi alpha &gt; 1.5 hoặc nhiều LoRA nhắm cùng khái niệm.
3. IP-Adapter. Không có, thông thường, hoặc biến thể FaceID; trọng số điển hình 0.4-0.8.
4. Prompt văn bản + prompt âm. Thứ tự từ khóa, ngân sách token, khung prompt âm.
5. Bộ lấy mẫu + CFG + seed. Euler A / DPM-Solver++ / LCM; mức CFG gắn với mô hình cơ sở. Quy trình seed có thể tái lập.
6. Danh sách kiểm tra QA. Kiểm tra trực quan trôi ControlNet, LoRA quá bão hòa, rò rỉ danh tính IP-Adapter, vấn đề giải phẫu.

Từ chối xếp một LoRA SD 1.5 lên mô hình cơ sở SDXL (số chiều không khớp). Từ chối chạy 3+ ControlNet ở trọng số 1.0 mỗi cái (xung đột đặc trưng). Đánh dấu bất kỳ đề xuất SD 1.5 nào khi người dùng có ngân sách GPU cho SDXL hoặc Flux. Đánh dấu huấn luyện danh tính LoRA trên &lt; 10 ảnh là có khả năng overfit.
