---
id: eval-passes-users-complain
title: Every metric is high and one unit still gets wrong answers
card: rag
kind: design
level: 4
roles: [ai-evaluation-reliability-engineer, applied-ai-engineer, forward-deployed-ai-engineer]
rounds: [system-design, design-review]
tags: [rag-eval, qrels, drift, golden-set, slicing]
minutes: 15
lessons: [phases/19-capstone-projects/68-rag-eval-precision-recall, phases/19-capstone-projects/08-production-rag-chatbot, phases/05-nlp-foundations-to-advanced/23-chunking-strategies-rag]
manuals: []
practice: []
cheatsheet: [llm-evaluation, rag-production]
related: [rag/diagnose-from-the-metric-table, rag/take-home-stratified-eval]
updated: 2026-11-03
---

Đánh giá RAG của bạn báo cáo recall cao, MRR cao, độ trung thực cao và mức liên quan câu trả lời cao, và dashboard drift hàng tuần phẳng. Bộ phận hỗ trợ vẫn chuyển tiếp một luồng câu trả lời sai từ một đơn vị kinh doanh. Với vai trò kỹ sư staff trên hệ thống, bạn kết luận gì, và bạn thay đổi gì trong chính chương trình đánh giá?

## Short answer

Kết luận rằng tập đánh giá không đại diện cho lưu lượng của đơn vị đó: cả bốn chỉ số có thể cao trên các truy vấn không ai hỏi. Thêm các truy vấn thực của họ vào qrels, phân lát mọi chỉ số theo lớp truy vấn và loại tài liệu, và kiểm tra tài liệu của họ có được chia chunk bằng một bộ chia phù hợp định dạng không. Sau đó thay đổi chương trình: phân tầng qrels, xem xét chúng theo lịch để chúng không mục nát, và xem một mức giảm theo từng lát là một điều chặn phát hành.

## Full answer

### The row in the table

Bài học đánh giá kết thúc bảng chẩn đoán bằng đúng mẫu này: cả bốn chỉ số cao, người dùng vẫn phàn nàn, nguyên nhân có khả năng là một tập đánh giá không có tính đại diện, sửa bằng cách mở rộng qrels với các truy vấn người dùng thực. Một dashboard theo dõi cùng tập mỗi tuần giữ phẳng vì cùng lý do.

### Why averages hide it

Một recall trung bình 90 phần trăm có thể giấu một lớp truy vấn luôn bỏ lỡ. Quy tắc của bài học là phân lát qrels theo lớp, như nguyên văn, diễn đạt lại và đa chủ đề, và báo cáo từng lát. Bài học chunking thêm trục khác: một tập phân tầng theo loại truy vấn, vì các truy vấn multi-hop bộc lộ các bên thắng khác với các truy vấn dữ kiện.

### The changes to the program

1. **Mở rộng qrels với các truy vấn thực của đơn vị đó**, được một chuyên gia lĩnh vực gán nhãn với id chuẩn và câu trả lời, như capstone production làm cho tập chuẩn 200 cặp có trích dẫn.
2. **Gắn tag mọi qrel** với lớp truy vấn và loại tài liệu, và báo cáo mọi chỉ số theo từng lát.
3. **Lưu bền vững trace theo từng truy vấn** cho mỗi lần chạy, để khi một phàn nàn đến bạn có thể tra qrel tương ứng và xem liệu đánh giá có bắt được nó không.
4. **Lên lịch xem xét qrels.** Các câu trả lời chuẩn trôi dạt khi kho ngữ liệu thay đổi; bài học lên lịch xem xét hàng quý.
5. **Khóa bộ chia chunk trong header qrels**, và kiểm tra bộ chia trong production phù hợp với định dạng tài liệu của đơn vị đó.
6. **Phân tầng các tập**: 20 truy vấn trong CI, 200 mỗi đêm, 2000 hàng tuần, và biến một mức giảm theo từng lát thành một điều chặn phát hành.

### What the dashboard should have shown

Dashboard drift của capstone theo dõi chất lượng truy xuất hàng tuần và cảnh báo khi giảm 5 phần trăm. Nó chỉ có thể cảnh báo trên lưu lượng mà nó chứa. Một khi các truy vấn của đơn vị nằm trong tập, cùng cảnh báo bắt đầu có ý nghĩa đối với họ.

## Follow-ups

- **Level 3:** Tại sao mọi chỉ số có thể cao trong khi các câu trả lời sai? Expected: các chỉ số được tính trên tập đánh giá, và tập đó thiếu các truy vấn và tài liệu nơi các lỗi xảy ra.
- **Level 4:** Thay đổi cụ thể đầu tiên cho qrels là gì? Expected: thêm các truy vấn thực của đơn vị đó với id chuẩn và câu trả lời được chuyên gia gán nhãn, gắn tag lớp truy vấn và loại tài liệu để phân lát.
- **Level 4:** Bạn giữ qrels trung thực theo thời gian bằng cách nào? Expected: một lần xem xét theo lịch, hàng quý trong bài học, vì các câu trả lời chuẩn trôi dạt khi kho ngữ liệu thay đổi, cùng một kiểm tra rằng bộ chia chunk trong header qrels là bộ chia trong production.
- **Level 4:** Tại sao dashboard drift phẳng trong khi chất lượng giảm? Expected: nó theo dõi cùng tập không có tính đại diện mỗi tuần; một cảnh báo trên tập đó không nói gì về lưu lượng nó không chứa.

## Wrong answers

- "Các chỉ số cao, nên các phàn nàn là lỗi người dùng." Các chỉ số chấm tập đánh giá, không phải lưu lượng; các phàn nàn là dữ liệu bị thiếu.
- "Nâng các ngưỡng." Các ngưỡng chặt hơn trên các truy vấn sai vẫn đo các truy vấn sai.
- "Thay đánh giá bằng một benchmark công khai lớn hơn." Một tập công khai không có gì từ đơn vị đó; cách sửa là các truy vấn thực của họ, được gán nhãn.

## Taught in

Bài học [đánh giá RAG](../../../phases/19-capstone-projects/68-rag-eval-precision-recall/) nêu tập không có tính đại diện, báo cáo theo từng lát, qrels mục nát và các tầng, capstone [RAG production](../../../phases/19-capstone-projects/08-production-rag-chatbot/) đặt ra tập chuẩn và cảnh báo drift, và bài học [chiến lược chunking](../../../phases/05-nlp-foundations-to-advanced/23-chunking-strategies-rag/) phân tầng các truy vấn theo loại.
