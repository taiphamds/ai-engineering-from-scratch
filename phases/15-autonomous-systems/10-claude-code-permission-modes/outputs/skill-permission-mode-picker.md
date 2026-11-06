---
name: permission-mode-picker
description: Match a Claude Code task to the correct permission mode, budget caps, and required isolation before starting a run.
version: 1.0.0
phase: 15
lesson: 10
tags: [claude-code, permission-modes, auto-mode, budgets, isolation]
---

Với một tác vụ Claude Code được đề xuất, chọn chế độ quyền, đặt ngân sách, và chỉ định cách ly tối thiểu cần có trước khi agent được phép bắt đầu.

Tạo ra:

1. **Hồ sơ tác vụ.** Một câu về những gì tác vụ làm, một câu về phạm vi ảnh hưởng nếu nó diễn ra sai.
2. **Khuyến nghị chế độ.** Một trong: `plan`, `default`, `acceptEdits`, `auto`, `dontAsk`, `bypassPermissions`. Giải thích bằng một câu duy nhất tham chiếu phạm vi ảnh hưởng.
3. **Các con số ngân sách.** Các giá trị cụ thể cho `max_turns`, `max_budget_usd`, và bất kỳ mức trần nào cho từng công cụ. Với các lần chạy không có người giám sát trên một giờ, chỉ định mức trần đô la bằng hoặc thấp hơn số tiền bạn sẽ trả cho một sai lầm của con người mà bạn không thể hoàn tác.
4. **Yêu cầu cách ly.** Phạm vi hệ thống file (chỉ thư mục dự án, thư mục tạm, container tạm thời). Chính sách mạng (không có lưu lượng đi ra, chỉ danh sách cho phép, đầy đủ). Bề mặt thông tin xác thực (không có, token có phạm vi giới hạn, token có phạm vi rộng). Với `bypassPermissions` hoặc `dontAsk`, lần chạy phải nằm bên trong một container tạm thời không có thông tin xác thực sản xuất được mount.
5. **Kế hoạch kiểm toán quỹ đạo.** Một người sẽ xem xét quỹ đạo sau lần chạy như thế nào? Bắt buộc đối với `auto`, `dontAsk`, và bất cứ điều gì vượt tầm thời gian 30 phút.

Các trường hợp loại bỏ dứt khoát:
- `bypassPermissions` trên một kho mã có các thay đổi chưa commit.
- `auto` không có mức trần ngân sách.
- Bất kỳ chế độ nào trên `acceptEdits` với thông tin xác thực có phạm vi rộng trong môi trường (AWS, GCP, GitHub PAT với phạm vi repo).
- Các lần chạy không có người giám sát dài hơn một giờ mà không có kiểm toán quỹ đạo được lên lịch.
- Các tuyên bố rằng chỉ riêng bộ phân loại Auto Mode là đủ cho một phân phối tác vụ mới.

Các quy tắc từ chối:
- Nếu người dùng không thể nêu phạm vi ảnh hưởng của một lỗi, hãy từ chối và yêu cầu một câu tường minh về trường hợp xấu nhất trước khi bắt đầu.
- Nếu người dùng yêu cầu `auto` trong một không gian làm việc có thể tiếp cận thông tin xác thực cơ sở dữ liệu sản xuất, hãy từ chối và yêu cầu thông tin xác thực có phạm vi giới hạn hoặc một container tạm thời trước.
- Nếu mức trần ngân sách được đề xuất vượt quá số tiền người dùng sẵn sàng mất trong một lần chạy tệ, hãy từ chối và yêu cầu mức trần thấp hơn.

Định dạng đầu ra:

Trả về một thẻ lần chạy dài một trang với:
- **Tóm tắt tác vụ** (một câu)
- **Phạm vi ảnh hưởng** (một câu, trường hợp xấu nhất)
- **Chế độ** (tường minh)
- **Ngân sách** (`max_turns`, `max_budget_usd`, mức trần cho từng công cụ)
- **Cách ly** (phạm vi hệ thống file, chính sách mạng, bề mặt thông tin xác thực)
- **Kế hoạch kiểm toán** (ai xem xét quỹ đạo, khi nào, theo tiêu chí nào)
