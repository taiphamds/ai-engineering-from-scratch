---
name: skill-function-calling-patterns
description: Decision framework for implementing function calling in production -- tool design, error handling, security, and provider patterns
version: 1.0.0
phase: 11
lesson: 09
tags: [function-calling, tool-use, agents, mcp, security, openai, anthropic]
---

# Function Calling Patterns

Khi xây dựng ứng dụng LLM dùng công cụ, áp dụng khung quyết định này.

## When to use function calling

**Dùng function calling khi:**
- Mô hình cần dữ liệu thời gian thực (thời tiết, giá cổ phiếu, truy vấn cơ sở dữ liệu)
- Tác vụ cần tác dụng phụ (gửi email, tạo bản ghi, triển khai mã)
- Mô hình phải chọn giữa nhiều hành động theo ý định người dùng
- Bạn đang xây một tác tử tương tác với hệ thống bên ngoài

**Dùng đầu ra có cấu trúc thay thế khi:**
- Bạn cần trích xuất dữ liệu từ văn bản (không cần lệnh gọi bên ngoài)
- Đầu ra là sản phẩm cuối, không phải bước trung gian
- Bạn có một schema duy nhất, không phải nhiều công cụ để chọn

**Dùng cả hai khi:**
- Mô hình gọi công cụ, rồi cấu trúc kết quả công cụ thành định dạng đầu ra cụ thể

## Tool design guidelines

1. **Một công cụ, một hành động.** Công cụ tên `manage_database` xử lý truy vấn, chèn, cập nhật và xóa là quá rộng. Chia thành `query_records`, `insert_record`, `update_record`. Mô hình chọn tốt hơn với công cụ cụ thể.

2. **Mô tả là prompt.** Mô hình đọc mô tả công cụ để quyết định lựa chọn. Viết như bạn viết chỉ dẫn cho lập trình viên mới. Bao gồm công cụ trả gì, không chỉ nó làm gì.

3. **Ràng buộc bằng enum.** Nếu tham số có 3-10 giá trị hợp lệ, dùng enum. Mô hình sẽ tự tạo chuỗi -- "celsius", "Celsius", "C", "metric" -- trừ khi bạn ràng buộc.

4. **Ít công cụ hơn tốt hơn.** GPT-4o xử lý tốt 5-10 công cụ. Ở 20+ công cụ, độ chính xác lựa chọn giảm. Ở 50+ công cụ, dự kiến 10-15% lựa chọn sai công cụ. Nhóm chức năng liên quan hoặc dùng lớp định tuyến.

5. **Bắt buộc nghĩa là bắt buộc.** Chỉ đánh dấu tham số là bắt buộc nếu công cụ thực sự không thể hoạt động thiếu nó. Tham số tùy chọn với mặc định tốt giảm thất bại gọi công cụ.

## Provider-specific patterns

### OpenAI (GPT-4o, o3, GPT-4o-mini)

```python
tools=[{"type": "function", "function": {"name": ..., "parameters": ...}}]
tool_choice="auto"       # model decides
tool_choice="required"   # must call at least one tool
tool_choice={"type": "function", "function": {"name": "specific_tool"}}
```

- Hỗ trợ lệnh gọi công cụ song song (nhiều `tool_calls` trong một phản hồi)
- ID lệnh gọi công cụ phải được truyền lại với kết quả
- `gpt-4o-mini` rẻ hơn 10x và xử lý tốt định tuyến công cụ đơn giản
- Chế độ structured outputs hoạt động với tham số công cụ để bảo đảm tuân thủ schema

### Anthropic (Claude 3.5 Sonnet, Claude 4 Opus)

```python
tools=[{"name": ..., "description": ..., "input_schema": ...}]
tool_choice={"type": "auto"}     # model decides
tool_choice={"type": "any"}      # must call at least one tool
tool_choice={"type": "tool", "name": "specific_tool"}
```

- Lệnh gọi công cụ xuất hiện dưới dạng khối nội dung có `type: "tool_use"`
- Kết quả đi trong thông điệp người dùng có `type: "tool_result"`
- Tên trường là `input_schema`, không phải `parameters` (lỗi chuyển đổi phổ biến)
- Hỗ trợ nhiều lệnh gọi công cụ mỗi phản hồi

### Google (Gemini 2.0 Flash, Gemini 2.0 Pro)

```python
function_declarations=[{"name": ..., "description": ..., "parameters": ...}]
function_calling_config={"mode": "AUTO"}   # or "ANY" or "NONE"
```

- Dùng `function_declarations` ở cấp cao nhất
- Kết quả trả qua các phần `function_response`
- Hỗ trợ function calling song song

### Open-source models (Llama 3, Hermes, Qwen)

- Không có định dạng chuẩn hóa -- khác nhau theo mô hình và framework phục vụ
- Định dạng Hermes (NousResearch) là quy ước fine-tuned phổ biến nhất
- vLLM hỗ trợ gọi công cụ tương thích OpenAI cho mô hình được hỗ trợ
- Ollama hỗ trợ gọi công cụ cơ bản với mô hình tương thích
- Kiểm thử độ chính xác chọn công cụ trước sản xuất -- mô hình mở kém chính xác hơn GPT-4o 15-30% trên Berkeley Function Calling Leaderboard

## Error handling patterns

### Return structured errors

```json
{"error": true, "message": "City 'Toky' not found. Did you mean 'Tokyo'?", "code": "NOT_FOUND", "suggestions": ["Tokyo"]}
```

Bao gồm thông tin có thể hành động. "Không tìm thấy" là kém. "Không tìm thấy, có phải bạn muốn nói X?" là tốt. Mô hình dùng thông điệp lỗi để tự sửa.

### Retry strategy

1. Lệnh gọi công cụ thất bại với lỗi sửa được (lỗi gõ, giá trị enum sai)
2. Gửi lỗi lại mô hình dưới dạng kết quả công cụ
3. Mô hình điều chỉnh và thử lại
4. Tối đa 3 lần thử lại mỗi lệnh gọi công cụ
5. Sau 3 lần thất bại, trả lỗi cho người dùng

### Timeout handling

Đặt thời gian chờ cho mọi lần thực thi công cụ. 30 giây là mặc định hợp lý. Nếu công cụ hết thời gian chờ, trả lỗi timeout có cấu trúc để mô hình báo người dùng thay vì treo.

## Security checklist

| Kiểm tra | Tại sao | Cách làm |
|-------|-----|-----|
| Đưa hàm vào danh sách cho phép | Ngăn thực thi mã tùy ý | Chỉ đăng ký công cụ người dùng cần |
| Xác thực kiểu đối số | Ngăn tấn công nhầm lẫn kiểu | Kiểm tra kiểu trước thực thi |
| Làm sạch đối số chuỗi | Ngăn chèn | Từ chối hoặc escape ký tự đặc biệt |
| Tham số hóa truy vấn cơ sở dữ liệu | Ngăn SQL injection | Không bao giờ truyền SQL do mô hình sinh trực tiếp |
| Lọc kết quả công cụ | Ngăn rò rỉ dữ liệu | Bỏ khóa API, PII, lỗi nội bộ |
| Giới hạn tần suất gọi công cụ | Ngăn vòng lặp mất kiểm soát | Tối đa 10-20 lệnh gọi mỗi hội thoại |
| Ghi log mọi lệnh gọi công cụ | Dấu vết kiểm toán | Lưu tên công cụ, đối số, kết quả, dấu thời gian |
| Chặn duyệt xuyên đường dẫn | Ngăn truy cập hệ thống file | Từ chối `..` và đường dẫn tuyệt đối trong công cụ file |
| Sandbox thực thi mã | Ngăn truy cập hệ thống | Dùng container hoặc builtin bị hạn chế |
| Xác thực kích thước trả về | Ngăn nhồi ngữ cảnh | Cắt ngắn kết quả trên 10KB |

## Performance optimization

- **Gọi song song:** Khi mô hình yêu cầu nhiều công cụ độc lập, thực thi đồng thời bằng `asyncio.gather()` hoặc `concurrent.futures`
- **Cache:** Cache kết quả công cụ cho đối số giống hệt trong cùng phiên (thời tiết không thay đổi trong 60 giây)
- **Streaming:** Stream phản hồi cuối của mô hình trong khi kết quả công cụ đang được lấy
- **Cắt tỉa công cụ:** Nếu ngữ cảnh hạn chế, chỉ bao gồm định nghĩa công cụ liên quan đến truy vấn hiện tại (dùng bộ phân loại để lọc)
- **Mô hình nhỏ hơn để định tuyến:** Dùng `gpt-4o-mini` hoặc `claude-haiku-4-5` để chọn công cụ, rồi truyền kết quả cho mô hình mạnh hơn để tổng hợp

## Common failure patterns

| Thất bại | Nguyên nhân | Cách sửa |
|---------|-------|-----|
| Chọn sai công cụ | Mô tả mơ hồ | Viết lại mô tả với từ kích hoạt cụ thể |
| Thiếu đối số bắt buộc | Mô hình quên tham số | Thêm ví dụ rõ ràng trong mô tả tham số |
| Vòng lặp công cụ vô hạn | Mô hình liên tục gọi cùng công cụ | Đặt số vòng tối đa (5-10) và phát hiện lệnh gọi lặp |
| Đối số ảo giác | Mô hình tạo giá trị có vẻ hợp lý nhưng sai | Dùng enum, xác thực theo giá trị đã biết |
| Kết quả công cụ quá lớn | API trả 100KB dữ liệu | Cắt ngắn hoặc tóm tắt trước đưa trở lại |
| Mô hình bỏ qua kết quả công cụ | Định dạng kết quả khó hiểu | Trả JSON sạch với tên trường rõ ràng |
