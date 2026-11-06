---
name: mcp-registry-admission
description: Admit, pin, monitor, quarantine, and roll back an MCP Registry release with supply chain evidence.
version: 1.0.0
phase: 13
lesson: 30
tags: [mcp, registry, provenance, admission, drift, rollback]
---

Với phản hồi MCP Registry, danh tính nhà phát hành xác minh, bằng chứng sản phẩm, quan sát máy chủ trực tiếp và chính sách cục bộ, tạo quyết định tiếp nhận và bundle bằng chứng.

## Required inputs

- Nguồn Registry, bản ghi máy chủ, siêu dữ liệu Registry quản lý và thời gian lấy.
- Không gian tên xác minh và phương thức xác thực thiết lập.
- Registry gói, định danh, phiên bản chính xác, kết quả sở hữu và bản băm sản phẩm tính.
- Kết quả `server/discover` trực tiếp, phiên bản giao thức, khả năng, thông tin máy chủ chẩn đoán và bộ mô tả công cụ đầy đủ.
- Khả năng bắt buộc, thuộc tính công cụ cấm, người xem xét, giữ bằng chứng và chính sách hoàn tác.
- Ghim tiếp nhận trước, tuyến hiện tại, cách ly và quan sát sức khỏe gần.

## Procedure

1. Xác thực hình dạng bản ghi Registry. Yêu cầu tên, phiên bản, mô tả không rỗng và ít nhất một gói hoặc remote. Coi phiên bản lược đồ Registry và phiên bản giao thức MCP trực tiếp là giá trị độc lập.
2. Đọc trạng thái Registry quản lý từ `_meta["io.modelcontextprotocol.registry/official"].status` cấp phản hồi, không từ `_meta.status` trực tiếp hoặc bản ghi công bố. Từ chối tiếp nhận tự động trừ khi trạng thái `active`.
3. So không gian tên chính xác với không gian tên xác thực đáng tin thiết lập. Từ chối tiền tố giống và slug rỗng.
4. Nối một nguồn thực thi khai báo với bằng chứng xác minh. Với gói, khớp loại registry, định danh, phiên bản chính xác và vận chuyển. Với bản ghi chỉ từ xa, khớp URL và vận chuyển với bằng chứng endpoint xác minh độc lập. Yêu cầu bản băm bằng chứng SHA-256 đáng tin cho mỗi nguồn.
5. Hash bản ghi Registry chuẩn. Hash đối tượng xuất xứ nối nguồn Registry, tên máy chủ, phiên bản Registry, bản băm bản ghi, nguồn chọn và bản băm bằng chứng nguồn.
6. Quan sát endpoint trực tiếp. Yêu cầu phiên bản giao thức chấp nhận, khả năng bắt buộc và bộ mô tả công cụ đầy đủ. Chỉ giữ `_meta["io.modelcontextprotocol/serverInfo"]` kết quả cho hiển thị, nhật ký và gỡ lỗi. Không bao giờ dùng `serverInfo` tự khai, gồm bí danh chỉ trực tiếp, làm thẩm quyền tiếp nhận hoặc bảo mật.
7. Chỉ chuẩn hóa tập hợp không thứ tự về ngữ nghĩa. Hash toàn bề mặt bộ mô tả chuẩn hóa để đổi tên, mô tả, lược đồ, chú giải hoặc tập công cụ tạo sai lệch.
8. Áp chính sách cấp quyền, dữ liệu, mạng và đánh giá cục bộ. Công bố Registry là bằng chứng, không phê duyệt cục bộ.
9. Khi phê duyệt, lưu ghim bất biến chứa bản băm bản ghi, nguồn thực thi, xuất xứ và tập công cụ. Giữ trạng thái phê duyệt riêng trạng thái định tuyến hoạt động.
10. Thêm quyết định, lý do, tham chiếu bằng chứng, hash sổ trước và hash mục hiện tại vào sổ tiếp nhận. Che thông tin xác thực và đối số nhạy cảm trước lưu bằng chứng.
11. Đối soát trạng thái Registry và bộ mô tả trực tiếp theo lịch và trước kích hoạt. Cách ly và ngừng kích hoạt ghim khi trạng thái thành ngừng khuyến nghị hoặc xóa, bằng chứng nguồn đổi hoặc hành vi trực tiếp khác. Ghim cách ly không bao giờ là đích hoàn tác.
12. Chỉ hoàn tác về ghim tiếp nhận trước, hiện đủ điều kiện, khỏe và không cách ly. Ghi khôi phục tuyến thành sự kiện mới. Không bao giờ viết lại công bố hoặc quyết định tiếp nhận cũ.

## Hard rejects

- Tin cậy chỉ từ tên hiển thị quen hoặc hiện diện Registry.
- Kiểm tra không gian tên `startswith` hoặc không gian tên chỉ bản ghi nộp tuyên bố.
- `latest`, dải phiên bản hoặc tọa độ gói không bản băm sản phẩm.
- Trường nhà phát hành bắt chước trạng thái hoặc xác minh Registry quản lý.
- Bằng chứng giao thức, khả năng hoặc bộ mô tả thiếu hoặc sai dạng.
- Coi `serverInfo` tự khai là thẩm quyền không gian tên, xuất xứ, endpoint hoặc tiếp nhận.
- Cập nhật ghim bộ mô tả âm thầm sau sai lệch.
- Kích hoạt phiên bản ngừng khuyến nghị, xóa, không biết hoặc cách ly.
- Hoàn tác về đích không bằng chứng tiếp nhận đầy đủ.
- Bằng chứng sổ chứa bearer token, cookie, thông tin xác thực gói hoặc đối số công cụ không cần.

## Produce

Trả mục này:

1. Quyết định: `approve`, `reject` hoặc `quarantine`, với mã lý do ổn định.
2. Bằng chứng không gian tên: không gian tên xác minh, nguồn xác thực và so tên chính xác.
3. Ghim công bố: nguồn Registry, tên máy chủ, phiên bản chính xác, trạng thái, phiên bản lược đồ và bản băm bản ghi.
4. Ghim nguồn: tọa độ gói và vận chuyển hoặc URL từ xa và vận chuyển, tham chiếu kết quả sở hữu và bản băm bằng chứng nguồn.
5. Ghim runtime: phiên bản giao thức chấp nhận, khả năng bắt buộc, bản băm tập công cụ và `serverInfo` chẩn đoán tùy chọn.
6. Nối xuất xứ: trường chuẩn và bản băm xuất xứ kết quả.
7. Kết quả chính sách: mọi kiểm soát đạt, trượt và không áp dụng.
8. Sự kiện sổ: thứ tự, thời gian, sự kiện, kết quả, mã lý do, tham chiếu bằng chứng, hash trước và hash mục.
9. Kế hoạch đối soát: kiểm tra trạng thái, sản phẩm, khám phá, bộ mô tả và sức khỏe tiếp.
10. Kế hoạch hoàn tác: ghim trước đủ điều kiện, bước xác thực, đổi tuyến, cửa sổ sức khỏe và bằng chứng giữ.

Kết thúc bằng một sự thật thiếu làm đổi quyết định nhiều nhất. Nếu không sự thật bắt buộc nào thiếu, nêu kiểm tra sai lệch theo lịch tiếp.
