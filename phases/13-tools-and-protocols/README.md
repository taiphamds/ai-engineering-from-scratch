# Phase 13: Tools & Protocols

> Các giao diện giữa AI và thế giới thực.

Giai đoạn này đi từ các lời gọi hàm và schema công cụ sang các giao thức
có thể tương tác, Agent Skills, bảo mật và quản trị sản xuất. Thứ tự số
hữu ích để duyệt. Các lộ trình tập trung bên dưới là thứ tự học đáng tin cậy.

## Start this phase on GitHub

**Prerequisites:** Các API hoàn thành LLM của Giai đoạn 11. Với MCP hoặc Agent Skills, sử dụng
lộ trình tập trung bên dưới thay vì cho rằng thứ tự bài học theo số là thứ tự học.

**Bài học đầu tiên của toàn bộ giai đoạn:** [Giao diện công cụ](01-the-tool-interface/)

Chạy lệnh này từ thư mục gốc của kho mã:

```bash
python3 phases/13-tools-and-protocols/01-the-tool-interface/code/main.py
```

Giữ lệnh, mã thoát, trace mô tả-quyết định-thực thi-quan sát, bằng chứng đầu vào
bị từ chối và một câu giải thích giới hạn lượt.

**Hành động tiếp theo:** Tiếp tục đến [Tìm hiểu sâu về gọi hàm](02-function-calling-deep-dive/),
hoặc chọn lộ trình Model Context Protocol (MCP) hay Agent Skills bên dưới.

Duyệt [danh sách bài học Giai đoạn 13 đầy đủ](../../README.md#phase-13) hoặc
[lộ trình xuyên giai đoạn](../../ROADMAP.md).

## Model Context Protocol (MCP) path

Lộ trình MCP tập trung gồm 17 bài học và khoảng 23 giờ 15 phút. Nó đi theo
MCP `2026-07-28` từ một yêu cầu JSON-RPC tự mô tả đến một cổng
tuân thủ vận hành.

| Chặng | Các bài học | Bạn chứng minh điều gì | Thời gian |
|---|---|---|---:|
| Cốt lõi | [06](06-mcp-fundamentals/), [07](07-building-an-mcp-server/), [08](08-building-an-mcp-client/), [09](09-mcp-transports/), [10](10-mcp-resources-and-prompts/) | Phong bì, khám phá, hành vi client và máy chủ, phương thức truyền tải, tài nguyên và prompt. | 5 giờ 50 phút |
| Hai chiều | [11](11-mcp-sampling/), [12](12-mcp-roots-and-elicitation/), [13](13-mcp-async-tasks/), [14](14-mcp-apps/) | Đầu vào MRTR, phạm vi rõ ràng, tác vụ bền vững và ranh giới ứng dụng không có các yêu cầu do máy chủ khởi tạo. | 5 giờ |
| An toàn | [15](15-mcp-security-tool-poisoning/), [16](16-mcp-security-oauth-2-1/), [18](18-mcp-auth-production/), [17](17-mcp-gateways-and-registries/) | Các biện pháp phòng vệ đầu độc, cấp quyền, token sản xuất, định tuyến gateway và tiếp nhận registry. | 5 giờ 15 phút |
| Nâng cao | [28](28-mcp-tool-contracts-and-content/), [29](29-mcp-reliability-cancellation-and-flow-control/), [30](30-mcp-registry-supply-chain-and-drift/), [31](31-mcp-conformance-versioning-and-operations/) | Độ trung thực của hợp đồng, tranh chấp hủy, sự trôi dạt chuỗi cung ứng và bằng chứng phát hành. | 7 giờ 10 phút |

Thứ tự chính xác là 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 18, 17, 28,
29, 30, 31. Nó được định nghĩa trong
[`learning-paths/model-context-protocol.json`](../../learning-paths/model-context-protocol.json).
Gia sư tạo `MCP-LEARNING.md`, dạy một bài học cho mỗi
lần gọi và ghi lại yêu cầu, phản hồi, lệnh, thư mục làm việc, mã
thoát và bằng chứng ranh giới đã che dữ liệu được yêu cầu bởi mỗi điểm kiểm tra.

Bắt đầu với cách gọi được host của bạn hỗ trợ:

| Host | Cách gọi |
|---|---|
| Codex | `learn-mcp`, hoặc chọn nó từ `/skills` |
| Claude Code | `/learn-mcp` |
| Các host tương thích khác | `Use learn-mcp to start or resume the Model Context Protocol (MCP) path.` |

### Your first ten minutes

Từ thư mục gốc của kho mã, chạy bản ghi phi trạng thái của Bài 06:

```bash
python3 phases/13-tools-and-protocols/06-mcp-fundamentals/code/main.py
```

Tìm bốn điều trong đầu ra: siêu dữ liệu yêu cầu được lặp lại, một kết quả
`server/discover` hoàn tất, lỗi `-32022` cho một phiên bản không được hỗ trợ và một
lần đóng truyền tải không tạo hoặc kết thúc một phiên giao thức MCP.
Bản ghi đó là điểm kiểm tra đầu tiên, không chỉ là một bản demo.

Nếu kho mã hoặc Python 3 không khả dụng, đọc [Bài 06](06-mcp-fundamentals/)
và lần theo thủ công một yêu cầu và phản hồi. Đánh dấu điểm kiểm tra là khái niệm và
để bằng chứng runtime, truyền tải, cấp quyền và triển khai ở trạng thái chờ.

Hoàn thành điểm kiểm tra bảo mật thực thi được của Bài 15 trước bất kỳ việc bind không loopback,
đầu vào dùng chung, endpoint được lưu trữ hoặc xuất bản registry nào. Xem xét
đích bên ngoài và quyền được yêu cầu, rồi xác nhận hành động triển khai
một cách rõ ràng. Một hướng dẫn đã hoàn thành không cấp quyền triển khai.

Các luồng `initialize`, `Mcp-Session-Id`, SSE `GET` độc lập, `DELETE` phiên cũ hơn
và yêu cầu do máy chủ khởi tạo chỉ xuất hiện trong các ghi chú tương thích rõ ràng.
Các yêu cầu hiện đại khai báo phiên bản giao thức và khả năng client trong
`params._meta`, sử dụng `server/discover` và mang đủ thông tin để được
xác thực, cấp quyền, định tuyến và thử lại độc lập.

[Bài 23](23-capstone-tool-ecosystem/) là đồ án tổng kết lộ trình MCP
tùy chọn duy nhất. Hoàn thành 17 bài học bắt buộc cộng với [Bài 19](19-a2a-protocol/)
và [Bài 20](20-opentelemetry-genai/) trước khi bắt đầu nó.

## Agent Skills fast path

Lộ trình tập trung gồm năm bài học và khoảng 9 giờ 30 phút:

| Bước | Bài học | Kết quả | Thời gian |
|---:|---|---|---:|
| 1 | [22: Hợp đồng có tính di động và ranh giới runtime](22-skills-and-agent-sdks/) | Tạo, cài đặt, gọi, xác minh và loại bỏ một bundle skill hoàn chỉnh. | 90 phút |
| 2 | [24: Khám phá và tiết lộ dần](24-skill-discovery-and-progressive-disclosure/) | Lần theo việc khám phá, lập danh mục, kích hoạt và tải tài nguyên. | 105 phút |
| 3 | [25: Gọi và định tuyến](25-skill-invocation-and-routing/) | Kiểm soát các đường đi tường minh, ngầm định, con người, mô hình và từ chối. | 105 phút |
| 4 | [26: Quyền, sandbox và sự tin cậy](26-skill-permissions-sandboxes-and-trust/) | Tách biệt các chỉ dẫn, quyền, sự cô lập và xác minh. | 120 phút |
| 5 | [27: Đánh giá, đóng gói và tính di động](27-skill-evals-packaging-and-portability/) | Xây dựng một cổng phát hành và chứng minh hành vi trong các host thực. | 150 phút |

Bắt đầu với cách gọi được host của bạn hỗ trợ:

| Host | Cách gọi |
|---|---|
| Codex | `learn-agent-skills`, hoặc chọn nó từ `/skills` |
| Claude Code | `/learn-agent-skills` |
| Các host tương thích khác | `Use learn-agent-skills to start or resume the Agent Skills Engineering path.` |

Gia sư tạo hoặc tiếp tục `AGENT-SKILLS-LEARNING.md`, dạy một bài học cho mỗi
lần gọi và ghi lại bằng chứng được yêu cầu bởi mỗi điểm kiểm tra. Lộ trình được
định nghĩa trong
[`learning-paths/agent-skills.json`](../../learning-paths/agent-skills.json).

Nếu bạn thích đọc trước, bắt đầu với [Bài 22](22-skills-and-agent-sdks/).
Bài thực hành đầu tiên của nó đưa một skill vào một host thực trong khoảng mười phút.

### Prerequisite fast lane

- Với các bài thực hành thực, bạn cần `node`, `npx`, `python3`, một host được chọn
  có hỗ trợ skill và quyền ghi vào phạm vi skill của dự án hoặc người dùng
  đã chọn. Xác minh ba lệnh bằng `node --version`, `npx --version` và
  `python3 --version` trước khi cài đặt.
- Nếu việc kiểm tra trước đó không khả dụng, sử dụng trang web hoặc đọc từng `docs/en.md`
  một cách thủ công. Bạn có thể hoàn thành phần khái niệm, nhưng giữ bằng chứng khám phá,
  gọi, script, cập nhật và gỡ cài đặt được đánh dấu là chờ.
- Đọc lướt [Bài 01](01-the-tool-interface/) và [Bài 05](05-tool-schema-design/)
  nếu các hợp đồng công cụ còn mới với bạn.
- Trước Bài 26, xác nhận rằng bạn có thể giải thích việc đầu độc công cụ và các chỉ dẫn
  không đáng tin cậy. [Bài 15](15-mcp-security-tool-poisoning/) là phần ôn tập
  tùy chọn cho việc kiểm tra trước đó, không phải một bài học bắt buộc thứ sáu trong lộ trình này.
- [Bài 23](23-capstone-tool-ecosystem/) là một đồ án tổng kết hệ thống tùy chọn,
  không phải bài học Agent Skills tiếp theo sau 22. Hoàn thành các bài học từ 06 đến 20
  trước khi thực hiện nó.

## Full phase

Xem [ROADMAP.md](../../ROADMAP.md) để biết kế hoạch bài học đầy đủ.
