---
id: rag-service-company-docs
title: Design cited search over ten repositories of code
card: system-design
kind: design
level: 3
roles: [applied-ai-engineer, forward-deployed-ai-engineer, ai-data-engineer, agentic-ai-engineer]
rounds: [system-design]
tags: [rag, hybrid-retrieval, reranking, citations, incremental-indexing]
minutes: 25
lessons: [phases/19-capstone-projects/02-rag-over-codebase, phases/11-llm-engineering/13-production-app]
manuals: []
practice: []
cheatsheet: [rag-production, rag]
related: [system-design/batched-inference-api-budget, system-design/eval-platform-ship-gate]
updated: 2026-11-03
---

Một tổ chức kỹ thuật muốn hỏi các câu hỏi trên 10 repository với khoảng 2M dòng mã và nhận các câu trả lời trích dẫn file và dòng. Chỉ mục phải giữ mới trên mỗi lần push. Thiết kế việc nạp dữ liệu, truy xuất, bước trả lời, đường độ tươi, và đánh giá, với các ngân sách bạn sẽ cam kết.

## Short answer

Parse mỗi file thành các nút hàm và lớp và chia chunk tại các ranh giới đó, cho mỗi chunk một embedding dense, các thuật ngữ sparse và một bản tóm tắt một câu, và lưu một đồ thị import và lời gọi giữa các chunk. Một truy vấn chạy tìm kiếm dense và sparse song song, gộp và khử trùng lặp, xếp hạng lại top 50 bằng một cross-encoder để giữ 10, và trao chúng cho một mô hình ngữ cảnh dài phải trích dẫn mọi khẳng định theo file và dòng; các khẳng định không trích dẫn bị bỏ. Một lần push kích hoạt một diff cấp symbol để chỉ các chunk thay đổi được nhúng lại, với một ngân sách dưới 60 giây cho một lần push 50 file. Chất lượng được đo trên 100 câu hỏi liên repo được gán nhãn bằng MRR@10, nDCG@10, độ trung thực trích dẫn và độ trễ p50 và p99.

## Full answer

### Ingestion

- Một webhook push khởi động một worker thu thập các file thay đổi.
- Một parser có các ngữ pháp cho các ngôn ngữ trong tập repository trích xuất các nút hàm và lớp với toàn bộ đoạn nguồn. Các chunk đi theo ranh giới nút, không phải các cửa sổ token cố định.
- Mỗi chunk nhận ba biểu diễn: một embedding mã dense, các thuật ngữ sparse trong một chỉ mục có trọng số trường với tên symbol trọng số 4, phần thân 1 và tóm tắt 2, và một bản tóm tắt một câu được một mô hình nhỏ viết với lời mở đầu system được cache.
- Một đồ thị symbol ghi lại import, lời gọi và kế thừa qua các file và repository, được dùng ở thời điểm truy vấn để mở rộng truy xuất qua các ranh giới repo.

Bản tóm tắt là phương thức có thể truy xuất thứ ba: một người dùng hỏi một thứ được ủy quyền như thế nào, mã nói `check_permission`, và bản tóm tắt nói sự ủy quyền.

### Retrieval and answer

1. Khởi chạy tìm kiếm dense và sparse song song, khử trùng lặp theo repository, đường dẫn và symbol.
2. Xếp hạng lại top 50 bằng một cross-encoder và giữ top 10.
3. Gọi bộ tổng hợp với các chunk đã xếp hạng lại và một system prompt được cache, yêu cầu một điểm neo file và dòng trên mọi khẳng định.
4. Parse đầu ra và kiểm tra mỗi điểm neo theo đoạn ở commit được lập chỉ mục; một khẳng định không có điểm neo, hoặc với một đoạn bị thiếu hoặc không hỗ trợ nó, được hỏi lại hoặc bị bỏ. Chỉ các khẳng định đã xác minh được trả về.

Chỉ tìm kiếm cosine ngây thơ bị đầu độc bởi mã khuôn mẫu được sinh, trùng lặp monorepo và các symbol hiếm khi được import, đó là lý do tìm kiếm lai, reranker và đồ thị tồn tại.

### Freshness

Trên mỗi webhook tính diff cấp symbol. Chỉ nhúng lại các chunk có văn bản thay đổi, tính lại các cạnh import, lời gọi và kế thừa của các symbol thay đổi, và xóa các chunk, bản tóm tắt và cạnh của các file và symbol bị loại khỏi mọi kho. Ngân sách là một lần push 50 file có thể tìm kiếm trong dưới 60 giây cho toàn bộ tập repository, không xử lý lại 2M dòng.

### Evaluation and budgets

| Trọng số | Tiêu chí | Phép đo |
|---|---|---|
| 25 | Chất lượng truy xuất | MRR@10 và nDCG@10 trên 100 câu hỏi giữ lại |
| 20 | Độ trung thực trích dẫn | Tỷ lệ các khẳng định có một điểm neo file và dòng xác minh được |
| 20 | Độ trễ và quy mô | Độ trễ truy vấn p95 ở 10k QPS trên kho ngữ liệu đã lập chỉ mục |
| 20 | Lập chỉ mục gia tăng | Thời gian từ push tới có thể tìm kiếm trên một commit 50 file |
| 15 | Định dạng câu trả lời | Các trích dẫn click được, bản xem trước đoạn trích, khả năng hỏi tiếp |

Một lần chạy lại hàng tuần 100 câu hỏi với một cảnh báo khi MRR@10 giảm trên 5% bắt drift trong chỉ mục hoặc các mô hình.

### The service around it

Đường truy vấn nằm trong ngăn xếp production từ bài học ứng dụng: một gateway với các giới hạn theo từng người dùng, các guardrail trên đầu vào và đầu ra, streaming câu trả lời, các nhật ký có cấu trúc theo từng bước truy xuất và tổng hợp, và theo dõi chi phí quy riêng mô hình tóm tắt, các embedding, reranker và bộ tổng hợp.

## Follow-ups

- **Level 3:** Tại sao chia chunk tại các nút cú pháp thay vì các cửa sổ token cố định? Expected: một cửa sổ cắt đôi các hàm và trộn các phần lân cận; một nút là một đơn vị mạch lạc với một tên symbol ổn định để trích dẫn và khử trùng lặp theo.
- **Level 3:** Reranker thêm gì mà hai retriever không thể? Expected: nó chấm mỗi cặp truy vấn và ứng viên cùng nhau, chính xác hơn cosine trên các embedding riêng, ở một chi phí mà chỉ top 50 có thể chịu.
- **Level 4:** Mã khuôn mẫu được sinh chiếm một phần năm kho ngữ liệu. Điều gì xảy ra và bạn thay đổi gì? Expected: đầu độc truy xuất, nơi mã được sinh gần trùng lặp lấn các kết quả; đánh dấu các chunk được sinh trong payload và giảm trọng số của chúng.
- **Level 4:** Một câu hỏi cần mã từ bốn repository. Thành phần nào gánh điều đó? Expected: đồ thị symbol mở rộng tập ứng viên qua các cạnh import và lời gọi, để reranker thấy các chunk từ các repository mà tìm kiếm đầu đã bỏ lỡ.

## Wrong answers

- "Một cửa sổ ngữ cảnh triệu token thay thế truy xuất." Ngữ cảnh giúp nhưng không xếp hạng; các câu hỏi liên repo vẫn cần truy xuất và trích dẫn.
- "Chỉ các embedding dense là đủ cho mã." Các tên symbol chính xác cần chỉ mục sparse, và bản tóm tắt bắt ý định mà văn bản mã không nêu.
- "Lập chỉ mục lại tập repository trên mỗi lần push cho đơn giản." Xử lý lại 2M dòng mỗi commit phá ngân sách độ tươi; diff giữ chỉ mục nhất quán ở một phần công việc.

## Taught in

[Capstone RAG trên một codebase](../../../phases/19-capstone-projects/02-rag-over-codebase/) cung cấp việc nạp dữ liệu, truy xuất lai, quy tắc trích dẫn, ngân sách độ tươi và rubric, và [bài học ứng dụng LLM production](../../../phases/11-llm-engineering/13-production-app/) cung cấp dịch vụ quanh đường truy vấn.
