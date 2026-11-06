---
name: hierarchy-fitness
description: Decide whether a multi-agent task fits hierarchical, flat supervisor, or sequential. Surface the failure modes that matter.
version: 1.0.0
phase: 16
lesson: 06
tags: [multi-agent, hierarchy, crewai, langgraph, decomposition-drift]
---

Với một mô tả tác vụ và một cấu trúc tổ chức tùy chọn, đề xuất mẫu phối hợp (bộ giám sát phẳng, phân cấp, tuần tự) và liệt kê các chế độ lỗi cụ thể cần phòng ngừa.

Tạo ra:

1. **Phân tích hình dạng tác vụ.** Tác vụ là một luồng tuyến tính, fan-out với các nhánh độc lập, hay các nhóm lồng nhau có các nhóm con riêng? Giải thích.
2. **Kết luận mẫu.** Tuần tự, bộ giám sát phẳng, hoặc phân cấp. Nếu phân cấp, chỉ định độ sâu (rất ưu tiên 2 cấp; 3 chỉ với nhu cầu kiểm toán mạnh).
3. **Kế hoạch phân rã.** Phép chia chính xác mà quản lý cao nhất nên thực hiện. Với mỗi nhánh, nêu quản lý con và phạm vi được giới hạn.
4. **Ngân sách hòa giải.** Số vòng được phép trước khi quản lý cao nhất phải cam kết. Mặc định 2.
5. **Các rào chắn.** Ba rào chắn tối thiểu: worker canary theo từng cấp, chuỗi nguồn gốc trên mọi tổng hợp, cảnh báo khi phân rã trôi.
6. **Danh sách kiểm tra chế độ lỗi.** Chế độ nào trong {lỗi giao tác vụ, diễn giải sai đầu ra, vòng lặp đồng thuận} có khả năng nhất với hình dạng tác vụ? Mô tả một triệu chứng cụ thể và một biện pháp giảm thiểu cho mỗi chế độ.

Các trường hợp loại bỏ dứt khoát:

- Bất kỳ khuyến nghị nào đề xuất độ sâu > 2 mà không nêu một yêu cầu kiểm toán hoặc tổ chức cụ thể đòi hỏi nó.
- Phân cấp cho các tác vụ một luồng tuyến tính. Chúng nên là các pipeline tuần tự.
- Các thiết kế không có một ngân sách hòa giải tường minh.

Các quy tắc từ chối:

- Nếu tác vụ đủ đơn giản để vừa một agent (dưới ~10 lệnh gọi công cụ), từ chối phân cấp và đề xuất một agent đơn lẻ.
- Nếu tác vụ không có các ranh giới nhóm tự nhiên (mọi bước con phụ thuộc mọi bước khác), từ chối và thay vào đó đề xuất một mẫu trò chuyện nhóm.
- Nếu người dùng muốn phân cấp vì “tính thực tế” (vì tổ chức con người sâu), đánh dấu rằng phân cấp con người không ánh xạ sang phân cấp LLM và đề xuất phẳng hơn.

Đầu ra: bản tóm lược một trang. Mở đầu bằng kết luận mẫu, kết thúc bằng ba rủi ro lớn nhất và các rào chắn của chúng.
