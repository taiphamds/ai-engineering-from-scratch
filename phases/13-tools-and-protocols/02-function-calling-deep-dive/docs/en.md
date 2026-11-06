# Function Calling Deep Dive — OpenAI, Anthropic, Gemini

> Ba nhà cung cấp tiên tiến nhất hội tụ về cùng vòng lặp gọi công cụ năm 2024 rồi phân kỳ về mọi thứ khác. OpenAI dùng `tools` và `tool_calls`. Anthropic dùng khối `tool_use` và `tool_result`. Gemini dùng `functionDeclarations` và liên hệ bằng id duy nhất. Bài học này đối chiếu ba bên cạnh nhau để mã phát hành trên một nhà cung cấp không hỏng khi bạn chuyển nó.

**Type:** Build
**Languages:** Python (stdlib, schema translators)
**Prerequisites:** Phase 13 · 01 (the tool interface)
**Time:** ~75 minutes

## Learning Objectives

- Nêu ba khác biệt hình dạng giữa payload function calling của OpenAI, Anthropic và Gemini (khai báo, lời gọi, kết quả).
- Chuyển một khai báo công cụ qua cả ba định dạng nhà cung cấp và dự đoán nơi ràng buộc chế độ nghiêm ngặt khác nhau.
- Dùng `tool_choice` ở mỗi nhà cung cấp để ép, cấm hoặc tự động chọn lời gọi công cụ.
- Biết giới hạn cứng mỗi nhà cung cấp (số công cụ, độ sâu lược đồ, độ dài đối số) và dấu hiệu lỗi mỗi bên phát khi vi phạm giới hạn.

## The Problem

Hình dạng yêu cầu function calling khác nhau theo nhà cung cấp. Ba ví dụ cụ thể từ ngăn xếp sản xuất năm 2026:

**OpenAI Chat Completions / Responses API.** Bạn truyền `tools: [{type: "function", function: {name, description, parameters, strict}}]`. Phản hồi mô hình chứa `choices[0].message.tool_calls: [{id, type: "function", function: {name, arguments}}]`, trong đó `arguments` là chuỗi JSON bạn phải phân tích. Chế độ nghiêm ngặt (`strict: true`) bắt buộc tuân thủ lược đồ qua giải mã có ràng buộc.

**Anthropic Messages API.** Bạn truyền `tools: [{name, description, input_schema}]`. Phản hồi trở về dưới dạng `content: [{type: "text"}, {type: "tool_use", id, name, input}]`. `input` đã được phân tích (đối tượng, không phải chuỗi). Bạn trả lời bằng thông điệp `user` mới chứa khối `{type: "tool_result", tool_use_id, content}`.

**Google Gemini API.** Bạn truyền `tools: [{functionDeclarations: [{name, description, parameters}]}]` (lồng dưới `functionDeclarations`). Phản hồi đến dưới dạng `candidates[0].content.parts: [{functionCall: {name, args, id}}]`, trong đó `id` duy nhất ở Gemini 3 trở lên để liên hệ lời gọi song song. Bạn trả lời bằng `{functionResponse: {name, id, response}}`.

Cùng vòng lặp. Khác tên trường, khác lồng nhau, khác quy ước chuỗi-so-với-đối-tượng, khác cơ chế liên hệ. Nhóm viết agent thời tiết trên OpenAI tốn hai ngày chuyển sang Anthropic và thêm một ngày sang Gemini chỉ cho phần kết nối.

Bài học này xây bộ chuyển đổi thống nhất ba định dạng thành một khai báo công cụ chuẩn và định tuyến ở biên. Giai đoạn 13 · 17 khái quát cùng mẫu thành gateway LLM.

## The Concept

### The common structure

Mọi nhà cung cấp cần năm thứ:

1. **Danh sách công cụ.** Tên, mô tả và lược đồ đầu vào mỗi công cụ.
2. **Lựa chọn công cụ.** Ép công cụ cụ thể, cấm công cụ hoặc để mô hình quyết định.
3. **Phát lời gọi.** Đầu ra có cấu trúc nêu công cụ và đối số.
4. **Id lời gọi.** Liên hệ phản hồi với đúng lời gọi (quan trọng cho song song).
5. **Chèn kết quả.** Thông điệp hoặc khối gắn kết quả trở lại lời gọi.

### Shape diffs, field by field

| Khía cạnh | OpenAI | Anthropic | Gemini |
|--------|--------|-----------|--------|
| Vỏ khai báo | `{type: "function", function: {...}}` | `{name, description, input_schema}` | `{functionDeclarations: [{...}]}` |
| Trường lược đồ | `parameters` | `input_schema` | `parameters` |
| Vùng chứa phản hồi | `tool_calls[]` trên thông điệp assistant | `content[]` kiểu `tool_use` | `parts[]` kiểu `functionCall` |
| Kiểu đối số | JSON chuỗi hóa | đối tượng đã phân tích | đối tượng đã phân tích |
| Định dạng id | `call_...` (OpenAI tạo) | `toolu_...` (Anthropic) | UUID (Gemini 3+) |
| Khối kết quả | vai trò `tool`, `tool_call_id` | `user` với `tool_result`, `tool_use_id` | `functionResponse` với `id` khớp |
| Ép một công cụ | `tool_choice: {type: "function", function: {name}}` | `tool_choice: {type: "tool", name}` | `tool_config: {function_calling_config: {mode: "ANY"}}` |
| Cấm công cụ | `tool_choice: "none"` | `tool_choice: {type: "none"}` | `mode: "NONE"` |
| Lược đồ nghiêm ngặt | `strict: true` | lược đồ-là-lược-đồ (luôn bắt buộc) | `responseSchema` ở cấp yêu cầu |

### Limits you will actually hit

- **OpenAI.** 128 công cụ mỗi yêu cầu. Độ sâu lược đồ 5. Chuỗi đối số <= 8192 byte. Chế độ nghiêm ngặt yêu cầu không `$ref`, không `oneOf`/`anyOf`/`allOf` chồng lấn, mọi thuộc tính được liệt kê trong `required`.
- **Anthropic.** 64 công cụ mỗi yêu cầu. Độ sâu lược đồ về thực chất không giới hạn nhưng giới hạn thực tế 10. Không cờ chế độ nghiêm ngặt; lược đồ là hợp đồng và mô hình có xu hướng tuân thủ.
- **Gemini.** 64 hàm mỗi yêu cầu. Kiểu lược đồ là tập con OpenAPI 3.0 (hơi khác JSON Schema 2020-12). Lời gọi song song có id duy nhất từ Gemini 3.

### `tool_choice` behavior

Ba chế độ mọi bên hỗ trợ, được đặt tên khác nhau.

- **Tự động.** Mô hình chọn công cụ hoặc văn bản. Mặc định.
- **Bắt buộc / Bất kỳ.** Mô hình phải gọi ít nhất một công cụ.
- **Không.** Mô hình không được gọi công cụ.

Cộng một chế độ riêng ở mỗi nhà cung cấp:

- **OpenAI.** Ép công cụ cụ thể theo tên.
- **Anthropic.** Ép công cụ cụ thể theo tên; cờ `disable_parallel_tool_use` tách đơn so với đa.
- **Gemini.** `mode: "VALIDATED"` định tuyến mọi phản hồi qua bộ xác thực lược đồ bất kể ý định mô hình.

### Parallel calls

`parallel_tool_calls: true` của OpenAI (mặc định) phát nhiều lời gọi trong một thông điệp assistant. Bạn chạy tất cả và trả lời bằng thông điệp vai trò tool theo lô chứa một mục mỗi `tool_call_id`. Anthropic trước đây gọi đơn; `disable_parallel_tool_use: false` (mặc định kể từ Claude 3.5) bật đa. Gemini 2 cho phép lời gọi song song nhưng không cho id ổn định; Gemini 3 thêm UUID để phản hồi sai thứ tự liên hệ rõ ràng.

### Streaming

Cả ba hỗ trợ lời gọi công cụ truyền luồng. Định dạng trên đường truyền khác nhau:

- **OpenAI.** Các phần delta của `tool_calls[i].function.arguments` đến tăng dần. Bạn tích lũy đến `finish_reason: "tool_calls"`.
- **Anthropic.** Sự kiện bắt đầu khối / delta khối / kết thúc khối. Các phần `input_json_delta` mang đối số từng phần.
- **Gemini.** `streamFunctionCallArguments` (mới ở Gemini 3) phát các phần với `functionCallId` để nhiều lời gọi song song có thể xen kẽ.

Giai đoạn 13 · 03 đi sâu vào ghép lại song song + truyền luồng. Bài này tập trung hình dạng khai báo và lời gọi đơn.

### Errors and repair

Lỗi đối số không hợp lệ cũng trông khác nhau.

- **OpenAI (không nghiêm ngặt).** Mô hình trả `arguments: "{bad json}"`, phân tích JSON của bạn thất bại, bạn chèn thông điệp lỗi và gọi lại.
- **OpenAI (nghiêm ngặt).** Xác thực xảy ra lúc giải mã; JSON không hợp lệ là không thể nhưng `refusal` có thể xuất hiện.
- **Anthropic.** `input` có thể chứa trường ngoài dự kiến; lược đồ mang tính hướng dẫn. Xác thực phía máy chủ.
- **Gemini.** Điểm đặc thù OpenAPI 3.0: `enum` trên trường đối tượng bị âm thầm bỏ qua; tự xác thực.

### The translator pattern

Khai báo công cụ chuẩn trong mã của bạn trông như thế này (bạn chọn hình dạng):

```python
Tool(
    name="get_weather",
    description="Use when ...",
    input_schema={"type": "object", "properties": {...}, "required": [...]},
    strict=True,
)
```

Ba hàm nhỏ chuyển nó sang ba hình dạng nhà cung cấp. Bộ khung trong `code/main.py` làm chính xác việc này, rồi đưa lời gọi công cụ giả đi và về qua hình dạng phản hồi mỗi nhà cung cấp. Không cần mạng — bài này dạy hình dạng, không phải HTTP.

Nhóm sản xuất bọc bộ chuyển đổi này trong `AbstractToolset` (Pydantic AI), `UniversalToolNode` (LangGraph) hoặc `BaseTool` (LlamaIndex). Giai đoạn 13 · 17 cung cấp gateway đưa API hình dạng OpenAI ra trước bất kỳ bên nào trong ba bên.

```figure
function-call-args
```

## Use It

`code/main.py` định nghĩa một dataclass `Tool` chuẩn và ba bộ chuyển đổi phát JSON khai báo OpenAI, Anthropic và Gemini. Sau đó nó phân tích phản hồi nhà cung cấp làm thủ công với mỗi hình dạng thành cùng đối tượng lời gọi chuẩn, minh họa ngữ nghĩa giống nhau bên dưới. Chạy nó và đối chiếu ba khai báo cạnh nhau.

Những gì cần xem:

- Ba khối khai báo chỉ khác vỏ và tên trường.
- Ba khối phản hồi khác nơi lời gọi nằm (`tool_calls` cấp cao nhất, khối `content[]`, mục `parts[]`).
- Một hàm `canonical_call()` trích `{id, name, args}` từ cả ba hình dạng phản hồi.

## Ship It

Bài học này tạo ra `outputs/skill-provider-portability-audit.md`. Với tích hợp function calling cho một nhà cung cấp, skill tạo bản kiểm tra khả năng chuyển đổi: nó dựa vào giới hạn nhà cung cấp nào, trường nào cần đổi tên và điều gì hỏng khi chuyển sang mỗi nhà cung cấp khác.

## Exercises

1. Chạy `code/main.py` và xác minh JSON khai báo của cả ba nhà cung cấp đều tuần tự hóa cùng đối tượng `Tool` bên dưới. Sửa công cụ chuẩn để thêm tham số enum và xác nhận chỉ bộ chuyển đổi Gemini cần xử lý điểm đặc thù OpenAPI.

2. Thêm bộ phân tích `ListToolsResponse` cho mỗi nhà cung cấp trích danh sách công cụ mô hình trả sau lời gọi `list_tools` hoặc khám phá. OpenAI không có sẵn cái này; ghi nhận sự bất đối xứng.

3. Triển khai chuyển đổi `tool_choice`: ánh xạ `ToolChoice(mode="force", tool_name="x")` chuẩn vào cả ba hình dạng nhà cung cấp. Rồi ánh xạ `mode="any"` và `mode="none"`. Kiểm tra bảng đối chiếu của bài.

4. Chọn một trong ba nhà cung cấp và đọc hướng dẫn function calling từ đầu đến cuối. Tìm một trường trong đặc tả lược đồ của nó mà hai bên kia không hỗ trợ. Ứng viên: `strict` của OpenAI, `disable_parallel_tool_use` của Anthropic, `function_calling_config.allowed_function_names` của Gemini.

5. Viết vector kiểm thử: lời gọi công cụ có đối số vi phạm lược đồ khai báo. Chạy qua bộ xác thực mỗi nhà cung cấp (bản stdlib trong Bài 01 có thể làm đại diện) và ghi lỗi nào phát sinh. Ghi lại nhà cung cấp bạn sẽ dùng trong sản xuất vì tính nghiêm ngặt.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|----------------|------------------------|
| Function calling (Gọi hàm) | "Sử dụng công cụ" | API cấp nhà cung cấp để phát lời gọi công cụ có cấu trúc |
| Tool declaration (Khai báo công cụ) | "Đặc tả công cụ" | Tên + mô tả + payload đầu vào JSON Schema |
| `tool_choice` | "Ép / cấm" | Chế độ tự động / bắt buộc / không / tên cụ thể |
| Strict mode (Chế độ nghiêm ngặt) | "Bắt buộc lược đồ" | Cờ OpenAI ràng buộc giải mã khớp lược đồ |
| `tool_use` block (Khối sử dụng công cụ) | "Hình dạng lời gọi Anthropic" | Khối nội dung nội tuyến với id, tên, đầu vào |
| `functionCall` part (Phần gọi hàm) | "Hình dạng lời gọi Gemini" | Mục `parts[]` chứa tên, args và id |
| Arguments-as-string (Đối số dạng chuỗi) | "JSON chuỗi hóa" | OpenAI trả args dạng chuỗi JSON, không phải đối tượng |
| Parallel tool calls (Lời gọi công cụ song song) | "Phân nhánh trong một lượt" | Nhiều lời gọi công cụ trong một thông điệp assistant |
| Refusal (Từ chối) | "Mô hình khước từ" | Khối từ chối chỉ ở chế độ nghiêm ngặt thay lời gọi |
| OpenAPI 3.0 subset (Tập con OpenAPI 3.0) | "Điểm đặc thù lược đồ Gemini" | Gemini dùng phương ngữ giống JSON Schema với khác biệt nhỏ |

## Further Reading

- [OpenAI — Function calling guide](https://platform.openai.com/docs/guides/function-calling) — tham chiếu kinh điển gồm chế độ nghiêm ngặt và lời gọi song song
- [Anthropic — Tool use overview](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview) — ngữ nghĩa khối `tool_use` và `tool_result`
- [Google — Gemini function calling](https://ai.google.dev/gemini-api/docs/function-calling) — lời gọi song song, id duy nhất và tập con OpenAPI
- [Vertex AI — Function calling reference](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/multimodal/function-calling) — bề mặt doanh nghiệp của Gemini
- [OpenAI — Structured outputs](https://platform.openai.com/docs/guides/structured-outputs) — chi tiết bắt buộc lược đồ chế độ nghiêm ngặt
