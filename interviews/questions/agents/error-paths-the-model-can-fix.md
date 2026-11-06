---
id: error-paths-the-model-can-fix
title: Read the registry, what the model gets back on a bad call
card: agents
kind: code-reading
level: 2
roles: [agentic-ai-engineer, ai-developer-relations-engineer]
rounds: [coding, screen]
tags: [tool-registry, json-schema, validation, json-pointer, self-correction]
minutes: 10
lessons: [phases/19-capstone-projects/21-tool-registry-schema-validation]
manuals: []
practice: [tool-call-parser]
cheatsheet: [tool-calling]
related: [agents/five-parts-of-an-agent-loop]
updated: 2026-11-03
---

Một công cụ được đăng ký với schema này, và mô hình gửi bốn tập đối số bên dưới. Với mỗi tập, hãy nói registry trả về gì và tại sao hình dạng câu trả lời có ý nghĩa đối với mô hình.

```python
registry.register(
    name="db.get_user",
    schema={
        "type": "object",
        "required": ["id"],
        "properties": {
            "id": {"type": "integer"},
            "fields": {"type": "array", "items": {"type": "string", "enum": ["id", "name", "email"]}},
        },
    },
    handler=get_user,
)
cases = [
    {"id": 42, "fields": ["id", "name"]},
    {"id": "forty-two"},
    {"fields": ["id"]},
    {"id": 1, "fields": ["id", "phone"]},
]
```

## Short answer

Trường hợp đầu tiên vượt qua xác thực và trả về một kết quả Ok. Trường hợp thứ hai trả về một lỗi tại `/id` với từ khóa `type`, vì một chuỗi không phải một số nguyên và validator không bao giờ ép kiểu. Trường hợp thứ ba trả về một lỗi tại `/id` với từ khóa `required`, vì thuộc tính bị thiếu. Trường hợp thứ tư trả về một lỗi tại `/fields/1` với từ khóa `enum`, vì `phone` không phải một giá trị được phép, và đường dẫn trỏ đến chính xác phần tử để mô hình có thể sửa giá trị đó trong lời gọi tiếp theo.

## Full answer

### The walk

Validator điều phối theo `type`. Với một đối tượng nó kiểm tra `required` trước, rồi duyệt mỗi thuộc tính có một schema. Với một mảng nó duyệt mỗi phần tử bằng schema `items` và nối thêm chỉ mục vào đường dẫn. Một kiểu không khớp dừng việc duyệt tại nút đó và báo cáo một lỗi, nên một kiểu sai không tạo ra một chuỗi lỗi lồng nhau bên dưới nó.

| Trường hợp | Kết quả | Đường dẫn | Từ khóa |
|---|---|---|---|
| `{"id": 42, "fields": ["id", "name"]}` | `Ok` | | |
| `{"id": "forty-two"}` | một lỗi | `/id` | `type` |
| `{"fields": ["id"]}` | một lỗi | `/id` | `required` |
| `{"id": 1, "fields": ["id", "phone"]}` | một lỗi | `/fields/1` | `enum` |

### Why the path is the product

Mô hình đọc một con trỏ tốt hơn một câu. Một lỗi nói trường email kỳ vọng một chuỗi, với đường dẫn `/user/email`, được sửa trong một vòng trao đổi. Một thông điệp văn xuôi nói các đối số không hợp lệ tốn một lượt đoán. Các đường dẫn theo dạng JSON pointer: các tên thuộc tính và chỉ mục mảng được phân cách bằng dấu gạch chéo, với `~` và `/` được escape bên trong một đoạn.

### What the validator refuses to do

- Nó không ép kiểu. Chuỗi `"42"` trượt một schema số nguyên hoặc số. Một mô hình học rằng các chuỗi được chấp nhận gửi các chuỗi ở khắp nơi.
- Nó không gọi handler. Schema là dữ liệu và handler là mã, và trộn chúng đặt việc xác thực bên trong các handler nơi nó trôi dạt.
- Nó không phải một ranh giới bảo mật. Một handler có thể hoạt động sai sau khi xác thực đạt. Dispatcher thêm các timeout và sandboxing. Registry thêm hình dạng.

### Registration hygiene

`register` từ chối một tên đã có trong bảng trừ khi bên gọi truyền `override=True`. Hai phần của một codebase đăng ký cùng tên là một lỗi mất một tuần để tìm trong production, nên mặc định là phát sinh ngoại lệ.

## Follow-ups

- **Level 2:** Mô hình gửi `{"id": true}`. Điều gì xảy ra? Expected: một lỗi kiểu tại `/id`, vì validator coi một boolean không phải một số nguyên mặc dù ngôn ngữ sẽ chấp nhận nó.
- **Level 2:** Tại sao một kiểu không khớp dừng việc duyệt tại nút đó? Expected: các nút con không có ý nghĩa khi nút cha sai kiểu, và một lỗi rõ ràng tốt hơn một danh sách các lỗi do cùng sai lầm gây ra.
- **Level 3:** Schema dùng `oneOf`. `register` làm gì? Expected: nó phát sinh ngoại lệ, vì registry hỗ trợ tám từ khóa và từ chối bất kỳ thứ gì ngoài tập con tại thời điểm đăng ký.
- **Level 3:** Catalog vượt năm mươi công cụ và các schema bắt đầu lặp lại. Bạn thêm hai phần mở rộng nào trước? Expected: `$ref` đối với một khối định nghĩa cục bộ, và `additionalProperties: false` cho một hình dạng nghiêm ngặt.

## Wrong answers

- "Trả về một thông điệp nói các đối số không hợp lệ và để mô hình thử lại." Một lần thử lại không có đường dẫn là một lần đoán, và một đường dẫn sửa lời gọi trong một vòng trao đổi.
- "Ép chuỗi thành một số, vì ý định rõ ràng." Ép kiểu dạy mô hình rằng schema là lời khuyên, và lời gọi tiếp theo gửi một chuỗi ở nơi không có ép kiểu.
- "Xác thực làm cho công cụ an toàn để gọi." Xác thực kiểm tra hình dạng, và handler vẫn có thể hoạt động sai, nên các timeout và sandboxing thuộc về dispatcher.

## Taught in

[Bài học registry công cụ](../../../phases/19-capstone-projects/21-tool-registry-schema-validation/) dựng registry, validator tám từ khóa và các đường dẫn con trỏ.
