---
id: lost-in-the-middle-order
title: Where each part of the context goes, and why
card: prompting-structured-output
kind: concept
level: 2
roles: [applied-ai-engineer, agentic-ai-engineer, forward-deployed-ai-engineer]
rounds: [screen, system-design]
tags: [context-engineering, lost-in-the-middle, token-budget, ordering]
minutes: 8
lessons: [phases/11-llm-engineering/05-context-engineering]
manuals: []
practice: []
cheatsheet: [context-engineering]
related: [prompting-structured-output/tool-budget-fifty-tools, prompting-structured-output/timestamp-kills-the-cache]
updated: 2026-11-03
---

Bạn lắp một prompt từ một system message, mười tài liệu truy xuất, lịch sử chat đến nay và câu hỏi người dùng. Bạn đặt chúng theo thứ tự nào, và bằng chứng nào quyết định?

## Short answer

Đặt system prompt và các instruction quan trọng trước, câu hỏi hiện tại và ngữ cảnh liên quan nhất cuối, và tài liệu ưu tiên thấp nhất ở giữa. Bằng chứng là phát hiện lost-in-the-middle: với một tài liệu liên quan trong 20 tài liệu, độ chính xác là 85 đến 90 phần trăm khi nằm đầu hoặc cuối và giảm xuống 60 đến 70 phần trăm ở giữa. Nếu một điểm chính phải nằm giữa, lặp nó ở cuối.

## Full answer

### The finding

Các mô hình attend tốt nhất đến đầu và cuối ngữ cảnh. Nghiên cứu đặt một tài liệu liên quan trong 20 tài liệu không liên quan và di chuyển nó. Đầu hoặc cuối, độ chính xác 85 đến 90 phần trăm. Ở giữa, 60 đến 70 phần trăm. Bài học tổng quát hóa là mức giảm 10 đến 20 phần trăm cho thông tin ở 40 đến 70 phần trăm chiều dài ngữ cảnh.

### The budget

| Thành phần | Kích thước điển hình |
|---|---|
| System prompt | khoảng 500 token |
| Các định nghĩa công cụ | 2K đến 8K token |
| Ngữ cảnh truy xuất | 2K đến 10K token |
| Lịch sử hội thoại | 2K đến 20K token |
| Các ví dụ few-shot | 1K đến 3K token |
| Truy vấn người dùng | 100 đến 500 token |
| Dự trữ sinh | 2K đến 8K token |

Mọi token trong cửa sổ chiếm chỗ một token có thể mang nhiều tín hiệu hơn. Một prompt 10K có 90 phần trăm tín hiệu thắng một prompt 100K có 10 phần trăm tín hiệu.

### Do not include all ten documents

Truy xuất xấu tệ hơn không có; nó lấp cửa sổ bằng nhiễu và làm mô hình hiểu sai. Chấm mỗi tài liệu đối chiếu truy vấn và bỏ các tài liệu dưới một ngưỡng. Nếu bạn truy xuất 10 chunk và 3 liên quan, giữ 3.

### The reorder

Hàm của bài học sắp các tài liệu theo điểm, gửi các hạng lẻ lên đầu theo thứ tự và các hạng chẵn xuống cuối theo thứ tự ngược, để các tài liệu tốt nhất nằm ở hai đầu và yếu nhất ở giữa. Rồi lịch sử, được nén thành một bản tóm tắt khi vượt một ngưỡng, rồi câu hỏi cuối, với 2,000 đến 4,000 token dành cho câu trả lời.

## Follow-ups

- **Level 2:** Tại sao không bao gồm tất cả mười tài liệu truy xuất? Expected: truy xuất xấu tệ hơn không có; chấm mỗi tài liệu đối chiếu truy vấn, bỏ các tài liệu dưới một ngưỡng, và giữ 3 tài liệu liên quan thay vì 10 tài liệu tầm thường.
- **Level 2:** Bạn dành gì ở cuối cửa sổ, và bao nhiêu? Expected: ngân sách sinh, ít nhất 2,000 đến 4,000 token, nếu không mô hình không có chỗ trả lời.
- **Level 3:** Việc sắp lại của bài học đặt năm tài liệu có điểm như thế nào? Expected: được sắp theo điểm, các hạng lẻ đi lên đầu theo thứ tự và các hạng chẵn đi xuống cuối theo thứ tự ngược, để tài liệu tốt nhất nằm ở hai đầu.
- **Level 3:** Cùng system prompt được gửi trên mọi lượt. Điều đó hàm ý gì cho kích thước của nó? Expected: mọi từ được trả tiền trên mọi lời gọi, nên giữ gọn; bài học trích một trợ lý lập trình với khoảng 6,000 token system prompt và các định nghĩa công cụ.

## Wrong answers

- "Cửa sổ khổng lồ, nhiều ngữ cảnh hơn luôn tốt hơn." Một prompt 10K có 90 phần trăm tín hiệu thắng một prompt 100K có 10 phần trăm tín hiệu; nhiều ngữ cảnh hơn là nhiều nhiễu hơn cho attention lọc.
- "Đặt câu hỏi trước để mô hình biết tìm gì." Cuối ngữ cảnh cũng nhận attention cao; bài học đặt truy vấn hiện tại cuối và instruction trước.
- "Thứ tự không quan trọng, attention thấy mọi thứ." Mức giảm đo được ở giữa là 10 đến 20 phần trăm.

## Taught in

Bài học [context engineering](../../../phases/11-llm-engineering/05-context-engineering/) đưa ra các con số lost-in-the-middle, bảng ngân sách và hàm sắp lại.
