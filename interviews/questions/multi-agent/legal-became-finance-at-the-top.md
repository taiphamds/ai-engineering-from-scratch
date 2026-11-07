---
id: legal-became-finance-at-the-top
title: The legal question came back as finance findings
card: multi-agent
kind: debug
level: 3
roles: [agentic-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [debugging, design-review]
tags: [hierarchy, decomposition-drift, canary, provenance, depth-cap]
minutes: 12
lessons: [phases/16-multi-agent-and-swarms/06-hierarchical-architecture]
manuals: []
practice: []
cheatsheet: [multi-agent, multi-agent-case-studies]
related: [multi-agent/two-workers-return-different-facts]
updated: 2026-11-03
---

Một hệ phân cấp agent ba cấp đánh giá một hợp đồng. Quản lý cao nhất chia công việc thành một nhánh kỹ thuật và một nhánh pháp lý, mỗi nhánh có quản lý phụ và worker riêng. Báo cáo cuối đầy đủ và tự tin, và nó chứa các phát hiện tài chính nơi lẽ ra là đánh giá pháp lý. Không ai hỏi một câu hỏi tài chính. Truy vết lỗi và nói bạn thay đổi gì trong thiết kế.

## Short answer

Quản lý cao nhất gắn nhãn nhầm nhánh pháp lý thành tài chính khi phân rã tác vụ. Quản lý phụ làm điều được giao, các worker làm tốt công việc tài chính, và bộ tổng hợp cao nhất báo cáo các phát hiện tài chính. Lỗi chỉ xuất hiện ở đỉnh, cách một cấp so với bất kỳ điểm nào một người có thể bắt được nó. Các cách sửa thiết kế là giới hạn độ sâu hai, nguồn gốc trên mọi lần tổng hợp, một phân rã được ghi log và kiểm tra đối chiếu câu hỏi gốc, và một worker canary luôn được hỏi câu hỏi của người dùng nguyên vẹn.

## Full answer

### Why hierarchy hides this

Một quản lý con người có tri thức ổn định về công việc của mỗi nhóm. Một quản lý mô hình suy ra lại toàn bộ cấu trúc mỗi lượt từ bất cứ thứ gì trong ngữ cảnh của nó. Một sự trôi nhỏ trong ngữ cảnh đó thay đổi phân rã, và mọi cấp bên dưới làm việc trên phiên bản bị trôi với thiện chí. Bài học nêu ba chế độ lỗi, và sự cố này là chế độ đầu:

| Lỗi | Cơ chế |
|---|---|
| Lỗi giao tác vụ | Quản lý ảo giác một phân rã và gửi công việc đến sai nhánh |
| Diễn giải sai đầu ra | Một quản lý phụ trả về "không thể xác minh khẳng định X" và cấp cao nhất báo cáo "khẳng định X không được xác nhận", và ý nghĩa trôi ở mọi cấp |
| Vòng lặp đồng thuận | Hai quản lý phụ bất đồng, cấp cao nhất yêu cầu họ hòa giải, họ phân công lại, worker chạy lại, và vòng lặp tiếp tục đến một giới hạn bước |

### Trace it

1. Đọc log phân rã của quản lý cao nhất. Nhãn nhánh là "tài chính", không phải "pháp lý".
2. Đọc đầu vào của quản lý phụ. Nó nhận một tác vụ tài chính và không có cách biết nó sai.
3. Đọc phần tổng hợp. Nó trích dẫn các phát hiện tài chính. Câu hỏi pháp lý gốc không xuất hiện ở đâu.

Đặt điều được hỏi và điều được bàn giao cạnh nhau là toàn bộ chẩn đoán.

### The design changes

- **Giới hạn độ sâu ở hai.** Ba cấp đã giấu phần lớn lỗi khỏi khả năng quan sát.
- **Nguồn gốc trên mọi lần tổng hợp.** Bản tóm tắt của mỗi node trích dẫn các đầu ra lá tạo ra nó, để một báo cáo có thể được truy về các worker đã viết nó.
- **Cảnh báo về sự trôi phân rã.** Ghi log phân rã của quản lý ở mỗi bước và so sánh nó với câu hỏi của người dùng. Khi phân rã không còn bao phủ câu hỏi, phát một cảnh báo trước khi worker bắt đầu.
- **Một worker canary mỗi quản lý phụ.** Một worker luôn được hỏi câu hỏi gốc nguyên vẹn. Khi câu trả lời của canary bất đồng với câu trả lời tổng hợp, quản lý dừng và chuyển lên thay vì gộp.
- **Một ngân sách hòa giải tường minh.** Đặt số vòng trước khi cấp cao nhất phải chốt, thường là hai.

### The deciding question

Trước khi giữ hệ phân cấp, hỏi liệu tác vụ có các nhóm con độc lập hay là một luồng tuyến tính trông như cây. Một đánh giá hợp đồng có các nhánh pháp lý và kỹ thuật là một cây thật. Một tác vụ mà bước hai cần bước một là một pipeline, và tuần tự thắng phân cấp ở đó.

## Follow-ups

- **Level 3:** Lỗi đi qua bao nhiêu cấp trước khi đầu ra lệch khỏi câu hỏi? Expected: một, vì việc gắn nhãn nhầm xảy ra ở đỉnh và mọi cấp bên dưới thực thi nó trung thành, đó là lý do giới hạn độ sâu là hai.
- **Level 3:** Câu trả lời của canary và câu trả lời được gộp khác nhau. Quản lý làm gì? Expected: dừng, ghi cả hai câu trả lời với nguồn gốc, và chuyển lên một người hoặc phân rã lại, không bao giờ gộp hai câu.
- **Level 4:** Bạn phát hiện sự trôi ý nghĩa giữa các cấp như thế nào? Expected: so sánh bản tóm tắt của mỗi node với các đầu ra lá nó trích dẫn, và gắn cờ một bản tóm tắt thay đổi tình thái của một khẳng định, chẳng hạn chưa xác minh thành sai.
- **Level 4:** Vòng lặp hòa giải tiếp tục chạm giới hạn bước. Điều đó cho bạn biết gì? Expected: giới hạn giờ là một siêu tham số giấu một bất đồng, nên hoặc phân rã sai hoặc câu hỏi không có một đáp án duy nhất, và cấp cao nhất phải báo cáo sự bất đồng.

## Wrong answers

- "Thêm một cấp thứ tư để kiểm tra cấp thứ ba." Nhiều cấp hơn giấu nhiều lỗi hơn khỏi khả năng quan sát, và cách sửa là ít cấp hơn với nguồn gốc.
- "Bảo quản lý phụ kiểm tra lại tác vụ nó nhận." Quản lý phụ không có quyền truy cập câu hỏi gốc, và một worker canary là cơ chế cấp cho nó câu hỏi.
- "Dùng một mô hình lớn hơn cho quản lý cao nhất." Một quản lý lớn hơn vẫn suy ra lại cấu trúc mỗi lượt từ ngữ cảnh của nó, và nhãn nhầm là một sự trôi ngữ cảnh, không phải một khoảng cách năng lực.

## Taught in

[Bài học kiến trúc phân cấp](../../../phases/16-multi-agent-and-swarms/06-hierarchical-architecture/) chạy đường thành công đối chiếu đường gắn nhãn nhầm và liệt kê các biện pháp bảo vệ.
