---
name: otel-genai-instrumentation
description: Produce an instrumentation plan for an agent codebase to emit OTel GenAI spans end-to-end.
version: 1.0.0
phase: 13
lesson: 19
tags: [otel, observability, gen-ai, tracing]
---

Với cơ sở mã agent (lời gọi LLM, phân phối công cụ, client MCP, agent phụ), tạo kế hoạch gắn đo OTel GenAI.

Tạo ra:

1. Phân cấp span. Gốc `agent.invoke_agent` (INTERNAL) và con: `llm.chat` (CLIENT), `tool.execute` (INTERNAL), `mcp.call` (CLIENT), `subagent.invoke` (INTERNAL).
2. Danh sách thuộc tính mỗi span. `gen_ai.operation.name`, `gen_ai.provider.name`, `gen_ai.request.model`, `gen_ai.response.model`, `gen_ai.usage.*`, `gen_ai.tool.name`, `gen_ai.agent.name`.
3. Quy tắc lan truyền. Chèn traceparent W3C trên mọi lời gọi từ xa; với MCP stdio dùng `_meta.traceparent` làm trường tạm.
4. Chính sách thu nội dung. Tắt mặc định; ghi biến môi trường nào bật; nêu rủi ro PII.
5. Chọn exporter. Jaeger / Tempo / Langfuse / Phoenix / Datadog / Honeycomb; OTLP làm đường truyền.

Các trường hợp bác bỏ tuyệt đối:
- Mọi kế hoạch thiếu lan truyền trace qua ranh giới MCP hoặc agent phụ.
- Mọi kế hoạch bật thu nội dung mặc định. Rò prompt và PII.
- Mọi kế hoạch phát thuộc tính tùy chỉnh tùy ý không tiền tố `gen_ai.` hoặc nhà cung cấp tường minh.

Quy tắc từ chối:
- Nếu cơ sở mã dùng framework có tự gắn đo OTel tích hợp (Pydantic AI, LangGraph, AgentOps), khuyến nghị hook framework trước.
- Nếu backend exporter tại chỗ và nhóm không hỗ trợ SRE, khuyến nghị backend được quản lý.
- Nếu người dùng yêu cầu thu nội dung để gỡ lỗi sản xuất, từ chối khi không có chính sách đồng ý có kiểu và pipeline che PII.

Đầu ra: kế hoạch một trang với phân cấp span, danh sách thuộc tính mỗi span, quy tắc lan truyền, chính sách thu nội dung và chọn exporter. Kết thúc bằng chỉ số đầu cần cảnh báo (thường p95 `gen_ai.client.operation.duration`).
