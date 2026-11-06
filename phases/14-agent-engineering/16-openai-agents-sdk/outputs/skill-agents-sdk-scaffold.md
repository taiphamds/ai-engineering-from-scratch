---
name: agents-sdk-scaffold
description: Scaffold an OpenAI Agents SDK app with a triage agent, handoffs, input/output/tool guardrails, session store, and a trace processor.
version: 1.0.0
phase: 14
lesson: 16
tags: [openai, agents-sdk, handoffs, guardrails, tracing, session]
---

Với một miền sản phẩm và một danh sách các agent chuyên gia, tạo khung một ứng dụng OpenAI Agents SDK.

Tạo:

1. `Agent` cho mỗi chuyên gia cộng một agent `triage` chỉ có các bàn giao (không có công cụ miền).
2. `FunctionTool` cho mỗi công cụ miền với schema đầu vào có kiểu, mô tả rõ ràng (cho mô hình biết khi nào sử dụng nó) và sandbox thực thi.
3. `Handoff` từ phân loại ban đầu đến mỗi chuyên gia. Xác minh các tên công cụ tuân theo quy ước `transfer_to_<agent>`.
4. `InputGuardrail` cho PII, chính sách, phạm vi. Mặc định chế độ song song trừ khi LLM chốt bảo vệ lớn so với mô hình chính — khi đó dùng chặn.
5. `OutputGuardrail` cho độ dài, PII, chính sách. Luôn chặn trong sản xuất cho các đầu ra then chốt về an toàn.
6. Các chốt bảo vệ cho từng công cụ trên các công cụ hàm chạm đến mạng hoặc hệ thống file.
7. Kho `Session` (SQLite mặc định; Redis cho sản xuất).
8. `add_trace_processor` nối các span đến backend của bạn cùng với UI trace của OpenAI.

Các trường hợp từ chối cứng:

- Các agent phân loại ban đầu có các công cụ miền. Chỉ các bàn giao phân loại ban đầu; trộn làm pha loãng quyết định của bộ định tuyến.
- Các chốt bảo vệ thay đổi đầu vào/đầu ra. Các chốt bảo vệ chấp thuận hoặc từ chối — chúng không viết lại.
- Các vòng lặp bàn giao âm thầm. Yêu cầu một bộ đếm chặng (mặc định tối đa 3).

Các quy tắc từ chối:

- Nếu người dùng muốn "không chốt bảo vệ, chỉ tiến nhanh," từ chối cho bất kỳ sản phẩm nào tiếp xúc người dùng trả phí hoặc PII.
- Nếu sản phẩm chỉ có 2 chuyên gia, đề xuất định tuyến qua `Agents` với một bộ phân loại trực tiếp (Bài 12) thay vì phân loại ban đầu+bàn giao — ít chi phí token hơn.
- Nếu truy vết bị tắt trong sản xuất, từ chối phát hành. Các lỗi nhiều bước không thể gỡ lỗi mà không có trace.

Đầu ra: `agents.py`, `tools.py`, `guardrails.py`, `app.py`, `README.md` với lý do agent phân loại ban đầu, các chế độ chốt bảo vệ, bộ xử lý trace và backend phiên. Kết thúc bằng "đọc gì tiếp theo" chỉ đến Bài 23 (OTel GenAI), Bài 24 (các backend khả năng quan sát) hoặc Bài 17 cho chuyển dịch Claude Agent SDK.
