---
name: simulation-designer
description: Design a generative-agent simulation (Smallville-style) for a given scenario. Specifies memory schema, reflection cadence, plan horizon, spatial/social constraints, and evaluation metrics.
version: 1.0.0
phase: 16
lesson: 17
tags: [multi-agent, simulation, generative-agents, emergence, memory]
---

Với một kịch bản yêu cầu hành vi nổi lên từ một quần thể agent (mô phỏng xã hội, NPC trò chơi, diễn tập chính sách, động lực thị trường), thiết kế mô phỏng.

Tạo ra:

1. **Kích thước quần thể và tính không đồng nhất.** N agent; những agent nào chia sẻ một mô hình cơ sở so với khác nhau; các họ prompt; phân phối vai trò. Smallville sử dụng 25 agent đồng nhất với các nhân cách cá nhân hóa; các quần thể lớn hơn hưởng lợi từ tính không đồng nhất.
2. **Lược đồ bộ nhớ.** Các trường theo từng mục: `(ts, kind, content, importance, embedding_ref, source_ids)`. Hằng số suy giảm độ gần đây; quy trình chấm mức quan trọng; chỉ số độ liên quan (cosine với mô hình embedding X). Chính sách lưu giữ cho nén.
3. **Nhịp phản tư.** Kích hoạt: tổng mức quan trọng chưa xử lý > ngưỡng, hoặc mỗi N quan sát, hoặc nhịp định kỳ. Số phản tư theo từng lần kích hoạt. Mẫu prompt phản tư.
4. **Tầm thời gian kế hoạch.** Các cấp ngày / giờ / hành động. Những cấp nào bắt buộc; những cấp nào tùy chọn. Tác nhân kích hoạt sửa đổi: một quan sát mới với mức quan trọng > ngưỡng mâu thuẫn kế hoạch hoạt động.
5. **Mô hình thế giới.** Lưới không gian, đồ thị xã hội, các ràng buộc tài nguyên. Điều gì cấu thành một quan sát (tầm nhìn, hội thoại, thông báo). Những ràng buộc chuẩn mực nào kiến trúc KHÔNG học và phải được mã hóa tường minh (giới hạn sức chứa, giờ đóng cửa, các không gian riêng tư).
6. **Các mục tiêu được gieo.** Các agent nào được gieo các ưu tiên nào. Các mục tiêu chồng lấp có thể cạnh tranh; các mục tiêu không cạnh tranh nên cùng tồn tại.
7. **Ngân sách.** Các lệnh gọi LLM mỗi nhịp cho mỗi agent (quan sát + truy xuất + phản tư + lập kế hoạch + hành động). Token kỳ vọng mỗi nhịp cho mỗi agent. Tổng chi phí mô phỏng cho T nhịp.
8. **Chỉ số đánh giá.** Tính đáng tin (người chấm), tỷ lệ đạt mục tiêu, số sự kiện phối hợp được đếm, các vi phạm chuẩn mực không gian như một tín hiệu thất bại.

Các trường hợp loại bỏ dứt khoát:

- Các thiết kế không có mã hóa chuẩn mực không gian / xã hội tường minh. Kiến trúc sẽ vi phạm chúng (các thất bại cửa hàng đóng cửa, phòng tắm đơn từ Park 2023).
- Các thiết kế có bộ nhớ có thể biến đổi. Bộ nhớ phải chỉ thêm; các sửa chữa là các mục mới.
- Các thiết kế chạy phản tư mỗi nhịp. Điều này không hiệu quả về ngân sách; phản tư tốn kém và các tác nhân kích hoạt nên dựa trên ngưỡng.
- Các mô phỏng ở N lớn (> 50) không có một chiến lược nén bộ nhớ. Chi phí truy xuất tăng theo độ dài luồng.

Các quy tắc từ chối:

- Nếu kịch bản yêu cầu *thực thi tác vụ* nổi lên thay vì *hành vi xã hội* nổi lên, thay vào đó đề xuất các mẫu bộ giám sát / vai trò / nguyên thủy (Giai đoạn 16 · 05-08). Smallville dành cho mô phỏng xã hội.
- Nếu ngân sách cho phép < 100 lệnh gọi LLM mỗi nhịp tổng cộng, đề xuất N = 3-5 với các tương tác dày đặc thay vì các quần thể lớn hơn.
- Nếu kịch bản không hưởng lợi từ sự nổi lên (tác vụ được viết kịch bản chặt), đề xuất một agent đơn lẻ + công cụ.

Đầu ra: một bản tóm lược thiết kế một trang. Bắt đầu với một tóm tắt một câu (“Mô phỏng kiểu Smallville: 15 agent không đồng nhất, phản tư khi tổng mức quan trọng > 120, tầm thời gian kế hoạch 3 cấp, lưới không gian với các ràng buộc sức chứa, được đo bằng tính đáng tin + các sự kiện phối hợp.”), rồi tám phần ở trên. Kết thúc bằng các hành vi nổi lên kỳ vọng và ba chế độ lỗi đầu tiên cần theo dõi.
