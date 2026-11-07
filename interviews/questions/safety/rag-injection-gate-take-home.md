---
id: rag-injection-gate-take-home
title: Build the safety gate around a retrieval assistant
card: safety
kind: take-home
level: 4
roles: [agentic-ai-engineer, applied-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [take-home]
tags: [safety-gate, prompt-injection, context-smuggling, output-classifier, trace]
minutes: 60
lessons: [phases/19-capstone-projects/83-prompt-injection-detector, phases/19-capstone-projects/82-jailbreak-taxonomy, phases/19-capstone-projects/87-end-to-end-safety-gate, phases/19-capstone-projects/85-content-classifier-integration]
manuals: []
practice: []
cheatsheet: [guardrails-moderation]
related: [safety/one-regex-is-not-a-detector, safety/output-router-severity, safety/gate-aggregation-table]
updated: 2026-11-03
---

Bài làm ở nhà. Chúng tôi cho bạn kho fixture các prompt tấn công được gán nhãn, một danh sách prompt lành tính và một trợ lý giả trả lời các câu hỏi trên các tài liệu truy xuất. Xây dựng cổng an toàn quanh nó: một bộ phát hiện đầu vào có độ bao phủ được đo cho từng danh mục tấn công, một phía đầu ra với ít nhất hai bộ phân loại phía sau một bộ định tuyến, và một trace theo từng yêu cầu. Các tài liệu truy xuất có thể mang chỉ dẫn. Bạn bàn giao gì, đo nó bằng cách nào, và nói bạn đã không làm gì?

## Short answer

Bàn giao một bộ phát hiện dưới dạng các quy tắc trong dữ liệu với một lượt chuẩn hóa, một bộ chạy chỉ số ghi precision và recall theo từng danh mục theo kho fixture và danh sách lành tính, một bộ định tuyến đầu ra với một bộ phân loại dữ liệu cá nhân và một bộ phân loại rò rỉ chỉ dẫn cùng các bộ che dữ liệu của chúng, và một cổng chạy trước, trong và sau sinh với một bảng tổng hợp xác định và ghi phán quyết của mọi checkpoint cho mỗi yêu cầu. Thêm một danh mục và một họ quy tắc cho các chỉ dẫn ẩn trong các tài liệu truy xuất, vì kho ngữ liệu không có. Nêu rằng bộ phát hiện sai có chủ đích trên nhập vai trông lành tính, rằng một mô hình thực và một sandbox thực nằm ngoài phạm vi, và rằng các ngưỡng chưa được tinh chỉnh trên dữ liệu giữ lại.

## Full answer

### The detector

Các quy tắc nằm trong một file dữ liệu, mỗi quy tắc có một tên, một danh mục, một điểm và hoặc một chuỗi con hoặc một regex. Một lượt chuẩn hóa loại các ký tự zero width, chuyển một bản sao thành chữ thường, giải mã base64, rot13 và hex và ánh xạ các chữ số leet, trong khi văn bản thô vẫn khả dụng. Bộ tổng hợp trả về danh mục có điểm cao nhất và độ tin cậy của nó, hoặc lành tính ở không. Bộ chạy chỉ số đọc artifact phân loại, chấm mọi fixture và mọi prompt lành tính, và ghi precision, recall và các số đếm thô theo từng danh mục vào một file báo cáo.

### The retrieval problem

Một chỉ dẫn bên trong một tài liệu truy xuất là context smuggling: nó lạm dụng khoảng hở giữa dữ liệu và chỉ dẫn, và lượt người dùng trông lành tính. Kho fixture có sáu danh mục và không có danh mục cho một cuộc tấn công đến qua truy xuất, nên thêm danh mục thứ bảy mà phân loại đặt ra như một bài tập, viết khoảng mười fixture cho nó, và thêm một họ quy tắc cho các chỉ dẫn ẩn trong các kết quả công cụ và tài liệu. Đo mức tăng recall trên danh mục đó và chi phí dương tính giả trên danh sách lành tính.

### The output side

Một bộ phân loại dữ liệu cá nhân với các regex cho email, số điện thoại và các chuỗi có dạng thẻ, và một bộ phân loại rò rỉ chỉ dẫn so sánh đầu ra với system prompt đã biết bằng độ trùng trigram. Mỗi bộ trả về một mức nghiêm trọng và sở hữu một bộ che dữ liệu. Bộ định tuyến lấy mức nghiêm trọng tối đa và ánh xạ cao thành block, trung bình thành redact, thấp thành warn và none thành log.

### The gate and the trace

Trước sinh, bộ phát hiện chạy: chặn ở hoặc trên độ tin cậy 0.85 trên một danh mục không lành tính, nếu không thì gắn tín hiệu. Trong sinh, một bộ lọc trên stream theo dõi một cửa sổ hai chunk để tìm các cụm từ tiếp nối và dừng stream khi khớp. Sau sinh, bộ định tuyến và các quy tắc chạy trên toàn văn bản. Bộ tổng hợp lấy hạng tối đa. Mọi yêu cầu ghi một trace với id, prompt, phán quyết bộ phát hiện, phán quyết stream, các phán quyết sau sinh, hành động cuối, đầu ra cuối và độ trễ. Chạy toàn bộ kho ngữ liệu và danh sách lành tính qua nó và in các số đếm tóm tắt theo từng danh mục.

### What to measure

Precision và recall theo từng danh mục cho bộ phát hiện, số dương tính giả trên các prompt lành tính, các số đếm hành động của cổng theo từng danh mục, và một lần quét ngưỡng từ 0 đến 1 với một đường cong precision và recall theo từng danh mục.

### What to leave out and say so

Một mô hình thực thay cho mô hình giả. Một sandbox thực cho bất cứ thứ gì mô hình có thể thực thi. Các ngưỡng đã tinh chỉnh, vì kho ngữ liệu là tập huấn luyện cho các quy tắc và tinh chỉnh trên nó sẽ báo cáo một con số không giữ vững. Các bộ phân loại neural; hệ thống kết nối giống nhau khi chúng đến. Từ chối quá mức trên người dùng thực, cần một bộ lành tính từ lưu lượng production.

## Follow-ups

- **Level 3:** Tại sao các tài liệu truy xuất cần danh mục và các quy tắc riêng? Expected: cuộc tấn công nằm trong dữ liệu mà người dùng chưa bao giờ viết, nên lượt người dùng trông lành tính; không có các fixture cho nó, recall trên cuộc tấn công đó chưa được đo.
- **Level 4:** Bạn cho thấy họ quy tắc mới không đánh đổi recall lành tính bằng cách nào? Expected: số dương tính giả trên danh sách lành tính trước và sau, cạnh mức tăng recall trong danh mục mới.
- **Level 4:** Bạn sẽ làm gì trước với một mô hình thực phía sau mô hình giả? Expected: chạy lại toàn bộ kho ngữ liệu qua cổng và đọc tóm tắt trace theo từng danh mục, rồi tinh chỉnh các ngưỡng tổng hợp trên một phần tách giữ lại và báo cáo precision và recall theo từng danh mục.

## Wrong answers

- "Một bộ phát hiện tốt khiến phía đầu ra không cần thiết." Một tài liệu truy xuất có thể mang cuộc tấn công qua bất kỳ quy tắc đầu vào nào, và mô hình có thể tự rò rỉ dữ liệu cá nhân; phía đầu ra là nơi điều đó được bắt.
- "Giấu các trường hợp bộ phát hiện làm sai." Báo cáo bộc lộ các lần bỏ lỡ có chủ đích để các lớp khác của cổng có thể được thiết kế quanh chúng.
- "Tinh chỉnh các ngưỡng trên kho fixture." Kho ngữ liệu là tập huấn luyện cho các quy tắc; tinh chỉnh trên nó báo cáo một con số sẽ không giữ vững.

## Taught in

[Capstone bộ phát hiện prompt injection](../../../phases/19-capstone-projects/83-prompt-injection-detector/) xây dựng bộ phát hiện và bộ chạy chỉ số, [capstone phân loại jailbreak](../../../phases/19-capstone-projects/82-jailbreak-taxonomy/) đặt danh mục thứ bảy như một bài tập, [capstone tích hợp bộ phân loại nội dung](../../../phases/19-capstone-projects/85-content-classifier-integration/) xây dựng bộ định tuyến đầu ra, và [capstone cổng an toàn đầu cuối](../../../phases/19-capstone-projects/87-end-to-end-safety-gate/) kết hợp chúng với một trace.
