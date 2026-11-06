---
id: agent-decides-alone
title: Decide which choices an agent may make alone
card: behavioral
kind: tradeoff
level: 4
roles: [agentic-ai-engineer, applied-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [behavioral, design-review]
tags: [autonomy, authority, decision-modes, delegation]
minutes: 12
lessons: [phases/14-agent-engineering/45-delegate-with-isolation, phases/14-agent-engineering/51-write-specifications-that-preserve-judgment]
manuals: []
practice: []
cheatsheet: [delegation-feedback, agent-planning]
related: [behavioral/locked-bounded-delegated, behavioral/split-that-only-looks-parallel]
updated: 2026-11-03
---

Tổ chức của bạn muốn cho phép các coding agent gộp các thay đổi mà không có con người trong vòng lặp cho một lớp nhiệm vụ. Bạn được yêu cầu viết chính sách nói những quyết định nào một agent có thể tự đưa ra. Bạn vạch ranh giới đó thế nào, và nó dịch chuyển theo thời gian ra sao?

## Short answer

Ranh giới đi theo hậu quả và khả năng đảo ngược, không theo độ khó nhiệm vụ. Một con người giữ các lựa chọn thay đổi hành vi công khai, rủi ro, thẩm quyền hoặc chi phí không thể đảo ngược; một agent sở hữu việc điều tra có giới hạn, triển khai, xác minh và đánh giá. Tôi biểu đạt điều đó thành các quyết định bị khóa, có giới hạn và được ủy quyền trong mỗi hợp đồng nhiệm vụ, và tôi chỉ mở rộng tập được ủy quyền ở nơi bằng chứng và rollback mạnh, là quyền tự chủ được hiệu chỉnh thay vì một công tắc cố định.

## Full answer

### Calibrated autonomy

Hệ thống cấp tự do ở nơi bằng chứng và rollback mạnh và yêu cầu một checkpoint ở nơi hậu quả cao. Đó là một thuộc tính của mỗi quyết định, nên chính sách được viết theo lớp quyết định, không theo nhiệm vụ hoặc mô hình.

### Human-owned and agent-owned

| Con người giữ | Agent có thể sở hữu |
|---|---|
| Các thay đổi hành vi công khai hoặc tính tương thích | Cấu trúc cục bộ, tên, các lần refactor có thể đảo ngược |
| Các thay đổi về rủi ro hoặc tư thế an toàn | Việc điều tra có giới hạn trả về một bảng thông tin thực tế |
| Việc cấp thẩm quyền hoặc quyền truy cập | Triển khai bên trong các đường dẫn độc quyền với bằng chứng |
| Chi phí không thể đảo ngược: migration, xóa, chi tiêu | Xác minh và đánh giá chỉ đọc các sản phẩm đã hoàn tất |

### The three modes make it executable

Mỗi quyết định trong một hợp đồng nhiệm vụ bị khóa, có giới hạn hoặc được ủy quyền. Các quyết định bị khóa mang một checkpoint của con người. Các quyết định có giới hạn nêu các giới hạn, như một danh sách dependency được phép hoặc một phạm vi thử lại, và agent đề xuất bên trong chúng. Các quyết định được ủy quyền yêu cầu agent giải thích lựa chọn và chứng minh kết quả. Chế độ được chọn từ hậu quả và khả năng đảo ngược, và lý do được ghi lại để một nhóm sau này có thể sửa đổi nó.

### How the line moves

Quyền tự chủ mở rộng trên bằng chứng. Khi một lớp các quyết định được ủy quyền có một lớp chứng minh mạnh, một rollback sạch và một khoảng thời gian không có sự cố, một quyết định có giới hạn có thể trở thành được ủy quyền. Khi một sự cố cho thấy thiếu một biện pháp kiểm soát, sự dịch chuyển đi theo hướng ngược lại cho đến khi biện pháp kiểm soát tồn tại. Bản thân chính sách là một biện pháp kiểm soát có một người phụ trách và một ngày đánh giá.

### What never moves

Phép chứng minh phải khớp khẳng định. Một kiểm thử đơn vị không chứng minh một đường giao diện công khai, và bản tóm tắt của một agent không thay thế việc đọc đầu ra chứng minh. Người tích hợp đọc bằng chứng, không câu chuyện.

## Follow-ups

- **Level 3:** Một agent đề xuất một dependency ngoài danh sách cho phép với một lập luận tốt. Điều gì xảy ra? Expected: quyết định có giới hạn được chuyển lên một con người; lập luận là đầu vào cho quyết định, không phải một sự cho phép.
- **Level 4:** Bạn mở rộng quyền tự chủ cho một lớp quyết định một cách an toàn thế nào? Expected: cho thấy lớp chứng minh, rollback và một khoảng thời gian không có sự cố cho lớp đó, rồi thay đổi chế độ và ghi lại bằng chứng cùng người đánh giá.
- **Level 4:** Bằng chứng nào sẽ khiến bạn thu hẹp quyền tự chủ lần nữa? Expected: một sự cố mà một biện pháp kiểm soát cấp thấp hơn không bắt được, cho thấy lớp chứng minh yếu hơn chính sách giả định.

## Wrong answers

- "Để agent quyết định các nhiệm vụ dễ và giữ các nhiệm vụ khó." Độ khó không phải trục; một lần xóa tầm thường có thể không thể đảo ngược và một lần refactor khó có thể đảo ngược.
- "Quyền tự chủ là một thiết lập duy nhất theo nhóm." Mỗi lớp quyết định có hậu quả và khả năng đảo ngược riêng, nên một công tắc sai ở cả hai hướng.
- "Một bộ kiểm thử đạt là đủ để gộp bất kỳ thứ gì." Bộ kiểm thử chứng minh các hợp đồng cục bộ; hành vi công khai, thẩm quyền và chi phí không thể đảo ngược cần phép chứng minh riêng và một checkpoint của con người.

## Taught in

[Bài học ủy quyền](../../../phases/14-agent-engineering/45-delegate-with-isolation/) định nghĩa quyền tự chủ được hiệu chỉnh và [bài học đặc tả](../../../phases/14-agent-engineering/51-write-specifications-that-preserve-judgment/) đưa ra ba chế độ quyết định.
