---
name: constitution-review
description: Audit a deployment's constitutional layer — hardcoded prohibitions, soft-coded defaults, operator-adjustable bounds, and four-tier hierarchy resolution.
version: 1.0.0
phase: 15
lesson: 17
tags: [constitutional-ai, rule-override, hierarchy, cai, rlaif, hardcoded-prohibition]
---

Với lớp hiến định của một triển khai (prompt hệ thống, cấu hình người vận hành, các nguyên tắc đã khai báo), kiểm toán nó theo tham chiếu Claude Constitution và đánh dấu các điều cấm mã hóa cứng còn thiếu, các nguyên tắc mơ hồ, hoặc các tầng sai thứ tự.

Tạo ra:

1. **Danh mục điều cấm mã hóa cứng.** Liệt kê mọi điều cấm không được uốn cong bất kể chỉ dẫn của người vận hành hoặc người dùng. Mức sàn tối thiểu: nâng cao năng lực vũ khí sinh học / CBRN, CSAM, lập kế hoạch tấn công cơ sở hạ tầng trọng yếu, danh tính giả khi được hỏi. Các bổ sung phụ thuộc vào triển khai cụ thể (ví dụ: dịch vụ tài chính bổ sung các điều cấm gian lận cụ thể).
2. **Các mặc định mã hóa mềm.** Liệt kê mọi hành vi người vận hành có thể điều chỉnh. Với mỗi hành vi, nêu giới hạn đã khai báo. Một thiết lập “có thể điều chỉnh” không có giới hạn là một cách ghi đè qua cửa hậu.
3. **Thứ tự tầng.** Xác nhận thứ tự giải quyết là: an toàn > đạo đức > hướng dẫn > tính hữu ích. Nếu tính hữu ích từng thắng đạo đức trong bộ giải quyết đã triển khai, đánh dấu là một hỏng hóc triển khai.
4. **Các cờ mơ hồ nguyên tắc.** Xác định bất kỳ nguyên tắc nào có văn bản để ngỏ chỗ cho các diễn giải khác nhau đáng kể. Sự mơ hồ cộng dồn qua các chu kỳ huấn luyện (sự trôi nguyên tắc).
5. **Tính đầy đủ của lớp.** Xác nhận các kiểm soát lớp môi trường chạy (Bài 10, 13, 14) hiện diện bên cạnh lớp hiến định. Chỉ Constitution là không đủ; chỉ môi trường chạy là không đủ.

Các trường hợp loại bỏ dứt khoát:
- Các triển khai không có bất kỳ lớp điều cấm mã hóa cứng nào.
- Cấu hình người vận hành tuyên bố ghi đè một điều cấm mã hóa cứng (ngay cả bằng cách đổi tên).
- Các thứ tự tầng đặt tính hữu ích cao hơn đạo đức.
- Văn bản nguyên tắc chung chung đến mức không thể đánh giá (“hãy tốt”).
- Coi Constitutional AI là thứ thay thế cho các kiểm soát môi trường chạy.

Các quy tắc từ chối:
- Nếu người dùng nêu một điều cấm mã hóa cứng nhưng không thể chỉ ra một chốt chặn lớp môi trường chạy cho nó, đánh dấu triển khai là một lớp và từ chối sản xuất.
- Nếu cấu hình người vận hành bao gồm một thiết lập “an toàn” có thể điều chỉnh không có giới hạn đã khai báo, hãy từ chối.
- Nếu người dùng coi các phát hiện hiến pháp có sự tham gia năm 2023 là có thể áp dụng trong triển khai hiện tại, hãy kiểm tra: Constitution năm 2026 không tích hợp chúng, nên “kế thừa một cách dân chủ” là một tuyên bố triển khai không thể chứng minh.

Định dạng đầu ra:

Trả về một kiểm toán hiến định với:
- **Mức sàn mã hóa cứng** (các điều cấm, lớp thực thi: trọng số / suy luận / cả hai)
- **Các mặc định mã hóa mềm** (thiết lập, giới hạn người vận hành, người dùng nhìn thấy có/không)
- **Thứ tự tầng** (được liệt kê; xác nhận an toàn > đạo đức > hướng dẫn > tính hữu ích)
- **Các cờ mơ hồ** (nguyên tắc, sự mơ hồ cụ thể, đề xuất siết chặt)
- **Tính đầy đủ của lớp** (hiến định có/không, kiểm soát môi trường chạy có/không, cả hai đều bắt buộc)
- **Mức sẵn sàng** (sản xuất / staging / chỉ nghiên cứu)
