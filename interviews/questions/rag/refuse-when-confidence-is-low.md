---
id: refuse-when-confidence-is-low
title: Let the assistant say it does not know
card: rag
kind: design
level: 3
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer, forward-deployed-ai-engineer]
rounds: [system-design, design-review]
tags: [refusal, hallucination, citations, threshold]
minutes: 10
lessons: [phases/19-capstone-projects/69-end-to-end-rag-system, phases/05-nlp-foundations-to-advanced/13-question-answering, phases/19-capstone-projects/08-production-rag-chatbot, phases/19-capstone-projects/66-reranker-cross-encoder]
manuals: []
practice: []
cheatsheet: [rag-production]
related: [rag/design-rag-over-company-docs, rag/faithfulness-vs-relevance]
updated: 2026-11-03
---

Trợ lý tài liệu của bạn trả lời mọi câu hỏi, bao gồm những câu mà kho ngữ liệu không bao phủ, và các câu trả lời bịa ra là những câu người dùng nhớ. Thiết kế đường cho phép hệ thống nói nó không biết, và nói bạn đo đường đó hoạt động bằng cách nào.

## Short answer

Ghi nhật ký điểm rank-1 của reranker cho mọi truy vấn và từ chối khi nó rơi dưới một ngưỡng riêng theo kho ngữ liệu, thay vì đưa các chunk yếu cho bộ sinh. Bảo bộ sinh chỉ trả lời từ các đoạn trích, trích dẫn mọi khẳng định và nói nó không biết khi các đoạn trích không trả lời được. Đo hiệu chuẩn từ chối: trên các câu hỏi có câu trả lời không nằm trong kho, đếm mức thường xuyên hệ thống từ chối, và theo dõi tỷ lệ tự tin sai.

## Full answer

### Gate 1: before generation

Bài học reranker ghi nhật ký điểm cross-encoder rank-1. Một truy vấn có điểm cao nhất nằm dưới một ngưỡng riêng theo kho ngữ liệu là một kết quả trúng ngoài lĩnh vực, và bài học đầu cuối từ chối trên nó: bộ sinh trả về văn bản từ chối không có trích dẫn. Capstone production gọi điều này là chế độ không chắc và đo mức giảm tự tin sai. Bài học hỏi đáp bắt đầu đơn giản hơn, với một ngưỡng trên độ tương đồng truy xuất cao nhất, và tinh chỉnh nó trên một tập giữ lại.

### Gate 2: inside generation

Prompt bảo mô hình chỉ dùng các đoạn trích, trích dẫn mọi khẳng định với điểm neo của nó, và nói nó không biết khi các đoạn trích không trả lời được. Bài học hỏi đáp đo rằng chỉ dẫn tường minh về căn cứ và từ chối cắt ảo giác từ 40 đến 60 phần trăm so với một prompt ngây thơ.

### Gate 3: after generation

Parse câu trả lời và kiểm tra từng khẳng định theo đoạn mà điểm neo của nó trích dẫn. Một khẳng định không có điểm neo, hoặc có một điểm neo mà đoạn của nó không nêu khẳng định, bị bỏ hoặc được gửi lại để hỏi lại. Một câu trả lời lọt qua cổng điểm khi đó không thể đưa ra một khẳng định mà đoạn được trích dẫn không hỗ trợ.

### How to measure it

- **Hiệu chuẩn từ chối.** Trên một tập câu hỏi không có câu trả lời trong kho, tỷ lệ mà hệ thống từ chối.
- **Tỷ lệ tự tin sai.** Tỷ lệ các câu hỏi đó vẫn nhận được một câu trả lời.
- **Tỷ lệ từ chối sai.** Trên các câu hỏi trong kho ngữ liệu, tỷ lệ bị từ chối. Một ngưỡng quá cao thất bại ở đây.

Di chuyển ngưỡng trên tập giữ lại, không bao giờ trên các giai thoại production, và tinh chỉnh lại khi bộ nhúng, reranker hoặc kho ngữ liệu thay đổi.

## Follow-ups

- **Level 3:** Ngưỡng đến từ đâu? Expected: phân phối các điểm rank-1 trên một tập giữ lại với các câu hỏi trong kho ngữ liệu và ngoài kho ngữ liệu đã biết; nó riêng theo kho ngữ liệu.
- **Level 3:** Prompt bộ sinh cần gì ngoài "chỉ dùng ngữ cảnh"? Expected: trích dẫn mỗi khẳng định với điểm neo của nó và nói nó không biết khi các đoạn trích không trả lời được; chỉ dẫn tường minh cắt ảo giác từ 40 đến 60 phần trăm trong bài học hỏi đáp.
- **Level 4:** Quá nhiều lần từ chối cũng là một lỗi. Bạn cân bằng bằng cách nào? Expected: theo dõi tỷ lệ tự tin sai trên các câu hỏi ngoài kho ngữ liệu cạnh tỷ lệ từ chối sai trên các câu hỏi trong kho ngữ liệu, và di chuyển ngưỡng trên tập giữ lại.
- **Level 4:** Bộ lọc sau trích dẫn hoạt động với cổng từ chối như thế nào? Expected: mỗi khẳng định được kiểm tra theo đoạn mà điểm neo của nó trích dẫn, và một khẳng định không có điểm neo hoặc có một đoạn không nêu nó bị bỏ hoặc hỏi lại, nên một câu trả lời yếu vượt qua cổng điểm không thể đưa ra một khẳng định không được hỗ trợ.

## Wrong answers

- "Bảo mô hình cẩn thận." Một chỉ dẫn không thể thấy các điểm truy xuất; cổng đầu tiên thuộc về trước khi sinh.
- "Từ chối khi truy xuất trả về ít hơn k chunk." Một số lượng không phải độ tin cậy; các chunk yếu vẫn lấp k chỗ.
- "Đặt ngưỡng một lần từ fixture." Nó riêng theo kho ngữ liệu và di chuyển khi bộ nhúng, reranker hoặc kho ngữ liệu thay đổi.

## Taught in

Bài học [RAG đầu cuối](../../../phases/19-capstone-projects/69-end-to-end-rag-system/) xây dựng đường từ chối và bộ sinh có trích dẫn, bài học [hỏi đáp](../../../phases/05-nlp-foundations-to-advanced/13-question-answering/) định nghĩa hiệu chuẩn từ chối, capstone [RAG production](../../../phases/19-capstone-projects/08-production-rag-chatbot/) thêm chế độ không chắc, và bài học [cross-encoder](../../../phases/19-capstone-projects/66-reranker-cross-encoder/) ghi nhật ký điểm rank-1.
