---
name: decoupled-encoder-picker
description: Decide whether a unified VLM should decouple its visual encoders and pick between Janus-Pro, JanusFlow, and InternVL-U.
version: 1.0.0
phase: 12
lesson: 15
tags: [janus-pro, janusflow, internvl-u, decoupled-encoders, unified-model]
---

Với một đặc tả mô hình thống nhất (hiểu + tạo sinh, tùy chọn chỉnh sửa / điền khuyết ảnh), ngân sách tính toán và ràng buộc trọng số mở, khuyến nghị một kiến trúc bộ mã hóa tách rời và một cấu hình cụ thể.

Tạo ra:

1. Lựa chọn kiến trúc. Janus-Pro (tạo sinh VQ), JanusFlow (tạo sinh rectified flow), InternVL-U (tiền huấn luyện nguyên bản + tách rời).
2. Tổ hợp bộ mã hóa. SigLIP-SO400m để hiểu; MAGVIT-v2 / IBQ VQ để tạo sinh rời rạc; VAE kiểu SD3 cho liên tục.
3. Kế hoạch giai đoạn dữ liệu. Giai đoạn 1 căn chỉnh (50-100M cặp), Giai đoạn 2 thống nhất (70M+ cặp), Giai đoạn 3 chỉ dẫn (1M+ mẫu). Dẫn kết quả mở rộng mô hình 5.4x + dữ liệu 2.8x của Janus-Pro.
4. Chiến lược định tuyến. Dựa trên thẻ prompt (tường minh `<understand>` / `<generate>`) hoặc dựa trên bộ phân loại tác vụ.
5. Khởi tạo phần thân dùng chung. Khởi tạo từ LLM đã tiền huấn luyện (DeepSeek, Qwen, Llama) thay vì từ đầu.
6. Giới hạn chất lượng. MMMU kỳ vọng (~60 ở 7B) và GenEval (~0.80 ở 7B cho Janus-Pro / ~0.85+ cho InternVL-U).

Các trường hợp bác bỏ tuyệt đối:
- Đề xuất mô hình thống nhất một bộ mã hóa (Show-o / Transfusion) khi yêu cầu chất lượng của người dùng cho cả hai phía là cạnh tranh với mức tiên tiến nhất. Cách tiếp cận tách rời là con đường duy nhất.
- Khuyến nghị tiền huấn luyện từ đầu cho mô hình <10B. Tái sử dụng phần thân LLM đã tiền huấn luyện.
- Đề xuất Janus (bản gốc) thay cho Janus-Pro cho bất kỳ dự án mới nào. Janus-Pro là phiên bản kế nhiệm.

Quy tắc từ chối:
- Nếu người dùng chỉ cần hiểu, từ chối tách rời và khuyến nghị họ LLaVA. Một bộ mã hóa là đủ.
- Nếu người dùng chỉ cần tạo sinh, từ chối và khuyến nghị Stable Diffusion 3 / Flux — các mô hình chuyên biệt vẫn thắng về chất lượng T2I.
- Nếu tính toán <50k giờ GPU, từ chối InternVL-U (đòi hỏi tiền huấn luyện nguyên bản) và khuyến nghị Janus-Pro (tái sử dụng LLM đã tiền huấn luyện).

Đầu ra: kế hoạch một trang với lựa chọn kiến trúc, tổ hợp bộ mã hóa, kế hoạch giai đoạn, định tuyến, khởi tạo phần thân dùng chung và giới hạn chất lượng. Kết thúc bằng arXiv 2501.17811 (Janus-Pro), 2411.07975 (JanusFlow), 2603.09877 (InternVL-U).
