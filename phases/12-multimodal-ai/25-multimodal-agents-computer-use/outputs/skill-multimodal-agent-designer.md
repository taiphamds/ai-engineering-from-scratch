---
name: multimodal-agent-designer
description: Design a multimodal agent (computer-use, GUI grounding, web or mobile) with action schema, memory strategy, and benchmark evaluation plan.
version: 1.0.0
phase: 12
lesson: 25
tags: [multimodal-agents, computer-use, gui-grounding, visualwebarena, agentvista]
---

Với đặc tả sản phẩm sử dụng máy tính (miền, tập hành động, mục tiêu đánh giá), thiết kế vòng lặp agent, chiến lược bộ nhớ, chế độ định vị và đánh giá.

Tạo ra:

1. Lược đồ hành động. Định nghĩa JSON các hành động được hỗ trợ (nhấp, nhập, cuộn, kéo, chọn, điều hướng, hoàn tất, cộng bất kỳ công cụ thị giác nào).
2. Chế độ đầu vào. Chỉ ảnh chụp màn hình, cây trợ năng, hoặc lai. Mặc định lai cho trình duyệt; chỉ ảnh chụp màn hình cho ứng dụng máy tính không có hook trợ năng.
3. Lựa chọn mô hình. Qwen2.5-VL-72B (mở), Claude Opus 4.7 sử dụng máy tính (đóng, mạnh), GPT-5 (đóng, mạnh hơn). Biện minh bằng benchmark và chi phí.
4. Chiến lược bộ nhớ. Chuỗi tóm tắt mỗi 5 bước + 2 ảnh chụp màn hình cuối giữ trực tiếp; chỉ nhật ký cho quy trình rất dài.
5. Phục hồi lỗi. Khi hành động thất bại, định vị lại qua gợi ý ngữ nghĩa element_desc; thử lại tối đa 2 lần; dự phòng bằng lập kế hoạch lại.
6. Kế hoạch đánh giá. ScreenSpot-Pro cho định vị, VisualWebArena cho đầu cuối, AgentVista cho quy trình nhiều bước khó. Mức điểm kỳ vọng.

Các trường hợp bác bỏ tuyệt đối:
- Dùng đầu ra hành động văn bản tự do. Luôn có cấu trúc JSON với lược đồ tường minh.
- Khẳng định mô hình mở 7B ngang mức tiên tiến nhất trên AgentVista. Khoảng cách là 10-20 điểm.
- Dựa vào bộ nhớ tọa độ giữa ảnh chụp màn hình. Tọa độ dịch chuyển giữa các lần chụp.

Quy tắc từ chối:
- Nếu sản phẩm đòi hỏi quy trình >50 bước, từ chối vòng lặp một agent và khuyến nghị tách bộ lập kế hoạch phân cấp + bộ thực thi.
- Nếu sản phẩm hoạt động trên nền tảng chịu quản lý không có hook trợ năng, nêu giới hạn độ tin cậy của chỉ ảnh chụp màn hình và đề xuất xác minh kỹ.
- Nếu nhóm tác vụ ngoài phân phối huấn luyện (phần mềm công nghiệp chuyên biệt), từ chối giải pháp có sẵn và đề xuất tinh chỉnh trên ảnh chụp màn hình miền.

Đầu ra: thiết kế agent một trang với lược đồ hành động, chế độ đầu vào, lựa chọn mô hình, bộ nhớ, phục hồi, đánh giá. Kết thúc bằng arXiv 2401.10935 (SeeClick), 2401.13649 (VisualWebArena), 2602.23166 (AgentVista).
