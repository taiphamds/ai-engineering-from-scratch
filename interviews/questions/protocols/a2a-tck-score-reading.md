---
id: a2a-tck-score-reading
title: How conformant is a server that scores 66.7 percent
card: protocols
kind: estimate
level: 4
roles: [agentic-ai-engineer, ai-evaluation-reliability-engineer, ai-developer-relations-engineer]
rounds: [ml-depth, design-review]
tags: [a2a, conformance, tck, testing, evidence]
minutes: 12
lessons: []
manuals: [a2a-101#s-conformance-testing, a2a-101#s-ref-errors]
practice: []
cheatsheet: [a2a]
related: [protocols/a2a-version-header-missing]
updated: 2026-11-03
---

Bạn chạy bộ kit kiểm tra tuân thủ A2A chính thức đối với server của mình hai lần. Lần chạy đầu đạt 32.3 phần trăm. Sau một thay đổi hai dòng đối với chính client JSON-RPC của kit, lần chạy thứ hai đạt 66.7 phần trăm: 62 PASS, 31 FAIL, 11 SKIPPED và 25 NOT TESTED trong số 129 yêu cầu. Quản lý hỏi server tuân thủ đến mức nào. Ước lượng con số thực và bảo vệ mọi điều chỉnh bạn thực hiện.

## Short answer

Không tỷ lệ nào đo riêng server. Lần chạy đầu mất 63 trong số 85 bản ghi JSON-RPC vì kit gửi post tới URL của card với một dấu gạch chéo cuối, đó là lỗi của kit. Trong lần chạy thứ hai, 21 lỗi là các lần bỏ qua bên trong thân kiểm thử mà kit ở tag ghi là FAIL, nên theo quy tắc nhánh chính, lần chạy được đọc là 62 PASS, 10 FAIL và 32 SKIPPED, hay 86.1 phần trăm, và trong mười lỗi đó có ba lỗi thuộc về server: các route push REST bị thiếu và, ở mức SHOULD, `Cache-Control` và `ETag` bị thiếu trên card.

## Full answer

### How the kit scores

Kit là một dự án pytest. Nó đọc card, xây dựng một client cho mỗi mục `supportedInterfaces`, và chạy mỗi kiểm thử trên từng binding được khai báo. Một kiểm thử MUST là một lỗi cứng, một kiểm thử SHOULD là một lỗi dự kiến, và một kiểm thử MAY được bỏ qua khi card thiếu capability. Các tỷ lệ chỉ tính PASS và FAIL. Cả 72 bản ghi gRPC được bỏ qua vì server không có giao diện gRPC, và điều đó là đúng, không phải một tổn thất.

### Run one: a kit defect

Đặc tả đặt giao diện tại `url`. Kit thêm một dấu gạch chéo, server trả lời 404, và 63 bản ghi thất bại vì một lý do. Sửa client của kit, không phải server, đã thay đổi điểm số.

### Run two: separate the failures

| Nhóm | Số lượng | Của ai |
|---|---|---|
| các lần bỏ qua bên trong thân kiểm thử, được ghi là FAIL tại tag | 21 | kit; `main` ghi chúng là SKIPPED |
| các yêu cầu push đạt trên HTTP+JSON và thất bại trên JSON-RPC | phần lớn số còn lại | kit gửi snake_case `task_id`, ở nơi đặc tả yêu cầu camelCase |
| các route push REST bị thiếu mặc dù card khai báo `pushNotifications` | 1 | server; mọi binding được khai báo phải cung cấp cùng các thao tác |
| thiếu `Cache-Control` và `ETag` trên card | 2 | server, ở mức SHOULD |

Sau khi sửa server, sáu bản ghi push HTTP+JSON đạt, và mỗi yêu cầu vẫn được đọc là FAIL vì phía JSON-RPC của nó.

### Where the kit departs from the specification

Kit mong đợi HTTP `409` cho `TaskNotCancelableError`, `415` cho `ContentTypeNotSupportedError`, `502` cho `InvalidAgentResponseError`, và gRPC `UNIMPLEMENTED` cho ba lỗi. Bảng chuẩn nói `400`, `400`, `500` và `FAILED_PRECONDITION`. Một server theo đặc tả thất bại ở các kiểm tra đó. Nó cũng đòi `application/json` trên REST ở nơi đặc tả nói nên dùng `application/a2a+json`, và nó khẳng định cứng các kiểm thử caching SHOULD và MAY.

### What the kit never tests

Năm hành vi chia rẽ các SDK không bao giờ chạy: động từ subscribe REST, phân trang vượt quá một lệnh gọi, một `append` tới một artifact không xác định, tác vụ của một bên gọi khác, và một `messageId` gửi lại. Tập NOT TESTED cũng bao gồm ủy quyền trong tác vụ, TLS, chữ ký card và header phiên bản của client. Những điều đó là phần bạn phải kiểm thử.

### The estimate

Hãy nói điều này: một lỗi MUST, đã tìm thấy và sửa; hai thiếu sót SHOULD về caching card; một cách đọc theo từng yêu cầu là 86.1 phần trăm theo quy tắc nhánh chính, với các lỗi còn lại có thể quy cho chính client của kit, và một danh sách tường minh các hành vi chưa được kiểm thử với các kiểm thử riêng của bạn bên cạnh chúng. Bàn giao `compatibility.json`, không phải tỷ lệ.

## Follow-ups

- **Level 3:** Tại sao các tỷ lệ bỏ các dòng SKIPPED và NOT TESTED? Expected: các dòng đó không mang phán quyết, nên một tỷ lệ trên chúng sẽ thưởng cho một card khai báo ít capability.
- **Level 4:** Các yêu cầu push đạt trên một binding và thất bại trên binding kia. Bạn phân loại điều đó như thế nào? Expected: một lỗi của kit, vì tên trường JSON phải là camelCase và kit gửi `task_id`; giữ yêu cầu là đạt trong sổ theo dõi riêng của bạn với bằng chứng.
- **Level 4:** Một lỗi thực sự đã dạy điều gì về card? Expected: một cờ capability là một lời hứa cho mọi binding được khai báo, nên phía REST cần bốn route push mà card đã quảng bá.
- **Level 4:** Bạn thêm những kiểm tra nào mà kit thiếu? Expected: giới hạn tác vụ theo chủ sở hữu, một `messageId` gửi lại, `append` tới một artifact không xác định, động từ subscribe REST, và phân trang bằng token được trả về.

## Wrong answers

- "Báo cáo tỷ lệ thứ hai là con số tuân thủ." Nó tính các lần bỏ qua của kit là lỗi và các tham số snake_case của kit là lỗi của bạn.
- "Báo cáo tuân thủ đầy đủ sau khi sửa các route bị thiếu." Hai thiếu sót SHOULD vẫn còn, và một phần tư các yêu cầu chưa bao giờ được kiểm thử.
- "Kit là đặc tả." Nó khác bảng lỗi chuẩn ở sáu chỗ; đặc tả thắng, và chính README của kit gọi SHOULD là một lỗi dự kiến.

## Taught in

[Phần kiểm thử tuân thủ](../../../manuals/a2a-101/sections/7-3-conformance-testing.md) ghi lại cả hai lần chạy, và [tham chiếu lỗi](../../../manuals/a2a-101/sections/r-4-errors.md) đặt bảng trạng thái của kit cạnh bảng chuẩn.
