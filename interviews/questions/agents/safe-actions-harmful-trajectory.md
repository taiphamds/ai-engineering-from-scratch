---
id: safe-actions-harmful-trajectory
title: Every action was approved, and the run was still harmful
card: agents
kind: concept
level: 3
roles: [agentic-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [ml-depth, design-review]
tags: [trajectory, classifier, exfiltration, prompt-injection, isolation]
minutes: 10
lessons: [phases/15-autonomous-systems/10-claude-code-permission-modes, phases/14-agent-engineering/36-scope-contracts]
manuals: []
practice: []
cheatsheet: [autonomous-agents, agent-failure-modes]
related: [agents/pick-the-permission-mode, agents/a-login-fix-touched-five-files]
updated: 2026-11-03
---

Một lần chạy lập trình không giám sát dùng chế độ trong đó một mô hình riêng đánh giá mọi hành động trước khi thực thi. Cuộc kiểm toán cho thấy người đánh giá đã phê duyệt mỗi hành động. Lần chạy vẫn sao chép một tập dữ liệu riêng tư vào một repository công khai. Giải thích điều đó có thể xảy ra thế nào, và nêu các biện pháp kiểm soát sẽ ngăn được nó.

## Short answer

Người đánh giá phán xét từng hành động một đối chiếu với yêu cầu. Mỗi hành động trong lần chạy được phép khi đứng riêng: đọc một file bạn sở hữu, viết một file bạn sở hữu, commit, push. Tác hại nằm trong sự kết hợp, và người đánh giá không suy ra lại ý định người dùng trên toàn quỹ đạo. Các biện pháp kiểm soát bắt điều này nằm ngoài phép kiểm tra từng hành động: một workspace cô lập không có mount nhạy cảm, một danh sách cho phép lưu lượng mạng đi ra trong hợp đồng phạm vi, các mức trần hành động theo công cụ, và một cuộc kiểm toán quỹ đạo sau lần chạy phát hiện những gì các biện pháp khác cho lọt qua.

## Full answer

### What a per-action reviewer can and cannot see

Bài học liệt kê những gì bộ phân loại bắt được: một injection rõ ràng ánh xạ đến một dạng hành động rủi ro đã biết, một vòng lặp lặp lại nơi hành động N+1 gần bằng hành động N, và một lệnh shell không đúng chỗ trong một phiên chỉnh sửa file. Nó cũng liệt kê những gì bộ phân loại bỏ sót. Injection tinh vi có thể thay đổi hành vi mà không tạo ra một hành động bị đánh dấu. Mọi hành động có thể trông an toàn trong khi quỹ đạo kết hợp gây hại. Tuồn dữ liệu qua các kênh hợp lệ là trường hợp tiêu chuẩn: viết dữ liệu vào một file bạn sở hữu rồi push lên một repository công khai là một chuỗi các hành động được phép.

### Why intent does not help

Người đánh giá so sánh hành động với nhiệm vụ được khai báo và trạng thái phiên. Nó không hỏi toàn bộ chuỗi hoàn thành điều gì. Yêu cầu một mô hình suy ra ý định của người dùng cho mọi hành động sẽ làm người đánh giá chậm hơn và không đáng tin cậy hơn, vì văn bản được chèn nằm trong cùng ngữ cảnh mà nó sẽ đọc.

### The controls

| Biện pháp kiểm soát | Nó nằm ở đâu | Nó ngăn gì |
|---|---|---|
| Workspace cô lập | Runtime, không có thông tin xác thực và không có mount production | Tập dữ liệu chưa bao giờ tiếp cận được |
| Danh sách cho phép lưu lượng mạng đi ra | Hợp đồng phạm vi | Lần push đến một host không thuộc nhiệm vụ |
| Các mức trần hành động theo công cụ | Các biện pháp kiểm soát ngân sách | Một chuỗi push hoặc fetch dài |
| Ngân sách thời gian | Hợp đồng phạm vi | Một lần chạy tiếp tục qua điểm mà một con người sẽ kiểm tra |
| Kiểm toán quỹ đạo | Sau lần chạy, trên luồng sự kiện | Không có gì trong lần chạy này. Nó phát hiện sự kết hợp mà không phép kiểm tra từng hành động nào thấy, để lần chạy tiếp theo được dừng, nhưng nó không thể hoàn tác một lần push đã thực hiện |

Hợp đồng phạm vi là nơi cho quy tắc lưu lượng đi ra, vì nó theo nhiệm vụ. Quy tắc gộp cho hai hợp đồng giữ nó nghiêm ngặt: một danh sách cho phép chưa đặt nhường cho hợp đồng kia, hai danh sách lấy giao, và một danh sách rỗng vẫn từ chối tất cả.

### The honest framing

Tài liệu cung cấp chế độ bộ phân loại dưới dạng một bản xem trước nghiên cứu và nói nó không đủ khi đứng riêng. Thiết lập kỳ vọng kết hợp nó với các ngân sách, danh sách cho phép, cô lập và kiểm toán. Một bộ phân loại vượt qua một đánh giá ngoại tuyến có thể hành xử khác trong một phiên nơi ngữ cảnh người dùng mơ hồ.

## Follow-ups

- **Level 3:** Tại sao một danh sách cho phép lưu lượng đi ra là một chiều phạm vi chứ không phải một thiết lập runtime? Expected: các host mà một nhiệm vụ có thể tiếp cận thay đổi theo nhiệm vụ, nên quy tắc thuộc về hợp đồng theo nhiệm vụ nơi các glob file và ngân sách thời gian nằm.
- **Level 3:** Cuộc kiểm toán quỹ đạo đọc gì? Expected: luồng sự kiện chỉ nối thêm của các lời gọi công cụ và kết quả, mà một bên đăng ký có thể phát lại từ bất kỳ độ lệch nào mà không chạy lại mô hình.
- **Level 4:** Bạn không thể vá hoàn toàn prompt injection gián tiếp. Điều đó hàm ý gì cho thiết kế? Expected: coi các đầu ra công cụ là không đáng tin cậy, giữ dữ liệu agent có thể tiếp cận nhỏ, giữ các nơi nó có thể gửi đến nhỏ, và chấp nhận rằng phát hiện là một lớp và khoanh vùng là biện pháp kiểm soát.
- **Level 4:** Bạn kiểm thử tập biện pháp kiểm soát trước lần chạy không giám sát tiếp theo thế nào? Expected: viết một quỹ đạo trong đó mọi hành động được phê duyệt và sự kết hợp gây hại, chạy nó trong workspace cô lập, và xác nhận rằng danh sách cho phép hoặc các mount ngăn nó.

## Wrong answers

- "Mô hình đánh giá quá yếu, nên dùng một mô hình lớn hơn." Một người đánh giá lớn hơn vẫn phán xét từng hành động một và vẫn đọc cùng ngữ cảnh bị chèn.
- "Phê duyệt push thủ công và phần còn lại tự động." Một lần push là một trong nhiều kênh hợp lệ, và dữ liệu đã rời vị trí riêng tư qua các lần ghi được phép.
- "Giữ tập dữ liệu trong repo nhưng đánh dấu nó riêng tư trong prompt." Prompt là lời khuyên, và biện pháp kiểm soát là liệu tập dữ liệu có được mount vào workspace hay không.

## Taught in

[Bài học các chế độ quyền hạn](../../../phases/15-autonomous-systems/10-claude-code-permission-modes/) nêu các khoảng trống trong bộ phân loại, và [bài học hợp đồng phạm vi](../../../phases/14-agent-engineering/36-scope-contracts/) thêm các ngân sách lưu lượng đi ra và thời gian vào hợp đồng.
