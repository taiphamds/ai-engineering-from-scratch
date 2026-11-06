---
name: mcp-threat-model
description: Threat-model an MCP 2026-07-28 deployment across metadata, routing, authorization, MRTR, and compatibility boundaries.
version: 2.0.0
phase: 13
lesson: 15
tags: [mcp, security, stateless, tool-poisoning, mrtr]
---

Với triển khai MCP, tạo mô hình đe dọa dựa trên bằng chứng. Giả định mọi máy chủ, gói, bộ đệm, mục registry hoặc tuyến gateway đều có thể bị xâm phạm.

## Required inputs

- Ranh giới tin cậy client, gateway, máy chủ, máy chủ cấp quyền và registry.
- Bộ mô tả công cụ chuẩn hóa đầy đủ và bản băm đã phê duyệt.
- Chủ thể xác thực, bên phát hành, đối tượng nhận, phạm vi và chính sách công cụ.
- Bản sửa đổi giao thức hiện tại và cũ được chấp nhận.
- Thao tác MRTR, lược đồ đầu vào, bảo vệ trạng thái và chính sách phát lại.
- Phạm vi bộ đệm, TTL, tuyến đăng ký và giữ kiểm toán.

## Produce

1. Xác thực đường truyền. Xác minh phiên bản và khả năng mỗi yêu cầu, rồi header định tuyến bằng nhau trước hỗ trợ phiên bản. Yêu cầu HTTP 400 `-32020` khi không khớp, HTTP 400 `-32022` với dữ liệu hỗ trợ và yêu cầu chính xác cho phiên bản khớp không hỗ trợ, HTTP 404 `-32601` cho phương thức không biết và 202 phần thân rỗng cho thông báo được chấp nhận.
2. Đánh giá bộ mô tả. Báo chỉ dấu đầu độc, đổi bản băm toàn bộ bộ mô tả, công cụ không biết và đổi lược đồ hoặc chú giải.
3. Bản đồ không gian tên. Cho một tên công khai định danh đầy đủ cho mỗi công cụ backend và từ chối giải quyết xung đột âm thầm.
4. Ma trận cấp quyền. Ánh xạ chủ thể đã xác thực và bên phát hành đến tài nguyên, công cụ, ràng buộc đối số và phạm vi. Không dùng `clientInfo` hoặc `serverInfo` làm danh tính.
5. Đánh giá MRTR. Xác nhận mọi mục `inputRequests` là yêu cầu nhúng đầy đủ được khả năng khai báo của client hỗ trợ. Coi `elicitation: {}` là hỗ trợ biểu mẫu ngầm và `elicitation: {form: {}}` là tường minh. Từ chối elicitation chỉ URL bằng HTTP 400 `-32021` và `data.requiredCapabilities.elicitation.form`. Gắn `requestState` được bảo vệ với phương thức, công cụ, đối số chính xác, chủ thể, mục đích, hết hạn và nonce. Khớp và xác thực mọi mục `inputResponses` theo khóa trước tiêu thụ nonce nguyên tử trong kho chống phát lại có giới hạn, dọn theo TTL dùng chung mọi thực thể trình xử lý.
6. Đánh giá trục rủi ro. Đánh dấu mọi bước tự động kết hợp đầu vào không đáng tin, dữ liệu nhạy cảm và hành động có hệ quả.
7. Đánh giá bộ đệm và đăng ký. Bảo đảm kết quả phụ thuộc người dùng riêng và thông báo sống lâu dùng `subscriptions/listen`.
8. Ranh giới tương thích. Cô lập mọi hành vi bắt tay, phiên, luồng GET, callback máy chủ hoặc tác vụ thử nghiệm cũ sau chặn phiên bản tường minh.
9. Ranh giới vận chuyển. Xác định triển khai là adapter HTTP đầy đủ hay mô hình giao thức trong tiến trình. Nối mô hình với Bài 09 để xác thực Content-Type JSON và Accept JSON cộng SSE.
10. Thứ tự khắc phục. Cho ba sửa đổi tác động lớn nhất với bên chịu trách nhiệm và bằng chứng chấp nhận.

## Hard rejects

- Ghi đè công cụ âm thầm hoặc chọn tuyến theo thứ tự khám phá.
- Cập nhật bản băm bộ mô tả không có con người hoặc chính sách phê duyệt lại.
- Coi thông tin client hoặc máy chủ tự khai là xác thực.
- Coi khả năng khai báo là quyền.
- Tin `requestState` văn bản thuần hoặc không chữ ký cho hành động có hệ quả.
- Giữ sổ chống phát lại duy nhất trong một thực thể gateway hoặc máy chủ.
- Đặt khóa giới hạn tốc độ hoặc trạng thái phê duyệt chỉ theo `Mcp-Session-Id`.
- Trình bày Sampling, Roots, Logging ngừng khuyến nghị hoặc HTTP cộng SSE cũ là nhánh triển khai mới.

## Output format

Trả các mục tên Trust Boundaries, Wire Findings, Descriptor Findings, Route Map, Authorization Matrix, MRTR Findings, Compatibility Findings và Remediation. Tách bằng chứng xác nhận khỏi giả định. Kết thúc bằng một đường tấn công hiện đi qua nhiều ranh giới nhất.
