# Tool Use and Function Calling

> Toolformer (Schick và cộng sự, 2023) khởi đầu việc chú thích công cụ tự giám sát. Berkeley Function Calling Leaderboard V4 (Patil và cộng sự, 2025) đặt ra chuẩn năm 2026: 40% agentic, 30% nhiều lượt, 10% live, 10% non-live, 10% ảo giác. Một lượt đã được giải quyết. Bộ nhớ, ra quyết định động và các chuỗi công cụ có tầm dài thì chưa.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 13 · 01 (Function Calling Deep Dive)
**Time:** ~60 minutes

## Learning Objectives

- Giải thích tín hiệu huấn luyện tự giám sát của Toolformer: chỉ giữ các chú thích công cụ khi việc thực thi làm giảm mất mát token tiếp theo.
- Nêu tên năm hạng mục đánh giá của BFCL V4 và điều mỗi hạng mục đo lường.
- Triển khai một sổ đăng ký công cụ dùng thư viện chuẩn với xác thực schema, ép kiểu đối số và cô lập thực thi bằng sandbox.
- Chẩn đoán ba vấn đề còn mở năm 2026: nối chuỗi công cụ có tầm dài, ra quyết định động và bộ nhớ.

## The Problem

Việc sử dụng công cụ ban đầu hỏi: mô hình có thể dự đoán một lời gọi hàm đúng không? Việc sử dụng công cụ hiện đại hỏi: mô hình có thể nối chuỗi công cụ qua 40 bước, với bộ nhớ, với khả năng quan sát một phần, với phục hồi từ lỗi công cụ, mà không ảo giác các công cụ không tồn tại không?

Toolformer thiết lập đường cơ sở: các mô hình có thể học khi nào gọi công cụ bằng tự giám sát. BFCL V4 xác định mục tiêu đánh giá năm 2026. Khoảng cách giữa chúng là không gian mà các agent sản xuất tồn tại.

## The Concept

### Toolformer (Schick et al., NeurIPS 2023)

Ý tưởng: để mô hình chú thích kho ngữ liệu tiền huấn luyện của chính nó bằng các lời gọi API ứng viên. Với mỗi ứng viên, thực thi nó. Chỉ giữ chú thích nếu việc đưa kết quả công cụ vào làm giảm mất mát trên token tiếp theo. Tinh chỉnh trên kho ngữ liệu đã lọc.

Các công cụ được bao phủ: máy tính, hệ thống QA, công cụ tìm kiếm, bộ dịch, lịch. Tín hiệu tự giám sát thuần túy là về việc công cụ có giúp dự đoán văn bản hay không — không có nhãn của con người.

Kết quả về quy mô: việc sử dụng công cụ xuất hiện ở quy mô lớn. Các mô hình nhỏ hơn bị tổn hại bởi chú thích công cụ; các mô hình lớn hơn được lợi. Đây là lý do các mô hình tiên tiến nhất năm 2026 có khả năng sử dụng công cụ mạnh được tích hợp sẵn trong khi hầu hết các mô hình 7B cần tinh chỉnh sử dụng công cụ tường minh để đáng tin cậy.

### Berkeley Function Calling Leaderboard V4 (Patil et al., ICML 2025)

BFCL là đánh giá trên thực tế của năm 2026. Thành phần V4:

- **Agentic (40%)** — các quỹ đạo agent đầy đủ: bộ nhớ, nhiều lượt, các quyết định động.
- **Nhiều lượt (30%)** — các hội thoại tương tác với các chuỗi công cụ.
- **Live (10%)** — các prompt thực do người dùng gửi (phân phối khó hơn).
- **Non-Live (10%)** — các trường hợp kiểm thử tổng hợp.
- **Ảo giác (10%)** — phát hiện khi không nên gọi công cụ nào.

V3 giới thiệu đánh giá dựa trên trạng thái: sau một chuỗi công cụ, kiểm tra trạng thái thực tế của API (ví dụ "file đã được tạo chưa?") thay vì khớp AST của các lời gọi công cụ. V4 thêm các hạng mục tìm kiếm web, bộ nhớ và độ nhạy định dạng.

Phát hiện then chốt năm 2026: gọi hàm một lượt gần như đã được giải quyết. Các lỗi tập trung ở bộ nhớ (mang ngữ cảnh qua các lượt), ra quyết định động (chọn công cụ dựa trên các kết quả trước), các chuỗi tầm dài (trôi dạt sau 20+ bước) và phát hiện ảo giác (từ chối gọi khi không công cụ nào phù hợp).

### Tool schema

Mỗi nhà cung cấp có một schema. Chúng khác nhau ở chi tiết nhưng có chung hình dạng:

```
name: string
description: string (what it does, when to use it)
input_schema: JSON Schema (properties, required, types, enums)
```

Anthropic sử dụng `input_schema` trực tiếp. OpenAI sử dụng `function.parameters`. Cả hai chấp nhận JSON Schema. Các mô tả đóng vai trò trụ cột — mô hình đọc chúng để chọn công cụ đúng. Mô tả công cụ kém là nguyên nhân gốc #1 của các lỗi chọn sai công cụ.

### Argument validation

Không tin bất kỳ lời gọi công cụ nào. Xác thực:

1. **Ép kiểu.** Mô hình có thể trả về một chuỗi "5" trong khi schema nói int. Ép kiểu nếu không mơ hồ; từ chối nếu không.
2. **Xác thực enum.** Nếu schema nói `status in {"open", "closed"}` và mô hình phát ra `"in_progress"`, từ chối với một lỗi có tính mô tả.
3. **Các trường bắt buộc.** Thiếu trường bắt buộc -> quan sát lỗi ngay lập tức trở lại mô hình, không phải một lần sập.
4. **Xác thực định dạng.** Ngày, email, URL — xác thực bằng các bộ phân tích cụ thể, không phải regex.

Mọi lỗi xác thực nên trả về một quan sát có cấu trúc để mô hình có thể thử lại với hình dạng đúng.

### Parallel tool calls

Các nhà cung cấp hiện đại hỗ trợ các lời gọi công cụ song song trong một lượt trợ lý. Vòng lặp:

1. Mô hình phát ra 3 lời gọi công cụ với các `tool_use_id` khác nhau.
2. Runtime thực thi chúng (song song nếu độc lập).
3. Mỗi kết quả trở lại dưới dạng một khối `tool_result` được tương quan bằng `tool_use_id`.

Quy tắc kỹ thuật: coi các ID tương quan là trụ cột. Hoán đổi chúng và bạn có việc định tuyến sai công cụ đến sai kết quả.

### Sandboxing

Thực thi công cụ là ranh giới sandbox. Xem Giai đoạn 13 · 26 để biết chi tiết. Phiên bản ngắn: mọi công cụ phải chỉ rõ bề mặt đọc/ghi, truy cập mạng, thời gian chờ và giới hạn bộ nhớ. `run_shell(cmd)` tổng quát là một dấu hiệu cảnh báo; `git_status()` cụ thể an toàn hơn.

```figure
tool-routing
```

## Build It

`code/main.py` triển khai một sổ đăng ký công cụ có dạng sản xuất:

- Bộ xác thực tập con JSON Schema (chỉ thư viện chuẩn).
- Đăng ký công cụ với mô tả, schema đầu vào, thời gian chờ và bộ thực thi.
- Ép kiểu đối số và xác thực enum.
- Phân phối công cụ song song với các ID tương quan.
- Các quan sát lỗi dưới dạng chuỗi có cấu trúc.

Chạy nó:

```
python3 code/main.py
```

Trace cho thấy một agent nhỏ gọi ba công cụ trong một lượt, với một lời gọi cố ý sai định dạng bị từ chối bằng một lỗi có tính mô tả mà mô hình có thể hành động dựa trên đó.

## Use It

Mỗi nhà cung cấp có schema công cụ riêng — Anthropic, OpenAI, Gemini, Bedrock. Sử dụng một lớp dịch (OpenAI Agents SDK, Vercel AI SDK, bộ điều hợp công cụ LangChain) nếu bạn cần nhiều nhà cung cấp. BFCL là benchmark tham chiếu — chạy nó đối với agent của bạn trước khi phát hành nếu việc sử dụng công cụ là trọng tâm của sản phẩm.

## Ship It

`outputs/skill-tool-registry.md` tạo một danh mục công cụ, schema và sổ đăng ký cho một miền tác vụ cho trước. Bao gồm các kiểm tra chất lượng mô tả (mô tả của mỗi công cụ có cho mô hình biết khi nào sử dụng nó không?).

## Exercises

1. Thêm một công cụ "không làm gì" cho phép mô hình từ chối rõ ràng việc sử dụng bất kỳ công cụ nào khác. Đo trên một kiểm thử ảo giác giống BFCL.
2. Triển khai ép kiểu đối số cho int dưới dạng chuỗi và float dưới dạng chuỗi. Ở đâu việc ép kiểu bắt đầu che giấu các lỗi thực?
3. Thêm một thời gian chờ cho từng công cụ và một bộ ngắt mạch (từ chối công cụ trong 60 giây sau 3 lần thất bại liên tiếp). Điều này thay đổi gì về cách mô hình phục hồi?
4. Đọc mô tả BFCL V4. Chọn một hạng mục (ví dụ "nhiều lượt") và chạy 10 prompt ví dụ qua agent của bạn. Báo cáo tỷ lệ đạt.
5. Chuyển bộ xác thực thư viện chuẩn sang Pydantic hoặc Zod. Pydantic/Zod đã bắt được điều gì mà bản mô phỏng bỏ sót?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Nó thực sự có nghĩa gì |
|------|----------------|------------------------|
| Function calling (Gọi hàm) | "Sử dụng công cụ" | Gọi công cụ bằng đầu ra có cấu trúc với schema đã xác thực |
| Toolformer | "Chú thích công cụ tự giám sát" | Schick 2023 — giữ các lời gọi công cụ có kết quả làm giảm mất mát token tiếp theo |
| BFCL | "Berkeley Function Calling Leaderboard" | Benchmark năm 2026: 40% agentic, 30% nhiều lượt, 10% live, 10% non-live, 10% ảo giác |
| Tool schema (Schema công cụ) | "Chữ ký hàm cho mô hình" | tên, mô tả, JSON Schema của các đối số |
| tool_use_id | "ID tương quan" | Gắn một lời gọi công cụ với kết quả của nó; thiết yếu cho phân phối song song |
| Hallucination detection (Phát hiện ảo giác) | "Biết khi nào không gọi" | Hạng mục V4: từ chối gọi khi không công cụ nào phù hợp |
| Argument coercion (Ép kiểu đối số) | "Sửa chuỗi thành int" | Các sửa chữa hẹp cho sự không khớp schema có thể dự đoán; từ chối nếu mơ hồ |
| Sandboxing (Cô lập bằng sandbox) | "Ranh giới thực thi công cụ" | Bề mặt đọc/ghi, mạng, thời gian chờ, giới hạn bộ nhớ cho từng công cụ |

## Further Reading

- [Schick et al., Toolformer (arXiv:2302.04761)](https://arxiv.org/abs/2302.04761) — chú thích công cụ tự giám sát
- [Berkeley Function Calling Leaderboard (V4)](https://gorilla.cs.berkeley.edu/leaderboard.html) — benchmark đánh giá năm 2026
- [Anthropic, Tool use documentation](https://platform.claude.com/docs/en/agent-sdk/overview) — schema công cụ sản xuất trong Claude Agent SDK
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) — kiểu công cụ hàm và Chốt bảo vệ
