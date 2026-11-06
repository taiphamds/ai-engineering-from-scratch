# The Tool Interface — Why Agents Need Structured I/O

> Mô hình ngôn ngữ tạo token. Chương trình thực hiện hành động. Khoảng cách giữa hai thứ đó là giao diện công cụ: một hợp đồng cho phép mô hình yêu cầu hành động và host thực thi nó. Mọi ngăn xếp năm 2026 — function calling trên OpenAI, Anthropic và Gemini; `tools/call` của MCP; các phần tác vụ của A2A — là cách mã hóa khác nhau của cùng vòng lặp bốn bước. Bài học này đặt tên vòng lặp và cho thấy bộ máy tối thiểu để chạy nó.

**Type:** Learn
**Languages:** Python (stdlib, no LLM)
**Prerequisites:** Phase 11 (LLM completion APIs)
**Time:** ~45 minutes

## Learning Objectives

- Giải thích tại sao LLM chỉ có thể tạo văn bản không thể tự mình thực hiện hành động với thế giới thực.
- Vẽ vòng lặp gọi công cụ bốn bước (mô tả → quyết định → thực thi → quan sát) và nêu ai phụ trách mỗi bước.
- Viết mô tả công cụ thành ba phần: tên, đầu vào JSON Schema và hàm thực thi tất định.
- Phân biệt công cụ thuần và công cụ có tác dụng phụ, nêu tại sao sự phân chia này quan trọng với an toàn.

## The Problem

LLM phát ra phân phối xác suất trên token tiếp theo. Đó là toàn bộ bề mặt đầu ra. Nếu bạn hỏi mô hình chat "thời tiết ở Bengaluru lúc này thế nào", nó có thể viết câu có vẻ hợp lý, nhưng không thể kết nối vào API thời tiết. Câu có thể đúng do trùng hợp hoặc cũ ba ngày.

Thu hẹp khoảng cách đó là mục đích của giao diện công cụ. Chương trình host — runtime agent của bạn, Claude Desktop, ChatGPT, Cursor hoặc script tùy chỉnh — công bố danh sách công cụ có thể gọi cho mô hình. Khi quyết định cần hành động, mô hình phát payload có cấu trúc nêu công cụ và đối số. Host phân tích payload đó, thực sự chạy công cụ và đưa kết quả trở lại. Vòng lặp tiếp tục đến khi mô hình quyết định không cần gọi nữa.

Phiên bản đầu tiên của hợp đồng này được phát hành tháng 6 năm 2023 dưới dạng tham số "functions" của OpenAI. Anthropic theo sau với khối `tool_use` trong Claude 2.1. Gemini thêm `functionDeclarations` vài tháng sau. Mọi nhà cung cấp hiện đưa ra cùng hình dạng: danh sách công cụ định kiểu bằng JSON Schema đi vào, lời gọi công cụ payload JSON đi ra. Model Context Protocol (tháng 11 năm 2024) khái quát hợp đồng để một sổ đăng ký công cụ phục vụ mọi mô hình. A2A (tháng 4 năm 2026, v1.0) xếp lớp cùng thành phần cơ bản cho ủy nhiệm agent-sang-agent.

Vòng lặp bốn bước là bất biến bên dưới tất cả những thứ này. Mọi thứ khác trong Giai đoạn 13 là phần triển khai chi tiết.

## The Concept

### Step one: describe

Host khai báo mỗi công cụ bằng ba trường.

- **Tên.** Định danh ổn định, máy đọc được. `get_weather`, không phải "thứ thời tiết".
- **Mô tả.** Bản hướng dẫn ngôn ngữ tự nhiên một đoạn. "Dùng khi người dùng hỏi về điều kiện hiện tại của một thành phố cụ thể. Không dùng cho dữ liệu lịch sử."
- **Lược đồ đầu vào.** Đối tượng JSON Schema (bản thảo 2020-12) mô tả đối số công cụ.

Mô hình nhận danh sách. Các nhà cung cấp hiện đại tuần tự hóa những khai báo này vào system prompt bằng mẫu riêng cho nhà cung cấp, nên bạn với tư cách bên gọi chỉ xử lý dạng có cấu trúc.

### Step two: decide

Với thông điệp người dùng và các công cụ sẵn có, mô hình chọn một trong ba hành vi.

1. **Trả lời trực tiếp** bằng văn bản. Không gọi công cụ.
2. **Gọi một hoặc nhiều công cụ.** Phát đối tượng lời gọi có cấu trúc. Với `parallel_tool_calls: true` (mặc định trên OpenAI và Gemini, bật tùy chọn trên Anthropic), mô hình có thể phát nhiều lời gọi trong một lượt.
3. **Từ chối.** Đầu ra có cấu trúc ở chế độ nghiêm ngặt có thể tạo khối `refusal` có kiểu thay vì lời gọi.

Payload lời gọi công cụ có ba trường ổn định: `id` lời gọi, `name` công cụ và đối tượng JSON `arguments`. Id tồn tại để host liên hệ kết quả sau đó với lời gọi cụ thể, điều quan trọng khi các lời gọi song song trả về không đúng thứ tự.

### Step three: execute

Host nhận lời gọi, xác thực đối số theo lược đồ đã khai báo và chạy bộ thực thi. Đối số không hợp lệ nghĩa là mô hình bịa ra trường hoặc dùng sai kiểu — dạng lỗi rất phổ biến trên mô hình yếu. Host sản xuất làm một trong ba việc khi đối số không hợp lệ: thất bại sớm và đưa lỗi cho mô hình, sửa JSON bằng bộ phân tích có ràng buộc, hoặc thử lại mô hình với lỗi xác thực được đưa vào prompt.

Bản thân bộ thực thi là mã thông thường. Python, TypeScript, lệnh shell, truy vấn cơ sở dữ liệu. Nó tạo kết quả, thường là chuỗi nhưng có thể là bất kỳ giá trị JSON hoặc khối nội dung có cấu trúc nào (văn bản, ảnh hoặc tham chiếu tài nguyên trong MCP). Kết quả phải tuần tự hóa được.

### Step four: observe

Host nối kết quả công cụ vào hội thoại (dưới dạng thông điệp vai trò `tool` với `id` khớp) và gọi lại mô hình. Mô hình giờ có đầu ra công cụ trong ngữ cảnh và có thể tạo câu trả lời cuối hoặc yêu cầu gọi thêm. Việc này tiếp tục đến khi mô hình ngừng phát lời gọi hoặc host chạm giới hạn an toàn về số vòng lặp.

### The trust split

Công cụ có hai loại quan trọng với an toàn.

- **Thuần.** Chỉ đọc, tất định, không tác dụng phụ. `get_weather`, `search_docs`, `get_current_time`. An toàn để gọi suy đoán.
- **Có hệ quả.** Thay đổi trạng thái, tiêu tiền, chạm đến dữ liệu người dùng. `send_email`, `delete_file`, `execute_trade`. Phải có cổng kiểm soát.

"Quy tắc Hai" năm 2026 của Meta cho bảo mật agent nói rằng một lượt chỉ được kết hợp tối đa hai trong số: đầu vào không đáng tin cậy, dữ liệu nhạy cảm, hành động có hệ quả. Giao diện công cụ là nơi bạn thực thi quy tắc đó — bằng cách từ chối lời gọi, yêu cầu người dùng xác nhận hoặc nâng phạm vi quyền. Xem Giai đoạn 13 · 15 để có chương bảo mật đầy đủ và Giai đoạn 14 · 09 để có chính sách quyền cấp agent.

### Where the loop lives

| Ngữ cảnh | Ai mô tả | Ai quyết định | Ai thực thi |
|---------|---------------|-------------|--------------|
| Function calling một lượt (OpenAI/Anthropic/Gemini) | Nhà phát triển ứng dụng | LLM | Nhà phát triển ứng dụng |
| MCP | Máy chủ MCP | LLM qua client MCP | Máy chủ MCP |
| A2A | Bên công bố Agent Card | Agent gọi | Agent được gọi |
| Trình duyệt web (agent function calling) | Tiện ích trình duyệt / WebMCP | LLM | Runtime trình duyệt |

Ở mọi nơi, cùng bốn bước. Tên cột thay đổi; cấu trúc không thay đổi.

### Why not just prompt the model to emit JSON?

"Yêu cầu mô hình trả lời bằng JSON" là mẫu trước function calling. Nó thất bại ~5 đến 15 phần trăm số lần trên mô hình tiên tiến nhất và nhiều hơn hẳn trên mô hình nhỏ hơn. Dạng lỗi gồm thiếu dấu ngoặc nhọn, dấu phẩy cuối, trường bịa ra và sai kiểu. Khi đó bạn cần lượt sửa JSON, thử lại hoặc bộ giải mã có ràng buộc.

Function calling nguyên bản tốt hơn vì ba lý do. Thứ nhất, nhà cung cấp huấn luyện mô hình đầu cuối trên đúng hình dạng lời gọi, nên tỷ lệ JSON hợp lệ tăng lên 98 đến 99 phần trăm ở chế độ nghiêm ngặt. Thứ hai, payload lời gọi nằm trong khe giao thức riêng, không bên trong văn bản tự do — nên lời gọi công cụ không bao giờ lọt vào câu trả lời hiển thị cho người dùng. Thứ ba, nhà cung cấp bắt buộc tuân thủ lược đồ bằng giải mã có ràng buộc (chế độ nghiêm ngặt của OpenAI, `tool_use` của Anthropic, `responseSchema` của Gemini). Đầu ra được bảo đảm xác thực thành công.

Giai đoạn 13 · 02 đi qua ba API nhà cung cấp cạnh nhau. Giai đoạn 13 · 04 đi sâu về đầu ra có cấu trúc.

### Circuit breakers

Vòng lặp kết thúc khi mô hình ngừng phát lời gọi hoặc host chạm số lượt tối đa. Host sản xuất đặt mức này từ 5 đến 20 lượt. Vượt mức đó, gần như chắc chắn bạn đang trong vòng lặp mà mô hình không thể thoát. Claude Code mặc định 20; OpenAI Assistants 10; chế độ agent của Cursor 25.

Phương án còn lại — vòng lặp không giới hạn — xuất hiện mỗi sáu tháng trong các báo cáo hậu kiểm "agent tiêu $400 cho lời gọi API qua một đêm". Không phát hành khi không có giới hạn.

Giai đoạn 14 · 12 đề cập sâu phục hồi lỗi và tự chữa lành; Giai đoạn 17 đề cập giới hạn tốc độ trong sản xuất.

### Where Phase 13 goes from here

- Bài 02 đến 05 hoàn thiện bề mặt gọi công cụ cấp nhà cung cấp.
- Bài 06 đến 14 khái quát vòng lặp thành MCP.
- Bài 15 đến 18 bảo vệ vòng lặp trước máy chủ thù địch, người dùng đối kháng và bề mặt xác thực từ xa chưa được xác thực.
- Bài 19 đến 22 mở rộng mẫu sang cộng tác agent-sang-agent, khả năng quan sát, định tuyến và đóng gói.
- Bài 23 cung cấp hệ sinh thái hoàn chỉnh sử dụng mọi thành phần cơ bản.

Mỗi bài còn lại là phần triển khai chi tiết của vòng lặp bốn bước này. Giữ nó trong đầu như bất biến.

```figure
tp-tool-loop
```

## Use It

`code/main.py` chạy vòng lặp bốn bước không có LLM. Hàm "quyết định" giả mô phỏng mô hình bằng khớp mẫu thông điệp người dùng; bộ thực thi, bộ xác thực lược đồ và bộ khung bước quan sát là thật. Chạy nó để thấy toàn bộ cách phối hợp yêu cầu/phản hồi với trạng thái trung gian in được, rồi thay bộ quyết định giả bằng bất kỳ nhà cung cấp thật nào ở bài sau.

Những gì cần xem:

- Sổ đăng ký công cụ giữ ba trường mỗi công cụ: tên, mô tả, lược đồ và tham chiếu bộ thực thi.
- Bộ xác thực là tập con JSON Schema tối thiểu (kiểu, required, enum, min/max) chỉ viết bằng stdlib. Giai đoạn 13 · 04 cung cấp bản đầy đủ hơn.
- Vòng lặp giới hạn số vòng ở năm. Agent sản xuất cần đúng loại bộ ngắt mạch này.

## Ship It

Bài học này tạo ra `outputs/skill-tool-interface-reviewer.md`. Với bản nháp định nghĩa công cụ (tên + mô tả + lược đồ + phác thảo bộ thực thi), skill kiểm tra độ phù hợp vòng lặp: tên có ổn định với máy, mô tả có là hướng dẫn sử dụng đầy đủ, lược đồ có dùng đúng JSON Schema 2020-12 và phân loại thuần-so-với-có-hệ-quả có tường minh không.

## Exercises

1. Thêm công cụ thứ tư vào `code/main.py` tên `get_stock_price(ticker)`. Viết mô tả là "Dùng khi người dùng hỏi giá cổ phiếu hiện tại theo mã. Không dùng cho giá lịch sử hoặc tóm tắt thị trường." Chạy bộ khung và xác nhận bộ quyết định giả định tuyến truy vấn nhắc mã cổ phiếu đến công cụ mới.

2. Phá bộ xác thực lược đồ. Truyền lời gọi có đối tượng `arguments` thiếu trường bắt buộc và xác nhận host từ chối trước khi thực thi. Sau đó truyền lời gọi có thêm trường không biết. Quyết định: host nên từ chối hay bỏ qua? Biện minh lựa chọn bằng lập luận an toàn.

3. Phân loại mỗi công cụ trong bộ khung là thuần hoặc có hệ quả. Thêm cờ `consequential: true` vào mục đăng ký cần nó và đổi vòng lặp để in dòng "sẽ xác nhận với người dùng" mỗi khi công cụ có hệ quả được chọn. Đây là hình dạng cổng xác nhận mà mọi host sản xuất cần.

4. Vẽ vòng lặp bốn bước lên giấy với bảng cột nhà cung cấp phía trên được điền cho client yêu thích của bạn (Claude Desktop, Cursor, ChatGPT hoặc ngăn xếp tùy chỉnh). Tham chiếu chéo với biến thể riêng cho MCP ở Giai đoạn 13 · 06.

5. Đọc hướng dẫn function calling của OpenAI từ đầu đến cuối. Xác định một trường nằm trong yêu cầu nhưng không trong vòng lặp bốn bước trình bày ở đây. Giải thích nó thêm gì và tại sao nó tiện lợi thay vì thiết yếu.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|----------------|------------------------|
| Tool (Công cụ) | "Thứ mô hình có thể gọi" | Bộ ba tên + đầu vào định kiểu bằng JSON Schema + hàm thực thi |
| Function calling (Gọi hàm) | "Sử dụng công cụ nguyên bản" | Hỗ trợ API cấp nhà cung cấp để phát lời gọi công cụ có cấu trúc thay vì văn xuôi |
| Tool call (Lời gọi công cụ) | "Yêu cầu hành động của mô hình" | Payload JSON có `id`, `name`, `arguments` do mô hình phát |
| Tool result (Kết quả công cụ) | "Công cụ đã trả gì" | Đầu ra bộ thực thi, bọc trong thông điệp vai trò `tool` với id khớp |
| Parallel tool calls (Lời gọi công cụ song song) | "Nhiều lời gọi cùng lúc" | Nhiều đối tượng lời gọi trong một lượt mô hình, độc lập và sắp thứ tự được theo id |
| Strict mode (Chế độ nghiêm ngặt) | "JSON được bảo đảm" | Giải mã có ràng buộc buộc đầu ra mô hình xác thực theo lược đồ khai báo |
| Pure tool (Công cụ thuần) | "Công cụ chỉ đọc" | Không tác dụng phụ; an toàn để chạy lại |
| Consequential tool (Công cụ có hệ quả) | "Công cụ hành động" | Thay đổi trạng thái bên ngoài; cần cổng kiểm soát, kiểm toán hoặc xác nhận người dùng |
| Four-step loop (Vòng lặp bốn bước) | "Chu kỳ gọi công cụ" | mô tả → quyết định → thực thi → quan sát |
| Host | "Runtime agent" | Chương trình giữ sổ đăng ký công cụ, gọi mô hình và chạy bộ thực thi |

## Further Reading

- [OpenAI — Function calling guide](https://platform.openai.com/docs/guides/function-calling) — tham chiếu kinh điển cho khai báo công cụ và hình dạng lời gọi kiểu OpenAI
- [Anthropic — Tool use overview](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview) — định dạng khối `tool_use` / `tool_result` của Claude
- [Google — Gemini function calling](https://ai.google.dev/gemini-api/docs/function-calling) — `functionDeclarations` và ngữ nghĩa lời gọi song song trong Gemini
- [Model Context Protocol — Specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28) — sự khái quát không trạng thái, không phụ thuộc nhà cung cấp hiện tại của giao diện công cụ
- [JSON Schema — 2020-12 release notes](https://json-schema.org/draft/2020-12/release-notes) — phương ngữ lược đồ mà mọi API công cụ hiện đại sử dụng
