---
id: budget-burn-pauses-chaos
title: Keep a production chaos experiment from becoming an incident
card: production-mlops
kind: design
level: 4
roles: [ai-evaluation-reliability-engineer, inference-engineer]
rounds: [system-design, design-review]
tags: [chaos-engineering, error-budget, blast-radius, alerting]
minutes: 18
lessons: [phases/17-infrastructure-and-production/24-chaos-engineering-llm]
manuals: []
practice: []
cheatsheet: [sre-for-ai]
related: [production-mlops/chaos-before-you-start, production-mlops/retries-that-amplify]
updated: 2026-11-03
---

Bạn chạy một thí nghiệm chaos trong production. Một nhà cung cấp mô hình trả về các lỗi giới hạn tốc độ cho một phần cụm, để bạn có thể quan sát fallback. Các cảnh báo bắt đầu kích hoạt trong khi nó chạy. Thiết kế mặt phẳng an toàn giữ điều này khỏi thành một sự cố, và giải thích cách trực vận hành phân biệt một lỗi thí nghiệm với một lỗi tự nhiên.

## Short answer

Ba biện pháp bảo vệ nằm trong mặt phẳng an toàn: một cảnh báo tốc độ tiêu hao tạm dừng thí nghiệm khi mức tiêu hao ngân sách lỗi hằng ngày vượt hai lần tốc độ kỳ vọng, các cửa sổ chặn cảnh báo làm im các cảnh báo không thuộc thí nghiệm trong phạm vi ảnh hưởng, và một tag trên trace id của mọi lỗi thí nghiệm gây ra. Người trực đọc tag. Một lỗi không tag bên trong cửa sổ là tự nhiên và nhận phản ứng bình thường.

## Full answer

### The planes

Bài học chia hệ thống thành một mặt phẳng điều khiển lên lịch thí nghiệm, một mặt phẳng mục tiêu gồm dịch vụ, pod và kho dữ liệu, một mặt phẳng an toàn với công tắc ngắt, các cửa sổ chặn cảnh báo, giới hạn phạm vi ảnh hưởng và các cổng ngân sách lỗi, và một mặt phẳng quan sát tương quan mọi lỗi với một trace id. Các phát hiện phản hồi vào SLO, runbook và mã.

### The three guards

1. **Tạm dừng theo tốc độ tiêu hao.** Thí nghiệm được phép dùng ngân sách lỗi, vì đó là điều một thất bại có kiểm soát làm. Cổng kích hoạt khi mức tiêu hao hằng ngày vượt 2x tốc độ kỳ vọng, và nó tự tạm dừng thí nghiệm.
2. **Các cửa sổ chặn cảnh báo.** Các cảnh báo thí nghiệm được thiết kế để kích hoạt được làm im cho phạm vi ảnh hưởng và thời lượng. Không gì ngoài phạm vi bị làm im.
3. **Tương quan trace-id.** Mọi lỗi do thí nghiệm gây ra mang một tag, để người trực có thể tách nó khỏi các lỗi tự nhiên mà không cần một cuộc trao đổi.

Công tắc ngắt là một điều khiển thủ công thứ tư. Nó dừng thí nghiệm ngay lập tức và thuộc về người trực, không phải bộ lập lịch.

### How on-call reads an alert during the window

- Một lỗi có tag trong phạm vi ảnh hưởng là thí nghiệm đang hoạt động. Nó được ghi log, không gọi trực.
- Một lỗi không tag trong cửa sổ là tự nhiên. Nó nhận phản ứng bình thường.
- Một lỗi ngoài phạm vi ảnh hưởng là tự nhiên, vì thí nghiệm không chạm nó.
- Nếu tiêu hao tiếp tục sau tạm dừng, nguyên nhân là tự nhiên, hoặc thí nghiệm làm hỏng thứ không tự phục hồi. Chạy ứng phó sự cố và rollback thay đổi cuối.

### What this experiment should teach

Bài học lưu ý phần lớn nhóm phát hiện fallback chưa bao giờ được kiểm thử đầy đủ. Ghi thời gian từ lỗi giới hạn tốc độ đầu đến fallback thành công đầu, và so sánh với SLA. Ghi liệu các lần thử lại của gateway có khuếch đại tải trước khi fallback hoạt động.

### Size the blast radius

Chọn một tỷ phần cụm đủ nhỏ để năng lực fallback trên các nhà cung cấp khác bao phủ nó, và viết tỷ phần đó vào định nghĩa thí nghiệm. Một tỷ phần lớn hơn kiểm thử nhiều hơn và có nguy cơ một gián đoạn thật khi fallback chậm hơn bạn tin.

## Follow-ups

- **Level 3:** Tại sao đặt cổng ở hai lần mức tiêu hao kỳ vọng và không phải bất kỳ tiêu hao nào? Expected: một thí nghiệm được định để dùng một ít ngân sách. Cổng bắt trường hợp nó dùng nhiều hơn kế hoạch rất nhiều.
- **Level 4:** Tiêu hao tiếp tục tăng sau tạm dừng. Điều đó cho bạn biết gì? Expected: nguyên nhân tự nhiên, hoặc thí nghiệm làm hỏng thứ không tự phục hồi. Chạy ứng phó sự cố và rollback thay đổi cuối.
- **Level 4:** Bạn chọn phạm vi ảnh hưởng cho một thí nghiệm gián đoạn nhà cung cấp như thế nào? Expected: một tỷ phần đủ nhỏ để năng lực fallback bao phủ nó, được viết trong định nghĩa thí nghiệm và xem xét với người trực.

## Wrong answers

- "Làm im tất cả cảnh báo trong thí nghiệm." Một sự cố tự nhiên trong cùng cửa sổ không được thấy. Chỉ làm im phạm vi ảnh hưởng, và giữ các lỗi có tag nhìn thấy.
- "Chạy nó trong staging, nên không cần mặt phẳng an toàn." Staging không thể cho thấy fallback dưới lưu lượng thật. Mặt phẳng an toàn là điều khiến production chấp nhận được.
- "Cảnh báo tốc độ tiêu hao là công tắc ngắt." Cảnh báo tạm dừng thí nghiệm. Công tắc ngắt dừng ngay lập tức, và nên là một điều khiển thủ công riêng.

## Taught in

[Bài học chaos engineering](../../../phases/17-infrastructure-and-production/24-chaos-engineering-llm/) định nghĩa bốn mặt phẳng, tạm dừng tốc độ tiêu hao, các cửa sổ chặn cảnh báo và tương quan trace-id.
