# Lesson 13 - Stateless MCP Server (TypeScript)

Nửa TypeScript của bài tổng kết. Phía Python (`code/main.py`) cung cấp
registry và cổng chính sách; dự án này là cơ chế truyền tải MCP: được viết thủ công
JSON-RPC 2.0 phân cách bằng dòng mới trên stdio với ba công cụ sự cố giả lập. Nó
triển khai MCP `2026-07-28` trực tiếp, không có `@modelcontextprotocol/sdk`, để
bạn có thể kiểm tra mọi byte trên đường truyền.

Giao thức là phi trạng thái mặc dù kho sự cố giả lập lưu bền vững dữ liệu.
Mỗi yêu cầu lặp lại phiên bản giao thức và khả năng máy khách của nó trong
`params._meta`; không có kết nối, tiến trình, hoặc yêu cầu trước đó nào thiết lập một
phiên. Máy chủ cung cấp `server/discover` bắt buộc, xác định danh tính của mình trong
mọi kết quả thành công, và công bố các danh sách công cụ tất định, có thể lưu đệm.
`tools/call` xác thực các đối số theo cùng các lược đồ có giới hạn được trả về bởi
`tools/list`; các đối số sai định dạng cho một công cụ đã biết trả về một kết quả công cụ hoàn chỉnh
với `isError: true` và không bao giờ đến bộ thực thi của nó.

Danh tính runtime là `com.example/internal-incidents`. Nó sử dụng không gian tên DNS đảo ngược
cho nhà phát hành `example.com` đã xác minh. Một
`server.json` được công bố tương ứng phải sử dụng cùng tên đó mặc dù gói npm cục bộ có
tên dự án riêng của nó.

## Layout

```text
src/
  index.ts      entry: fixture demo (default) or stdio loop (--serve)
  transport.ts  stdin readline + fixture replay
  protocol.ts   request validation / server/discover / tools/list / tools/call
  tools.ts      three incident tools + executors
  types.ts      JSON-RPC + tool shapes
tests/
  protocol.test.ts  stateless metadata, discovery, tools, errors, roundtrip
```

## Run

```bash
npm install
npm run typecheck
npm test
npm start            # self-terminating fixture demo
npm run serve        # real stdio loop (waits on stdin)
```

Demo tự kết thúc. Máy chủ stdio thực vẫn hoạt động cho đến khi luồng đầu vào của nó
đóng; không có yêu cầu tắt MCP hoặc bắt tay khởi tạo.
