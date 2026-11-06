---
name: agent-budget-audit
description: Audit an agent deployment's cost-governor stack and flag missing layers before enabling unattended runs.
version: 1.0.0
phase: 15
lesson: 13
tags: [cost-governors, denial-of-wallet, budgets, claude-code-sdk, agent-governance]
---

Với một triển khai agent được đề xuất, kiểm toán ngăn xếp bộ điều tiết chi phí của nó theo tham chiếu mười hai lớp và đánh dấu những lớp còn thiếu, được điều chỉnh quá thấp, hoặc được điều chỉnh quá cao.

Tạo ra:

1. **Danh mục lớp.** Với mỗi lớp trong mười hai lớp tham chiếu (mức trần theo từng yêu cầu, ngân sách token theo từng tác vụ, ngân sách đô la theo từng tác vụ, mức trần theo từng công cụ, mức trần số lần lặp, các mức trần trượt theo phút/giờ/ngày/tháng, giới hạn tốc độ, định tuyến phân tầng, bộ nhớ đệm prompt, phân cửa sổ ngữ cảnh, checkpoint HITL, công tắc ngắt), nêu liệu nó có được cấu hình hay không, và ở giá trị nào.
2. **Ánh xạ chế độ lỗi.** Với mỗi lỗi theo thang thời gian (vòng lặp mất kiểm soát, rò rỉ chậm, bản phát hành tệ, tăng vọt hợp lệ), nêu lớp cụ thể bắt nó và nhanh đến mức nào.
3. **Các mức trần riêng cho công cụ.** Liệt kê mọi công cụ agent có thể gọi. Với mỗi công cụ, nêu một mức trần theo từng phiên và một lý do. Bất kỳ công cụ nào không có mức trần tường minh đều là một vòng lặp mở.
4. **Các ngưỡng cảnh báo.** Tách biệt với các mức trần: ở tốc độ chi tiêu nào một người nhận được thông báo khẩn? Trường hợp thương mại điện tử đã quan sát ($1,200 → $4,800) là một vấn đề tăng trưởng tuần so với tuần, không phải vấn đề mức trần hằng tháng.
5. **Đường công tắc ngắt.** Khi một mức trần kích hoạt, điều gì xảy ra? Hủy sạch, hoàn tác, cảnh báo, thủ tục bật lại. Xác nhận công tắc ngắt nằm ngoài agent (agent không thể chỉnh sửa mức trần của chính nó).

Các trường hợp loại bỏ dứt khoát:
- Bất kỳ triển khai tự chủ nào không có ngân sách đô la theo từng tác vụ.
- Bất kỳ lần chạy không có người giám sát với tầm thời gian dài nào không có giới hạn tốc độ.
- Các bề mặt công cụ không có mức trần theo từng công cụ đối với một công cụ mới được thêm (<30 ngày).
- Các công tắc ngắt mà chính agent có thể sửa đổi.
- Mức trần hằng tháng là mức trần duy nhất (mọi thang thời gian khác đều không được bảo vệ).

Các quy tắc từ chối:
- Nếu người dùng không thể định giá một lần chạy trong trường hợp xấu nhất theo giá mô hình hôm nay, hãy từ chối và yêu cầu một ước tính có tính chi phí.
- Nếu ngân sách được đề xuất vượt quá tổn thất tổ chức có thể chấp nhận cho một sai lầm đơn lẻ, hãy từ chối và yêu cầu mức trần thấp hơn.
- Nếu người dùng coi bộ phân loại Auto Mode (Bài 10) là thứ thay thế cho ngân sách, hãy từ chối. Bộ phân loại trực giao với chi phí; cả hai lớp đều bắt buộc.

Định dạng đầu ra:

Trả về một kiểm toán bộ điều tiết chi phí với:
- **Bảng lớp** (tên lớp, được cấu hình có/không, giá trị)
- **Độ bao phủ chế độ lỗi** (4 hàng: vòng lặp / rò rỉ / bản phát hành / tăng vọt)
- **Các mức trần theo từng công cụ** (công cụ, mức trần, lý do)
- **Các ngưỡng cảnh báo** (tốc độ, người phụ trách, kênh)
- **Đường công tắc ngắt** (tác nhân kích hoạt, hành động, thủ tục bật lại)
- **Mức sẵn sàng** (sản xuất / staging / chỉ nghiên cứu)
