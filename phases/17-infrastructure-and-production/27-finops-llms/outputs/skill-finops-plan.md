---
name: finops-plan
description: Design an LLM FinOps program — attribution schema (user/task/tenant + four token layers), three-tier enforcement ladder, and unit metric (cost per resolved / artifact).
version: 1.0.0
phase: 17
lesson: 27
tags: [finops, cost-attribution, multi-tenant, kill-switch, unit-economics, rate-limit]
---

Với bề mặt sản phẩm, tầng tenant, chi tiêu hằng tháng và hiện trạng quy chi phí, tạo một kế hoạch FinOps.

Tạo:

1. Schema quy chi phí. `user_id`, `task_id`, `route`, `tenant_id` được đóng dấu tại nơi gọi. Số lượng bốn lớp token (prompt / công cụ / bộ nhớ / phản hồi). Ưu tiên mẫu bộ nối dữ liệu đo từ xa.
2. Chỉ số đơn vị. Xác định chỉ số kết quả sản phẩm — chi phí mỗi phiếu hỗ trợ được giải quyết, chi phí mỗi tạo tác, chi phí mỗi tác vụ agent, chi phí mỗi phiên. Gắn với mô hình tính phí.
3. Thang thực thi. Giới hạn tốc độ theo tenant (2-3x đỉnh), trần chi tiêu hằng ngày (1.5-3x hợp đồng), công tắc ngắt khi z-score > 4.
4. Bảng điều khiển. 5 khung nhìn hàng đầu: chi tiêu hôm nay theo tenant, chi phí mỗi kết quả theo tác vụ, phân phối theo người dùng, tác động tỷ lệ trúng bộ nhớ đệm, tỷ lệ phân chia định tuyến mô hình.
5. Kiểm tra tối ưu kết hợp. Kiểm tra bộ nhớ đệm (Giai đoạn 17 · 14), theo lô (Giai đoạn 17 · 15), định tuyến (Giai đoạn 17 · 16), gateway (Giai đoạn 17 · 19) đều đang dùng. Đánh dấu đòn bẩy thiếu.
6. Nhịp rà soát. Hằng tuần: bên chi nhiều nhất + bất thường. Hằng tháng: tính kinh tế đơn vị theo tenant. Hằng quý: phân loại lại khối lượng công việc vào tương tác/bán tương tác/theo lô.

Các trường hợp loại bỏ dứt khoát:
- Triển khai không có quy chi phí tại nơi gọi. Từ chối — gắn thẻ hồi tố mất ~10-30% chi tiêu.
- Tính phí một nhóm duy nhất. Từ chối — yêu cầu phân tách bốn lớp token.
- Công tắc ngắt không có cơ sở z-score. Từ chối — yêu cầu thống kê cơ sở trước khi kích hoạt sẵn.

Quy tắc từ chối:
- Nếu sản phẩm có < 10 tenant, từ chối thực thi đa tenant đầy đủ — yêu cầu quy chi phí cơ bản theo tenant trước.
- Nếu chi phí/kết quả chưa xác định, từ chối bảng điều khiển — chọn chỉ số đơn vị trước.
- Nếu bất kỳ tenant đơn lẻ nào chiếm > 40% tổng chi tiêu, yêu cầu rà soát tính kinh tế đơn vị riêng trước khi triển khai kế hoạch.

Đầu ra: một kế hoạch một trang với schema quy chi phí, chỉ số đơn vị, thang thực thi, bảng điều khiển, kiểm tra tối ưu kết hợp, nhịp rà soát. Kết thúc bằng cảnh báo duy nhất: chi tiêu hằng ngày so với dự đoán; gọi trực khi chênh lệch > 20%.
