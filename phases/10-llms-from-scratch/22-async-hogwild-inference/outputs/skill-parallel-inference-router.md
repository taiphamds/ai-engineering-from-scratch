---
name: parallel-inference-router
description: Route a reasoning workload between voting, tree-of-thought, multi-agent, Hogwild!, and speculative decoding strategies.
version: 1.0.0
phase: 10
lesson: 22
tags: [parallel-inference, hogwild, speculative-decoding, tree-of-thought, multi-agent, reasoning]
---

Với một hồ sơ khối lượng công việc suy luận (ngân sách token mỗi tác vụ, đặc tính song song hóa tác vụ, họ mô hình, đích triển khai, ngân sách độ trễ), khuyến nghị một chiến lược suy luận song song hoặc tổ hợp.

Tạo:

1. Phân loại tác vụ. Suy luận dài (5k+ token), chain-of-thought trung bình (1k-5k), chat ngắn (dưới 1k) hoặc phân loại. Chi phối quyết định ban đầu.
2. Trục song song hóa. Trong chuỗi (speculative decoding) so với giữa các chuỗi (bỏ phiếu, Hogwild!, đa tác tử). Hầu hết khối lượng công việc hưởng lợi từ trục trong chuỗi trước.
3. Khuyến nghị chiến lược. Chọn từ: chỉ speculative decoding (mặc định an toàn cho mọi khối lượng công việc trên 100 token), speculative + Hogwild! (suy luận dài với cấu trúc có thể song song hóa), tree-of-thought (các bài toán phân nhánh và cắt tỉa rõ ràng), đa tác tử (các bài toán chuyên môn hóa vai trò), tổ hợp bỏ phiếu (phân loại hệ trọng).
4. Thiết lập tham số. Với speculative decoding: họ bản dự thảo (mặc định EAGLE-3) và `N` (skill Giai đoạn 10 · 15). Với Hogwild!: số worker N (2 đến 4, hiếm khi nhiều hơn), mẫu prompt phối hợp, xác nhận triển khai một node.
5. Ước lượng mức tăng tốc kết hợp. Nếu kết hợp speculative decoding với Hogwild!, báo cáo mức tăng tốc nhân (phạm vi điển hình: spec 3x * Hogwild! 1.5-2x = 4.5-6x).

Các trường hợp loại bỏ dứt khoát:
- Hogwild! cho bất kỳ khối lượng công việc nào dưới 2000 token. Chi phí phối hợp chiếm ưu thế.
- Hogwild! trên các mô hình không suy luận (không có sự phối hợp tự phát).
- Framework đa tác tử cho các bài toán không có sự phân chia vai trò tự nhiên.
- Tree-of-thought không có logic phân nhánh và cắt tỉa rõ ràng (nếu không chiến lược rút về CoT tuyến tính).
- Chạy Hogwild! giữa các node (đồng bộ hóa cache giữa các node quá chậm).

Quy tắc từ chối:
- Nếu khối lượng công việc là nghiên cứu thử nghiệm, khuyến nghị Hogwild! như một thử nghiệm thay vì đặt cược sản xuất. Mức tăng tốc phụ thuộc tác vụ và việc triển khai thực tế còn hiếm tính đến tháng 4 năm 2026.
- Nếu người dùng yêu cầu mức tăng tốc được bảo đảm, từ chối và giải thích rằng chỉ speculative decoding có thuộc tính bảo đảm mạnh (phân phối đầu ra được bảo toàn). Hogwild! mang tính thực nghiệm.
- Nếu người dùng có VRAM hạn chế, từ chối Hogwild! N>2 — mỗi worker cần bộ nhớ activation riêng dù cache được chia sẻ.

Đầu ra: một khuyến nghị dài một trang liệt kê phân loại tác vụ, trục song song hóa, chiến lược, tham số và ước lượng mức tăng tốc kết hợp. Kết thúc bằng đoạn "điều kiện kích hoạt hoàn tác" nêu chỉ số độ trễ hoặc độ chính xác cụ thể sẽ biện minh cho việc quay về chỉ speculative decoding nếu Hogwild! không mang lại lợi ích trong 100 yêu cầu sản xuất đầu tiên.
