---
id: design-rag-over-company-docs
title: Design a question answering service over company documents
card: rag
kind: design
level: 3
roles: [applied-ai-engineer, forward-deployed-ai-engineer, ai-data-engineer, ai-evaluation-reliability-engineer]
rounds: [system-design]
tags: [rag, system-design, hybrid-search, access-control, evaluation]
minutes: 30
lessons: [phases/11-llm-engineering/06-rag, phases/11-llm-engineering/07-advanced-rag, phases/19-capstone-projects/69-end-to-end-rag-system, phases/19-capstone-projects/08-production-rag-chatbot, phases/19-capstone-projects/68-rag-eval-precision-recall]
manuals: []
practice: []
cheatsheet: [rag, rag-production]
related: [rag/filter-before-search, rag/refuse-when-confidence-is-low, rag/take-home-stratified-eval]
updated: 2026-11-03
---

Thiết kế một dịch vụ hỏi đáp trên các tài liệu nội bộ của một công ty: wiki, chính sách, hợp đồng và bài viết hỗ trợ, vài trăm nghìn trang, với các cập nhật hàng tuần. Người dùng là nhân viên có các quyền truy cập khác nhau. Trình bày pipeline, việc đánh giá, và ba điều đầu tiên bạn sẽ đo trong production.

## Short answer

Xây dựng hai phía. Phía nạp dữ liệu parse từng tài liệu, chia chunk theo từng tài liệu bằng một bộ chia nhận biết cấu trúc, nhúng các chunk, và lập chỉ mục các vector dense và một chỉ mục BM25 với metadata và nhãn truy cập trên mọi chunk. Phía truy vấn lọc theo truy cập trước, chạy truy xuất lai với hợp nhất thứ hạng, xếp hạng lại một nhóm ứng viên bằng một cross-encoder, và sinh một câu trả lời có trích dẫn với một đường từ chối. Chứng minh bằng một tập chuẩn được các chuyên gia lĩnh vực gán nhãn và một đánh giá truy xuất báo cáo recall ở k theo từng lớp truy vấn, rồi đo chất lượng truy xuất hàng tuần, độ trung thực và tính đúng đắn của trích dẫn theo từng lượt, và chi phí mỗi truy vấn trong production.

## Full answer

### Requirements first

- **Độ tươi.** Cập nhật hàng tuần nghĩa là lập chỉ mục lại các tài liệu thay đổi, không phải huấn luyện lại một mô hình.
- **Truy cập.** Các quyền khác nhau nghĩa là nhãn theo từng chunk và một bộ lọc trước truy xuất.
- **Kiểm toán.** Các câu trả lời phải chỉ tới các đoạn mà chúng xuất phát.
- **Quy mô.** Vài trăm nghìn trang không vừa bất kỳ prompt nào; truy xuất quyết định những gì mô hình thấy.

### Ingestion

1. Parse từng tài liệu thành văn bản và cấu trúc.
2. Chia chunk theo từng tài liệu. Bắt đầu bằng chia đệ quy ở 512 token và không chồng lấn; dùng bộ chia heading cho markdown; chặn mọi chunk bằng một mức tối thiểu và tối đa; không bao giờ để một chunk trải qua hai tài liệu.
3. Gắn metadata: nguồn, ngày, phiên bản, danh mục, tác giả, nhãn vai trò, tag khu vực tài phán hoặc đơn vị kinh doanh.
4. Nhúng từng chunk và ghi vector cùng payload của nó. Xây dựng một chỉ mục BM25 bên cạnh với trọng số trường để một kết quả khớp tiêu đề hoặc mã được tính nhiều hơn một kết quả khớp phần thân.

### Query

1. Lọc không gian ứng viên theo các nhãn vai trò của bên gọi trước bất kỳ tìm kiếm nào.
2. Chạy truy xuất dense và BM25 song song và hợp nhất theo thứ hạng.
3. Gửi top 20 tới một cross-encoder và giữ top 5, phễu mà capstone production sử dụng.
4. Xây dựng prompt với các phần ổn định trước: system prompt và các chính sách tĩnh, rồi ngữ cảnh đã xếp hạng lại, rồi câu hỏi. Capstone nhắm tới tỷ lệ cache hit 60 đến 80 phần trăm trên tiền tố đó, làm giảm chi phí mỗi truy vấn từ 3 đến 5 lần.
5. Sinh với các chỉ dẫn trích dẫn mọi khẳng định và từ chối khi các đoạn trích không trả lời được; chặn theo điểm rank-1 của reranker trước khi sinh và bỏ các khẳng định không có trích dẫn sau đó.

### Evaluation before launch

- Một tập chuẩn gồm 200 cặp câu hỏi và câu trả lời có trích dẫn, được một chuyên gia lĩnh vực gán nhãn, như capstone yêu cầu.
- Qrels theo các tầng: một tập smoke 20 truy vấn trong CI, một tập hồi quy 200 mỗi đêm, một tập sâu 2000 hàng tuần.
- Các chỉ số truy xuất theo từng lớp truy vấn: recall ở k trước, rồi MRR, rồi nDCG nếu mức liên quan được phân bậc.
- Các chỉ số câu trả lời: độ trung thực và mức liên quan, được chấm bởi một mô hình từ họ khác.
- Một đợt red team với 50 prompt đối kháng: jailbreak, các nỗ lực trích xuất dữ liệu, câu hỏi ngoài lĩnh vực và rò rỉ giữa các đơn vị.

### The first three production measurements

1. **Chất lượng truy xuất trên tập chuẩn, hàng tuần.** Capstone cảnh báo khi giảm 5 phần trăm. Phân lát theo loại tài liệu và đơn vị kinh doanh.
2. **Độ trung thực và tính đúng đắn của trích dẫn theo từng lượt.** Chúng bắt được việc bộ sinh bịa hoặc trích dẫn sai trong khi truy xuất vẫn ổn.
3. **Chi phí và độ trễ mỗi truy vấn theo từng giai đoạn.** Tỷ lệ cache hit, token mỗi truy vấn, và sự phân chia giữa truy xuất, trong khoảng 50 đến 200 ms của bài học, và sinh, trong khoảng 500 đến 3000 ms.

## Follow-ups

- **Level 3:** Kiểm soát truy cập nằm ở đâu? Expected: trong bộ lọc truy xuất, dưới dạng các nhãn vai trò trên chunk được áp dụng trước tìm kiếm tương đồng, và không bao giờ trong văn bản prompt.
- **Level 3:** Một tài liệu thay đổi vào thứ Ba. Điều gì lỗi thời và trong bao lâu? Expected: các chunk của nó, cho đến lần lập chỉ mục lại tiếp theo; chỉ nhúng lại các tài liệu thay đổi, mang phiên bản trong metadata, và theo dõi khoảng cách giữa cập nhật nguồn và cập nhật chỉ mục.
- **Level 4:** Bạn giữ chi phí mô hình thấp ở khối lượng này bằng cách nào? Expected: một prompt thân thiện với cache với system prompt và các chính sách trước, ngữ cảnh đã xếp hạng lại tiếp theo và câu hỏi cuối cùng; capstone nhắm tới tỷ lệ hit 60 đến 80 phần trăm và chi phí mỗi truy vấn thấp hơn từ 3 đến 5 lần.
- **Level 4:** Tập chuẩn đạt và một phòng ban vẫn báo cáo các câu trả lời kém. Bạn làm gì? Expected: phân lát đánh giá theo loại tài liệu và lớp truy vấn, thêm các truy vấn thực của phòng ban đó vào qrels, và kiểm tra tài liệu của họ có được chia chunk bằng một bộ chia phù hợp định dạng không.

## Wrong answers

- "Đặt mọi tài liệu vào một prompt dài." Hàng trăm nghìn trang không vừa, và bài học dành ngân sách 2,500 đến 5,000 token văn bản được truy xuất mỗi truy vấn là có lý do.
- "Tinh chỉnh mô hình trên các tài liệu mỗi tuần." Nó không thể trích dẫn, nó lỗi thời giữa các lần chạy, và nó không thể thực thi quyền truy cập.
- "Chỉ tìm kiếm vector là đủ." Các định danh, mã và tên chính xác cần phía từ vựng; chạy cả hai và hợp nhất.
- "Phát hành mà không có tập được gán nhãn, demo hoạt động mà." Một demo trên mười tài liệu không nói gì về hàng trăm nghìn trang; gán nhãn tập chuẩn trước.

## Taught in

Bài học [RAG](../../../phases/11-llm-engineering/06-rag/) xây dựng hai pha, bài học [RAG nâng cao](../../../phases/11-llm-engineering/07-advanced-rag/) thêm tìm kiếm lai, xếp hạng lại và các bộ lọc metadata, bài học [RAG đầu cuối](../../../phases/19-capstone-projects/69-end-to-end-rag-system/) kết hợp các giai đoạn với một bộ sinh có trích dẫn, capstone [RAG production](../../../phases/19-capstone-projects/08-production-rag-chatbot/) đặt ra tập chuẩn, red team và các mục tiêu cache, và bài học [đánh giá RAG](../../../phases/19-capstone-projects/68-rag-eval-precision-recall/) phân tầng qrels.
