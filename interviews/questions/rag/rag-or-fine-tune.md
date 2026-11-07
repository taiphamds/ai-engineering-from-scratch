---
id: rag-or-fine-tune
title: Retrieval or fine-tuning for the policy wiki
card: rag
kind: concept
level: 1
roles: [applied-ai-engineer, forward-deployed-ai-engineer, ai-developer-relations-engineer]
rounds: [screen, ml-breadth]
tags: [rag, fine-tuning, freshness, auditability]
minutes: 6
lessons: [phases/11-llm-engineering/06-rag]
manuals: []
practice: []
cheatsheet: [rag]
related: [rag/recall-at-k-first]
updated: 2026-11-03
---

Một nhóm sản phẩm muốn một trợ lý trả lời các câu hỏi về wiki chính sách nội bộ. Một kỹ sư đề xuất tinh chỉnh mô hình trên các trang wiki. Một người khác đề xuất tìm kiếm các trang ở thời điểm hỏi và dán các kết quả khớp vào prompt. Bạn chọn gì, và trong trường hợp nào bạn vẫn tinh chỉnh mô hình?

## Short answer

Chọn truy xuất cho kiến thức. Mô hình không bao giờ thay đổi, kho tài liệu cập nhật trong vài phút, và bạn có thể cho thấy các đoạn đứng sau mỗi câu trả lời. Tinh chỉnh phù hợp khi bạn cần một phong cách, một giọng điệu hoặc một mẫu suy luận mà prompt không đạt được, không phải khi bạn cần các dữ kiện.

## Full answer

### Why retrieval wins on facts

Bài học đặt hai cách cạnh nhau trên năm mối quan tâm:

| Mối quan tâm | Mô hình đã tinh chỉnh | Truy xuất |
|---|---|---|
| Chi phí | một lần huấn luyện tốn từ $1,000 đến hơn $100,000 | một truy vấn tốn $0.01 đến $0.10 cho embedding và lệnh gọi mô hình |
| Độ tươi | lỗi thời cho đến lần huấn luyện tiếp theo | lập chỉ mục lại trang thay đổi và truy vấn tiếp theo thấy nó |
| Kiểm toán | không có cách lần một dữ kiện về một trang | các đoạn truy xuất được hiển thị và có thể trả về |
| Tính có căn cứ | mô hình vẫn tự do bịa dữ kiện | prompt bảo mô hình chỉ trả lời từ các đoạn |
| Riêng tư | các trang được gắn vào trọng số | các trang nằm trong kho riêng của bạn |

Tinh chỉnh thay đổi trọng số lâu dài. Truy xuất thay đổi ngữ cảnh cho một yêu cầu. Đối với các dữ kiện, một ngữ cảnh tạm thời là điều bạn muốn.

### The one case for tuning

Khi mục tiêu là cách mô hình viết hoặc suy luận, và prompting không đạt được, tinh chỉnh là công cụ đúng. Một giọng cố định, một định dạng riêng hoặc một thói quen suy luận nằm trong trọng số tốt hơn trong một chỉ dẫn dài.

### The shape of the system

Truy xuất chạy trong hai pha. Pha lập chỉ mục chia chunk từng trang, nhúng từng chunk và lưu các vector với văn bản. Pha truy vấn nhúng câu hỏi, tìm các chunk top k, xây dựng một prompt từ chúng và gọi mô hình. Bài học đặt ngân sách k ở 5 đến 10 chunk và 2,500 đến 5,000 token văn bản truy xuất mỗi truy vấn.

## Follow-ups

- **Level 1:** Một trang chính sách thay đổi. Điều gì xảy ra trong mỗi cách tiếp cận? Expected: với truy xuất bạn lập chỉ mục lại trang đó và câu trả lời tiếp theo dùng văn bản mới; với một mô hình đã tinh chỉnh, dữ kiện cũ giữ lại cho đến khi bạn huấn luyện lại.
- **Level 2:** Một người rà soát pháp lý hỏi câu trả lời đến từ trang nào. Cách tiếp cận nào có thể cho thấy điều đó? Expected: truy xuất, vì các đoạn đi vào prompt được biết và có thể trả về với câu trả lời.
- **Level 2:** Tại sao câu chuyện riêng tư khác nhau? Expected: với truy xuất, các trang nằm trong kho của bạn và chỉ các chunk khớp đến mô hình cho một lệnh gọi; với tinh chỉnh, nội dung nằm bên trong trọng số của mô hình bạn triển khai.
- **Level 3:** Câu trả lời sai dù đoạn đúng nằm trong kho. Bạn kiểm tra giai đoạn nào trước? Expected: truy xuất, với recall ở k, vì mô hình không thể dùng một đoạn mà tìm kiếm không trả về.

## Wrong answers

- "Tinh chỉnh mô hình, vì khi đó nó biết các tài liệu." Trọng số giữ một bản sao sẽ lỗi thời, và không gì trong đầu ra nói một dữ kiện đến từ trang nào.
- "Truy xuất luôn tốt hơn." Một phong cách cố định, một giọng điệu hoặc một mẫu suy luận được học bằng tinh chỉnh tốt hơn bằng một prompt.
- "Bỏ qua tìm kiếm và đặt toàn bộ wiki vào prompt." Bài học đặt ngân sách 2,500 đến 5,000 token văn bản truy xuất mỗi truy vấn; toàn bộ wiki không vừa, và văn bản không liên quan pha loãng prompt.

## Taught in

Bài học [RAG](../../../phases/11-llm-engineering/06-rag/) so sánh hai cách tiếp cận và xây dựng các pha lập chỉ mục và truy vấn.
