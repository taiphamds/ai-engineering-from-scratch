---
id: a-quarterly-failure-audit
title: Design the quarterly failure audit for an agent team
card: multi-agent
kind: design
level: 4
roles: [agentic-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [system-design, design-review]
tags: [mast, failure-audit, verification-gap, slow-failure, golden-dataset]
minutes: 15
lessons: [phases/16-multi-agent-and-swarms/23-failure-modes-mast-groupthink]
manuals: []
practice: []
cheatsheet: [agent-failure-modes, multi-agent]
related: [multi-agent/the-retry-storm, multi-agent/a-number-that-never-existed]
updated: 2026-11-03
---

Một sản phẩm đa agent đã ở production trong hai quý. Các lỗi đến như một luồng ticket không liên quan và không có gì được sửa một cách hệ thống. Thiết kế cuộc kiểm toán biến luồng thành một danh sách các cách sửa được xếp hạng, và nói bạn sẽ đặt trọng số lớn nhất cho lớp lỗi nào ngay cả khi nó không thường xuyên nhất.

## Short answer

Lấy mẫu khoảng 1000 trace thực thi thực mỗi quý, phân loại mọi lỗi vào ba nhóm gốc của hệ phân loại đã công bố và năm mẫu tư duy nhóm, tính tỷ lệ lỗi mỗi nhóm, xếp hạng các biện pháp giảm thiểu theo số lỗi mỗi biện pháp sẽ loại bỏ, và cam kết hai hoặc ba biện pháp cho quý. Đặt trọng số lớn nhất cho các khoảng trống xác minh dù chúng là nhóm nhỏ nhất theo số lượng, vì chúng im lặng: một đầu ra sai hợp lý không tạo ngoại lệ, không cảnh báo và không ticket đến khi một người nhận thấy.

## Full answer

### The baseline you are measured against

Hệ phân loại tham chiếu được xây dựng từ 1642 trace thực thi trên 7 hệ thống đa agent mã nguồn mở và tìm thấy các tỷ lệ lỗi giữa 41 phần trăm và 86.7 phần trăm. Ba nhóm gốc:

| Nhóm | Tỷ phần | Nó trông như thế nào |
|---|---|---|
| Các vấn đề đặc tả | 41.77 phần trăm | Vai trò mơ hồ, một tác vụ thiếu đặc tả, các tiêu chí thành công ngầm |
| Các lỗi phối hợp | 36.94 phần trăm | Các lần ghi không đồng bộ vào trạng thái dùng chung, thông điệp bị mất, trôi trạng thái |
| Các khoảng trống xác minh | 21.30 phần trăm | Một agent tuyên bố thành công và không ai kiểm tra, mỗi agent tin agent trước |

Cạnh chúng là năm mẫu tư duy nhóm: đơn canh, tuân theo, thiếu một mô hình về niềm tin của nhau, trôi thỏa hiệp và các lỗi dây chuyền.

### The audit, step by step

1. **Lấy mẫu.** Lấy khoảng 1000 trace thực, phân tầng theo loại tác vụ, không phải những trace tạo ticket.
2. **Phân loại.** Ánh xạ mỗi lỗi vào một nhóm gốc và bất kỳ mẫu tư duy nhóm nào. Hai người đánh giá mỗi trace đến khi các nhóm ổn định.
3. **Tính.** Tỷ lệ lỗi mỗi nhóm cho hệ thống của bạn. Các tỷ phần đã công bố là một tiên nghiệm, không phải con số của bạn.
4. **Xếp hạng.** Với mỗi biện pháp giảm thiểu ứng viên, đếm các lỗi nó sẽ loại bỏ.
5. **Cam kết.** Hai hoặc ba biện pháp giảm thiểu cho quý, mỗi biện pháp có một người phụ trách và một ngày tái kiểm toán.

Kỷ luật quan trọng hơn các lựa chọn. Không có kiểm toán, các lỗi hòa vào nhiễu.

### The mitigation menu

- Đặc tả: các hợp đồng vai trò tường minh nói một agent làm gì và không làm gì, các kiểm thử chấp nhận được viết trước khi phân công, một kiểm tra định nghĩa tác vụ trước khi chạy.
- Phối hợp: trạng thái dùng chung có phiên bản với đồng thời lạc quan, xác nhận cho các thông điệp quan trọng, các checkpoint đồng bộ trạng thái định kỳ.
- Xác minh: một bộ xác minh chỉ đọc độc lập với quyền truy cập nguồn riêng, các hợp đồng bàn giao yêu cầu một kiểm tra trước khi agent tiếp theo bắt đầu, ghi log kết quả.
- Dây chuyền: các circuit breaker trên mọi lời gọi đi ra với ngưỡng mở mặc định ở tỷ lệ lỗi 5 đến 10 phần trăm, và các ngân sách thử lại bị giới hạn.

### Why verification gaps weigh more

Một lỗi ồn ào, một crash hoặc một timeout, ít tốn kém để phát hiện. Một lỗi tính đúng đắn im lặng không thể được tìm trong log ngoại lệ. Đó là lý do các khoảng trống xác minh là nhóm đắt nhất trên mỗi lỗi. Đầu tư vào đánh giá con người dựa trên mẫu, một tập dữ liệu vàng nhỏ được kiểm toán bằng tay chạy hằng tuần, và các kiểm tra chéo giữa agent trên những đầu ra quan trọng.

### Catch slow failures before the audit

Đo các chỉ dấu cho sự trôi: tỷ lệ đồng thuận giữa các agent song song, tỷ lệ thử lại, phân phối độ dài đầu ra, và khoảng cách chỉnh sửa giữa các phiên bản agent liên tiếp. Bài học cũng mô tả một bộ ba agent chuyên biệt, phát hiện, chẩn đoán và xác thực, cải thiện thành công giảm thiểu gấp 1.5 lần; bắt đầu chỉ với phát hiện và thêm chẩn đoán khi các triệu chứng nhiễu.

### Make it binding

Đặt một ngân sách lỗi mỗi nhóm, một mục tiêu tường minh cho tỷ lệ. Khi một nhóm vượt ngân sách, bản phát hành tiếp theo chờ.

## Follow-ups

- **Level 3:** Tại sao lấy mẫu trace thay vì kiểm toán ticket? Expected: ticket là các lỗi ồn ào, và những lỗi im lặng không bao giờ tạo ticket, nên một mẫu phân tầng là cách duy nhất để thấy chúng.
- **Level 3:** Bạn sẽ đo chỉ dấu đơn lẻ nào trước? Expected: tỷ lệ đồng thuận giữa các agent song song, vì một mức tăng mạnh báo hiệu tuân theo và một mức giảm mạnh báo hiệu sự trôi, và cả hai đi trước các lỗi nhìn thấy.
- **Level 4:** Kiểm toán thấy các vấn đề đặc tả chi phối. Cách sửa ít tốn kém nhất là gì? Expected: một kiểm tra định nghĩa tác vụ trước khi chạy bởi một agent riêng trước khi phân công, với các hợp đồng vai trò bao gồm những gì mỗi agent không làm.
- **Level 4:** Bạn giữ kiểm toán khỏi trở thành một báo cáo không ai hành động như thế nào? Expected: ngân sách lỗi với một quy tắc dừng phát hành, người phụ trách mỗi biện pháp giảm thiểu, và ngày tái kiểm toán trên lịch trước khi quý bắt đầu.

## Wrong answers

- "Sửa nhóm thường xuyên nhất trước." Tần suất không phải chi phí, và các khoảng trống xác minh im lặng tốn nhiều hơn trên mỗi lỗi so với các vấn đề đặc tả ồn ào.
- "Kiểm toán một lần mỗi năm, khi hệ thống ổn định." Các nhóm dịch chuyển khi hệ thống tăng, và một năm lỗi không được xếp hạng là luồng bạn bắt đầu với.
- "Thêm agent để kiểm tra nhau." Các agent chia sẻ một mô hình chia sẻ các điểm mù của chúng, và kiểm tra quan trọng là một bộ xác minh độc lập có quyền truy cập nguồn riêng.

## Taught in

[Bài học các chế độ lỗi](../../../phases/16-multi-agent-and-swarms/23-failure-modes-mast-groupthink/) đưa ra hệ phân loại, các bước kiểm toán và các chỉ dấu lỗi chậm.
