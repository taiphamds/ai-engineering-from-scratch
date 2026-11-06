---
id: prove-one-repository-change
title: Bring evidence for one agent-assisted change
card: agents
kind: take-home
level: 4
roles: [agentic-ai-engineer, ai-evaluation-reliability-engineer, forward-deployed-ai-engineer]
rounds: [take-home, design-review]
tags: [evidence, baseline, acceptance-check, rollback, intervention-log]
minutes: 60
lessons: [phases/14-agent-engineering/42-agent-workbench-capstone]
manuals: []
practice: []
cheatsheet: [agent-workbench-ops, eval-driven-agents]
related: [agents/ship-a-workbench-pack, agents/green-gate-missing-tests]
updated: 2026-11-03
---

Bài làm tại nhà. Chọn một thay đổi thật nhỏ trong một repository bạn có thể sửa đổi, và để một coding agent thực hiện nó. Mang lại bằng chứng mà một người đánh giá có thể tái tạo, không phải một bản ghi trò chuyện. Cho chúng tôi biết bạn sẽ ghi lại gì ở mỗi bước, bạn sẽ chứng minh phép kiểm tra nghiệm thu có thể thất bại thế nào, và bạn sẽ từ chối khẳng định gì.

## Short answer

Ghi lại revision bắt đầu, mục tiêu có thể quan sát, các điều không phải mục tiêu, các đường dẫn được phép và bằng chứng nghiệm thu trước khi agent chạy, cùng chế độ làm việc, ngân sách và một điều kiện dừng. Thu một đường cơ sở bằng phép kiểm tra hiện có gần nhất trước bất kỳ chỉnh sửa nào. Sau thay đổi, viết kết quả kỳ vọng độc lập với triển khai, đưa vào một kết quả sai có chủ ý trong một bản sao dùng rồi bỏ, và cho thấy cùng phép kiểm tra thất bại vì lý do đó. Gắn nhãn mọi quan sát runtime là cục bộ, staging hoặc trực tiếp, diễn tập một lần rollback, và để nhánh, các file đã thay đổi, các rủi ro còn mở và hành động tiếp theo rõ ràng.

## Full answer

### Frame the task and the autonomy

Viết ra revision bắt đầu, mục tiêu như một thứ có thể quan sát, các điều không phải mục tiêu, các đường dẫn được phép và bằng chứng sẽ được tính là nghiệm thu. Nêu người dùng hoặc người vận hành thật cần hành vi đó. Chọn một chế độ làm việc, các bước có hướng dẫn, triển khai có checkpoint hoặc một lần chạy tự chủ có giới hạn, và nói tại sao sự không chắc chắn, hậu quả và khả năng đảo ngược biện minh cho nó. Đặt một ngân sách thời gian thực và một giới hạn token hoặc chi phí ở nơi agent cung cấp. Định nghĩa điều kiện dừng cho thất bại lặp lại, một yêu cầu quyền mới, hết ngân sách hoặc một quyết định hợp đồng chưa được giải quyết, và nêu ai giải quyết nó.

### Prepare the smallest environment

Lấy triển khai, bên gọi của nó, kiểm thử của nó và các chỉ dẫn cục bộ, và ghi lại tại sao mỗi thứ thuộc về ngữ cảnh. Đưa ra một lựa chọn rõ ràng cho mỗi phần mở rộng: một skill cho một quy trình lặp lại được, một công cụ cho truy cập, một hook cho một phép kiểm tra xác định, một plugin cho các khả năng được đóng gói, mỗi thứ với các quyền tối thiểu cho phép nó hoạt động. Ghi lại một bổ sung được đề xuất mà bạn đã từ chối và chi phí của nó. Kiểm tra lại một ghi chú hoặc chỉ dẫn cũ và loại bỏ nó nếu bằng chứng ủng hộ điều đó.

### Baseline, then implement

Trước bất kỳ chỉnh sửa nào, chạy phép kiểm tra hiện có gần nhất và ghi lại lệnh, revision, kết quả và nơi bằng chứng tồn tại. Một tính năng chưa tồn tại vẫn có một đường cơ sở: phản hồi được quan sát hoặc thao tác không được hỗ trợ. Sau đó để agent làm việc bên trong hợp đồng, và giữ một log can thiệp với lý do cho mỗi lần sửa, thay đổi quyền hoặc sửa đổi kế hoạch.

### Challenge the evidence

Chọn phép chứng minh quan sát bề mặt đã thay đổi: trang được phục vụ tại các độ rộng liên quan cho một UI, yêu cầu và phản hồi được tuần tự hóa cho một API, lệnh được dựng với mã thoát của nó cho một CLI. Viết kết quả kỳ vọng từ hợp đồng nhiệm vụ mà không đọc triển khai. Trong một bản sao dùng rồi bỏ, đưa vào một kết quả sai cụ thể, như chấp nhận một giá trị không hợp lệ hoặc bỏ một trường bắt buộc, và chạy cùng phép kiểm tra nghiệm thu. Nó phải thất bại vì lý do đó. Nếu nó vẫn xanh, tăng cường assertion trước khi bạn tin nó. Khôi phục, chạy lại, và giữ cả hai bằng chứng. Một lỗi cú pháp hoặc một thiết lập kiểm thử hỏng không được tính là phát hiện sự suy giảm. Yêu cầu một đồng nghiệp hoặc một phiên đánh giá riêng thách thức phép chứng minh yếu nhất mà không chỉnh sửa triển khai.

### Rehearse operation and recovery

Chạy sản phẩm trong một môi trường cục bộ hoặc staging dùng rồi bỏ và gắn nhãn mọi quan sát là cục bộ, staging hoặc trực tiếp với revision chính xác. Chọn một tín hiệu thất bại cho nhiệm vụ, với một ngưỡng, một cửa sổ quan sát và một người phụ trách, và kích hoạt nó an toàn. Diễn tập rollback về một sản phẩm tốt đã biết và kiểm tra hành vi cũ trở lại, bao gồm bất kỳ dữ liệu bền vững nào. Ghi lại bất kỳ bước khôi phục nào bạn không thể xác minh.

### Improve the next run and hand off

So sánh kết quả với đường cơ sở, bao gồm thời gian đã trôi qua, dữ liệu sử dụng và các can thiệp của con người. Một nhiệm vụ cho thấy điều gì đã xảy ra trên nhiệm vụ đó, không cho thấy một agent nói chung nhanh hơn. Nâng một lần sửa được quan sát thành một kiểm thử, một quyền nhỏ hơn hoặc một tự động hóa, và chạy lại phép kiểm tra bị ảnh hưởng. Loại bỏ các thay đổi tạm và để nhánh cuối cùng, các file đã thay đổi, các rủi ro còn mở và hành động tiếp theo rõ ràng.

### The rubric

Mỗi hàng nhận `demonstrated`, `needs revision` hoặc `unverified`, với một con trỏ bằng chứng và một lý do. Người đánh giá tái tạo ít nhất phép kiểm tra nghiệm thu yếu nhất. Các trường được điền và các script đạt không thay thế cho các quan sát. Để bằng chứng không khả dụng là chưa xác minh và thu hẹp khẳng định, và không bao giờ trình bày kết quả là một bảo đảm tuyển dụng hoặc triển khai.

## Follow-ups

- **Level 3:** Sự suy giảm bạn cài vào vượt qua phép kiểm tra nghiệm thu. Bạn làm gì? Expected: coi phép kiểm tra là không đáng tin cậy, tăng cường assertion hoặc quan sát cho đến khi nó thất bại vì lý do đó, và chỉ sau đó chạy lại phiên bản đúng.
- **Level 3:** Tại sao mỗi quan sát runtime phải mang một nhãn môi trường? Expected: một lần diễn tập cục bộ chỉ ủng hộ một khẳng định cục bộ, và một quan sát không nhãn cho phép người đọc hiểu một lần chạy laptop là bằng chứng production.
- **Level 4:** Agent hoàn tất nhanh hơn đường cơ sở của bạn. Bạn có thể khẳng định gì? Expected: nhiệm vụ này nhanh hơn trong lần chạy này với chừng này can thiệp, và không gì về các agent nói chung.
- **Level 4:** Bạn sẽ đánh dấu hàng đơn lẻ nào là chưa xác minh thay vì làm giả? Expected: bất kỳ hàng nào có bằng chứng bạn không thể quan sát, như một bước khôi phục cần một mount production mà bạn không có, với khẳng định được thu hẹp cho phù hợp.

## Wrong answers

- "Bản ghi cho thấy agent chạy các kiểm thử, nên đó là bằng chứng." Một bản ghi là những gì agent nói, và bằng chứng là phép kiểm tra, mã thoát của nó và bản ghi mà một người đánh giá có thể chạy lại.
- "Phép kiểm tra nghiệm thu đạt, nên thay đổi đã được chứng minh." Một phép kiểm tra chưa bao giờ thất bại không chứng minh gì, và kết quả sai có chủ ý là thứ cho thấy phép kiểm tra có thể phát hiện một sự suy giảm.
- "Triển khai lên production là bắt buộc để hoàn thành bài tập." Một lần diễn tập cục bộ hoặc staging có nhãn ủng hộ một khẳng định cục bộ, và bài tập yêu cầu các nhãn trung thực, không truy cập production.

## Taught in

[Bài tổng kết workbench](../../../phases/14-agent-engineering/42-agent-workbench-capstone/) đưa ra sáu bước và rubric đánh giá thủ công cho bằng chứng.
