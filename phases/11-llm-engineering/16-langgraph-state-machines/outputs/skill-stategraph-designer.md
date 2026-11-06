---
name: stategraph-designer
description: Turn an agent task into a LangGraph StateGraph with named nodes, typed state, reducers, checkpointer, and human interrupts.
version: 1.0.0
phase: 11
lesson: 16
tags: [langgraph, stategraph, checkpointer, interrupt, time-travel, react-agent, human-in-the-loop]
---

Với tác vụ tác tử (mục tiêu cho người dùng, công cụ sẵn có, số lượt kỳ vọng, tác dụng phụ với phạm vi ảnh hưởng an toàn, yêu cầu độ bền, ngân sách độ trễ đích), xuất:

1. Danh sách node. Đặt tên mọi bước rời rạc: bộ suy nghĩ LLM, mỗi bộ chạy công cụ, mọi bước con người xem xét, mọi bộ tóm tắt hoặc phê bình, mọi bộ truy xuất. Loại thiết kế nếu bất kỳ node nào chạm hơn một mối quan tâm; chia nó.
2. Schema trạng thái. Trường TypedDict (hoặc Pydantic) với reducer cho mọi danh sách. Luôn Annotated[list, add_messages] trên log thông điệp. Đưa mọi danh sách riêng tác vụ ra khỏi messages (kế hoạch, bộ đếm ngân sách, danh sách tài liệu truy xuất) để reducer giữ đúng khi cập nhật song song.
3. Bản đồ cạnh. Cạnh tĩnh nơi bước tiếp theo tất định. Cạnh có điều kiện với hàm router có tên chỉ nơi mô hình chọn bước tiếp theo. Loại mọi đồ thị có hàm router phụ thuộc lệnh gọi LLM mới chưa được thực hiện trong node trước.
4. Vị trí ngắt. interrupt_before trên mọi node có tác dụng phụ không đảo ngược (ghi, xóa, thanh toán, gọi API ngoài có chi phí). interrupt_after trên node mô hình khi xác thực đầu ra chạy trong tiến trình riêng. Loại interrupt_after trên mọi node có tác dụng phụ; đến lúc đó tác dụng phụ đã xảy ra.
5. Checkpointer. MemorySaver chỉ cho kiểm thử. Chọn PostgresSaver, SQLiteSaver, RedisSaver cho mọi môi trường phải sống qua khởi động lại. Xác nhận chiến lược thread_id (mỗi người dùng, mỗi phiên, mỗi hội thoại) và TTL checkpoint.

Từ chối phát hành LangGraph thiếu checkpointer. Không checkpointer nghĩa là không tiếp tục, không du hành thời gian, không phát lại có con người tham gia. Từ chối phát hành trường messages thiếu add_messages; lần ghi thứ hai âm thầm ghi đè lần đầu và nửa hội thoại biến mất. Từ chối đồ thị có mọi chuyển tiếp là cạnh có điều kiện được LLM lập kế hoạch định tuyến; đó là AutoGen với thêm các bước và đốt token mỗi lượt.

Đầu vào ví dụ: "Tác tử xử lý hoàn tiền trên Anthropic Claude với ba công cụ (lookup_order, issue_refund, send_email), phải dừng cho con người trước mọi hoàn tiền trên 100 đô la, phải tiếp tục sau máy chủ khởi động lại, ngân sách độ trễ p95 8 giây."

Đầu ra ví dụ:
- Node: agent (lệnh gọi LLM), lookup_tool, refund_tool, email_tool, human_review.
- Trạng thái: messages với add_messages, order_context (ghi đè), refund_amount (ghi đè), reviewer_decision (ghi đè).
- Cạnh: agent đến router should_continue với nhánh lookup_tool, refund_tool, email_tool, human_review, END. Node công cụ trở về agent.
- Ngắt: interrupt_before trên refund_tool khi refund_amount > 100. Không ngắt trên lookup_tool hoặc email_tool.
- Checkpointer: PostgresSaver với thread_id "user:{user_id}:case:{case_id}" và TTL 30 ngày.
