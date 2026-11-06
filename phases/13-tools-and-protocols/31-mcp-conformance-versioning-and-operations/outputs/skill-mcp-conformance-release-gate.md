---
name: mcp-conformance-release-gate
description: Build an MCP conformance matrix and evidence-backed promote, hold, or rollback decision.
version: 1.0.0
phase: 13
lesson: 31
tags: [mcp, conformance, versioning, transcripts, proxy, operations]
---

Với một thay đổi client, máy chủ, gateway, SDK hoặc phương thức truyền tải MCP, tạo một bộ kiểm thử tuân thủ ở cấp dữ liệu truyền và một quyết định phát hành với bằng chứng đã che dữ liệu.

## Required inputs

- Các phiên bản giao thức hiện đại và cũ được hỗ trợ cùng chính sách cho mỗi đích triển khai.
- Các điểm ghi lại yêu cầu và phản hồi thô trước khi SDK giải mã.
- Các header HTTP phản chiếu, body JSON-RPC, trạng thái, kiểu nội dung và cấu trúc liên kết trung gian.
- Các khả năng client, máy chủ và phần mở rộng đã công bố.
- Tên, phiên bản, giá trị chuẩn hóa và ngoại lệ của SDK.
- Các ngưỡng tình trạng hoạt động, cửa sổ canary, số mẫu tối thiểu và các phép đo đường cơ sở.
- Phiên bản khôi phục chính xác, digest bằng chứng tiếp nhận, các ghim SHA-256 của sản phẩm và bộ mô tả, trạng thái Registry, tình trạng hoạt động hiện tại, các bên ký phát hành đáng tin cậy và một chứng thực trên toàn bộ payload khôi phục.
- Chính sách che dữ liệu, lưu giữ và truy cập bằng chứng.

## Procedure

1. Xác định các thời kỳ giao thức rõ ràng. Yêu cầu các khóa `io.modelcontextprotocol/protocolVersion` và `io.modelcontextprotocol/clientCapabilities` chính xác trong nhánh hiện đại. Đặt hành vi thời kỳ khởi tạo đến `2025-11-25` trong một bộ điều hợp cũ riêng biệt.
2. Chọn chính sách nghiêm ngặt hoặc dự phòng có giới hạn cho từng đích. Một `server/discover` thành công hoặc lỗi hiện đại đã nhận diện chứng minh nhánh hiện đại. Hết thời gian chờ hoặc phản hồi rỗng không chứng minh điều gì. Chỉ cho phép một lần thăm dò cũ đối với một endpoint được cấu hình hoặc đưa vào danh sách cho phép, rồi chỉ chọn kiểu cũ sau khi xác thực một kết quả `initialize` khẳng định cho bản sửa đổi cũ đã ghim. Không bao giờ hạ cấp sau `-32020`, `-32021` hoặc `-32022`.
3. Tạo các bản ghi chuẩn cho các yêu cầu được chấp nhận, kết quả hợp lệ dành riêng cho phương thức, kết quả phần mở rộng đã công bố, hành vi cũ được chọn và bất biến không phản hồi thông báo.
4. Tạo các bản ghi âm tính cho các phong bì sai định dạng, phiên bản phản hồi hoặc ID không khớp, tính loại trừ của kết quả và lỗi, lỗi sai định dạng, ánh xạ HTTP không đúng, thiếu siêu dữ liệu, header và body không khớp, thiếu phản hồi lỗi máy chủ, phiên bản không được hỗ trợ, thiếu `resultType` hiện đại, payload phương thức sai định dạng, kiểu kết quả không xác định hoặc chưa được công bố và các phản hồi thông báo bị cấm. Bất cứ khi nào xác thực cục bộ quan sát thấy `HeaderMismatch`, tự động yêu cầu và xác thực cấu trúc phản hồi JSON-RPC HTTP 400 `-32020` thực tế. Một ngoại lệ cục bộ đơn lẻ không bao giờ làm trường hợp đó đạt.
5. Xác thực các kiểu siêu dữ liệu JSON-RPC trước tiên. Khớp tên header HTTP không phân biệt chữ hoa chữ thường, từ chối các bản trùng lặp xung đột, giải mã dấu hiệu Base64 chính xác cho các giá trị `Mcp-Name` không an toàn, rồi so sánh `MCP-Protocol-Version`, `Mcp-Method` và các giá trị `Mcp-Name` áp dụng với body trước khi kiểm tra hỗ trợ cho giá trị khớp. Coi khoảng trắng đầu hoặc cuối là không an toàn và từ chối nó khi được gửi ở dạng thô, ngay cả khi nó bằng giá trị body.
6. Chấp nhận các kết quả hiện đại đã biết `complete` và `input_required`. Chỉ chấp nhận một trường phân biệt phần mở rộng khi khả năng của nó đã được công bố. Từ chối mọi `resultType` không xác định hoặc chưa được công bố. Sau đó xác thực payload phương thức, bao gồm các bộ mô tả công cụ đầy đủ cho `tools/list`, các trường vòng đời bắt buộc cho một kết quả tác vụ và một đối tượng hoàn thành với các giá trị chuỗi có giới hạn cho `completion/complete`.
7. Giữ các trường kết quả bổ sung và `_meta` thô trong bằng chứng. Quyết định rõ ràng liệu mỗi thành phần có thể bỏ qua chúng hay phải chuyển tiếp chúng.
8. Chạy mọi bản ghi rủi ro cao qua mỗi SDK được phân phối. So sánh ngữ nghĩa dữ liệu truyền thô với giá trị trả về chuẩn hóa và báo cáo mọi trường được tổng hợp, đưa lên, loại bỏ hoặc thay đổi.
9. Thực thi bộ kiểm thử trực tiếp và qua mọi trung gian trong sản xuất. Ghi lại bằng chứng đầu vào, nguồn và đầu ra đã che dữ liệu. Phát hiện việc gộp trạng thái, viết lại body JSON-RPC, header định tuyến không khớp, lưu đệm và các thay đổi thương lượng nội dung.
10. Áp dụng che dữ liệu trước khi tuần tự hóa, băm, ghi log hoặc tải lên. Chuyển tên trường và header về cùng kiểu chữ và loại bỏ các dấu phân cách để các biến thể camelCase, có gạch nối, có gạch dưới và có dấu chấm chia sẻ danh sách từ chối, rồi loại bỏ thông tin xác thực như `Authorization`, `Set-Cookie`, `X-Api-Key`, `accessToken`, `clientSecret` và `registrationAccessToken` cộng với các đối số nhạy cảm dành riêng cho phương thức. Băm bundle bằng chứng đã che dữ liệu.
11. Đánh giá ứng viên đối với bằng chứng bản ghi mang tính xác định, so sánh khác biệt SDK và proxy không rỗng cộng với một cửa sổ tình trạng hoạt động đã khai báo trước có số mẫu tối thiểu dương. Yêu cầu các digest bằng chứng hợp lệ từ mọi nguồn. Một ranh giới bị bỏ qua là một cổng thất bại, không phải một danh sách rỗng đạt.
12. Xác minh một đích khôi phục chính xác đã được tiếp nhận, được ghim, đang hoạt động và hoạt động tốt trước khi đưa lên. Xác thực các kiểu trường và digest SHA-256 chính xác, rồi xác minh chứng thực của nó bằng mật mã đối với một danh tính bộ điều khiển phát hành đáng tin cậy. Chỉ đưa lên khi bằng chứng tuân thủ, SDK, proxy, tình trạng hoạt động và sự sẵn sàng khôi phục đạt. Khi ứng viên thất bại, chỉ khôi phục về đích đã xác minh đó. Nếu không thì giữ lại.

## Required matrix

Với mỗi trường hợp, báo cáo:

- tên trường hợp ổn định và bất biến mang tính quy phạm
- thời kỳ giao thức và bằng chứng lựa chọn
- các phiên bản client, máy chủ, SDK, proxy và bản dựng
- trạng thái, dạng phản hồi, kiểu kết quả hoặc mã lỗi được mong đợi
- các digest bằng chứng đầu vào, nguồn và đầu ra được quan sát
- các khác biệt chuẩn hóa SDK
- đạt hoặc không đạt tại mỗi ranh giới
- phiên bản chính sách che dữ liệu
- mã lý do cuối cùng

Tối thiểu bao gồm các trường hợp này:

- khám phá hoặc lời gọi phương thức hiện đại chuẩn
- kết quả hoàn tất đã biết chuẩn với một trường bổ sung
- kiểu cũ chuẩn thiếu `resultType` trong thời kỳ cũ được chọn
- kết quả phần mở rộng đã công bố chuẩn
- kết quả `completion/complete` hợp lệ chuẩn
- thông báo chuẩn không có phản hồi JSON-RPC
- header và body không khớp âm tính
- thiếu khả năng âm tính
- phiên bản khớp không được hỗ trợ âm tính
- thiếu `resultType` hiện đại âm tính
- `resultType` không xác định hoặc chưa được công bố âm tính
- phép biến đổi trạng thái hoặc body proxy âm tính
- mất trường ngữ nghĩa SDK âm tính
- kết quả `completion/complete` sai định dạng âm tính

## Hard rejects

- Tuyên bố tuân thủ từ các giá trị trả về SDK mà không có bằng chứng dữ liệu truyền thô.
- Một bộ phân tích âm thầm chấp nhận cả dạng hiện đại và cũ.
- Cơ chế dự phòng cũ sau một lỗi hiện đại đã nhận diện.
- Cơ chế dự phòng cũ chỉ dựa trên hết thời gian chờ, sự im lặng, đóng kết nối hoặc một phản hồi không nhận diện được.
- Cho một trường hợp yêu cầu âm tính đạt mà không ghi lại và xác thực phản hồi lỗi của máy chủ.
- Biến bằng chứng JSON-RPC HTTP 400 `-32020` thành tùy chọn sau khi phát hiện `HeaderMismatch` cục bộ.
- Suy ra hoàn tất cho một `resultType` bị thiếu trước khi chọn một thời kỳ cũ.
- Coi một trường phân biệt không xác định là hoàn tất.
- Từ chối mọi trường không xác định được bổ sung mà không có lý do trường dành riêng.
- Gửi bất kỳ phản hồi JSON-RPC nào cho một thông báo.
- Chấp nhận một `resultType` đã biết mà không xác thực payload dành riêng cho phương thức.
- Cấp quyền cho các header phản chiếu mà không kiểm tra tính bằng nhau với body.
- Coi tên trường HTTP là phân biệt chữ hoa chữ thường hoặc so sánh một `Mcp-Name` đã mã hóa mà không giải mã dấu hiệu chính xác.
- Chấp nhận một `Mcp-Name` thô có khoảng trắng đầu hoặc cuối thay vì yêu cầu mã hóa bằng dấu hiệu.
- Chấp nhận một kết quả hoàn thành mà không có đối tượng hoàn thành với các giá trị chuỗi có giới hạn hợp lệ.
- Coi một lỗi 500 do proxy tạo ra là tương đương với một lỗi giao thức nguồn.
- Ghi bearer token, cookie, bí mật hoặc các đối số nhạy cảm vào bằng chứng.
- Sử dụng chuẩn hóa che dữ liệu cho phép các biến thể camelCase hoặc dấu phân cách vượt qua danh sách từ chối thông tin xác thực chuẩn.
- Tuyên bố một canary không có mẫu là hoạt động tốt.
- Coi bằng chứng bản ghi, SDK hoặc proxy rỗng là một ranh giới đạt.
- Coi các chuỗi có giá trị đúng hoặc một từ điển khôi phục chưa xác thực là bằng chứng đã xác minh.
- Khôi phục về một phiên bản mà không có bằng chứng tiếp nhận, ghim, trạng thái và tình trạng hoạt động chính xác.
- Đưa một ứng viên sản xuất lên trước khi chứng minh một đích khôi phục hoạt động tốt.

## Produce

Trả về các phần này:

1. Chính sách thời kỳ: bằng chứng hiện đại, các đích nghiêm ngặt, các tác nhân kích hoạt dự phòng có giới hạn và các tín hiệu hạ cấp bị cấm.
2. Ma trận bản ghi: các trường hợp chuẩn và âm tính với các kết quả dữ liệu truyền được mong đợi.
3. Tương thích kết quả: các trường phân biệt cốt lõi, phần mở rộng đã công bố, chính sách trường bổ sung và ranh giới suy luận cũ.
4. So sánh khác biệt SDK: các digest thô và chuẩn hóa cộng với các trường được đưa lên, loại bỏ, tổng hợp và thay đổi.
5. Bằng chứng proxy: các kết quả đầu vào, nguồn và đầu ra với chặng thất bại chính xác.
6. Báo cáo che dữ liệu: phiên bản chính sách, các lớp trường bị loại bỏ và digest bằng chứng đã che dữ liệu.
7. Cửa sổ tình trạng hoạt động: các mẫu, tỷ lệ lỗi, độ trễ, mức bão hòa, thời lượng, ngưỡng và so sánh đường cơ sở.
8. Bằng chứng khôi phục: đích chính xác, digest tiếp nhận, các ghim, trạng thái Registry, tình trạng hoạt động, danh tính bên ký, chứng thực đã xác minh và kế hoạch khôi phục tuyến.
9. Quyết định: `promote`, `hold` hoặc `rollback`, với các mã lý do ổn định và digest bằng chứng đầy đủ.

Kết thúc bằng ranh giới thất bại đầu tiên. Nếu tất cả các ranh giới đều đạt, nêu điều kiện hoàn tất canary cho phép đưa lên đầy đủ.
