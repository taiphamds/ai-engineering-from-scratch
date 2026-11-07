---
id: two-models-disagree
title: When the triage agent should say it is unsure
card: production-mlops
kind: concept
level: 2
roles: [ai-evaluation-reliability-engineer, inference-engineer]
rounds: [ml-breadth, system-design]
tags: [ai-sre, incident-triage, adversarial-evaluation, human-approval]
minutes: 8
lessons: [phases/17-infrastructure-and-production/23-sre-for-ai]
manuals: []
practice: []
cheatsheet: [sre-for-ai]
related: [production-mlops/narrow-auto-remediation, production-mlops/prediction-without-action]
updated: 2026-11-03
---

Một agent phân loại sự cố đề xuất một nguyên nhân gốc cho mọi cảnh báo. Nhóm trực ngừng tin nó sau nhiều câu trả lời sai tự tin. Mẫu nào từ bài học SRE tăng sự tin cậy đầu ra, và nhóm làm gì khi mẫu nói agent không chắc?

## Short answer

Chạy hai mô hình độc lập trên cùng sự cố. Khi chúng đồng ý nguyên nhân gốc, độ tự tin cao. Khi chúng bất đồng, hệ thống chuyển lên một người với cả hai giả thuyết và bằng chứng nhìn thấy, thay vì chọn một. Mẫu lọc các nguyên nhân gốc bịa ở chi phí thấp, và chính sự bất đồng nói với người ứng phó rằng sự cố không chắc chắn.

## Full answer

### Adversarial evaluation

Bài học đặt tên mẫu theo một sản phẩm cung cấp nó: hai mô hình tự phân tích cùng sự cố. Đồng thuận là độ tự tin. Bất đồng là một lần chuyển lên với cả hai giả thuyết được cho thấy. Nó đơn giản, và là một bộ lọc hiệu quả chống một câu trả lời sai tự tin, vì hai phân tích độc lập hiếm khi bịa cùng nguyên nhân.

### Where it sits in the architecture

Một supervisor chia sự cố thành các truy vấn con. Các agent chuyên biệt có quyền công cụ tìm các log, chạy các truy vấn chỉ số và truy xuất các runbook. Supervisor lắp một giả thuyết có bằng chứng và cho một người xem, người phê duyệt hoặc chuyển hướng. Chỉ sau đó một hành động chạy, và chỉ từ một tập hẹp được phê duyệt. Kiểm tra hai mô hình nằm ở bước giả thuyết, trước khi con người thấy nó.

### What the person does on a disagreement

Đọc cả hai giả thuyết và bằng chứng mỗi giả thuyết trích dẫn. Chọn một, chuyển hướng các agent, hoặc bắt đầu điều tra thủ công với hai manh mối thay vì không có. Phân công lao động của bài học giữ nguyên: agent đề xuất các giả thuyết và truy vấn, và con người đưa ra phán xét.

### What the agents remember

Các runbook và phân tích sau sự cố nằm trong một vector store, và cả hai mô hình truy xuất từ nó trên mọi sự cố. Bộ nhớ vận hành sống sót qua thay đổi nhân sự nhóm, và sự cố đầu của một kỹ sư mới có toàn bộ lịch sử phía sau.

### The limit of agreement

Hai mô hình chia sẻ dữ liệu huấn luyện có thể đồng ý và sai cùng nhau. Đồng thuận tăng độ tự tin, không phải bằng chứng. Yêu cầu mọi giả thuyết trích dẫn các dòng log và truy vấn chỉ số phía sau, để người ứng phó có thể kiểm tra bằng chứng và không phải sự hùng biện.

## Follow-ups

- **Level 2:** Tại sao một phán quyết chia đôi hữu ích cho người ứng phó? Expected: nó đánh dấu sự cố là không chắc chắn và cho người ứng phó hai nguyên nhân ứng viên với bằng chứng.
- **Level 3:** Cả hai mô hình đồng ý và cả hai sai. Bạn bắt nó như thế nào? Expected: yêu cầu mỗi giả thuyết trích dẫn bằng chứng người ứng phó có thể kiểm tra, và giữ phê duyệt con người trước bất kỳ hành động nào.
- **Level 3:** Mẫu tốn gì? Expected: hai lần chạy mô hình mỗi sự cố cộng độ trễ của bên chậm hơn, nhỏ so với hai mươi phút đầu một điều tra thủ công mà bài học nói có thể tự động hóa.

## Wrong answers

- "Hỏi một mô hình hai lần ở temperature không." Một lần lặp của cùng mô hình chia sẻ các điểm mù của nó. Mẫu cần các phân tích độc lập.
- "Để một giả thuyết được đồng ý tự kích hoạt cách sửa." Đồng thuận tăng độ tự tin. Con người vẫn phê duyệt hành động, và chỉ các hành động hẹp mới được tự động hóa.
- "Bất đồng chứng minh agent vô dụng." Nó có nghĩa sự cố không chắc chắn, chính là lúc một người nên xem.

## Taught in

[Bài học SRE cho AI](../../../phases/17-infrastructure-and-production/23-sre-for-ai/) mô tả mẫu đánh giá đối kháng và kiến trúc supervisor có phê duyệt con người.
