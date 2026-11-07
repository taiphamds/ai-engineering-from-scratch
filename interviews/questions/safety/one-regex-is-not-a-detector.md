---
id: one-regex-is-not-a-detector
title: The injection defense is one regex
card: safety
kind: debug
level: 2
roles: [applied-ai-engineer, agentic-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [debugging, design-review]
tags: [prompt-injection, detector, precision, recall]
minutes: 8
lessons: [phases/19-capstone-projects/83-prompt-injection-detector]
manuals: []
practice: []
cheatsheet: [guardrails-moderation]
related: [safety/six-jailbreak-categories]
updated: 2026-11-03
---

Một đồng nghiệp đã phát hành một biện pháp phòng vệ prompt injection tháng trước: một regex khớp "bỏ qua các chỉ dẫn trước". Tuần này một prompt nói "phớt lờ hướng dẫn trước đó" đi qua. Đồng nghiệp muốn thêm một regex thứ hai. Bạn hỏi gì trước khi bất cứ thứ gì được phát hành, và một bộ phát hiện thay vào đó trông như thế nào?

## Short answer

Yêu cầu precision và recall theo từng danh mục tấn công trên một kho ngữ liệu được gán nhãn; biện pháp phòng vệ hiện tại chưa bao giờ được đo, nên không ai biết nó bao phủ gì. Một bộ phát hiện là một hàm từ một prompt tới một độ tin cậy giữa không và một và một danh mục khớp nhất. Xây dựng nó như các lớp, một lượt chuẩn hóa, các quy tắc chuỗi con và các regex ở cấp token, với một danh mục và một điểm cơ sở trên mọi quy tắc, và chạy nó theo kho fixture và một tập lành tính trên mỗi thay đổi.

## Full answer

### Why the single regex is theater

Không ai biết precision, recall hoặc các danh mục nó bao phủ. Cách diễn đạt lại tiếp theo bị bỏ lỡ, nhóm đổ lỗi cho mô hình, và một bản vá không được đo thứ hai theo sau bản thứ nhất. Phiên bản trung thực có hành vi đo được.

### The detector shape

Một danh sách các quy tắc. Mỗi quy tắc có một tên, một danh mục và một hàm điểm từ prompt tới một giá trị trong khoảng đơn vị. Một quy tắc kích hoạt hoặc không; khi nó kích hoạt, điểm của nó là độ tin cậy. Bộ tổng hợp trả về một phán quyết: danh mục có điểm cao nhất và điểm tối đa trong đó. Không quy tắc nào kích hoạt cho không và nhãn lành tính.

### Three layers, in order

1. **Chuẩn hóa.** Loại các ký tự zero width và điều khiển hai chiều, chuyển một bản sao làm việc thành chữ thường, giải mã base64, rot13 và hex, ánh xạ các chữ số leet sang các chữ cái. Giữ văn bản thô cạnh bản sao.
2. **Các quy tắc chuỗi con.** Các cụm từ viết tay như "bỏ qua trước đó", "với tư cách không bị hạn chế", "trả lời bắt đầu bằng", mỗi cụm có một danh mục và một điểm cơ sở.
3. **Các quy tắc regex.** Các mẫu ở cấp token bắt các họ, như một mẫu trên gốc từ ignore theo sau bởi all, prior, previous hoặc earlier. Cách diễn đạt lại trong câu hỏi bị bắt bởi một quy tắc họ, không phải một cụm nguyên văn thứ hai.

### The measurement

Bộ chạy chỉ số đọc kho phân loại và một danh sách prompt lành tính. Với một danh mục, một dương tính thật là một fixture thuộc danh mục đó với một phán quyết thuộc danh mục đó; một dương tính giả là một phán quyết thuộc danh mục đó trên một fixture thuộc danh mục khác hoặc trên văn bản lành tính; một âm tính giả là một fixture thuộc danh mục đó với một phán quyết khác hoặc lành tính. Nó ghi precision, recall và các số đếm thô theo từng danh mục, và nó bộc lộ nơi bộ phát hiện sai có chủ đích, như nhập vai trông lành tính.

### Where it sits

Bộ phát hiện là một tín hiệu trong nhiều tín hiệu mà một cổng kết hợp. Nó thiên về recall trên các thủ thuật mã hóa và ghi đè chỉ dẫn và chấp nhận precision tầm trung trên nhập vai, vốn mờ ranh giới với viết sáng tạo và được xử lý với các tín hiệu khác.

## Follow-ups

- **Level 2:** Định nghĩa một dương tính giả cho danh mục ghi đè chỉ dẫn. Expected: danh mục fixture là thứ khác, hoặc văn bản lành tính, và danh mục phán quyết là ghi đè chỉ dẫn.
- **Level 2:** Tại sao giữ các quy tắc dưới dạng dữ liệu thay vì mã? Expected: mỗi quy tắc có thể kiểm toán với một tên, một danh mục và một điểm, và thêm một quy tắc không thay đổi bộ máy.
- **Level 3:** Tại sao bộ phát hiện chịu đựng nhiều lần kích hoạt giả hơn trong một danh mục so với các danh mục khác? Expected: các cuộc tấn công nhập vai mờ ranh giới với các yêu cầu sáng tạo hợp lệ; cổng thêm các tín hiệu khác ở đó trong khi bộ phát hiện thiên về recall trên mã hóa và ghi đè.
- **Level 3:** Bạn quyết định loại quy tắc nào bằng cách nào? Expected: đếm các dương tính thật bị mất nếu quy tắc bị loại, cho mọi quy tắc, và sắp theo đóng góp biên đó.

## Wrong answers

- "Thêm regex thứ hai và tiếp tục." Các bản vá không được đo chồng chất; không có precision và recall theo từng danh mục, bạn không thể nói cặp đó bao phủ gì.
- "Thay các quy tắc bằng một bộ phân loại mô hình." Một bộ phân loại là thêm một tín hiệu; các quy tắc có thể kiểm toán và bộ chạy chỉ số đo cả hai theo cùng cách.
- "Dù sao mô hình lẽ ra phải từ chối." Bộ phát hiện tồn tại để cổng không phụ thuộc vào một lớp; đổ lỗi cho mô hình là cách regex đầu tiên được phát hành.

## Taught in

[Capstone bộ phát hiện prompt injection](../../../phases/19-capstone-projects/83-prompt-injection-detector/) định nghĩa bộ phát hiện là một hàm được đo và cung cấp ba lớp cùng các chỉ số theo từng danh mục.
