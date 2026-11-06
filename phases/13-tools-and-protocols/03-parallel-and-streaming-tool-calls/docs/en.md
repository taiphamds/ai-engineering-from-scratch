# Parallel Tool Calls and Streaming with Tools

> Ba lần tra thời tiết độc lập chạy tuần tự là ba lượt khứ hồi. Chạy song song và tổng thời gian giảm còn lời gọi đơn chậm nhất. Mọi nhà cung cấp tiên tiến nhất hiện phát nhiều lời gọi công cụ trong một lượt. Lợi ích là thật; phần kết nối tinh tế. Bài này đi qua cả hai nửa: phân nhánh song song và ghép lại đối số truyền luồng, nhấn mạnh bẫy liên hệ id.

**Type:** Build
**Languages:** Python (stdlib, thread pool + streaming harness)
**Prerequisites:** Phase 13 · 02 (function calling deep dive)
**Time:** ~75 minutes

## Learning Objectives

- Giải thích tại sao `parallel_tool_calls: true` tồn tại và khi nào tắt.
- Liên hệ các phần đối số truyền luồng với đúng id lời gọi công cụ trong phân nhánh song song.
- Ghép chuỗi `arguments` từng phần thành JSON đầy đủ mà không phân tích sớm.
- Chạy benchmark thời tiết ba thành phố minh họa độ trễ tuần tự so với song song.

## The Problem

Không có lời gọi song song, agent trả lời "thời tiết ở Bengaluru, Tokyo và Zurich thế nào" làm như sau:

```
user -> LLM
LLM -> call get_weather(Bengaluru)
host -> run executor, reply with result
LLM -> call get_weather(Tokyo)
host -> run executor, reply with result
LLM -> call get_weather(Zurich)
host -> run executor, reply with result
LLM -> final text answer
```

Ba lượt khứ hồi LLM, mỗi lượt cũng chịu độ trễ bộ thực thi. Xấp xỉ 4x thời gian thực lý tưởng.

Với lời gọi song song:

```
user -> LLM
LLM -> call get_weather(Bengaluru); call get_weather(Tokyo); call get_weather(Zurich)
host -> run all three executors concurrently, reply with three results
LLM -> final text answer
```

Một lượt khứ hồi LLM. Thời gian bộ thực thi là giá trị tối đa của ba bên, không phải tổng. Benchmark sản xuất trên OpenAI, Anthropic và Gemini cho thấy giảm 60 đến 70 phần trăm thời gian thực trên khối lượng công việc phân nhánh.

Cái giá là độ phức tạp liên hệ. Khi ba lời gọi hoàn tất sai thứ tự, kết quả phải mang `tool_call_id` khớp để mô hình xếp chúng đúng. Khi kết quả truyền luồng, bạn phải ghép mảnh đối số từng phần thành JSON đầy đủ trước khi thực thi. Gemini 3 thêm id duy nhất một phần để giải quyết vấn đề thực tế khi hai lời gọi song song đến cùng công cụ không thể phân biệt.

## The Concept

### Enabling parallel

- **OpenAI.** `parallel_tool_calls: true` bật mặc định. Đặt `false` để ép tuần tự.
- **Anthropic.** Song song qua `disable_parallel_tool_use: false` (mặc định trên Claude 3.5 trở lên). Đặt `true` để tuần tự.
- **Gemini.** Luôn có khả năng song song; `tool_config.function_calling_config.mode = "AUTO"` để mô hình quyết định.

Tắt song song khi công cụ có phụ thuộc thứ tự (`create_file` rồi `write_file`), khi đầu ra lời gọi này cung cấp thông tin cho đầu vào lời gọi khác, hoặc khi bộ giới hạn tốc độ không xử lý được phân nhánh.

### Id correlation

Mọi lời gọi mô hình phát có `id`. Mọi kết quả host trả phải gồm cùng id. Không có điều này, kết quả mơ hồ.

- **OpenAI.** `tool_call_id` trên mỗi thông điệp vai trò tool.
- **Anthropic.** `tool_use_id` trên mỗi khối `tool_result`.
- **Gemini.** `id` trên mỗi `functionResponse` (Gemini 3 trở lên; Gemini 2 khớp theo tên, hỏng với lời gọi song song cùng tên).

### Running calls concurrently

Host chạy bộ thực thi mỗi lời gọi trên luồng, coroutine hoặc worker từ xa riêng. Bộ khung đơn giản nhất dùng nhóm luồng; sản xuất dùng asyncio với `asyncio.gather` hoặc đồng thời có cấu trúc. Thứ tự hoàn tất không đoán được — id là định danh.

Một lỗi phổ biến: trả lời bằng các kết quả theo thứ tự danh sách lệnh gọi thay vì thứ tự hoàn thành. Điều này thường hoạt động vì mô hình chỉ quan tâm đến `tool_call_id`, nhưng nếu một kết quả bị mất hoặc trùng lặp, một danh sách phản hồi được sắp xếp khác với thứ tự các kết quả đến sẽ làm khoảng trống khó tìm hơn trong log. Ưu tiên trả lời theo thứ tự hoàn thành với các ID tường minh.

### Streaming tool calls

Khi mô hình truyền luồng, `arguments` đến theo từng mảnh. Ba luồng phần riêng cho ba lời gọi song song xen kẽ trên đường truyền. Bạn cần một bộ tích lũy mỗi id.

Hình dạng theo nhà cung cấp:

- **OpenAI.** Mỗi phần là `choices[0].delta.tool_calls[i].function.arguments` (chuỗi từng phần). Phần mang `index` (vị trí trong danh sách lời gọi). Bạn tích lũy theo chỉ số, đọc `id` khi lần đầu xuất hiện và phân tích JSON khi `finish_reason = "tool_calls"`.
- **Anthropic.** Sự kiện luồng là `message_start`, rồi một `content_block_start` mỗi khối với kiểu `tool_use` (chứa id, tên, đầu vào rỗng). Sự kiện `content_block_delta` mang phần `input_json_delta`. `content_block_stop` đóng mỗi khối.
- **Gemini.** `streamFunctionCallArguments` (Gemini 3 trở lên) phát các phần có `functionCallId` để lời gọi xen kẽ rõ ràng. Trước Gemini 3, truyền luồng trả một lời gọi đầy đủ mỗi lần.

### Partial JSON and the parse-early trap

Bạn không thể phân tích `arguments` đến khi nó đầy đủ. JSON từng phần như `{"city": "Beng` không hợp lệ và sẽ ném lỗi. Cổng đúng là tín hiệu kết thúc lời gọi của nhà cung cấp: `finish_reason = "tool_calls"` của OpenAI, `content_block_stop` của Anthropic hoặc sự kiện kết thúc luồng của Gemini. Chỉ khi đó mới thử `json.loads`. Cách vững chắc hơn dùng bộ phân tích JSON tăng dần phát sự kiện khi cấu trúc hoàn tất; hướng dẫn truyền luồng OpenAI khuyến nghị điều này cho UX hiển thị chỉ báo "đang suy nghĩ" trực tiếp. Đếm ngoặc nhọn không đáng tin để kiểm tra tính đầy đủ (ngoặc nhọn trong chuỗi có dấu nháy hoặc nội dung escape gây dương tính giả) và chỉ nên dùng làm heuristic gỡ lỗi không chính thức.

### Out-of-order completion

```
call_A: fast API, returns first
call_B: slow API, returns second
call_C: median API, returns third
```

Phản hồi host vẫn phải dẫn các id:

```
[{role: "tool", tool_call_id: "call_A", content: ...},
 {role: "tool", tool_call_id: "call_B", content: ...},
 {role: "tool", tool_call_id: "call_C", content: ...}]
```

Thứ tự trong phản hồi không ảnh hưởng tính đúng trên OpenAI hoặc Anthropic. Gemini chấp nhận mọi thứ tự miễn id khớp.

### Benchmark: sequential vs parallel

Bộ khung trong `code/main.py` mô phỏng ba bộ thực thi có độ trễ 400, 600 và 800 ms. Tuần tự chạy trong tổng 1800 ms. Song song chạy trong max(400, 600, 800) = 800 ms. Chênh lệch là hằng số, không tỷ lệ, nên tiết kiệm tăng theo số công cụ.

Lưu ý thực tế: lời gọi song song gây áp lực lên API phía sau. Phân nhánh 10 chiều đến dịch vụ giới hạn tốc độ sẽ thất bại. Giai đoạn 13 · 17 đề cập backpressure cấp gateway; ngữ nghĩa thử lại được lên kế hoạch cho giai đoạn tương lai.

### Streaming fan-out wall-clock

Nếu bản thân mô hình truyền luồng, bạn có thể bắt đầu thực thi ngay khi đối số của một lời gọi đầy đủ, thay vì chờ mọi lời gọi hoàn tất. Đây là tối ưu OpenAI ghi lại nhưng không phải SDK nào cũng cung cấp. Bộ khung bài này làm điều đó: ngay khi luồng mô phỏng cho ra đối tượng đối số đầy đủ, host khởi chạy lời gọi đó.

```figure
tp-parallel-fanout
```

## Use It

`code/main.py` có hai nửa. Nửa đầu chạy ba lời gọi thời tiết mô phỏng tuần tự và song song bằng `concurrent.futures.ThreadPoolExecutor` và in thời gian thực. Nửa sau phát lại phản hồi truyền luồng giả — các phần `arguments` cho ba lời gọi song song xen kẽ trên một luồng — rồi ghép theo id bằng `StreamAccumulator`. Không LLM, không mạng, chỉ logic ghép lại.

Những gì cần xem:

- Bộ đếm tuần tự đạt 1.8 giây. Bộ đếm song song đạt 0.8 giây trên cùng độ trễ giả.
- Bộ tích lũy xử lý các phần đến sai thứ tự bằng đệm theo id và chỉ phân tích khi JSON mỗi lời gọi đầy đủ.
- Bộ thực thi khởi chạy ngay khi đối số của một id hoàn tất, không sau khi mọi luồng kết thúc.

## Ship It

Bài học này tạo ra `outputs/skill-parallel-call-safety-check.md`. Với sổ đăng ký công cụ, skill kiểm tra công cụ nào an toàn để song song hóa, công cụ nào có phụ thuộc thứ tự và công cụ nào làm quá tải giới hạn tốc độ phía sau — trả sổ đăng ký sửa đổi với cờ `parallel_safe` mỗi công cụ.

## Exercises

1. Chạy `code/main.py` và thay đổi độ trễ mô phỏng. Xác nhận tỷ lệ song song-trên-tuần tự xấp xỉ `max/sum` (lần chạy thật lệch nhẹ so với lý tưởng do lập lịch luồng, tuần tự hóa và chi phí bộ khung). Ở phân phối độ trễ nào song song không còn quan trọng?

2. Mở rộng bộ tích lũy để xử lý trường hợp "lời gọi bị hủy giữa luồng" bằng bỏ bộ đệm và phát sự kiện `cancelled`. Nhà cung cấp nào ghi rõ trường hợp này? Kiểm tra ngữ nghĩa `content_block_stop` của Anthropic và hành vi `finish_reason: "length"` của OpenAI.

3. Thay nhóm luồng bằng `asyncio.gather`. Benchmark cả hai. Bạn nên thấy lợi ích nhỏ với async do chi phí chuyển ngữ cảnh thấp hơn, nhưng chỉ khi bộ thực thi làm I/O thật.

4. Chọn hai công cụ KHÔNG nên song song hóa (ví dụ `create_file` rồi `write_file`). Thêm đồ thị `ordering_dependency` vào sổ đăng ký và kiểm soát phân nhánh song song theo đồ thị đó. Đây là bộ máy tối thiểu cho lập lịch nhận biết phụ thuộc, được hình thức hóa ở giai đoạn kỹ thuật agent tương lai.

5. Đọc mục gọi hàm song song của OpenAI và tài liệu `disable_parallel_tool_use` của Anthropic. Xác định một loại công cụ thực tế Anthropic khuyến nghị tắt song song. (Gợi ý: thay đổi có hệ quả trên cùng tài nguyên.)

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|----------------|------------------------|
| Parallel tool calls (Lời gọi công cụ song song) | "Phân nhánh trong một lượt" | Mô hình phát nhiều lời gọi công cụ trong một thông điệp assistant |
| `parallel_tool_calls` | "Cờ của OpenAI" | Bật hoặc tắt phát nhiều lời gọi |
| `disable_parallel_tool_use` | "Nghịch đảo của Anthropic" | Cờ tắt tùy chọn; mặc định bật song song |
| Tool call id (Id lời gọi công cụ) | "Định danh liên hệ" | Định danh mỗi lời gọi mà thông điệp kết quả phải lặp lại |
| Accumulator (Bộ tích lũy) | "Bộ đệm luồng" | Bộ đệm chuỗi theo id cho phần `arguments` từng phần |
| Out-of-order completion (Hoàn tất sai thứ tự) | "Nhanh nhất trước" | Lời gọi song song kết thúc theo thứ tự không đoán được; id là chất kết dính |
| Dependency graph (Đồ thị phụ thuộc) | "Ràng buộc thứ tự" | Công cụ có đầu ra đưa vào đầu vào công cụ khác; không thể song song hóa |
| Parse-early trap (Bẫy phân tích sớm) | "JSON.parse phát nổ" | Cố phân tích chuỗi `arguments` chưa đầy đủ |
| `streamFunctionCallArguments` | "Tính năng Gemini 3" | Phần đối số truyền luồng với id duy nhất mỗi lời gọi |
| Completion-order reply (Phản hồi theo thứ tự hoàn tất) | "Đừng chờ tất cả" | Trả kết quả khi chúng đến, khóa theo id |

## Further Reading

- [OpenAI — Parallel function calling](https://platform.openai.com/docs/guides/function-calling#parallel-function-calling) — hành vi mặc định và cờ tắt tùy chọn
- [Anthropic — Parallel tool use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/parallel-tool-use) — `disable_parallel_tool_use` và gom kết quả theo lô
- [Google — Gemini function calling parallel section](https://ai.google.dev/gemini-api/docs/function-calling) — lời gọi song song liên hệ bằng id từ Gemini 3
- [OpenAI — Streaming responses with tools](https://platform.openai.com/docs/api-reference/responses-streaming) — ghép đối số chia phần cho luồng OpenAI
- [Anthropic — Streaming messages](https://docs.anthropic.com/en/api/messages-streaming) — `content_block_delta` với `input_json_delta`
