---
id: error-code-query-misses
title: Vector search misses the article with the exact error code
card: rag
kind: debug
level: 2
roles: [applied-ai-engineer, forward-deployed-ai-engineer, ai-data-engineer]
rounds: [debugging, ml-depth]
tags: [hybrid-search, bm25, rrf, lexical]
minutes: 8
lessons: [phases/11-llm-engineering/07-advanced-rag, phases/19-capstone-projects/65-hybrid-retrieval-bm25-dense]
manuals: []
practice: [bm25, reciprocal-rank-fusion]
cheatsheet: [rag-production]
related: [rag/rrf-beats-score-sum, rag/read-the-rrf-function]
updated: 2026-11-03
---

Các nhân viên hỗ trợ tìm kiếm cơ sở tri thức bằng mã lỗi chính xác từ một phiếu, như E-4021. Tìm kiếm vector trả về các bài viết về xử lý lỗi nói chung và bỏ lỡ bài viết duy nhất chứa mã đó. Điều gì đang xảy ra, và bạn thêm gì?

## Short answer

Mô hình embedding xem một mã hiếm là nhiễu, nên vector truy vấn rơi gần các bài viết về lỗi nói chung chứ không gần kết quả khớp chính xác duy nhất. Thêm một chỉ mục từ vựng với BM25 cạnh chỉ mục vector, chạy cả hai cho mọi truy vấn, và gộp hai danh sách đã xếp hạng bằng reciprocal rank fusion. Token chính xác thắng trên BM25, và danh sách hợp nhất đặt bài viết đó đầu tiên.

## Full answer

### Two retrievers, two strengths

Tìm kiếm ngữ nghĩa hiểu ý nghĩa. "Tôi hủy đăng ký như thế nào" khớp với "các bước chấm dứt gói của bạn" mà không chung từ nào. Nó bỏ lỡ các kết quả khớp chính xác, vì một mã như E-4021 không mang ý nghĩa để mô hình nhúng.

Tìm kiếm từ vựng làm ngược lại. BM25 chấm điểm một tài liệu bằng cách lấy tổng, trên các thuật ngữ truy vấn, của một hệ số tần suất tài liệu nghịch đảo nhân một hệ số tần suất thuật ngữ bão hòa với hiệu chỉnh độ dài. Một thuật ngữ xuất hiện trong ít tài liệu có trọng số lớn nhất, nên một mã hiếm chính là thứ BM25 giỏi nhất. Nó thất bại khi truy vấn và tài liệu không chung từ nào.

### Hybrid search

Chạy cả hai retriever song song và hợp nhất theo thứ hạng: mỗi tài liệu nhận tổng của một chia cho k cộng thứ hạng của nó trong mỗi danh sách, với k bằng 60. Demo capstone cho thấy ba trường hợp. Truy vấn symbol nguyên văn nằm ở BM25 hạng 1 và dense hạng 4, và hợp nhất thành hạng 1. Truy vấn diễn đạt lại nằm ở BM25 hạng 6 và dense hạng 1, và hợp nhất thành hạng 1. Hợp nhất thắng trên cả hai lớp truy vấn, nên cách sửa cho mã lỗi không đánh đổi các truy vấn diễn đạt lại.

### Two details that matter

- **Trọng số trường.** Nếu các mã nằm trong một trường tiêu đề hoặc symbol, lặp các token đó ở thời điểm lập chỉ mục để một kết quả khớp tiêu đề được tính nhiều hơn một kết quả khớp phần thân. Phép toán giữ nguyên.
- **Các mã ngoài từ vựng.** Một mã hiện diện trong phiếu và vắng mặt trong mọi bài viết nhận không từ BM25, vì tần suất tài liệu của nó bằng không, trong khi phía dense vẫn trả về các láng giềng trông có vẻ hợp lý. Khử trùng lặp theo tài liệu để phía từ vựng trống không thêm các đóng góp thứ hạng lạc chỗ. Hợp nhất thứ hạng vẫn chấm điểm các tài liệu mà chỉ phía dense trả về, nên chúng vẫn ở trong danh sách hợp nhất và có thể xếp đầu. Kiểm tra một bài viết được truy xuất có chứa mã, và khi không có bài nào, nói rằng không bài viết được truy xuất nào chứa nó thay vì trả lời từ các láng giềng.

## Follow-ups

- **Level 2:** Tại sao BM25 cho một mã hiếm trọng số lớn đến vậy? Expected: hệ số tần suất tài liệu nghịch đảo; một thuật ngữ trong ít tài liệu có điểm cao và một thuật ngữ trong phần lớn tài liệu có điểm thấp.
- **Level 2:** Mã có trong phiếu nhưng hoàn toàn không có trong bài viết nào. Mỗi retriever trả về gì? Expected: BM25 không đóng góp gì cho thuật ngữ đó, và retriever dense vẫn trả về các láng giềng trông hợp lý nhưng sai, và hợp nhất giữ chúng lại; kiểm tra một bài viết được truy xuất có chứa mã, và khi không có bài nào, nói rằng không bài viết được truy xuất nào chứa nó.
- **Level 3:** Các truy vấn diễn đạt lại ra sao sau khi bạn thêm chỉ mục từ vựng? Expected: chúng vẫn thắng, vì hợp nhất dựa trên thứ hạng; trong demo, truy vấn diễn đạt lại nằm ở BM25 hạng 6 và dense hạng 1 và hợp nhất thành hạng 1.
- **Level 3:** Các mã nằm trong một trường tiêu đề ngắn và phần thân là văn xuôi dài. Bạn tinh chỉnh gì? Expected: trọng số trường, lặp các token tiêu đề ở thời điểm lập chỉ mục để một kết quả khớp tiêu đề được tính nhiều hơn.

## Wrong answers

- "Chuyển sang một mô hình embedding tốt hơn." Một mã hiếm không có ý nghĩa để học; cách sửa là một tín hiệu từ vựng bên cạnh tín hiệu ngữ nghĩa.
- "Hạ ngưỡng tương đồng để nhiều bài viết quay về hơn." Nhiều láng giềng lạc đề hơn không bao gồm kết quả khớp chính xác duy nhất.
- "Thay tìm kiếm vector bằng BM25." Khi đó các truy vấn không chung từ với bài viết thất bại; chạy cả hai và hợp nhất.

## Taught in

Bài học [RAG nâng cao](../../../phases/11-llm-engineering/07-advanced-rag/) đối chiếu hai retriever, và bài học [truy xuất lai](../../../phases/19-capstone-projects/65-hybrid-retrieval-bm25-dense/) cho thấy ba lớp truy vấn, trọng số trường và trường hợp ngoài từ vựng.
