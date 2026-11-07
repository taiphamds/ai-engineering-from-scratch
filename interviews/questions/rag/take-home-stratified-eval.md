---
id: take-home-stratified-eval
title: Build the eval that picks a retrieval configuration
card: rag
kind: take-home
level: 3
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer, ai-data-engineer]
rounds: [take-home]
tags: [rag-eval, qrels, recall, stratified, take-home]
minutes: 60
lessons: [phases/05-nlp-foundations-to-advanced/23-chunking-strategies-rag, phases/19-capstone-projects/68-rag-eval-precision-recall, phases/19-capstone-projects/64-chunking-strategies-advanced]
manuals: []
practice: []
cheatsheet: [llm-evaluation, rag]
related: [rag/chunk-size-by-query-type, rag/recall-at-k-first]
updated: 2026-11-03
---

Bài làm ở nhà. Bạn nhận một kho ngữ liệu vài trăm tài liệu nội bộ và một pipeline truy xuất với hai bộ chia chunk và hai retriever phía sau các cờ. Xây dựng đánh giá cho nhóm biết nên phát hành cấu hình nào, và viết báo cáo ý nghĩa của các con số. Bạn có một buổi tối.

## Short answer

Xây dựng một tập truy vấn được gán nhãn trước, phân tầng theo loại truy vấn, với các id tài liệu chuẩn và văn bản câu trả lời chuẩn cho mỗi truy vấn. Chạy mọi cấu hình trên cùng tập và báo cáo recall ở 5 cho từng lát, cùng MRR và tỷ lệ truy vấn có top 5 giữ một chunk với văn bản câu trả lời chuẩn, và đọc độ chênh giữa các cấu hình. Gán nhãn ở cấp tài liệu để cùng nhãn chấm mọi bộ chia chunk; nếu bạn gán nhãn ở cấp chunk, ghi bộ chia chunk trong qrels và gán nhãn lại sau bất kỳ thay đổi bộ chia chunk nào.

## Full answer

### The deliverable

1. **Một file qrels.** Một bản ghi cho mỗi truy vấn với văn bản truy vấn, các id tài liệu chuẩn, một ánh xạ mức liên quan phân bậc và chuỗi con câu trả lời chuẩn. Gán nhãn ở cấp tài liệu, không phải cấp chunk, để nhãn sống sót qua một thay đổi bộ chia chunk.
2. **Một tập phân tầng.** Bài học chunking dùng một tập 50 truy vấn chia ra các câu hỏi dữ kiện, phân tích và multi-hop. Các truy vấn multi-hop bộc lộ các bên thắng khác với các truy vấn dữ kiện, và một trung bình giấu lớp thua.
3. **Ma trận chạy.** Hai bộ chia chunk nhân hai retriever, mọi ô theo cùng qrels, cùng các giá trị k.
4. **Các chỉ số.** Recall ở 5 là con số chính, precision ở k bên cạnh, MRR cho vị trí của kết quả trúng đầu tiên, nDCG nếu các nhãn phân bậc, và một answer hit ở 5 chỉ tính một truy vấn khi một chunk top-five chứa chuỗi con câu trả lời chuẩn. Recall ở cấp tài liệu không thể phân biệt hai bộ chia chunk khi cả hai trả về các chunk của tài liệu chuẩn và chỉ một trong hai trả về chunk có câu trả lời. Answer hit chỉ đo độ bao phủ đoạn chính xác: một câu trả lời multi-hop trải qua nhiều chunk có thể trượt nó trong khi top five vẫn hỗ trợ câu trả lời, nên đọc nó cạnh recall chứ không như một điểm truy xuất đầy đủ.
5. **Báo cáo.** Một bảng với một dòng mỗi cấu hình và một cột mỗi lát, rồi một khuyến nghị và lý do, rồi điều bạn sẽ đo tiếp theo.

### What to expect

Bài học so sánh chunking cho thấy mẫu: bộ chia heading theo cấu trúc thắng trên markdown, phân cụm ngữ nghĩa thắng trên văn xuôi thuần, và chia đệ quy giữ được vị thế trên một kho ngữ liệu hỗn hợp. Retriever lai đánh bại baseline từ vựng về recall. Kho ngữ liệu của bạn quyết định điều nào trong số này đúng.

### Guards that graders look for

- Cấp gán nhãn được ghi trong header qrels, và các id chuẩn ở cấp chunk nêu bộ chia chunk mà chúng được tạo theo.
- Mọi cặp huấn luyện cho một reranker không giao với các truy vấn đánh giá.
- Các kết quả theo từng truy vấn được lưu bền vững, không chỉ các trung bình.
- Báo cáo nêu điều đánh giá này không thể cho biết: chất lượng câu trả lời, cần độ trung thực và mức liên quan được chấm bởi một mô hình từ họ khác hoặc bằng tay.

## Follow-ups

- **Level 3:** Tại sao chia các truy vấn theo loại? Expected: các truy vấn dữ kiện và multi-hop bộc lộ các bên thắng khác nhau, và một trung bình giấu lớp thua.
- **Level 3:** Các nhãn được tạo bằng bộ chia chunk A. Bạn có thể dùng lại chúng cho bộ chia chunk B không? Expected: chỉ nếu nhãn ở cấp tài liệu hoặc đoạn; các id chunk thay đổi theo ranh giới, nên ghi bộ chia chunk trong qrels và gán nhãn lại nếu không.
- **Level 4:** Bạn biện minh số truy vấn trong báo cáo bằng cách nào? Expected: một tập phân tầng 50 truy vấn cho quyết định đầu tiên, rồi các tầng 20 truy vấn trong CI, 200 mỗi đêm và 2000 hàng tuần, với một ghi chú về điều mỗi tầng có thể và không thể phát hiện.
- **Level 4:** Bạn từ chối kết luận gì sau một buổi tối? Expected: bất cứ điều gì về chất lượng câu trả lời, vì đánh giá chấm truy xuất; độ trung thực và mức liên quan cần một bộ chấm, và một bộ chấm từ họ riêng của bộ sinh là thiên lệch.

## Wrong answers

- "Tôi tự viết mười câu hỏi và chạy mỗi cấu hình." Mười câu hỏi thuộc một loại không thể tách bốn cấu hình hoặc bộc lộ một lớp luôn bỏ lỡ.
- "Đây là recall trung bình cho mỗi cấu hình." Một trung bình giấu các bên thắng theo từng lát và lớp thất bại.
- "Tôi thay bộ chia chunk và dùng lại các nhãn ở cấp chunk." Các id chunk không còn khớp các chunk mới; gán nhãn ở cấp tài liệu, hoặc gán nhãn lại và ghi bộ chia chunk trong header qrels.

## Taught in

Bài học [chiến lược chunking](../../../phases/05-nlp-foundations-to-advanced/23-chunking-strategies-rag/) đặt ra tập phân tầng 50 truy vấn, bài học [đánh giá RAG](../../../phases/19-capstone-projects/68-rag-eval-precision-recall/) định nghĩa qrels và các tầng, và bài học [so sánh chunking](../../../phases/19-capstone-projects/64-chunking-strategies-advanced/) cho thấy bộ chia nào thắng trên kho ngữ liệu nào.
