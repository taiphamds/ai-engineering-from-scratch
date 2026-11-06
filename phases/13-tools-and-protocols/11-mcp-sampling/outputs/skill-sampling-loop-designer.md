---
name: sampling-loop-designer
description: Migrate model-assisted MCP tools to direct inference or stateless 2026-07-28 MRTR with bounded compatibility sampling.
version: 2.0.0
phase: 13
lesson: 11
tags: [mcp, mrtr, sampling, stateless, migration]
---

Thiết kế hành vi có mô hình hỗ trợ cho máy chủ MCP nhắm bản sửa đổi giao thức `2026-07-28`.

Bắt đầu bằng một quyết định: máy chủ có thể tích hợp trực tiếp với nhà cung cấp mô hình không? Sampling ngừng được khuyến nghị cho thiết kế mới. Ưu tiên tích hợp trực tiếp trừ khi dùng mô hình và thông tin xác thực của client là yêu cầu sản phẩm tường minh.

Tạo ra:

1. Quyết định kiến trúc. Chọn suy luận trực tiếp hoặc Sampling tương thích và nêu tại sao.
2. Hợp đồng khám phá. Cho thấy `server/discover` với `supportedVersions` chính xác, khả năng công bố, `ttlMs` và `cacheScope`. Nếu công bố công cụ, gồm bộ mô tả `tools/list` bắt buộc tất định với `inputSchema` đối tượng hợp lệ, `resultType: "complete"`, siêu dữ liệu danh tính máy chủ và gợi ý bộ đệm.
3. Vỏ yêu cầu. Gồm phiên bản giao thức và khả năng client trong `_meta` trên mọi yêu cầu. Dùng `-32602` cho phiên bản thiếu hoặc không chuỗi, `-32022` với dữ liệu `supported` và `requested` chính xác cho phiên bản không hỗ trợ và `-32021` với đối tượng `requiredCapabilities` khi không có Sampling. Chỉ coi siêu dữ liệu danh tính client là thông tin. Không bao giờ phát phản hồi JSON-RPC cho thông báo không id; thông báo HTTP được chấp nhận nhận `202` không phần thân.
4. Bảng vòng. Với mỗi vòng MRTR, nêu khóa `inputRequests`, phương thức yêu cầu nhúng, lược đồ phản hồi kỳ vọng, xác thực và ngân sách.
5. Hợp đồng thử lại. Yêu cầu phương thức và đối số gốc, id JSON-RPC mới, `inputResponses` vòng hiện tại và `requestState` chính xác từng byte.
6. Bảo vệ trạng thái. Gắn HMAC hoặc mã hóa có xác thực với chủ thể đã xác thực, phương thức, bản băm đối số, giai đoạn và thời hạn ngắn.
7. Chính sách an toàn. Định nghĩa phê duyệt, vòng tối đa, giới hạn token và byte, xác thực phản hồi, ghi nhật ký và hành vi từ chối.
8. Kế hoạch loại bỏ. Nếu còn Sampling, nêu điều kiện và ngày thay bằng tích hợp trực tiếp.

Các trường hợp bác bỏ tuyệt đối:

- Thiết kế mới tiếp nhận Sampling ngừng được khuyến nghị không có yêu cầu được ghi lại.
- Máy chủ 2026-07-28 gửi `sampling/createMessage` như yêu cầu trực tiếp máy chủ-sang-client.
- Mọi sử dụng `initialize`, `notifications/initialized`, `Mcp-Session-Id` hoặc trạng thái phiên giao thức ẩn.
- `requestState` không có chữ ký ảnh hưởng cấp quyền, truy cập tài nguyên hoặc logic nghiệp vụ.
- Lần thử lại dùng lại id JSON-RPC gốc hoặc đổi đối số gốc.
- Vòng lặp mô hình client không có kiểm tra khả năng, chính sách phê duyệt, xác thực và giới hạn vòng cứng.
- `includeContext: "allServers"` hoặc ngữ cảnh chéo máy chủ ngầm.

Quy tắc từ chối:

- Từ chối lời gọi mô hình bí mật hoặc mọi thiết kế giấu ý định máy chủ với người dùng.
- Từ chối đầu ra mô hình làm bằng chứng danh tính, cấp quyền hoặc đồng ý người dùng.
- Từ chối thiết kế nhiều vòng khi một lời gọi công cụ tất định đủ.
- Từ chối gọi siêu dữ liệu client và máy chủ là danh tính đã xác thực.

Xuất kiến trúc một trang với quyết định, luồng đường truyền, bảng vòng, nội dung trạng thái có chữ ký, ngân sách an toàn, ca thất bại và kế hoạch chuyển đổi. Kết thúc bằng kết luận: `direct inference`, `temporary MRTR compatibility` hoặc `no model required`.
