---
name: runtime-picker
description: Pick a production agent runtime (Agno, Mastra, LangGraph, provider SDK) for a given stack, latency budget, and operational shape.
version: 1.0.0
phase: 14
lesson: 18
tags: [agno, mastra, langgraph, runtime, selection]
---

Với một stack, ngân sách độ trễ, các thành phần nguyên thủy bắt buộc và hình thái vận hành, chọn một runtime.

Quyết định:

1. Python + FastAPI + hàng nghìn agent sống ngắn mỗi giây -> **Agno**.
2. TypeScript + Next.js/Vercel + nhiều nhà cung cấp thống nhất -> **Mastra**.
3. Trạng thái bền vững, đồ thị tường minh, tiếp tục khi thất bại -> **LangGraph** (Bài 13).
4. Sản phẩm ưu tiên Claude, muốn hình dạng harness Claude Code -> **Claude Agent SDK** (Bài 17).
5. Sản phẩm ưu tiên OpenAI, muốn các bàn giao + chốt bảo vệ + truy vết -> **OpenAI Agents SDK** (Bài 16).
6. Nhóm nhiều agent, tính đồng thời mô hình actor, cô lập lỗi -> **AutoGen v0.4** / **Microsoft Agent Framework** (Bài 14).
7. Hợp tác dựa trên vai trò hoặc các workflow mang tính xác định hướng sự kiện -> **CrewAI** Crew hoặc Flow (Bài 15).
8. Không điều nào ở trên -> các lời gọi API trực tiếp + vòng lặp dùng thư viện chuẩn từ Bài 01.

Tạo:

- Một tài liệu quyết định ngắn: stack, mục tiêu độ trễ, các thành phần nguyên thủy cần thiết, các đánh đổi được quan sát.
- Một khung tối thiểu trong runtime được chọn.
- Một kế hoạch di chuyển nếu một runtime khác đang được sử dụng hôm nay.

Các trường hợp từ chối cứng:

- Chọn Agno hoặc Mastra thuần túy theo "hiệu năng" khi khối lượng công việc là một lời gọi chậm cho mỗi yêu cầu. Hiệu năng hiếm khi là nút thắt.
- Chọn một runtime TypeScript trong một monorepo Python mà không có lý do. Mã agent nhiều ngôn ngữ là một khoản chi phí vận hành.
- Chọn LangGraph cho các tác vụ ngắn không trạng thái. Bộ tạo checkpoint thêm chi phí phụ mà một workflow đơn giản (Bài 12) tránh được.

Các quy tắc từ chối:

- Nếu người dùng muốn "cả năm runtime, để so sánh," từ chối. Benchmark trên khối lượng công việc của bạn; các benchmark nhà cung cấp framework mang tính định hướng.
- Nếu người dùng muốn tự host các tính năng `ee/` của Mastra, từ chối và chỉ đến các điều khoản giấy phép.
- Nếu sản phẩm cần công việc bất đồng bộ chạy lâu (hàng giờ đến hàng ngày), từ chối tự host và định tuyến đến Claude Managed Agents hoặc một kiến trúc dựa trên hàng đợi (Bài 29).

Đầu ra: tài liệu quyết định + khung + README. Kết thúc bằng "đọc gì tiếp theo" chỉ đến Bài 24 (khả năng quan sát) và Bài 29 (các runtime sản xuất) cho lớp vận hành bên trên framework.
