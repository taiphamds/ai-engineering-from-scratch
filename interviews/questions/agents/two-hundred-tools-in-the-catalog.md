---
id: two-hundred-tools-in-the-catalog
title: Two hundred registered tools, forty visible at a time
card: agents
kind: design
level: 4
roles: [agentic-ai-engineer, forward-deployed-ai-engineer]
rounds: [system-design, design-review]
tags: [tool-registry, progressive-disclosure, tool-catalog, schema, dispatcher]
minutes: 15
lessons: [phases/19-capstone-projects/21-tool-registry-schema-validation, phases/14-agent-engineering/31-agent-workbench-why-models-fail]
manuals: []
practice: []
cheatsheet: [tool-calling, agent-harness]
related: [agents/error-paths-the-model-can-fix]
updated: 2026-11-03
---

Harness của bạn đã tăng đến khoảng hai trăm công cụ trên một số nhóm. Mô hình không thể giữ tất cả trong ngữ cảnh, hai nhóm từng đăng ký cùng tên và nhóm thứ hai âm thầm thay thế nhóm đầu, và tỷ lệ thành công đã giảm khi catalog tăng. Thiết kế registry và chính sách cho những gì mô hình thấy ở mỗi lượt.

## Short answer

Làm registry thành nguồn sự thật duy nhất cho những gì tồn tại, các đối số có hình dạng nào và handler nào chạy, và chỉ cung cấp mười đến bốn mươi công cụ mỗi lượt. Registry giữ một bản ghi có kiểu cho mỗi công cụ, từ chối lần đăng ký thứ hai của một tên trừ khi bên gọi yêu cầu ghi đè, và xác thực mọi lời gọi với một tập con schema nhỏ bằng các lỗi dạng con trỏ. Chính sách cung cấp nạp metadata công cụ vào ngữ cảnh chỉ khi nhiệm vụ cần nó, và mô hình thấy càng ít công cụ, nó gọi chúng càng tốt.

## Full answer

### The record

| Trường | Mục đích |
|---|---|
| `name` | Duy nhất, các đoạn chữ thường phân cách bằng dấu chấm |
| `description` | Một dòng được hiển thị cho mô hình |
| `schema` | Một tập con JSON Schema có tám từ khóa |
| `handler` | Callable, không trong suốt đối với validator |
| `idempotent` | Cho dispatcher quyết định liệu một lần thử lại có an toàn hay không |
| `timeout_ms` | Ghi đè mặc định dispatcher theo công cụ |

Schema là dữ liệu và handler là mã. Giữ chúng tách biệt để việc xác thực không bao giờ kết thúc bên trong các handler.

### Three registry rules

1. **Không ghi đè âm thầm.** `register` phát sinh ngoại lệ trên một tên đã biết trừ khi `override=True`. Sự cố trong prompt là thiếu quy tắc này.
2. **Xác thực trước khi điều phối.** Một lần duyệt thuần, đệ quy trên schema trả về `Ok` hoặc một danh sách các lỗi có các đường dẫn JSON pointer. Không ép kiểu, không gọi handler, không I/O, nên validator có thể chạy lại trên một log phát lại.
3. **Registry là hình dạng, không phải an toàn.** Các timeout và sandboxing nằm trong dispatcher. Một lời gọi đã xác thực vẫn có thể hoạt động sai.

### The exposure policy

Một catalog hai trăm công cụ và một ngữ cảnh chứa vừa bốn mươi là một bài toán định tuyến. Cung cấp một tập con mỗi lượt dựa trên nhiệm vụ, và nạp phần còn lại đúng lúc. Bài học workbench mô tả mẫu là các skill được tiết lộ từng bước: một registry hàm có metadata đi vào ngữ cảnh chỉ khi cần. Cùng bài học báo cáo một nhóm xóa 80 phần trăm các công cụ của agent và thấy tỷ lệ thành công đi từ 80 phần trăm lên 100 phần trăm. Nhiều công cụ hơn trong tầm nhìn nghĩa là nhiều lựa chọn sai hơn, prompt dài hơn và nhiều schema hơn để đọc sai.

Các tín hiệu lựa chọn thực tế: hợp đồng phạm vi đang hoạt động, loại nhiệm vụ trên bảng, các công cụ được dùng trong vài lượt cuối, và một yêu cầu rõ ràng từ mô hình cho một họ có tên. Ghi log tập được cung cấp mỗi lượt để một thất bại có thể truy về một công cụ bị thiếu thay vì một lời gọi sai.

### What grows next

Qua khoảng năm mươi công cụ, thêm `$ref` đối với một khối định nghĩa cục bộ để các hình dạng đối số dùng chung được viết một lần, và `additionalProperties: false` để một đối số bổ sung là một lỗi thay vì bị bỏ âm thầm. Cả hai nhỏ. Cả hai phổ biến.

## Follow-ups

- **Level 3:** Hai nhóm muốn cùng tên công cụ cho các handler khác nhau. Bạn làm gì? Expected: từ chối sự trùng, đặt namespace bằng đoạn phân cách dấu chấm, và để chính sách cung cấp chọn họ mà nhiệm vụ cần.
- **Level 3:** Bạn chứng minh validator vẫn đúng sau một lần refactor thế nào? Expected: chạy nó trên một log phát lại đã lưu của các lời gọi thật, điều hoạt động vì nó không có I/O, không đồng hồ và không biến toàn cục.
- **Level 4:** Điều gì hỏng nếu chính sách cung cấp tự nó là một lời gọi mô hình? Expected: một bước không xác định thứ hai ở mỗi lượt, nên lựa chọn nên dựa trên quy tắc từ hợp đồng và bảng, với mô hình chỉ được phép yêu cầu một họ có tên.
- **Level 4:** Dispatcher thử lại một lời gọi thất bại. Trường bản ghi nào quyết định liệu nó có thể hay không? Expected: `idempotent`, vì một lần thử lại một công cụ không idempotent có thể lặp một tác dụng phụ.

## Wrong answers

- "Cho mô hình toàn bộ catalog và để nó chọn." Mô hình không thể giữ hai trăm schema, và thành công giảm khi catalog tăng, nên cách sửa là ít công cụ hơn trong tầm nhìn.
- "Đặt xác thực trong mỗi handler, gần mã nó bảo vệ." Xác thực bên trong các handler trôi dạt theo nhóm và biến dispatcher thành một trò đoán kết thúc bằng một stack trace.
- "Cho phép đăng ký lại để các nhóm có thể hot-fix một công cụ." Một lần thay thế âm thầm là sự cố trong prompt, và một cách sửa nên truyền một ghi đè rõ ràng xuất hiện trong đánh giá.

## Taught in

[Bài học registry công cụ](../../../phases/19-capstone-projects/21-tool-registry-schema-validation/) dựng bản ghi và validator, và [bài học tại sao các mô hình có năng lực vẫn thất bại](../../../phases/14-agent-engineering/31-agent-workbench-why-models-fail/) đặt các skill và catalog công cụ trong số các primitive harness.
