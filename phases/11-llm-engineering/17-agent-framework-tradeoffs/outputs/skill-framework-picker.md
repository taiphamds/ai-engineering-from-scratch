---
name: framework-picker
description: Pick LangGraph, CrewAI, AutoGen, Agno, or plain Python for an agent task by matching abstraction to problem shape.
version: 1.0.0
phase: 11
lesson: 17
tags: [langgraph, crewai, autogen, agno, agent-framework, orchestration, decision-matrix]
---

Với mô tả tác vụ (hình dạng bài toán, tổng lệnh gọi LLM mỗi lượt chạy, mẫu phân nhánh, nhu cầu độ bền và tiếp tục, checkpoint có con người tham gia, phân tán song song, bộ nhớ phiên, lượng chạy hằng ngày kỳ vọng), xuất:

1. Khớp hình dạng. Một câu nêu trừu tượng phù hợp: đồ thị (trạng thái có kiểu, chuyển tiếp có tên), sơ đồ tổ chức (vai trò chuyên gia, bàn giao do quản lý định tuyến), chat (tác tử nói đến khi xong), một tác tử với công cụ. Nếu không chọn được, tác vụ chưa có hình dạng tác tử; dừng và phân rã.
2. Quyền phân nhánh. Ai chọn bước tiếp: lập trình viên (cạnh rõ ràng), LLM quản lý (CrewAI phân cấp), tự phát từ hội thoại (AutoGen GroupChat), tự định tuyến qua lệnh gọi công cụ (Agno). Nêu chi phí token mỗi lượt của định tuyến do LLM chọn nếu áp dụng.
3. Ngân sách trạng thái. Xác nhận có cần tiếp tục sau khởi động lại, du hành thời gian hoặc ngắt cho con người không. Nếu có, LangGraph thắng ở trừu tượng ưu tiên trạng thái; Agno chỉ bao quát bộ nhớ phạm vi phiên.
4. Lựa chọn framework. Xuất một trong langgraph, crewai, autogen, agno, plain_python. Bao gồm lý giải một câu ánh xạ câu trả lời về hình dạng và trạng thái vào trừu tượng cốt lõi framework.
5. Lối thoát. Nếu lượng chạy ngày trên 10_000 hoặc tác vụ có hai lệnh gọi LLM trở xuống không trạng thái, khuyến nghị Python thường với SDK nhà cung cấp thay thế. Không dùng framework là framework nhanh nhất khi tác vụ nhỏ.

Từ chối khuyến nghị AutoGen cho quy trình tất định có DAG đã biết; GroupChatManager tốn token chọn người nói mà lập trình viên có thể nối tĩnh. CrewAI có hỗ trợ đầu ra tác vụ có cấu trúc qua `output_pydantic` / `output_json` (xem [docs.crewai.com/en/concepts/tasks](https://docs.crewai.com/en/concepts/tasks)), nhưng kênh `context` vẫn chảy qua chuỗi prompt tác vụ tiếp. Phản đối CrewAI khi quy trình dựa vào `context` thô để mang trạng thái có cấu trúc giữa tác vụ mà không nối một trong các schema đầu ra đó. Phản đối LangGraph cho bộ tóm tắt hai lệnh gọi; chi phí StateGraph bổ sung là thuế thuần túy. Phản đối Agno khi tác vụ phân tán qua hơn 4 worker con song song với ngữ nghĩa reducer; Agno cung cấp khối `Parallel` có đầu ra nối thành dict có khóa theo tên bước (xem [docs-v1.agno.com/workflows_2/overview](https://docs-v1.agno.com/workflows_2/overview) và [docs.agno.com/workflows/access-previous-steps](https://docs.agno.com/workflows/access-previous-steps)), nhưng không mở API phân tán-và-gộp kiểu Send tương đương LangGraph.

Đầu vào ví dụ: "Quy trình nghiên cứu chạy dài: lập kế hoạch, phân tán sang ba bộ truy xuất, tổng hợp, con người phê duyệt bản lược, viết báo cáo, trích nguồn. Phải tiếp tục sau sập. Dự kiến sản xuất 50 lượt mỗi ngày."

Đầu ra ví dụ:
- Hình dạng: đồ thị. Kế hoạch có kiểu, ba bộ truy xuất song song, chuyển tiếp có tên giữa tổng hợp và viết.
- Phân nhánh: lập trình viên quyết định qua cạnh có điều kiện. Không LLM quản lý mỗi lượt.
- Trạng thái: cần tiếp tục và ngắt cho con người. LangGraph bắt buộc.
- Framework: langgraph. Trạng thái, phân tán Send, interrupt_before và PostgresSaver đều là hạng nhất.
- Lối thoát: không áp dụng. 50 lượt mỗi ngày thấp hơn nhiều ngưỡng Python thường và quy trình quá nhiều trạng thái để không dùng framework.
