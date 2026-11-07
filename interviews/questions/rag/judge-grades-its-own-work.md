---
id: judge-grades-its-own-work
title: Faithfulness stays high while reviewers find invented facts
card: rag
kind: debug
level: 3
roles: [ai-evaluation-reliability-engineer, applied-ai-engineer]
rounds: [debugging, ml-depth]
tags: [faithfulness, llm-judge, rag-eval, bias]
minutes: 10
lessons: [phases/19-capstone-projects/68-rag-eval-precision-recall, phases/05-nlp-foundations-to-advanced/13-question-answering]
manuals: []
practice: []
cheatsheet: [llm-evaluation]
related: [rag/diagnose-from-the-metric-table, rag/faithfulness-vs-relevance]
updated: 2026-11-03
---

Điểm độ trung thực của bạn đến từ một mô hình đọc từng khẳng định cạnh ngữ cảnh truy xuất và trả lời có hoặc không. Điểm đã nằm gần đỉnh trong một tháng, nhưng người review liên tục tìm thấy các dữ kiện bịa ra trong những câu trả lời được lấy mẫu. Bộ sinh và bộ chấm là cùng một mô hình. Điều gì đang xảy ra, và bạn thay đổi gì?

## Short answer

Một bộ chấm từ cùng họ với bộ sinh chấm đầu ra của chính nó là trung thực hơn thực tế, nên con số giữ cao trong khi các mẫu cho thấy sự thật. Chuyển bộ chấm sang một họ mô hình khác hoặc chấm tay một mẫu, và thêm một lần xem xét ở cấp mẫu, vì một kiểm tra theo từng câu có thể đạt trong khi toàn bộ câu trả lời gây hiểu lầm.

## Full answer

### How the metric is built

Đánh giá tách câu trả lời thành các khẳng định có dạng câu, hỏi bộ chấm liệu mỗi khẳng định có được ngữ cảnh truy xuất hỗ trợ không, và báo cáo tỷ lệ đạt. Bài học cung cấp một bộ chấm thay thế xác định dựa trên độ trùng token để đánh giá chạy offline, và thay bằng một lệnh gọi mô hình trong production. Bài học hỏi đáp mô tả dạng production: suy dẫn giữa mỗi khẳng định và ngữ cảnh, không cần câu trả lời chuẩn.

### Two blind spots

1. **Thiên lệch bộ chấm.** Một mô hình đánh giá đầu ra của họ riêng là trung thực hơn thực tế. Quy tắc của bài học: dùng một họ mô hình khác cho bộ chấm so với bộ sinh, hoặc chấm tay một mẫu.
2. **Các kiểm tra vi mô bỏ lỡ các khẳng định vĩ mô.** Mỗi câu có thể được hỗ trợ trong khi toàn bộ câu trả lời rút ra một kết luận mà ngữ cảnh không rút ra. Thêm một lần xem xét định tính ở cấp mẫu bên trên chỉ số tự động.

### What to change

- Đổi họ bộ chấm, rồi đo sự bất đồng giữa bộ chấm cũ và bộ chấm mới trên cùng fixture. Bài tập của bài học làm cùng điều đó giữa bộ chấm giả và một mô hình thực.
- Chấm tay một mẫu cố định mỗi tuần và xem nó là tập hiệu chuẩn cho điểm tự động.
- Cân nhắc độ trung thực phân bậc với ba giá trị, không được hỗ trợ, được hỗ trợ một phần và được hỗ trợ đầy đủ, thay vì có hoặc không.
- Giữ mức liên quan câu trả lời cạnh độ trung thực. Một câu trả lời có căn cứ cho sai câu hỏi mạnh ở một chỉ số và yếu ở chỉ số kia.

## Follow-ups

- **Level 3:** Bạn xác định quy mô vấn đề bộ chấm trước khi thay đổi bất cứ thứ gì bằng cách nào? Expected: chấm tay một mẫu các khẳng định và đo sự bất đồng giữa bộ chấm và các nhãn con người.
- **Level 3:** Mọi câu đều đạt nhưng toàn bộ câu trả lời gây hiểu lầm. Kiểm tra nào bắt được điều đó? Expected: một lần xem xét định tính ở cấp mẫu ngoài chỉ số theo từng khẳng định.
- **Level 4:** Tại sao một điểm độ trung thực cao có thể nằm cạnh một câu trả lời vô dụng? Expected: độ trung thực so sánh câu trả lời với ngữ cảnh chứ không với câu hỏi, nên một câu trả lời lạc đề có căn cứ có điểm cao về độ trung thực và thấp về mức liên quan.
- **Level 4:** Nhóm muốn mô hình mạnh nhất hiện có làm bộ chấm, và nó cũng là bộ sinh. Bạn nói gì? Expected: chọn bộ chấm vì tính độc lập trước; một bộ chấm mạnh đối với họ riêng vẫn thiên lệch, nên dùng họ khác và giữ một mẫu hiệu chuẩn được con người chấm.

## Wrong answers

- "Điểm cao, nên người review sai." Điểm là ý kiến của một mô hình về đầu ra của họ riêng; các câu trả lời được lấy mẫu là sự thật chuẩn.
- "Làm bộ chấm nghiêm ngặt hơn và vấn đề biến mất." Một prompt hoặc ngưỡng nghiêm ngặt hơn không loại bỏ thiên lệch đối với họ riêng của bộ chấm; chỉ một họ khác hoặc một mẫu con người mới làm được.
- "Thay độ trung thực bằng mức liên quan câu trả lời." Chúng đo những thứ khác nhau; mức liên quan hỏi liệu câu trả lời có giải quyết câu hỏi không và không nói gì về tính có căn cứ.

## Taught in

Bài học [đánh giá RAG](../../../phases/19-capstone-projects/68-rag-eval-precision-recall/) nêu thiên lệch bộ chấm và khoảng hở khẳng định vĩ mô, và bài học [hỏi đáp](../../../phases/05-nlp-foundations-to-advanced/13-question-answering/) mô tả độ trung thực dựa trên suy dẫn trong production.
