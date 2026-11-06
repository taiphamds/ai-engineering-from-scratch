---
name: gateway-bootstrap
description: Design a stateless MCP 2026-07-28 gateway with registry admission, policy, routing, and compatibility boundaries.
version: 2.0.0
phase: 13
lesson: 17
tags: [mcp, gateway, stateless, registry, rbac, subscriptions, tasks]
---

Với client, backend, yêu cầu cấp quyền và ràng buộc tuân thủ, tạo thiết kế gateway.

## Required inputs

- URI tài nguyên gateway công khai, bản sửa đổi giao thức chấp nhận và vận chuyển.
- Mô hình chủ thể đã xác thực và vai trò.
- Endpoint backend, bên phát hành, tài nguyên, bản ghi registry, bằng chứng nhà phát hành và bộ mô tả phê duyệt.
- Hiển thị công cụ, chính sách đối số, lớp chi phí và độ nhạy dữ liệu.
- Yêu cầu truyền luồng, thông báo thay đổi, MRTR và Tasks.
- Yêu cầu kiểm toán, giữ lại, trace và che.

## Produce

1. Đầu vào không trạng thái. Một endpoint POST, phiên bản và khả năng mỗi yêu cầu, header phương thức và tên khớp, JSON hoặc SSE phạm vi yêu cầu và 405 cho GET và DELETE hiện đại. Xác thực header bằng nhau trước hỗ trợ phiên bản. Chỉ định HTTP 400 `-32020`, HTTP 400 `-32022` với dữ liệu hỗ trợ và yêu cầu chính xác, HTTP 404 `-32601`, tuần tự hóa dữ liệu lỗi tùy chọn và xử lý thông báo 202 phần thân rỗng.
2. Kế hoạch khám phá. Triển khai `server/discover` gateway, khám phá mỗi backend, chỉ đưa giao khả năng đầu cuối an toàn ra và gồm `resultType`, `ttlMs`, `cacheScope` hiện tại và siêu dữ liệu danh tính máy chủ.
3. Bảng tiếp nhận. Xác thực hình dạng công bố `server.json` Registry chính thức và tên kiểu `com.example/*` riêng tiếp nhận bảo mật. Với mỗi backend, nối bản ghi với không gian tên nhà phát hành đã xác minh ngoài, nguồn xuất xứ, endpoint, chính sách phiên bản, bản băm bộ mô tả, bên phát hành, tài nguyên, phê duyệt và trạng thái hết hạn.
4. Bản đồ không gian tên. Cho mỗi công cụ backend tên công khai định danh đầy đủ ổn định và giữ `inputSchema` gốc đối tượng hợp lệ trên mọi bộ mô tả `tools/list`. Từ chối xung đột-theo-thứ-tự.
5. Ma trận cấp quyền. Ánh xạ chủ thể và vai trò đến công cụ công khai, tài nguyên, đối số và phạm vi. Giữ thông tin xác thực ngoài và backend riêng và gắn bên phát hành.
6. Hợp đồng chuyển tiếp. Xây yêu cầu backend tự đầy đủ mới, chỉ công bố khả năng client được làm trung gian, xác thực kết quả backend và giữ liên hệ trace.
7. Kế hoạch bộ đệm. Làm khám phá và danh sách phụ thuộc chủ thể riêng. Đặt TTL có giới hạn và hành vi vô hiệu.
8. Chính sách tốc độ và kiểm toán. Đặt khóa giới hạn theo chủ thể, bên phát hành, tài nguyên, công cụ, lớp chi phí và thời gian. Che thông tin xác thực và đối số nhạy cảm không cần.
9. Định tuyến tương tác. Mô tả SSE phạm vi yêu cầu, xác nhận `subscriptions/listen` và hành vi kết nối lại, chuyển tiếp trạng thái MRTR chính xác từng byte và định tuyến Tasks theo id tác vụ trong `Mcp-Name`.
10. Adapter vận chuyển. Nếu gateway nhận yêu cầu và header đã phân tích, gắn nhãn mô hình giao thức trong tiến trình và nối với Bài 09 để bắt buộc Content-Type JSON và Accept JSON cộng SSE.
11. Adapter tương thích. Rào khởi tạo, id phiên, luồng GET, đăng ký tài nguyên và phương thức tác vụ thử nghiệm cũ khỏi lõi gateway hiện đại.

## Hard rejects

- Tính gắn kết phiên, kho phiên hoặc viết lại id phiên trình bày là bắt buộc cho 2026-07-28.
- Tin hiện diện registry hoặc tên hiển thị không có bằng chứng tiếp nhận.
- Xung đột công cụ âm thầm hoặc cập nhật ghim bộ mô tả không phê duyệt lại.
- Dùng lại bearer token ngoài tại backend hoặc token backend tại bên phát hành hoặc tài nguyên khác.
- Lưu đệm công khai danh sách lọc chủ thể.
- Luồng sự kiện GET hiện đại độc lập, phát lại Last-Event-ID hoặc phương thức đăng ký tài nguyên.
- Hành vi `tasks/list` hoặc `tasks/result` mới.
- Giới hạn tốc độ chỉ khóa theo phiên giao thức đã bỏ.
- Xác minh bảo mật bịa trong `server.json` thay trạng thái tiếp nhận đã xác minh và xuất xứ riêng.
- Bộ mô tả công cụ có không gian tên bỏ `inputSchema`.

## Output format

Trả các mục tên Ingress, Discovery, Admission, Namespace Map, Authorization, Forwarding, Cache, Rate Limits, Audit, Interactions và Legacy Adapter. Kết thúc bằng một tuyến cần kiểm thử chấp nhận mạnh nhất.
