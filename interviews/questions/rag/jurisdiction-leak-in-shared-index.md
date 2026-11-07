---
id: jurisdiction-leak-in-shared-index
title: The other jurisdiction's clause reached the answer
card: rag
kind: design
level: 4
roles: [forward-deployed-ai-engineer, applied-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [system-design, design-review]
tags: [access-control, jurisdiction, red-team, pre-filter]
minutes: 15
lessons: [phases/19-capstone-projects/08-production-rag-chatbot, phases/11-llm-engineering/07-advanced-rag]
manuals: []
practice: []
cheatsheet: [rag-production]
related: [rag/filter-before-search, rag/design-rag-over-company-docs]
updated: 2026-11-03
---

Một trợ lý lĩnh vực chịu quy định phục vụ các nhà phân tích ở hai khu vực tài phán từ một chỉ mục. Trong một phép dò red-team, một câu hỏi được hỏi dưới một khu vực tài phán trả về một điều khoản hợp đồng thuộc khu vực kia. Reranker và bộ sinh hoạt động như thiết kế. Rò rỉ ở đâu, bạn đóng nó bằng cách nào, và bạn chứng minh nó giữ đóng bằng cách nào?

## Short answer

Rò rỉ ở truy xuất: tag khu vực tài phán đã không được áp dụng như một bộ lọc trước trước tìm kiếm tương đồng, nên một chunk gần về ngữ nghĩa từ khu vực tài phán kia đi vào nhóm ứng viên, và không gì phía sau được xây để loại nó. Đóng nó bằng cách gắn tag mọi chunk với vai trò và khu vực tài phán ở bước nạp dữ liệu và lọc theo cả hai trước khi truy xuất lai chạy. Chứng minh bằng một tập dò liên khu vực tài phán trong bộ red-team, được chấm đạt hoặc không đạt với một mức nghiêm trọng, và chạy trước mỗi bản phát hành.

## Full answer

### Why downstream stages cannot save you

Reranker sắp xếp các ứng viên nó nhận theo mức liên quan, và điều khoản bị rò rỉ là liên quan. Bộ sinh trích dẫn những gì được cho. Biện pháp bảo vệ đầu ra làm sạch dữ liệu cá nhân và chặn các chủ đề bị cấm; nó không biết một điều khoản thuộc khu vực tài phán nào. Kiểm soát truy cập phải xảy ra trước khi văn bản đến prompt, và giai đoạn duy nhất thấy toàn bộ kho ngữ liệu là truy xuất.

### The capstone order

Lọc theo vai trò và khu vực tài phán trước. Rồi chạy truy xuất dense và BM25 song song, hợp nhất theo thứ hạng, gửi top 20 tới reranker, top 5 tới bộ sinh, rồi các biện pháp bảo vệ, rồi trích dẫn và trả về. Các tag đến từ nạp dữ liệu, nơi mỗi chunk nhận một bản tóm tắt, một nhãn vai trò và một tag khu vực tài phán.

### Closing it

1. Gắn tag ở bước nạp dữ liệu, và cho bước nạp dữ liệu từ chối một chunk không có tag.
2. Lọc trước truy xuất, không phải trên top k sau đó; một bộ lọc sau có thể để lại một kết quả trống và vẫn để một chunk không có tag đi qua.
3. Xem khu vực tài phán của bên gọi là một tham số yêu cầu, không bao giờ là một gợi ý trong prompt.

### Proving it

Capstone chạy một đợt red team trước phát hành gồm 50 prompt đối kháng bao gồm các rò rỉ liên khu vực tài phán, được chấm đạt hoặc không đạt với một mức nghiêm trọng. Bài tập của nó thêm một lát kho ngữ liệu thứ hai dưới một khu vực tài phán khác và chạy một phép dò liên khu vực tài phán 20 câu hỏi. Đặt phép dò đó trong cổng phát hành cho mọi thay đổi đối với nạp dữ liệu hoặc truy xuất, và mang số rò rỉ trên dashboard drift như một yêu cầu bắt buộc bằng không.

## Follow-ups

- **Level 3:** Tại sao reranker không thể bắt điều khoản bị rò rỉ? Expected: nó chỉ sắp xếp các ứng viên nó nhận, và một điều khoản từ sai khu vực tài phán vẫn liên quan tới câu hỏi.
- **Level 3:** Tại sao biện pháp bảo vệ đầu ra không phải cách sửa? Expected: nó làm sạch dữ liệu cá nhân và chặn các chủ đề bị cấm; nó không thể biết một điều khoản thuộc khu vực tài phán nào.
- **Level 4:** Các tag tồn tại và rò rỉ vẫn tiếp diễn. Bạn kiểm tra gì? Expected: liệu bộ lọc chạy trước truy xuất hay trên top k sau đó, và liệu nạp dữ liệu có cho một chunk không có tag vào không.
- **Level 4:** Bạn giữ bằng chứng cập nhật bằng cách nào? Expected: chạy tập dò trong red team trên mọi thay đổi đối với nạp dữ liệu hoặc truy xuất, và hiển thị số rò rỉ trên dashboard drift với một ngưỡng bằng không.

## Wrong answers

- "Thêm một câu vào system prompt về khu vực tài phán của người dùng." Mô hình không thể xác minh một chunk thuộc khu vực tài phán nào; kiểm soát truy cập thuộc về truy xuất.
- "Các chỉ mục riêng giải quyết điều đó, không cần tag." Lọc vai trò vẫn cần nhãn, các tài liệu dùng chung bị sao chép, và phép dò vẫn cần để chứng minh sự phân chia giữ vững.
- "Red team đã đạt một lần, nên nó đã đóng." Một lần đạt chứng minh một bản build; phép dò chạy trên mọi thay đổi nạp dữ liệu hoặc truy xuất.

## Taught in

Capstone [RAG production](../../../phases/19-capstone-projects/08-production-rag-chatbot/) áp dụng bộ lọc truy cập trước truy xuất và dò nó trong red team, và bài học [RAG nâng cao](../../../phases/11-llm-engineering/07-advanced-rag/) giải thích lọc trước theo metadata.
