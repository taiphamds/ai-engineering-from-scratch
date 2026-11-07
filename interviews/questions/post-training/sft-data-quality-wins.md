---
id: sft-data-quality-wins
title: A million scraped pairs or a small curated set
card: post-training
kind: tradeoff
level: 1
roles: [applied-ai-engineer, ai-data-engineer]
rounds: [screen, ml-breadth]
tags: [sft, data-quality, instruction-data, catastrophic-forgetting]
minutes: 8
lessons: [phases/10-llms-from-scratch/06-instruction-tuning-sft]
manuals: []
practice: []
cheatsheet: [llm-pipeline-capstone]
related: [post-training/sft-loss-mask]
updated: 2026-11-03
---

Nhóm của bạn có một ngân sách thu thập dữ liệu SFT cho một trợ lý mới. Một kế hoạch mua một triệu cặp hỏi-đáp thu thập từ web. Kế hoạch kia trả tiền cho những người viết có kỹ năng để có một tập nhỏ hơn nhiều. Bạn chọn kế hoạch nào, và lập luận như thế nào?

## Short answer

Chọn tập nhỏ hơn từ những người viết có kỹ năng. SFT dạy một mẫu hành vi, không phải sự thật mới, nên vài nghìn đến vài chục nghìn ví dụ sạch là đủ. Các mốc tham chiếu của bài học là khoảng 27,000 ví dụ tuyển chọn cho giai đoạn SFT đầu của một mô hình chat mở lớn, và 52,000 cặp được sinh tốn khoảng 600 đô la và tạo một trợ lý dùng được. Nhiễu trong các cặp thu thập được học như hành vi ở cùng trọng số với các ví dụ tốt.

## Full answer

### Why a small set is enough

Mô hình nền đã biết ngôn ngữ và các sự thật từ pretraining. SFT tập trung một khả năng tiềm ẩn: khi dấu assistant xuất hiện, trả lời. Mẫu đó cần ít ví dụ hơn nhiều so với học các sự thật. Bài học đưa ra 20,000 đến 100,000 cặp được chế tác là khoảng biến một mô hình nền thành một trợ lý, và chỉ đến một nghiên cứu nơi 1,000 ví dụ được chọn cẩn thận ngang các tập lớn hơn nhiều.

### Why noise hurts more than it helps

Mọi ví dụ là một mục tiêu. Các câu trả lời mơ hồ, sai hoặc thô lỗ trong một tập thu thập dạy hành vi mơ hồ, sai hoặc thô lỗ, và mô hình không có cách biết ví dụ nào để tin. SFT không có khái niệm một câu trả lời tốt hơn. So sánh đó là điều preference tuning thêm sau.

### What quality means in practice

- Các tác vụ và định dạng đa dạng, không phải nhiều bản sao của một hình dạng.
- Các câu trả lời một người cẩn thận sẽ viết, theo độ dài và giọng điệu bạn muốn trong production.
- Một mẫu chat nhất quán, với cùng các dấu vai trò trong mọi ví dụ.
- Một bộ lọc bỏ các câu trả lời quá ngắn và độ đa dạng từ vựng thấp trước huấn luyện.

### When volume does help

Một khi định dạng được học, thêm ví dụ sạch mở rộng độ bao phủ tác vụ. 70,000 cuộc hội thoại được chia sẻ đã huấn luyện một chatbot mở sớm cho thấy khối lượng hoạt động khi nguồn đã có hình dạng assistant. Trộn 2 đến 5 phần trăm văn bản pretraining thô vào các batch, để mô hình giữ khả năng chung.

## Follow-ups

- **Level 1:** SFT không dạy mô hình điều gì? Expected: các sự thật mới; chúng đến từ pretraining, và SFT dạy mẫu phản hồi.
- **Level 2:** Bạn phát hiện một tập dữ liệu dạy hành vi xấu trước khi huấn luyện như thế nào? Expected: lấy mẫu và đọc nó, chấm độ dài câu trả lời và đa dạng từ vựng, kiểm tra tỷ lệ instruction trên câu trả lời, và bỏ phần đuôi.
- **Level 2:** Sau SFT, mô hình trả lời tốt nhưng mất một ít khả năng lập trình. Điều gì trong kế hoạch dữ liệu giải quyết điều đó? Expected: trộn vài phần trăm văn bản pretraining thô vào các batch SFT và giữ lần chạy ngắn.
- **Level 3:** Những người viết tạo các câu trả lời dài, chi tiết cho mọi thứ. Rủi ro là gì? Expected: mô hình học rằng độ dài là mẫu, và preference tuning sau có thể khuếch đại nó thành dài dòng; khớp độ dài câu trả lời với sản phẩm.

## Wrong answers

- "Nhiều dữ liệu hơn luôn thắng trong học máy." SFT học một định dạng trên một mô hình đã biết nội dung; một triệu mục tiêu nhiễu dạy nhiễu như hành vi.
- "Dữ liệu được sinh vô giá trị, chỉ bài viết con người mới tính." 52,000 cặp được sinh trong bài học tạo một trợ lý dùng được với khoảng 600 đô la; vấn đề là kiểm soát chất lượng, không phải nguồn.
- "Huấn luyện lâu hơn trên tập nhỏ để bù kích thước." Hơn ba epoch trên một tập nhỏ dẫn đến ghi nhớ, và mô hình lặp các ví dụ huấn luyện từng từ.

## Taught in

[Bài học SFT](../../../phases/10-llms-from-scratch/06-instruction-tuning-sft/) so sánh các kích thước tập dữ liệu instruction thực và giải thích tại sao chất lượng quan trọng hơn số lượng.
