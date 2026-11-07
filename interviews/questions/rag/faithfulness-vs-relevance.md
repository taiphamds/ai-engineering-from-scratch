---
id: faithfulness-vs-relevance
title: Faithfulness and answer relevance grade different things
card: rag
kind: concept
level: 2
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer, ai-developer-relations-engineer]
rounds: [screen, ml-breadth]
tags: [faithfulness, answer-relevance, rag-eval, llm-judge]
minutes: 7
lessons: [phases/19-capstone-projects/68-rag-eval-precision-recall, phases/05-nlp-foundations-to-advanced/13-question-answering]
manuals: []
practice: []
cheatsheet: [llm-evaluation]
related: [rag/judge-grades-its-own-work, rag/recall-at-k-first]
updated: 2026-11-03
---

Hai chỉ số chấm câu trả lời nằm trong báo cáo đánh giá RAG của bạn: độ trung thực và mức liên quan câu trả lời. Một đồng đội nói chúng đo cùng một thứ và muốn bỏ một. Giải thích mỗi chỉ số chấm gì, và đưa một câu trả lời có điểm cao ở một chỉ số và thấp ở chỉ số kia.

## Short answer

Độ trung thực hỏi liệu mỗi khẳng định trong câu trả lời có được ngữ cảnh truy xuất hỗ trợ không. Mức liên quan câu trả lời hỏi liệu câu trả lời có giải quyết câu hỏi không. Một bản tóm tắt có căn cứ của các chunk truy xuất nhưng không bao giờ đi đến câu hỏi có điểm cao về độ trung thực và thấp về mức liên quan, và một câu trả lời ngắn trực tiếp từ bộ nhớ riêng của mô hình có điểm cao về mức liên quan và thấp về độ trung thực.

## Full answer

### How each one is computed

| Chỉ số | Đầu vào cho bộ chấm | Đầu ra |
|---|---|---|
| Độ trung thực | một khẳng định từ câu trả lời, cùng ngữ cảnh truy xuất | có hoặc không, tổng hợp thành tỷ lệ các khẳng định đạt |
| Mức liên quan câu trả lời | câu hỏi, cùng câu trả lời | câu trả lời có giải quyết câu hỏi không |

Đánh giá tách câu trả lời thành các khẳng định có dạng câu trước. Độ trung thực cũng được gọi là tính có căn cứ, sự hỗ trợ hoặc quy thuộc nguồn. Ở dạng production, bài học hỏi đáp mô tả nó là suy dẫn giữa khẳng định và ngữ cảnh, và mức liên quan là sinh các câu hỏi giả định từ câu trả lời và so sánh chúng với câu hỏi thực.

### Why both stay

Mỗi chỉ số bắt một lỗi mà chỉ số kia không thể thấy:

- Độ trung thực bắt một dữ kiện bịa ra, vì dữ kiện đó không có hỗ trợ trong ngữ cảnh.
- Mức liên quan bắt một câu trả lời đi chệch, vì bộ chấm không bao giờ thấy ngữ cảnh và chỉ hỏi liệu câu hỏi đã được trả lời chưa.

Bảng chẩn đoán trong bài học đánh giá dùng cặp này. MRR cao với độ trung thực thấp chỉ tới prompt sinh. Độ trung thực cao với mức liên quan thấp chỉ tới bộ viết lại truy vấn hoặc prompt.

### No gold answer needed

Cả hai được chấm theo ngữ cảnh và câu hỏi, không theo một câu trả lời tham chiếu. Điều đó cho phép bạn chấm lưu lượng trực tiếp mà không có nhãn, cạnh context precision và context recall cho phía truy xuất.

### The offline stand-in

Bài học cung cấp một bộ chấm xác định dựa trên độ trùng token trên một ngưỡng, để đánh giá chạy mà không gọi mạng. Nó không thể đọc ý nghĩa, nên production thay nó bằng một bộ chấm mô hình từ một họ khác với bộ sinh.

## Follow-ups

- **Level 2:** Chỉ số nào trong hai chỉ số bắt một ảo giác? Expected: độ trung thực, vì một dữ kiện bịa ra không có hỗ trợ trong ngữ cảnh truy xuất.
- **Level 2:** Mức liên quan thấp với độ trung thực cao chỉ tới giai đoạn nào? Expected: bộ viết lại truy vấn hoặc prompt sinh; ngữ cảnh nói về thứ khác, hoặc câu trả lời trôi khỏi câu hỏi.
- **Level 3:** Tại sao không chỉ số nào cần một câu trả lời tham chiếu? Expected: cả hai được chấm theo ngữ cảnh và câu hỏi, đó là điều khiến chúng dùng được trên lưu lượng trực tiếp.
- **Level 3:** Giới hạn của bộ chấm offline trong bài học là gì? Expected: nó đếm độ trùng token trên một ngưỡng, nên nó không thể đọc ý nghĩa; production dùng một bộ chấm mô hình, từ một họ khác với bộ sinh.

## Wrong answers

- "Chúng giống nhau, một câu trả lời trung thực là liên quan." Một câu trả lời trung thực có thể tóm tắt ngữ cảnh và bỏ qua câu hỏi.
- "Mức liên quan là đủ khi truy xuất tốt." Mức liên quan không bao giờ thấy ngữ cảnh, nên một câu trả lời từ bộ nhớ riêng của mô hình có thể liên quan và không có căn cứ.
- "Độ trung thực cần một câu trả lời chuẩn." Nó được chấm theo ngữ cảnh truy xuất, đó là lý do nó hoạt động trên lưu lượng trực tiếp.

## Taught in

Bài học [đánh giá RAG](../../../phases/19-capstone-projects/68-rag-eval-precision-recall/) định nghĩa cả hai chỉ số và bộ chấm thay thế, và bài học [hỏi đáp](../../../phases/05-nlp-foundations-to-advanced/13-question-answering/) cung cấp các dạng production.
