---
id: plan-you-would-reject
title: What you check before you approve an execution plan
card: behavioral
kind: debug
level: 2
roles: [agentic-ai-engineer, applied-ai-engineer, inference-engineer, ai-evaluation-reliability-engineer]
rounds: [behavioral, design-review]
tags: [planning, evidence, dependencies, review]
minutes: 10
lessons: [phases/14-agent-engineering/44-plan-from-evidence]
manuals: []
practice: []
cheatsheet: [agent-planning]
related: [behavioral/leave-work-resumable, behavioral/split-that-only-looks-parallel]
updated: 2026-11-03
---

Một đồng đội, hoặc một coding agent, đưa bạn kế hoạch này cho một thay đổi API công khai: cập nhật endpoint, thêm các kiểm thử, cập nhật tài liệu. Họ muốn phê duyệt để bắt đầu. Bạn yêu cầu gì trước khi đồng ý, và điều gì sẽ khiến bạn bác bỏ kế hoạch ngay?

## Short answer

Danh sách đó lặp lại yêu cầu ở thì tương lai. Tôi yêu cầu năm thứ trên mỗi mục: một định danh ổn định, thay đổi nhỏ nhất, các thông tin trong repository biện minh cho nó, các mục nó phụ thuộc, và phép kiểm tra chính xác đóng nó. Tôi bác bỏ một kế hoạch có một định danh trùng, một mục không có bằng chứng hoặc phép chứng minh, một dependency vào một mục không biết, một chu trình, hoặc một bước không thể đảo ngược được lên lịch trước khi sự không chắc chắn nó phụ thuộc được giải quyết.

## Full answer

### Why the three-line plan fails

Không có gì trong đó nói điều gì được tìm thấy trong repository, tại sao các file đó là đúng, hợp đồng nào thay đổi trước, hoặc những gì có thể chạy cùng lúc. Ai đó có thể hoàn tất mọi dòng và vẫn tạo công việc phải làm lại.

### The five commitments

| Cam kết | Mục đích |
|---|---|
| Định danh | Một tham chiếu ổn định cho các dependency và bàn giao |
| Thay đổi | Thay đổi hành vi hoặc hợp đồng nhỏ nhất |
| Bằng chứng | Các thông tin trong repository biện minh cho thay đổi |
| Các dependency | Công việc phải đúng trước |
| Phép chứng minh | Phép kiểm tra chính xác đóng mục |

### Order by dependency, not by prose

Khi một số bề mặt phụ thuộc vào một hành vi, hợp đồng đến trước. Các kiểm thử, triển khai và tài liệu sau đó dùng chung một định nghĩa thay vì bịa ra bốn. Một đồ thị phụ thuộc cũng cho thấy tính đồng thời an toàn: triển khai và tài liệu có thể tiến hành cùng nhau sau khi hợp đồng được cố định, và gate tích hợp chờ cả hai.

### Evidence must be able to change the plan

Một thành phần trợ giúp hiện có loại bỏ một lớp trừu tượng được lên kế hoạch. Một kiểm thử tính tương thích buộc một bước migration. Một ràng buộc triển khai chuyển một thay đổi schema sang một nhiệm vụ khác. Nếu một mẩu bằng chứng không thể thay đổi kế hoạch, nó là trang trí, không phải bằng chứng.

### The rejection list

Năm phép kiểm tra đầu mang tính cơ học: các định danh trùng, các mục không có bằng chứng, các mục không có phép chứng minh, các dependency không biết, các chu trình. Phép kiểm tra cuối cần phán đoán: hành động không thể đảo ngược đầu tiên, như một migration hoặc một lần phát hành công khai, có xảy ra trước khi sự không chắc chắn liên quan được giải quyết không? Tôi nêu rõ điều đó trong đánh giá.

## Follow-ups

- **Level 2:** Một mục liệt kê hai lệnh chứng minh. Bạn làm gì? Expected: tách nó thành hai mục, vì một mục cần một phép chứng minh hoàn tất rõ ràng.
- **Level 2:** Hai mục phụ thuộc lẫn nhau. Điều đó thường giấu gì? Expected: một bất đồng sản phẩm hoặc thiết kế chưa giải quyết; chu trình là triệu chứng, quyết định bị thiếu là nguyên nhân.
- **Level 3:** Kế hoạch nằm trong một luồng trò chuyện dưới dạng các ô đã đánh dấu. Tại sao đó là vấn đề? Expected: một phiên có thể kết thúc bất kỳ lúc nào, và người khác không thể thấy phép chứng minh nào đã chạy hoặc mục nào hiện được gỡ chặn; kế hoạch thuộc về cạnh công việc.
- **Level 3:** Một mục migration cần một phê duyệt của con người. Bạn biểu đạt điều đó trong đồ thị thế nào? Expected: như một mục rõ ràng với phê duyệt làm phép chứng minh của nó, mà mọi mục phụ thuộc chờ.

## Wrong answers

- "Tin tác giả và đánh giá kết quả thay vào đó." Công việc làm lại được tìm thấy tại thời điểm đánh giá tốn hơn một kế hoạch bị bác bỏ trước khi chỉnh sửa.
- "Một kế hoạch dài hơn là một kế hoạch tốt hơn." Độ dài không thêm gì; bằng chứng và phép chứng minh trên mỗi mục thì có.
- "Các dependency rõ ràng từ thứ tự danh sách." Thứ tự văn xuôi giấu những bước nào có thể chạy cùng nhau và những bước nào phải chờ.

## Taught in

[Bài học kế hoạch có bằng chứng hỗ trợ](../../../phases/14-agent-engineering/44-plan-from-evidence/) đưa ra năm cam kết và các quy tắc xác thực.
