---
id: filter-before-search
title: Filter on metadata ahead of the vector search
card: rag
kind: design
level: 2
roles: [applied-ai-engineer, forward-deployed-ai-engineer, ai-data-engineer]
rounds: [system-design, design-review]
tags: [metadata-filtering, access-control, hybrid-search, pre-filter]
minutes: 8
lessons: [phases/11-llm-engineering/07-advanced-rag, phases/19-capstone-projects/08-production-rag-chatbot]
manuals: []
practice: []
cheatsheet: [rag-production]
related: [rag/jurisdiction-leak-in-shared-index, rag/design-rag-over-company-docs]
updated: 2026-11-03
---

Một câu hỏi hỏi điều gì thay đổi trong chính sách bảo mật tháng trước. Tìm kiếm vector của bạn trả về một tài liệu bảo mật hai năm tuổi vì nó gần về ngữ nghĩa. Thiết kế bước truy xuất để điều này không thể xảy ra, và nói cùng cơ chế còn mang lại gì cho bạn trong một triển khai chịu quy định.

## Short answer

Lưu metadata với mỗi chunk, như nguồn, ngày tạo, danh mục, tác giả và phiên bản, và lọc theo nó trước khi tìm kiếm tương đồng chạy. Với câu hỏi này, bộ lọc là danh mục bảo mật và 30 ngày qua, nên tài liệu cũ không bao giờ là ứng viên. Dưới quy định, cùng bộ lọc trước mang các nhãn vai trò và tag khu vực tài phán, nên một người dùng chỉ truy xuất các chunk mà họ được phép thấy.

## Full answer

### Pre-filter, not post-filter

Một bộ lọc sau khi top k quay về có thể không để lại gì: nếu mọi chỗ trong top k đã thuộc về các tài liệu cũ, tài liệu đúng chưa bao giờ có cơ hội. Một bộ lọc được áp dụng trước tìm kiếm thu hẹp không gian mà tìm kiếm tương đồng chạy trên đó, điều bài học RAG nâng cao gọi là thiết yếu cho hiệu năng ở quy mô lớn, và một tài liệu bị loại không thể lấp một chỗ. Các kho vector hỗ trợ điều này dưới dạng lọc trước theo metadata.

### What to store

| Trường | Dùng cho |
|---|---|
| Tài liệu nguồn | trích dẫn và khử trùng lặp theo từng tài liệu |
| Ngày tạo và phiên bản | các cửa sổ thời gian và kiểm soát tài liệu lỗi thời |
| Danh mục | phạm vi, như bảo mật hoặc thanh toán |
| Tác giả | nguồn gốc |
| Nhãn vai trò | ai được thấy chunk |
| Tag khu vực tài phán | chunk thuộc phạm vi quy định nào |

### The regulated pipeline

Capstone production sắp thứ tự phía truy vấn như sau: lọc theo vai trò và khu vực tài phán trước, rồi truy xuất dense và BM25 song song, rồi hợp nhất thứ hạng, rồi top 20 tới reranker, rồi top 5 tới bộ sinh. Các nhãn được tạo ở bước nạp dữ liệu, cạnh các bản tóm tắt chunk, nên không gì phía sau phải đoán chúng.

### Prove it

Kiểm soát truy cập không được kiểm thử là một niềm hy vọng. Capstone chạy một đợt red team trước phát hành với các phép dò rò rỉ liên khu vực tài phán, và bài tập của nó xây dựng một lát kho ngữ liệu thứ hai dưới một khu vực tài phán khác và chạy một phép dò liên khu vực tài phán 20 câu hỏi, được chấm đạt hoặc không đạt.

## Follow-ups

- **Level 2:** Tại sao lọc trước tìm kiếm mà không phải sau? Expected: không gian tìm kiếm thu hẹp, giúp ích ở quy mô lớn, và một tài liệu bị loại không bao giờ có thể chiếm một chỗ trong top k.
- **Level 2:** Bạn lưu những trường nào với mỗi chunk? Expected: nguồn, ngày, danh mục, tác giả và phiên bản, cùng các nhãn vai trò và khu vực tài phán trong một môi trường chịu quy định.
- **Level 3:** Bạn kiểm thử bộ lọc vai trò giữ vững bằng cách nào? Expected: một tập dò các câu hỏi liên khu vực tài phán, mà capstone chạy như một kiểm tra 20 câu hỏi được chấm đạt hoặc không đạt.
- **Level 3:** Bộ lọc nằm ở đâu so với reranker và bộ sinh? Expected: trước truy xuất; capstone lọc, rồi chạy truy xuất lai, rồi reranker nhận top 20 và bộ sinh nhận top 5.

## Wrong answers

- "Đặt ngày vào văn bản truy vấn để embedding phản ánh nó." Một embedding không thực thi một ngày; một tài liệu cũ gần về ngữ nghĩa vẫn có điểm cao.
- "Lọc các kết quả sau khi top k quay về." Nếu top k toàn các tài liệu cũ, bộ lọc không để lại gì, và tài liệu đúng chưa bao giờ có cơ hội.
- "Bảo mô hình không dùng các tài liệu từ một khu vực tài phán khác." Kiểm soát truy cập thuộc về truy xuất, trước khi văn bản đến prompt.

## Taught in

Bài học [RAG nâng cao](../../../phases/11-llm-engineering/07-advanced-rag/) giải thích lọc trước theo metadata, và capstone [RAG production](../../../phases/19-capstone-projects/08-production-rag-chatbot/) áp dụng các bộ lọc truy cập trước truy xuất và dò chúng trong đợt red team.
