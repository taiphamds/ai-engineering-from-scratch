---
id: seven-surfaces-one-symptom-each
title: Seven surfaces, and the symptom when each is missing
card: agents
kind: concept
level: 1
roles: [agentic-ai-engineer, ai-developer-relations-engineer, forward-deployed-ai-engineer]
rounds: [screen, ml-breadth]
tags: [workbench, surfaces, harness, definition-of-done, system-of-record]
minutes: 6
lessons: [phases/14-agent-engineering/31-agent-workbench-why-models-fail]
manuals: []
practice: []
cheatsheet: [agent-harness, agent-workbench-ops]
related: [agents/a-login-fix-touched-five-files]
updated: 2026-11-03
---

Một nhóm chạy một mô hình tiên tiến trên một nhiệm vụ repo nhỏ. Kết quả có mã có vẻ hợp lý, hai kiểm thử đỏ, một chỉnh sửa trong một file không liên quan gì đến nhiệm vụ, và không ghi chú về những gì mô hình giả định hoặc những gì còn lại. Nhóm muốn mua một mô hình lớn hơn. Bạn nói gì với họ?

## Short answer

Mô hình đúng về ngôn ngữ và sai về công việc, và một mô hình lớn hơn không sửa điều đó. Các agent đáng tin cậy cần một workbench với bảy bề mặt quanh mô hình: chỉ dẫn, trạng thái, phạm vi, phản hồi, xác minh, đánh giá và bàn giao. Mỗi triệu chứng trong lần chạy ánh xạ đến một bề mặt bị thiếu. Bạn có thể đổi mô hình và giữ các bề mặt, nhưng bạn không thể bỏ các bề mặt và giữ độ tin cậy.

## Full answer

### The seven surfaces

| Bề mặt | Nó mang gì | Thất bại khi thiếu |
|---|---|---|
| Chỉ dẫn | Các quy tắc khởi động, các hành động bị cấm, định nghĩa hoàn tất | Agent đoán hoàn tất nghĩa là gì |
| Trạng thái | Nhiệm vụ hiện tại, các file đã chạm, các chướng ngại, hành động tiếp theo | Mọi phiên bắt đầu từ không |
| Phạm vi | Các file được phép, các file bị cấm, tiêu chí nghiệm thu | Các chỉnh sửa lan vào mã không liên quan |
| Phản hồi | Đầu ra lệnh thật được thu vào vòng lặp | Agent tuyên bố thành công trên một lỗi |
| Xác minh | Các kiểm thử, lint, lần chạy smoke, phép kiểm tra phạm vi | "Trông tốt" đến nhánh main |
| Đánh giá | Một lượt thứ hai với một vai trò khác | Người xây dựng chấm công việc của chính mình |
| Bàn giao | Những gì đã thay đổi, tại sao, những gì còn lại | Phiên tiếp theo tìm lại mọi thứ |

### Map the run to the table

- Hai kiểm thử đỏ và một khẳng định thành công: phản hồi và xác minh bị thiếu.
- Một chỉnh sửa trong một file không liên quan: phạm vi bị thiếu.
- Không có ghi chú về các giả định hoặc những gì còn lại: trạng thái và bàn giao bị thiếu.
- Không ai ngoài người xây dựng đọc diff: đánh giá bị thiếu.

### Why not a bigger model

Vòng lặp khép lại trên file trạng thái, không trên lịch sử trò chuyện. Trò chuyện là biến động. Repo là hệ thống lưu bản ghi chính thức. Bài học thu thập các bằng chứng: một coding agent di chuyển từ ngoài top 30 lên hạng năm trên một benchmark terminal với cùng mô hình và một harness thay đổi, và một nhóm xóa 80 phần trăm các công cụ của agent và thấy tỷ lệ thành công đi từ 80 phần trăm lên 100 phần trăm. Tải ngày nay được gánh bởi phần kỹ thuật quanh mô hình.

### What a workbench is not

Nó không phải prompt engineering, thứ nói với mô hình bạn muốn gì ở lượt này. Nó không phải framework, thứ cho bạn một runtime. Workbench là nơi agent làm việc, qua các lượt và qua các phiên, bên trong bất kỳ runtime nào bạn đã chọn.

## Follow-ups

- **Level 1:** Một mẫu pull request bao phủ bề mặt nào trong bảy bề mặt? Expected: bàn giao, vì nó ghi lại những gì đã thay đổi, tại sao, và những gì còn lại.
- **Level 2:** Bề mặt nào bắt một agent viết một file bổ sung mà không ai yêu cầu? Expected: phạm vi trước, vì phép kiểm tra diff so sánh các file đã chạm với hợp đồng, và sau đó xác minh, từ chối lần ghi bị cấm.
- **Level 2:** Tại sao bài học nói vòng lặp khép lại trên một file chứ không trên trò chuyện? Expected: các phiên kết thúc và các cuộc trò chuyện bị cắt bớt, nên file là bản ghi duy nhất mà phiên tiếp theo có thể tin cậy.
- **Level 3:** Bài học ánh xạ mỗi bề mặt đến một primitive hệ thống phân tán. Xác minh là gì? Expected: một hàm xác định trên các đầu vào của nó, được kích hoạt khi nhiệm vụ đóng, và fail-closed.

## Wrong answers

- "Mô hình ảo giác, nên chọn một mô hình ít ảo giác hơn." Mô hình không biết hoàn tất nghĩa là gì hoặc nơi nó có thể ghi, và không mô hình nào biết điều đó khi thiếu các bề mặt.
- "Viết một system prompt dài hơn với tất cả các quy tắc." Một prompt bao phủ một lượt, trong khi các bề mặt mang công việc qua các lượt và phiên.
- "Framework đã làm điều này." Một framework cho agent một runtime, và workbench là những gì agent đọc và viết bên trong runtime đó.

## Taught in

[Bài học tại sao các mô hình có năng lực vẫn thất bại](../../../phases/14-agent-engineering/31-agent-workbench-why-models-fail/) nêu bảy bề mặt và chạy cùng nhiệm vụ có và không có chúng.
