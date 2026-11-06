---
name: chaos-plan
description: Design an LLM chaos engineering plan — verify prerequisites, build four planes, pick tool, start with three safe experiments, enforce safety-plane gates.
version: 1.0.0
phase: 17
lesson: 24
tags: [chaos-engineering, litmuschaos, chaosmesh, harness, llm-chaos, game-day]
---

Với ngăn xếp (Kubernetes / VM / được quản lý), mức trưởng thành SLI/SLO, chất lượng khả năng quan sát và mức trưởng thành trực của nhóm, tạo một kế hoạch hỗn loạn.

Tạo:

1. Kiểm tra điều kiện tiên quyết. Xác minh SLI/SLO đã xác định, khả năng quan sát đã kết nối, hoàn tác tự động, cẩm nang vận hành có cấu trúc, luân phiên trực. Nếu thiếu bất kỳ điều nào, từ chối chạy hỗn loạn sản xuất.
2. Bốn mặt phẳng. Nêu công cụ cho mỗi mặt phẳng (điều khiển, mục tiêu, an toàn, khả năng quan sát). Trỏ đến Giai đoạn 17 · 13 cho khả năng quan sát.
3. Ba thí nghiệm ban đầu. Bắt đầu với diệt pod. Rồi lỗi 429 của nhà cung cấp. Rồi quá tải bộ nhớ. Mỗi thí nghiệm có trần bán kính ảnh hưởng, thời lượng, tiêu chí thành công.
4. Cổng an toàn. Tốc độ tiêu hao (>2x dự kiến), bán kính ảnh hưởng (< 30% tập máy), gắn thẻ ID dấu vết, cửa sổ ức chế.
5. Nhịp. Canary nhỏ hằng tuần. Ngày diễn tập hằng tháng (xuyên nhóm). Kiểm toán khả năng chống chịu hằng quý.
6. Công cụ. LitmusChaos (OSS, CNCF đã tốt nghiệp), Chaos Mesh (OSS, CNCF sandbox), Harness Chaos (thương mại có AI hỗ trợ), AWS FIS / Azure Chaos Studio (nguyên bản đám mây được quản lý).

Các trường hợp loại bỏ dứt khoát:
- Chạy hỗn loạn trong sản xuất không có năm điều kiện tiên quyết. Từ chối — sẽ thành sự cố thật.
- Thí nghiệm không có trần bán kính ảnh hưởng. Từ chối.
- Thí nghiệm không gắn thẻ ID dấu vết. Từ chối — không thể khử trùng lặp cảnh báo.

Quy tắc từ chối:
- Nếu nhóm chưa từng chạy một thí nghiệm thành công trong staging, từ chối hỗn loạn sản xuất cho đến khi một thí nghiệm xanh trong staging.
- Nếu lượng sự cố đã cao (>2/tuần), từ chối thêm hỗn loạn — ổn định trước.
- Nếu nhóm không có SLO, yêu cầu SLO trước mọi thí nghiệm.

Đầu ra: một kế hoạch một trang với kiểm tra điều kiện tiên quyết, công cụ bốn mặt phẳng, ba thí nghiệm ban đầu, cổng an toàn, nhịp. Kết thúc bằng cam kết cập nhật bản đồ phụ thuộc hằng quý.
