# Structured Output — JSON Schema, Pydantic, Zod, Constrained Decoding

> "Nhẹ nhàng yêu cầu mô hình trả JSON" thất bại 5 đến 15 phần trăm số lần, ngay cả trên mô hình tiên tiến nhất. Đầu ra có cấu trúc khép khoảng cách đó bằng giải mã có ràng buộc: mô hình thực sự bị ngăn phát token vi phạm lược đồ. Chế độ nghiêm ngặt của OpenAI, sử dụng công cụ định kiểu bằng lược đồ của Anthropic, `responseSchema` của Gemini, `output_type` của Pydantic AI và `.parse` của Zod là năm dạng bề mặt của cùng ý tưởng. Bài này xây bộ xác thực lược đồ và hợp đồng chế độ nghiêm ngặt mà người học sẽ dùng cho mọi pipeline trích xuất sản xuất.

**Type:** Build
**Languages:** Python (stdlib, JSON Schema 2020-12 subset)
**Prerequisites:** Phase 13 · 02 (function calling deep dive)
**Time:** ~75 minutes

## Learning Objectives

- Viết JSON Schema 2020-12 cho mục tiêu trích xuất với ràng buộc đúng (enum, min/max, required, pattern).
- Giải thích tại sao chế độ nghiêm ngặt và giải mã có ràng buộc cho bảo đảm khác "xác thực sau tạo sinh".
- Phân biệt ba dạng lỗi: lỗi phân tích, vi phạm lược đồ, mô hình từ chối.
- Cung cấp pipeline trích xuất với sửa lỗi có kiểu và xử lý từ chối có kiểu.

## The Problem

Agent đọc email đơn mua hàng cần chuyển văn bản tự do thành `{customer, line_items, total_usd}`. Ba cách tiếp cận.

**Cách một: yêu cầu JSON bằng prompt.** "Trả lời bằng JSON với trường customer, line_items, total_usd." Hoạt động 85 đến 95 phần trăm số lần trên mô hình tiên tiến nhất. Thất bại theo sáu cách: thiếu ngoặc nhọn, dấu phẩy cuối, sai kiểu, trường bịa ra, bị cắt ở giới hạn token, văn xuôi lọt vào như "Đây là JSON của bạn:".

**Cách hai: xác thực sau tạo sinh.** Tạo tự do, phân tích, xác thực theo lược đồ, thử lại khi thất bại. Đáng tin cậy nhưng đắt — bạn trả tiền cho mỗi lần thử lại, và lỗi cắt cụt tốn thêm một lượt mỗi lần xảy ra.

**Cách ba: giải mã có ràng buộc.** Nhà cung cấp bắt buộc lược đồ lúc giải mã. Token không hợp lệ bị che khỏi phân phối lấy mẫu. Đầu ra được bảo đảm phân tích được và xác thực thành công. Thất bại thu về một dạng: từ chối (mô hình quyết định đầu vào không phù hợp lược đồ).

Mọi nhà cung cấp tiên tiến nhất năm 2026 cung cấp một dạng của cách ba.

- **OpenAI.** `response_format: {type: "json_schema", strict: true}` cộng `refusal` trong phản hồi nếu mô hình khước từ.
- **Anthropic.** Bắt buộc lược đồ trên đầu vào `tool_use`; `stop_reason: "refusal"` không tồn tại, nhưng `end_turn` không có lời gọi công cụ là tín hiệu.
- **Gemini.** `responseSchema` ở cấp yêu cầu; năm 2026 Gemini cung cấp ràng buộc ngữ pháp cấp token cho kiểu được chọn.
- **Pydantic AI.** `output_type=InvoiceModel` phát `RunResult` có cấu trúc được định kiểu thành `InvoiceModel`.
- **Zod (TypeScript).** Bộ phân tích runtime xác thực đầu ra nhà cung cấp theo lược đồ Zod; kết hợp với `beta.chat.completions.parse` của OpenAI.

Mạch chung: khai báo lược đồ một lần, bắt buộc từ đầu đến cuối.

## The Concept

### JSON Schema 2020-12 — the lingua franca

Mọi nhà cung cấp chấp nhận JSON Schema 2020-12. Cấu trúc bạn dùng nhiều nhất:

- `type`: một trong `object`, `array`, `string`, `number`, `integer`, `boolean`, `null`.
- `properties`: ánh xạ tên trường đến lược đồ con.
- `required`: danh sách tên trường phải xuất hiện.
- `enum`: tập đóng các giá trị được phép.
- `minimum` / `maximum` (số), `minLength` / `maxLength` / `pattern` (chuỗi).
- `items`: lược đồ con áp dụng cho mọi phần tử mảng.
- `additionalProperties`: `false` cấm trường thêm (mặc định khác nhau theo chế độ).

Chế độ nghiêm ngặt OpenAI thêm ba yêu cầu: mọi thuộc tính phải được liệt kê trong `required`, `additionalProperties: false` ở mọi nơi và không `$ref` chưa phân giải. Nếu vi phạm, API trả 400 lúc yêu cầu.

### Pydantic, the Python binding

Pydantic v2 tạo JSON Schema từ mô hình hình dạng dataclass qua `model_json_schema()`. Pydantic AI bọc điều này để bạn viết:

```python
class Invoice(BaseModel):
    customer: str
    line_items: list[LineItem]
    total_usd: Decimal
```

và framework agent chuyển lược đồ sang chế độ nghiêm ngặt OpenAI, `input_schema` Anthropic hoặc `responseSchema` Gemini ở biên. Đầu ra mô hình trở về dưới dạng thực thể `Invoice` có kiểu. Lỗi xác thực ném `ValidationError` với đường dẫn lỗi có kiểu.

### Zod, the TypeScript binding

Zod (`z.object({customer: z.string(), ...})`) là tương đương TS. Node SDK của OpenAI cung cấp `zodResponseFormat(Invoice)` chuyển sang payload JSON Schema của API.

### Refusals

Chế độ nghiêm ngặt không thể ép mô hình trả lời. Nếu đầu vào không thể phù hợp lược đồ ("email là bài thơ, không phải hóa đơn"), mô hình phát trường `refusal` chứa lý do. Mã của bạn phải xử lý như kết quả hạng nhất, không phải thất bại. Từ chối cũng hữu ích làm tín hiệu an toàn: mô hình được yêu cầu trích số thẻ tín dụng từ email có nội dung được bảo vệ trả từ chối kèm lý do an toàn.

### Constrained decoding in the open

Triển khai trọng số mở dùng ba kỹ thuật.

1. **Giải mã dựa trên ngữ pháp** (`outlines`, `guidance`, `lm-format-enforcer`): xây ô-tô-mát hữu hạn tất định từ lược đồ; ở mỗi bước, che logit của token vi phạm FSM.
2. **Che logit với bộ phân tích JSON**: chạy bộ phân tích JSON truyền luồng đồng bộ với mô hình; ở mỗi bước, tính tập token tiếp theo hợp lệ.
3. **Giải mã suy đoán với bộ xác minh**: mô hình nháp rẻ đề xuất token, bộ xác minh bắt buộc lược đồ.

Nhà cung cấp thương mại chọn một trong số này bên trong. Hiện trạng tiên tiến nhất năm 2026 nhanh hơn tạo sinh thuần cho đầu ra có cấu trúc ngắn và tốc độ gần tương đương cho đầu ra dài.

### The three failure modes

1. **Lỗi phân tích.** Đầu ra không phải JSON hợp lệ. Không thể xảy ra ở chế độ nghiêm ngặt. Vẫn có thể xảy ra trên nhà cung cấp không nghiêm ngặt.
2. **Vi phạm lược đồ.** Đầu ra phân tích được nhưng vi phạm lược đồ. Không thể xảy ra ở chế độ nghiêm ngặt. Phổ biến ngoài nó.
3. **Từ chối.** Mô hình khước từ. Phải xử lý như kết quả có kiểu.

### Retry strategy

Khi ngoài chế độ nghiêm ngặt (sử dụng công cụ Anthropic, OpenAI không nghiêm ngặt, Gemini cũ), mẫu phục hồi là:

```
generate -> parse -> validate -> if fail, inject error and retry, max 3x
```

Một lần thử lại thường đủ. Ba lần thử lại bắt được lỗi chập chờn của mô hình yếu. Quá ba là dấu hiệu lược đồ xấu: mô hình không thể thỏa nó với một số đầu vào, và prompt hoặc lược đồ cần sửa.

### Small-model support

Giải mã có ràng buộc hoạt động trên mô hình nhỏ. Mô hình mở 3B tham số với bắt buộc ngữ pháp vượt mô hình 70B tham số với prompting thô trên tác vụ có cấu trúc. Đây là lý do chính đầu ra có cấu trúc quan trọng với sản xuất: nó tách độ tin cậy khỏi kích thước mô hình.

```figure
constrained-decoding
```

## Use It

`code/main.py` cung cấp bộ xác thực JSON Schema 2020-12 tối thiểu trong stdlib (types, required, enum, min/max, pattern, items, additionalProperties). Nó bọc lược đồ `Invoice` và chạy đầu ra LLM giả qua bộ xác thực, minh họa nhánh lỗi phân tích, vi phạm lược đồ và từ chối. Thay đầu ra giả bằng phản hồi thật của bất kỳ nhà cung cấp nào trong sản xuất.

Những gì cần xem:

- Bộ xác thực trả danh sách `[ValidationError]` có kiểu với đường dẫn và thông điệp. Đó là hình dạng bạn muốn đưa vào prompt thử lại.
- Nhánh từ chối KHÔNG thử lại. Nó ghi nhật ký và trả từ chối có kiểu. Giai đoạn 14 · 09 dùng từ chối làm tín hiệu an toàn.
- Kiểm tra `additionalProperties: false` kích hoạt trên đầu vào kiểm thử đối kháng, cho thấy tại sao chế độ nghiêm ngặt đóng cửa với trường bịa ra.

## Ship It

Bài học này tạo ra `outputs/skill-structured-output-designer.md`. Với mục tiêu trích xuất văn bản tự do (hóa đơn, phiếu hỗ trợ, hồ sơ xin việc, v.v.), skill tạo JSON Schema 2020-12 tương thích chế độ nghiêm ngặt và mô hình Pydantic phản chiếu nó, với khung xử lý từ chối và thử lại có kiểu.

## Exercises

1. Chạy `code/main.py`. Thêm ca kiểm thử thứ tư có `total_usd` là số âm. Xác nhận bộ xác thực từ chối với đường dẫn ràng buộc `minimum`.

2. Mở rộng bộ xác thực hỗ trợ `oneOf` với trường phân biệt. Trường hợp phổ biến: `line_item` là sản phẩm hoặc dịch vụ, được gắn nhãn bằng `kind`. Chế độ nghiêm ngặt có quy tắc tinh tế ở đây; kiểm tra hướng dẫn đầu ra có cấu trúc OpenAI.

3. Viết cùng lược đồ Invoice thành Pydantic BaseModel và so sánh đầu ra `model_json_schema()` với lược đồ tự viết. Xác định một trường Pydantic đặt mặc định mà bản tự viết bỏ qua.

4. Đo tỷ lệ từ chối. Tạo mười đầu vào không nên trích xuất được (lời bài hát, chứng minh toán học, email trống) và chạy qua nhà cung cấp thật với chế độ nghiêm ngặt. Đếm từ chối so với đầu ra bịa. Đây là chuẩn thực tế cho thử lại nhận biết từ chối.

5. Đọc hướng dẫn đầu ra có cấu trúc OpenAI từ đầu đến cuối. Xác định một cấu trúc nó cấm rõ trong chế độ nghiêm ngặt nhưng JSON Schema thuần cho phép. Rồi thiết kế lược đồ dùng cấu trúc bị cấm không thiết yếu và tái cấu trúc để tương thích nghiêm ngặt.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|----------------|------------------------|
| JSON Schema 2020-12 | "Đặc tả lược đồ" | Phương ngữ lược đồ bản thảo IETF mà mọi nhà cung cấp hiện đại sử dụng |
| Strict mode (Chế độ nghiêm ngặt) | "Lược đồ được bảo đảm" | Cờ OpenAI bắt buộc lược đồ qua giải mã có ràng buộc |
| Constrained decoding (Giải mã có ràng buộc) | "Che logit" | Bắt buộc lúc giải mã che token tiếp theo không hợp lệ |
| Refusal (Từ chối) | "Mô hình khước từ" | Kết quả có kiểu khi đầu vào không thể phù hợp lược đồ |
| Parse error (Lỗi phân tích) | "JSON không hợp lệ" | Đầu ra không phân tích được thành JSON; không thể dưới chế độ nghiêm ngặt |
| Schema violation (Vi phạm lược đồ) | "Sai hình dạng" | Phân tích được nhưng vi phạm kiểu / required / enum / phạm vi |
| `additionalProperties: false` | "Không cho phần thêm" | Cấm trường không biết; bắt buộc trong OpenAI nghiêm ngặt |
| Pydantic BaseModel | "Đầu ra có kiểu" | Lớp Python phát và xác thực JSON Schema |
| Zod schema (Lược đồ Zod) | "Kiểu đầu ra TypeScript" | Lược đồ runtime TS để xác thực đầu ra nhà cung cấp |
| Grammar enforcement (Bắt buộc ngữ pháp) | "Giải mã có ràng buộc trọng số mở" | Che logit dựa trên FSM, như trong outlines / guidance |

## Further Reading

- [OpenAI — Structured outputs](https://platform.openai.com/docs/guides/structured-outputs) — chế độ nghiêm ngặt, từ chối và yêu cầu lược đồ
- [OpenAI — Introducing structured outputs](https://openai.com/index/introducing-structured-outputs-in-the-api/) — bài ra mắt tháng 8 năm 2024 giải thích bảo đảm giải mã
- [Pydantic AI — Output](https://ai.pydantic.dev/output/) — liên kết output_type có kiểu tuần tự hóa sang mỗi nhà cung cấp
- [JSON Schema — 2020-12 release notes](https://json-schema.org/draft/2020-12/release-notes) — đặc tả kinh điển
- [Microsoft — Structured outputs in Azure OpenAI](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/structured-outputs) — ghi chú triển khai doanh nghiệp và lưu ý chế độ nghiêm ngặt
