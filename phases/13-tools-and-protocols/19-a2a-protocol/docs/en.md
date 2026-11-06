# A2A — Agent-to-Agent Protocol

> MCP là agent-sang-công-cụ. A2A (Agent2Agent) là agent-sang-agent — giao thức mở cho các agent mờ xây trên framework khác nhau cộng tác. Google phát hành tháng 4 năm 2025, chuyển cho Linux Foundation tháng 6 năm 2025, đạt v1.0 tháng 4 năm 2026 với 150+ bên hỗ trợ gồm AWS, Cisco, Microsoft, Salesforce, SAP và ServiceNow. Nó tiếp nhận ACP của IBM và thêm phần mở rộng thanh toán AP2. Bài này đi qua Agent Card, vòng đời Task và ba liên kết giao thức, dùng tên đường truyền A2A 1.0.1.

**Type:** Build
**Languages:** Python (stdlib, Agent Card + Task harness)
**Prerequisites:** Phase 13 · 06 (MCP fundamentals), Phase 13 · 08 (MCP client)
**Time:** ~75 minutes

## Learning Objectives

- Phân biệt trường hợp sử dụng agent-sang-công-cụ (MCP) với agent-sang-agent (A2A).
- Công bố Agent Card tại `/.well-known/agent-card.json` với skill và siêu dữ liệu `supportedInterfaces`.
- Đi qua vòng đời Task: `TASK_STATE_SUBMITTED`, `TASK_STATE_WORKING`, `TASK_STATE_INPUT_REQUIRED` và trạng thái kết thúc `TASK_STATE_COMPLETED`, `TASK_STATE_FAILED`, `TASK_STATE_CANCELED`, `TASK_STATE_REJECTED`.
- Dùng Message có mỗi Part giữ một trong `text`, `raw`, `url` hoặc `data` và Artifact làm đầu ra.

## The Problem

Agent dịch vụ khách hàng cần ủy nhiệm viết báo cáo cho agent viết chuyên biệt. Lựa chọn trước A2A:

- REST API tùy chỉnh. Hoạt động nhưng mọi cặp là riêng lẻ.
- Cơ sở mã dùng chung. Yêu cầu hai agent chạy cùng framework.
- MCP. Không phù hợp: MCP để gọi công cụ, không cho hai agent cộng tác trong khi giữ suy luận nội bộ mờ của mỗi agent.

A2A lấp khoảng trống. Nó mô hình hóa tương tác thành agent gửi Task đến agent khác, với vòng đời, thông điệp và sản phẩm. Trạng thái nội bộ agent được gọi vẫn mờ — bên gọi chỉ thấy chuyển trạng thái tác vụ và đầu ra cuối.

A2A là giao thức "để agent trên các framework nói chuyện với nhau". Không thay MCP; hai bên bổ sung.

## The Concept

### Agent Card

Mọi agent tuân thủ A2A công bố card tại `/.well-known/agent-card.json`:

```json
{
  "name": "research-agent",
  "description": "Summarizes academic papers and drafts citations.",
  "version": "1.2.0",
  "supportedInterfaces": [
    {
      "url": "https://research.example.com/a2a",
      "protocolBinding": "JSONRPC",
      "protocolVersion": "1.0"
    }
  ],
  "capabilities": {"streaming": true, "pushNotifications": true},
  "securitySchemes": {
    "bearer": {"httpAuthSecurityScheme": {"scheme": "Bearer"}}
  },
  "securityRequirements": [{"schemes": {"bearer": {"list": []}}}],
  "defaultInputModes": ["text/plain"],
  "defaultOutputModes": ["text/markdown"],
  "skills": [
    {
      "id": "summarize_paper",
      "name": "Summarize a paper",
      "description": "Read a paper PDF and produce a 3-paragraph summary.",
      "tags": ["research", "summarization"],
      "inputModes": ["text/plain", "application/pdf"],
      "outputModes": ["text/markdown"]
    }
  ]
}
```

Khám phá dựa URL: lấy card, chọn mục `supportedInterfaces` đầu có `protocolBinding` client của bạn sử dụng và liệt kê skill. Chế độ đầu vào và đầu ra là media type.

### Signed Agent Cards

Card có thể mang mảng `signatures`. Mỗi mục là JWS (RFC 7515) tính trên JSON chuẩn RFC 8785 của card, bỏ trường `signatures`. Bên sử dụng chuẩn hóa card cùng cách và xác minh. Ngăn mạo danh.

### Task lifecycle

```text
TASK_STATE_SUBMITTED
  -> TASK_STATE_WORKING
  -> TASK_STATE_COMPLETED | TASK_STATE_FAILED | TASK_STATE_CANCELED | TASK_STATE_REJECTED

TASK_STATE_WORKING
  -> TASK_STATE_INPUT_REQUIRED
  -> TASK_STATE_WORKING (the client sends a message with the same taskId)
```

Client bắt đầu bằng `SendMessage` và máy chủ tạo Task. Agent được gọi chuyển qua trạng thái; client thăm dò bằng `GetTask` hoặc truyền luồng qua SSE bằng `SendStreamingMessage` và `SubscribeToTask`. Luồng mang sự kiện `statusUpdate` và `artifactUpdate`, đóng khi tác vụ đạt trạng thái kết thúc. Không có cờ `final`.

### Messages and Parts

Thông điệp có `messageId`, `role` (`ROLE_USER` hoặc `ROLE_AGENT`) và một hoặc nhiều Part. Mỗi Part giữ đúng một trường nội dung và tên trường đó là kiểu. Không có trường `kind`.

- `text`: nội dung thuần.
- `raw`: byte file, base64 trong JSON, thường với `filename` và `mediaType`.
- `url`: liên kết đến nội dung file.
- `data`: payload JSON có cấu trúc (đầu vào có cấu trúc cho agent được gọi).

Ví dụ:

```json
{
  "messageId": "msg-001",
  "role": "ROLE_USER",
  "parts": [
    {"text": "Summarize this paper."},
    {"raw": "...", "filename": "paper.pdf", "mediaType": "application/pdf"},
    {"data": {"targetLength": "3 paragraphs"}, "mediaType": "application/json"}
  ]
}
```

### Artifacts

Đầu ra là Artifact, không chuỗi thô. Artifact là đầu ra có tên, có kiểu:

```json
{
  "artifactId": "art-001",
  "name": "summary",
  "parts": [{"text": "...", "mediaType": "text/markdown"}]
}
```

Artifact có thể truyền luồng thành phần. Mỗi sự kiện `artifactUpdate` mang artifact cộng `append` và `lastChunk`. Bên gọi tích lũy.

### Three protocol bindings

1. **JSON-RPC 2.0 trên HTTP** (`JSONRPC`). POST cho yêu cầu, SSE cho truyền luồng. Phương thức là PascalCase: `SendMessage`, `SendStreamingMessage`, `GetTask`, `ListTasks`, `CancelTask`, `SubscribeToTask`, `CreateTaskPushNotificationConfig`, `GetTaskPushNotificationConfig`, `ListTaskPushNotificationConfigs`, `DeleteTaskPushNotificationConfig` và `GetExtendedAgentCard`.
2. **gRPC** (`GRPC`). Cho môi trường doanh nghiệp nơi gRPC là nguyên bản. Cùng tên phương thức.
3. **HTTP+JSON/REST** (`HTTP+JSON`). URL tài nguyên như `POST /message:send` và `GET /tasks/{id}`.

Cả ba liên kết mang cùng mô hình dữ liệu. Mỗi mục `supportedInterfaces` nêu một liên kết và `protocolVersion`. Client gửi header `A2A-Version: 1.0` trên mọi yêu cầu vì máy chủ đọc yêu cầu thiếu nó là phiên bản 0.3.

```http
POST /a2a HTTP/1.1
Host: research.example.com
Content-Type: application/json
A2A-Version: 1.0

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "SendMessage",
  "params": {
    "message": {
      "messageId": "msg-001",
      "role": "ROLE_USER",
      "parts": [{"text": "Summarize this paper."}]
    }
  }
}
```

### Opacity preservation

Nguyên tắc thiết kế then chốt: trạng thái nội bộ agent được gọi mờ. Bên gọi thấy trạng thái tác vụ và sản phẩm. Chuỗi suy nghĩ, lời gọi công cụ, ủy nhiệm agent phụ của agent được gọi — tất cả vô hình. Khác MCP nơi lời gọi công cụ minh bạch.

Lý do: A2A cho đối thủ cộng tác không tiết lộ nội bộ. A2A có thể là "gọi agent dịch vụ khách hàng này" mà bên gọi không biết agent triển khai dịch vụ thế nào.

### Timeline

- **2025-04-09.** Google công bố A2A.
- **2025-06-23.** Chuyển cho Linux Foundation.
- **2025-08.** Tiếp nhận ACP của IBM.
- **2025-09.** Phần mở rộng AP2 (Thanh toán agent) phát hành.
- **2026-04.** v1.0 phát hành với 150+ tổ chức hỗ trợ.

### Relationship to MCP

| Chiều | MCP | A2A |
|-----------|-----|-----|
| Trường hợp sử dụng | Agent-sang-công-cụ | Agent-sang-agent |
| Tính mờ | Lời gọi công cụ minh bạch | Suy luận nội bộ mờ |
| Bên gọi điển hình | Runtime agent | Agent khác |
| Trạng thái | Kết quả lời gọi công cụ | Task với vòng đời |
| Cấp quyền | OAuth 2.1 (Giai đoạn 13 · 16) | `securitySchemes` + `securityRequirements` Agent Card |
| Vận chuyển | Stdio / Streamable HTTP | JSON-RPC / gRPC / HTTP+JSON |

Dùng MCP khi muốn gọi công cụ cụ thể. Dùng A2A khi muốn ủy nhiệm toàn tác vụ cho agent khác. Nhiều hệ thống sản xuất dùng cả hai: agent dùng MCP cho tầng công cụ và A2A cho tầng cộng tác.

```figure
a2a-task-lifecycle
```

## Use It

`code/main.py` triển khai bộ khung A2A tối thiểu: agent viết công bố card, agent nghiên cứu gửi yêu cầu `SendMessage` có phần PDF và chỉ dẫn văn bản, tác vụ đi qua `TASK_STATE_WORKING` → `TASK_STATE_INPUT_REQUIRED` → `TASK_STATE_WORKING` → `TASK_STATE_COMPLETED` trước trả sản phẩm văn bản. Tất cả stdlib; dùng vận chuyển trong bộ nhớ để tập trung hình dạng thông điệp.

Những gì cần xem:

- Hình dạng JSON Agent Card.
- Gán id tác vụ phía máy chủ và chuyển trạng thái.
- Part định kiểu theo trường nội dung có mặt.
- Nhánh `TASK_STATE_INPUT_REQUIRED` giữa tác vụ.
- Trả sản phẩm khi hoàn tất.

## Ship It

Bài này tạo `outputs/skill-a2a-agent-spec.md`. Với agent mới nên được agent khác gọi, skill tạo JSON Agent Card, lược đồ skill và bản thiết kế endpoint.

## Exercises

1. Chạy `code/main.py`. Lần theo toàn vòng đời Task, gồm tạm dừng `TASK_STATE_INPUT_REQUIRED` nơi agent được gọi hỏi làm rõ.

2. Thêm Agent Card có chữ ký. Đặt một mục JWS trong `signatures` với `alg` là `HS256`, ký JSON chuẩn card không có trường `signatures`. Viết bộ xác minh và xác nhận thất bại trên card bị sửa.

3. Triển khai truyền luồng tác vụ bằng `SendStreamingMessage`: agent viết phát `task`, ba phần `artifactUpdate` và `statusUpdate` với `TASK_STATE_COMPLETED`, rồi đóng luồng. Bên gọi tích lũy các phần.

4. Thiết kế agent A2A bọc máy chủ MCP. Ánh xạ mỗi công cụ MCP thành skill A2A. Ghi đánh đổi — tính mờ nào bị mất?

5. Đọc công bố A2A v1.0 và xác định một tính năng chưa được framework nào triển khai tính đến tháng 4 năm 2026. (Gợi ý: liên quan ủy nhiệm tác vụ nhiều bước.)

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|----------------|------------------------|
| A2A | "Giao thức Agent-sang-Agent" | Giao thức mở cho cộng tác agent mờ |
| Agent Card (Thẻ agent) | "`/.well-known/agent-card.json`" | Siêu dữ liệu công bố mô tả skill và `supportedInterfaces` của agent |
| Skill (Kỹ năng) | "Đơn vị gọi được" | Thao tác có tên agent hỗ trợ (tương tự công cụ MCP) |
| Task (Tác vụ) | "Đơn vị ủy nhiệm" | Mục công việc có vòng đời và sản phẩm cuối |
| Message (Thông điệp) | "Đầu vào tác vụ" | Mang Part (`text`, `raw`, `url`, `data`) |
| Part (Phần) | "Phần có kiểu" | Đúng một trong `text` / `raw` / `url` / `data`, cộng `mediaType` tùy chọn; không trường `kind` |
| Artifact (Sản phẩm) | "Đầu ra tác vụ" | Đầu ra có tên, có kiểu trả khi hoàn tất |
| AP2 | "Giao thức thanh toán agent" | Phần mở rộng thanh toán xây trên A2A; ký card là A2A lõi (`signatures`) |
| Opacity (Tính mờ) | "Cộng tác hộp đen" | Nội bộ agent được gọi ẩn với bên gọi |
| `TASK_STATE_INPUT_REQUIRED` | "Tạm dừng tác vụ" | Trạng thái gián đoạn khi agent cần thêm thông tin |

## Further Reading

- [a2a-protocol.org](https://a2a-protocol.org/latest/) — đặc tả A2A kinh điển
- [a2aproject/A2A — GitHub](https://github.com/a2aproject/A2A) — triển khai tham chiếu và SDK
- [A2A v1.0.1 release](https://github.com/a2aproject/A2A/tree/v1.0.1): `docs/specification.md` gắn thẻ và `specification/a2a.proto` quy phạm bài này theo
- [Linux Foundation — A2A launch press release](https://www.linuxfoundation.org/press/linux-foundation-launches-the-agent2agent-protocol-project-to-enable-secure-intelligent-communication-between-ai-agents) — chuyển quản trị tháng 6 năm 2025
- [Google Cloud — A2A protocol upgrade](https://cloud.google.com/blog/products/ai-machine-learning/agent2agent-protocol-is-getting-an-upgrade) — lộ trình và đà đối tác
- [Google Dev — A2A 1.0 milestone](https://discuss.google.dev/t/the-a2a-1-0-milestone-ensuring-and-testing-backward-compatibility/352258) — ghi chú phát hành v1.0 và hướng dẫn tương thích ngược
