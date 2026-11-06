---
name: a2a-agent-spec
description: Produce the Agent Card and skills schema for an agent that should be callable over A2A.
version: 1.0.0
phase: 13
lesson: 18
tags: [a2a, agent-card, task-lifecycle, delegation]
---

Với khả năng agent và cộng tác viên dự định, tạo A2A Agent Card và định nghĩa skill.

Tạo ra:

1. Agent Card. `name`, `description`, `version`, `supportedInterfaces[]` (mỗi mục có `url`, `protocolBinding`, `protocolVersion`), `capabilities` (streaming, pushNotifications), `defaultInputModes`, `defaultOutputModes`, `securitySchemes` và `securityRequirements`, `skills[]`. Phục vụ tại `/.well-known/agent-card.json`.
2. Danh sách skill. Mỗi mục có `id`, `name`, `description`, `tags` và media type `inputModes` / `outputModes` tùy chọn. Dùng mẫu "Dùng khi X. Không dùng cho Y." trong mô tả.
3. Kế hoạch trạng thái tác vụ. Với mỗi skill, chuyển trạng thái kỳ vọng và nhánh `TASK_STATE_INPUT_REQUIRED`.
4. Kế hoạch ký. Có ký card bằng mục JWS trong `signatures` không (khuyến nghị cho agent gọi được từ ngoài).
5. Liên kết giao thức. `JSONRPC`, `GRPC` hoặc `HTTP+JSON`, mỗi cái khai báo như mục `supportedInterfaces` với `protocolVersion` `1.0`. Client gửi `A2A-Version: 1.0`. Ghi tương thích ngược với v1.0.

Các trường hợp bác bỏ tuyệt đối:
- Mọi Agent Card không URL `supportedInterfaces` ổn định. Phá khám phá.
- Mọi skill không `tags` hoặc không chế độ đầu vào và đầu ra (riêng hoặc mặc định card). Bên gọi không suy luận được tương thích.
- Mọi agent gọi được từ ngoài không kế hoạch ký card. Vector mạo danh.

Quy tắc từ chối:
- Nếu trường hợp sử dụng agent là một lời gọi công cụ, từ chối dựng khung A2A; khuyến nghị MCP.
- Nếu agent lộ nội bộ không nên lộ (trace lời gọi công cụ, chuỗi suy nghĩ), từ chối và bắt buộc tính mờ.
- Nếu agent cần A2A cho thanh toán (trường hợp AP2), xác nhận phiên bản phần mở rộng AP2 và nêu AP2 riêng A2A lõi.

Đầu ra: JSON Agent Card một trang, lược đồ skill cho mỗi thao tác, kế hoạch chuyển trạng thái, lựa chọn ký và vận chuyển. Kết thúc bằng bảo đảm tương thích ngược v1.0 tối thiểu agent hứa.
