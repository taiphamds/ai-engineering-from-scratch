---
id: ab-test-prompt-rollout
title: Roll out a new prompt without betting the product on it
card: system-design
kind: design
level: 2
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer, forward-deployed-ai-engineer]
rounds: [system-design]
tags: [ab-testing, shadow-mode, canary, prompt-versioning]
minutes: 12
lessons: [phases/11-llm-engineering/13-production-app, phases/02-ml-fundamentals/19-ml-system-design]
manuals: []
practice: []
cheatsheet: [progressive-delivery, production-llm-app]
related: [system-design/streaming-and-fallback, system-design/design-doc-blocking-review]
updated: 2026-11-03
---

Một phiên bản mới của một prompt chat trông tốt hơn trong một notebook. Thiết kế cách nó đến người dùng: các giai đoạn, cách người dùng được phân nhóm, những gì bạn đo ở mỗi giai đoạn, và khi nào nó tự động rollback.

## Short answer

Chạy nó ở chế độ shadow trước, trên toàn bộ lưu lượng, ghi nhật ký các câu trả lời mà không hiển thị, và so sánh các chỉ số chất lượng với prompt hiện tại. Rồi định tuyến một tỷ lệ nhỏ người dùng tới nó, 10% trong bài học, và mở rộng theo các bước tới 25%, 50% và 100% trong khi các chỉ số giữ vững. Phân nhóm bằng một hash xác định của id người dùng để mỗi người dùng thấy một phiên bản, và tự động rollback khi tỷ lệ lỗi của phiên bản mới đạt gấp đôi phiên bản cũ trên một cửa sổ các yêu cầu.

## Full answer

### Shadow mode

Prompt mới chạy trên 100% lưu lượng nhưng chỉ các nhật ký của nó được giữ. Không ai thấy đầu ra. Điều này cho một so sánh đầy đủ về độ trễ, chi phí mỗi yêu cầu, tỷ lệ chặn guardrail và các điểm chất lượng so với phiên bản hiện tại, và người dùng không bao giờ thấy một câu trả lời shadow. Các lệnh gọi shadow có thể dùng chung hạn ngạch provider với các lệnh gọi trực tiếp, nên cho chúng một hạn ngạch hoặc khóa riêng; nếu không một giới hạn hạn ngạch có thể làm chậm hoặc làm thất bại các yêu cầu trực tiếp. Đó là cùng giai đoạn đầu mà bài học thiết kế ML gọi là triển khai shadow cho một mô hình.

### Percentage rollout

Định tuyến 10% lưu lượng tới phiên bản mới. Nếu chất lượng giữ vững, nâng lên 25%, rồi 50%, rồi 100%. Nếu chất lượng giảm, chuyển trở lại ngay. Cả hai phiên bản giữ được triển khai và việc chuyển là cấu hình, nên một rollback mất vài phút, đó là quy tắc của bài học cho mọi giai đoạn.

### Deterministic assignment

Băm id người dùng kết hợp với tên thí nghiệm và lấy modulo 100. Các bucket dưới tỷ lệ lưu lượng nhận biến thể, phần còn lại nhận đối chứng. Khi đó một người dùng thấy cùng phiên bản qua các yêu cầu bên trong một thí nghiệm, và việc phân nhóm có thể được tính lại sau từ nhật ký. Phân nhóm ngẫu nhiên theo từng yêu cầu trộn các phiên bản bên trong một hội thoại và khiến so sánh nhiễu.

### What to measure

Theo từng phiên bản prompt: các phân vị độ trễ, đánh giá người dùng ở nơi có, tỷ lệ lỗi, tỷ lệ chặn guardrail và chi phí mỗi yêu cầu. Bộ ghi đánh giá ghi tên và phiên bản template với mọi yêu cầu, nên các chỉ số tách theo phiên bản mà không cần kết nối thêm.

### Automatic rollback

Bài tập của bài học đặt quy tắc: khi một phiên bản mới cho thấy tỷ lệ lỗi 2x phiên bản trước trên 100 yêu cầu, tự động quay lại. Cửa sổ quan trọng; một ít yêu cầu là nhiễu, và chờ hàng nghìn để một prompt xấu chạy quá lâu.

### A note on the business metric

Shadow và canary bảo vệ người dùng. Liệu prompt mới cải thiện kết quả quan trọng, như hoàn thành tác vụ, cần một sự phân chia ngẫu nhiên với đủ lưu lượng và thời gian, đó là giai đoạn A/B từ bài học thiết kế ML.

## Follow-ups

- **Level 2:** Tại sao băm id người dùng mà không chọn ngẫu nhiên theo từng yêu cầu? Expected: khi đó một người dùng nhận một phiên bản nhất quán qua một phiên và việc phân nhóm có thể tái lập từ nhật ký.
- **Level 2:** Chế độ shadow không cho bạn biết gì? Expected: người dùng phản ứng thế nào với các câu trả lời mới; nó chỉ so sánh các đầu ra được ghi nhật ký và các chỉ số hệ thống.
- **Level 3:** Prompt mới tốn nhiều hơn mỗi yêu cầu nhưng có điểm cao hơn. Ai quyết định? Expected: một guardrail về chi phí mỗi yêu cầu quyết định liệu nó có thể được phát hành hay không; lợi ích chất lượng so với chi phí sau đó là một quyết định sản phẩm với cả hai con số trên bàn.
- **Level 3:** Bạn giữ đối chứng và biến thể khỏi dùng chung một mục cache bằng cách nào? Expected: bao gồm phiên bản prompt trong khóa cache, nếu không một lần trúng trả về câu trả lời của phiên bản kia và so sánh bị hỏng.

## Wrong answers

- "Phát hành cho mọi người và theo dõi dashboard." Một suy giảm khi đó đánh vào mọi người dùng trước khi dashboard dịch chuyển.
- "Phân nhóm ngẫu nhiên theo từng yêu cầu để có thống kê sạch hơn." Người dùng thấy cả hai phiên bản trong một hội thoại và các chỉ số được ghi nhật ký trộn chúng.
- "Chế độ shadow là đủ; bỏ canary." Chế độ shadow không bao giờ hiển thị đầu ra cho một người dùng, nên nó không thể đo phản ứng người dùng.

## Taught in

[Bài học ứng dụng LLM production](../../../phases/11-llm-engineering/13-production-app/) mô tả chế độ shadow, rollout theo tỷ lệ và phân nhóm bằng hash cho các prompt, và [bài học thiết kế hệ thống ML](../../../phases/02-ml-fundamentals/19-ml-system-design/) cung cấp cùng ba giai đoạn với quy tắc rollback cho các mô hình.
