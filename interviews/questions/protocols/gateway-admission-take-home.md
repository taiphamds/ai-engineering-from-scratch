---
id: gateway-admission-take-home
title: Build the admission gate of an MCP gateway
card: protocols
kind: take-home
level: 4
roles: [agentic-ai-engineer, forward-deployed-ai-engineer]
rounds: [take-home, coding]
tags: [mcp, gateway, admission, pagination, x-mcp-header, take-home]
minutes: 60
lessons: [phases/13-tools-and-protocols/15-mcp-security-tool-poisoning, phases/13-tools-and-protocols/28-mcp-tool-contracts-and-content, phases/19-capstone-projects/13-mcp-server-with-registry]
manuals: []
practice: [tool-call-parser]
cheatsheet: [mcp-gateways-operations, mcp-security-auth]
related: [protocols/descriptor-pin-rug-pull, protocols/empty-cursor-stops-early, protocols/header-body-mismatch-order]
updated: 2026-11-03
---

Bài làm ở nhà. Xây dựng mô-đun tiếp nhận của một MCP gateway. Nó nhận các kết quả `tools/list` của nhiều server và tạo một tập được tiếp nhận, một tập bị từ chối và một dấu vết kiểm toán. Nó phải duyệt hết mọi danh sách qua phân trang, ghim từng descriptor, đặt tên đầy đủ trước khi gộp, từ chối một descriptor phản chiếu một tham số nhạy cảm vào một header hoặc đặt `x-mcp-header` ở bất kỳ đâu ngoài một thuộc tính trực tiếp cấp cao nhất, xác thực các kết quả có cấu trúc theo các schema đầu ra trên đường gọi, và phát ra các sự kiện kiểm toán header mang tên và không bao giờ mang giá trị. Mô tả thiết kế của bạn, các kiểm thử bạn cung cấp, và bằng chứng mà một người xem xét nên mong đợi.

## Short answer

Chạy năm cổng theo thứ tự và giữ chúng tách biệt. Khám phá bằng một vòng lặp cursor mờ chỉ dừng khi `nextCursor` vắng mặt hoặc `null`; tiếp nhận từng descriptor theo một digest chuẩn hóa của toàn bộ descriptor, một lần duyệt toàn cây schema cho `x-mcp-header`, và một chính sách tên nhạy cảm; đặt tên đầy đủ mọi công cụ thành `<server>.<tool>` trước khi gộp; và xác thực `structuredContent` theo schema đầu ra đã công bố trước khi bất cứ thứ gì đến mô hình. Các kiểm thử chứng minh rằng một descriptor bị từ chối không chặn các công cụ hợp lệ, rằng một cursor chuỗi trống tiếp tục, rằng một annotation dưới `oneOf`, `items` hoặc `$ref` bị từ chối, và rằng một `inputSchema` thay đổi không vượt qua ghim. Bằng chứng là trace các trang, các tập được tiếp nhận và bị từ chối, sổ digest và các sự kiện kiểm toán đã che dữ liệu.

## Full answer

### Modules

| Mô-đun | Trách nhiệm |
|---|---|
| `discover` | vòng lặp cursor mờ theo từng server; ghi lại mọi yêu cầu thành một trace các trang |
| `admit` | digest chuẩn hóa, duyệt schema, chính sách header, dây báo động bộ quét |
| `namespace` | tên đầy đủ, ánh xạ backend, chính sách va chạm |
| `consume` | xác thực đối số trước khi gọi, xác thực kết quả trước khi mô hình dùng |
| `audit` | tên header, các danh mục từ chối, digest; không có giá trị |

### Admission rules

1. Chuẩn hóa descriptor với các khóa được sắp xếp và các dấu phân cách gọn, băm nó, và lưu digest dưới tên đầy đủ với bằng chứng nhà phát hành và thời gian phê duyệt. Một khóa không xác định bị cách ly. Một digest thay đổi là một rug pull và bị cách ly cho đến khi được phê duyệt lại.
2. Duyệt toàn bộ cây `inputSchema`. `x-mcp-header` chỉ hợp lệ trên một thành viên trực tiếp của `inputSchema.properties`, với kiểu string, integer hoặc boolean, một tên header token không trống duy nhất không phân biệt hoa thường, và các giá trị số nguyên trong khoảng an toàn của JavaScript. Từ chối nó dưới một đối tượng lồng nhau, một nhánh `oneOf`, `items`, một đích `$ref` hoặc bất kỳ schema đầu ra nào.
3. Từ chối một descriptor có thuộc tính được phản chiếu tên là `password`, `secret`, `token`, `api_key` hoặc `authorization`.
4. Chạy bộ quét tĩnh cho tag vai trò, ghi đè chỉ dẫn, che giấu, truy cập bí mật và các đích bị làm mờ. Xem một lần phát hiện là bằng chứng để xem xét, không phải một phán quyết.
5. Một descriptor không có đối tượng schema đầu vào bị từ chối; một công cụ không có đối số khai báo `{"type": "object", "additionalProperties": false}`.
6. Lưu namespace nhà phát hành đã xác minh và danh tính `server/discover` trực tiếp cùng bản ghi đã phê duyệt. Ở một lần làm mới sau đó, cách ly một server có namespace hoặc danh tính trực tiếp khác, ngay cả khi mọi digest descriptor vẫn khớp.

### Namespacing and merge

Các tên đầy đủ là các tên gateway công khai. Ghi ánh xạ backend riêng. Sắp xếp trước khi gộp để thứ tự cục bộ không phụ thuộc vào thời điểm tiến trình. Không bao giờ để thứ tự discovery quyết định một va chạm.

### The invoke path

Xác thực các đối số trước lệnh gọi. Mã hóa các giá trị header được phản chiếu thành ASCII hiển thị thuần hoặc sentinel base64 UTF-8 chính xác. Xác thực `structuredContent` như bất kỳ giá trị JSON nào theo schema đầu ra, bao gồm các kết quả với `isError: true`. Kiểm toán tên header và quyết định mã hóa, không bao giờ kiểm toán giá trị.

### Tests to ship

- Một danh sách hai trang mà trang đầu trả về `""` làm cursor tạo ra hai yêu cầu.
- Một descriptor không an toàn bị từ chối và mọi descriptor hợp lệ trên cùng server được tiếp nhận.
- Một annotation dưới `oneOf`, `items`, một `properties` lồng nhau hoặc một định nghĩa `$ref` bị từ chối ngay cả khi nhánh đó không bao giờ được dùng.
- Thay đổi `inputSchema` mà không thay đổi mô tả không vượt qua ghim.
- Một descriptor không thay đổi phía sau một danh tính `server/discover` đã thay đổi bị cách ly.
- Hai server đều cung cấp `search` trở thành hai tên đầy đủ và hai digest.
- Một kết quả mảng vượt qua một schema đầu ra mảng và một đối tượng không vượt qua nó.
- Các sự kiện kiểm toán header chứa tên và không có giá trị, được kiểm tra bằng một kiểm thử tìm giá trị bằng grep.

### Evidence for the reviewer

Capstone chấm bằng chứng tiếp nhận: namespace nhà phát hành đã xác minh và danh tính `server/discover` trực tiếp, discovery phân trang xác định và hoàn chỉnh, xác thực descriptor trước khi cung cấp cho mô hình, đầu ra có cấu trúc đã xác thực, và metadata định tuyến giữ nguyên các ranh giới ủy quyền. Thu thập descriptor, trace các trang, tập được tiếp nhận, tập bị từ chối với một lý do cho từng descriptor, sổ digest và một kết quả đã xác thực. Không tuyên bố tương thích gateway chỉ từ một `tools/call` thành công.

## Follow-ups

- **Level 3:** Tại sao không dừng phân trang khi mảng `tools` của một trang trống? Expected: sự trống là lựa chọn của server; tiếp tục trong khi `nextCursor` hiện diện và không phải `null`.
- **Level 4:** Hai server trả về các descriptor giống hệt từng byte dưới các tên khác nhau. Sổ theo dõi giữ gì? Expected: hai khóa đầy đủ với hai digest; cùng digest dưới các khóa khác nhau là ổn, và một digest khác dưới cùng khóa là rug pull.
- **Level 4:** Bộ quét đánh dấu một câu cảnh báo hợp lệ trong một mô tả. Điều gì xảy ra? Expected: xem xét, không phải từ chối tự động; bộ quét là dây báo động và một người phê duyệt toàn bộ descriptor.
- **Level 4:** Một descriptor vượt qua mọi kiểm tra và đã bị đầu độc từ ngày đầu. Điều gì bắt được nó? Expected: không có gì tự động; thiết kế cần một hàng đợi xem xét trước lần ghim đầu tiên, vì hash bằng nhau chứng minh tính ổn định chứ không phải an toàn.

## Wrong answers

- "Băm mô tả; các schema hiếm khi thay đổi." Các thay đổi schema và annotation là rug pull; ghim toàn bộ descriptor chuẩn hóa.
- "Tin thứ tự xác định của server và bỏ qua sắp xếp." Thứ tự registry cục bộ không được phụ thuộc vào thời điểm khởi động tiến trình; sắp xếp trước khi bạn gộp.
- "Ghi nhật ký các giá trị header để gỡ lỗi dễ hơn." Một giá trị được phản chiếu có thể là dữ liệu định tuyến hoặc, trong một descriptor xấu, một bí mật; chỉ kiểm toán tên và các danh mục từ chối.

## Taught in

[Bài học về tool poisoning](../../../phases/13-tools-and-protocols/15-mcp-security-tool-poisoning/) cung cấp ghim và bộ quét, [bài học về hợp đồng công cụ](../../../phases/13-tools-and-protocols/28-mcp-tool-contracts-and-content/) cung cấp các quy tắc header và cursor, và [capstone](../../../phases/19-capstone-projects/13-mcp-server-with-registry/) nêu bằng chứng tiếp nhận.
