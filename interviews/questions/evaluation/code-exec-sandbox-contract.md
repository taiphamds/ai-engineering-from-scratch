---
id: code-exec-sandbox-contract
title: Score generated code without an exec in the eval process
card: evaluation
kind: design
level: 3
roles: [ai-evaluation-reliability-engineer, agentic-ai-engineer, applied-ai-engineer]
rounds: [system-design, design-review]
tags: [code-exec, sandbox, timeout, denylist, exit-codes]
minutes: 10
lessons: [phases/19-capstone-projects/72-code-exec-metric, phases/19-capstone-projects/49-lm-eval-harness]
manuals: []
practice: []
cheatsheet: [eval-driven-agents]
related: [evaluation/two-pass-at-k-formulas]
updated: 2026-11-03
---

Bạn phải chấm mã được sinh bằng cách chạy nó. Một đồng đội đề xuất một lời gọi hàm eval của trình thông dịch bên trong tiến trình harness với một khối try quanh nó. Thay vào đó thiết kế hợp đồng thực thi, và nói một lần hết thời gian, một lần sập và một lần chạm denylist mỗi thứ xuất hiện trong kết quả như thế nào.

## Short answer

Chạy mọi ứng viên trong một tiến trình con trình thông dịch mới với một timeout thời gian thực, một giới hạn đầu ra và một denylist import, không bao giờ trong tiến trình harness. Điểm là tỷ lệ các assertion đạt. Một lần hết thời gian, một lỗi cú pháp, một assertion thất bại và bất kỳ lần sập khác mỗi thứ ánh xạ đến một lý do thoát riêng, để một người rà soát có thể phân biệt một lời giải chậm với một lời giải sai trong khi điểm cho phần lớn chúng bằng không.

## Full answer

### Why the subprocess

Một lời gọi trong tiến trình không thể sống sót qua một vòng lặp vô hạn được sinh, và nó không thể sống sót qua một lời gọi được sinh xóa hệ thống file. Một trình thông dịch mới mỗi ứng viên nhận mã trên đầu vào chuẩn, ghi một vỏ JSON của các kết quả theo assertion lên đầu ra chuẩn, và chết khi vượt quá. Harness tiếp tục chạy.

### The contract

1. **Trích xuất** code block có hàng rào đầu tiên từ phần sinh, với cùng quy tắc hậu xử lý mà đặc tả nhiệm vụ dùng.
2. **Xây dựng** một runner script quanh mã với các chuỗi assertion của nhiệm vụ.
3. **Khởi chạy** một trình thông dịch mới với một ngân sách mặc định 3 giây thời gian thực, được runner chặn giữa 0.1 và ba mươi giây.
4. **Giới hạn** đầu ra: runner stream đầu ra chuẩn và giết tiến trình con khi tổng vượt 256 KB, được ghi thành một lỗi với chi tiết tràn đầu ra.
5. **Cấm** các import nguy hiểm bằng cách viết lại chúng để phát sinh một lỗi import: lời gọi shell hệ điều hành, subprocess, socket, shutil, các thư viện request, và giao diện hàm ngoại. Danh sách là một biện pháp dự phòng. Timeout và giới hạn là các biện pháp kiểm soát chịu lực chính.

### The result vocabulary

| Lý do thoát | Ý nghĩa |
|---|---|
| pass | mọi assertion đạt |
| assertion_fail | mã đã chạy và ít nhất một assertion thất bại |
| syntax_error | mã không import được |
| timeout | thời gian thực đã hết |
| error | bất kỳ lần sập khác, gồm một lần chạm denylist và tràn đầu ra |

Điểm giữ là một tỷ lệ: hai trong ba assertion là 0.667. Lý do thoát là metadata, để lớp bảng xếp hạng có thể quyết định liệu một lần hết thời gian tính là không hay là dữ liệu thiếu.

### What the smaller harness does

Harness nhỏ hơn trong bài học bảng xếp hạng chạy dự đoán trong một namespace với các built-in bị lược bỏ, và kiểm thử của nó khẳng định rằng một import module hệ điều hành thất bại. Nó cũng giới hạn kích thước batch cho các giới hạn tốc độ và ghim các file nhiệm vụ bằng một hash để một điểm dịch chuyển có thể được truy về một nhiệm vụ dịch chuyển.

### What this is not

Không phải một sandbox cho mã không đáng tin từ web mở, không phải một nơi cho các nhiệm vụ có trạng thái với file hoặc mạng. Những thứ đó cần một container hoặc một microVM.

## Follow-ups

- **Level 3:** Tại sao denylist không phải biện pháp kiểm soát chính? Expected: mã quyết tâm có thể thoát bất kỳ biện pháp bảo vệ trong tiến trình nào; timeout thời gian thực và giới hạn đầu ra chặn thời gian chạy và kích thước đầu ra bất kể mã làm gì. Chúng không chặn bộ nhớ hoặc việc ghi file, vì vậy production thêm một hệ thống file chỉ đọc và cách ly mạng, hoặc một container.
- **Level 3:** Một ứng viên in bên trong một vòng lặp vô hạn. Biện pháp kiểm soát nào kích hoạt? Expected: giới hạn đầu ra tại 256 KB, được ghi thành một lỗi với chi tiết tràn đầu ra; timeout sẽ kích hoạt sau.
- **Level 4:** Bảng xếp hạng nên xử lý các lần hết thời gian như thế nào, không hay thiếu? Expected: một lựa chọn được tài liệu hóa; không nếu mã chậm là sai cho nhiệm vụ, thiếu nếu bạn chỉ đo tính đúng đắn, và lý do thoát cho phép bạn báo cáo cả hai.
- **Level 4:** Khi nào các chuỗi assertion ngừng đủ? Expected: khi đánh giá nên khớp production CI; thay chúng bằng các file kiểm thử đơn vị thật trong một container và ngừng gọi các chuỗi là kiểm thử.

## Wrong answers

- "Một khối try quanh lời gọi là một sandbox." Nó bắt ngoại lệ, không bắt các vòng lặp vô hạn, không bắt xóa file, không bắt tràn bộ nhớ.
- "Denylist làm nó an toàn." Nó là một biện pháp dự phòng bảo thủ; capstone nêu rằng nó không chắc chắn tuyệt đối.
- "Chấm một lần hết thời gian là một lần sập." Giữ chúng riêng biệt trong lý do thoát; điểm có thể bằng không cho cả hai, nhưng lý do cho bạn biết liệu có tăng ngân sách không.

## Taught in

[Capstone metric thực thi mã](../../../phases/19-capstone-projects/72-code-exec-metric/) đưa ra hợp đồng tiến trình con, các lý do thoát và giới hạn, và [capstone harness đánh giá mô hình ngôn ngữ](../../../phases/19-capstone-projects/49-lm-eval-harness/) chạy các dự đoán trong một namespace lược bỏ và ghim các file nhiệm vụ.
