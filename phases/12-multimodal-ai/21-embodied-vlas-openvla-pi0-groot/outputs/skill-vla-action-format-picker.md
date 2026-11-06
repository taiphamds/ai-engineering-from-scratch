---
name: vla-action-format-picker
description: Pick an action format (discrete bin, FAST, flow-matching, dual-system) and VLA family (RT-2, OpenVLA, π0, GR00T) for a robot task.
version: 1.0.0
phase: 12
lesson: 21
tags: [vla, rt-2, openvla, pi0, groot, action-tokenization]
---

Với tác vụ robot (thao tác, điều hướng, toàn thân hình người), số DOF, yêu cầu tốc độ điều khiển và ràng buộc tính toán, chọn định dạng hành động và họ VLA.

Tạo ra:

1. Định dạng hành động. Bin rời rạc cho tác vụ một cánh tay đơn giản, FAST cho quỹ đạo nhạy tốc độ, flow matching cho điều khiển liên tục mượt mà, hai hệ thống cho robot hình người.
2. Lựa chọn họ VLA. RT-2 (đóng), OpenVLA (mở 7B), π0 (flow mở), GR00T N1 (hai hệ thống hình người mở).
3. Tính khả thi tốc độ điều khiển. Khớp thông lượng định dạng với Hz điều khiển cần thiết. Bin rời rạc không thể làm >10 Hz trên mô hình 7B.
4. Hỗn hợp dữ liệu huấn luyện. Tỷ lệ đồng tinh chỉnh (VQA web : robot). Bắt đầu ở 0.5:1, điều chỉnh theo tác vụ.
5. Kế hoạch tinh chỉnh. LoRA trên ~500-1000 trình diễn tác vụ; tinh chỉnh đầy đủ ở ~10k trình diễn.
6. Cổng an toàn. Các kiểm tra tầng điều khiển bắt buộc ngoài VLA.

Các trường hợp bác bỏ tuyệt đối:
- Khuyến nghị VLA không có đặc tả tầng an toàn. Luôn gồm giới hạn khớp, cắt vận tốc.
- Khẳng định token hóa bin rời rạc đủ nhanh cho điều khiển 30 Hz. Không phải vậy.
- Đề xuất flow matching mà không có ràng buộc độ mượt phù hợp. Hành động ngoài phân phối vẫn xảy ra.

Quy tắc từ chối:
- Nếu yêu cầu tốc độ điều khiển >50 Hz trên mô hình <=7B với định dạng bin rời rạc, từ chối; khuyến nghị π0 hoặc head chuyên biệt.
- Nếu robot có >30 DOF (hình người), từ chối kiến trúc một giai đoạn; yêu cầu hai hệ thống (GR00T).
- Nếu ngân sách không đủ tiền huấn luyện quy mô Open X-Embodiment, từ chối VLA từ đầu; khuyến nghị tinh chỉnh OpenVLA.

Đầu ra: kế hoạch một trang với định dạng hành động, lựa chọn VLA, kiểm tra tốc độ điều khiển, hỗn hợp đồng tinh chỉnh, cổng an toàn. Kết thúc bằng arXiv 2307.15818 (RT-2), 2406.09246 (OpenVLA), 2410.24164 (π0), 2503.14734 (GR00T).
