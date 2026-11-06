---
id: overnight-pipeline-cost
title: Price a nightly pipeline on batch with a cached prompt
card: cost-capacity
kind: estimate
level: 3
roles: [applied-ai-engineer, ai-data-engineer, inference-engineer]
rounds: [system-design, screen]
tags: [batch-api, prompt-caching, cost-per-request, offline-jobs]
minutes: 12
lessons: [phases/17-infrastructure-and-production/15-batch-apis, phases/17-infrastructure-and-production/14-prompt-semantic-caching]
manuals: [vllm-101#s-run-batch-and-offline-jobs]
practice: []
cheatsheet: [llm-cost-caching, inference-load-testing]
related: [cost-capacity/batch-lane-triage, cost-capacity/cache-break-even]
updated: 2026-11-03
---

Một pipeline hằng đêm tóm tắt 50,000 tài liệu, và mọi lời gọi mở đầu bằng cùng system prompt. Nó chạy đồng bộ với một nhà cung cấp trong bốn giờ và tốn khoảng 2,000 đô la mỗi đêm. Ước tính cùng công việc tốn bao nhiêu trên batch API với system prompt được cache, và nói khi nào thay vào đó bạn sẽ chuyển nó lên GPU của chính mình.

## Short answer

Batch cho một mức giảm cố định 50 phần trăm trên các token đầu vào và đầu ra, và system prompt được cache làm đầu vào lặp lại rẻ hơn khoảng mười lần sau lần ghi đầu tiên. Kết hợp lại, ví dụ tính sẵn của bài học đạt khoảng 180 đô la mỗi đêm, gần 9 phần trăm hóa đơn đồng bộ, từ ba thay đổi cấu hình. Chuyển công việc sang GPU của chính bạn khi nó chạy mỗi đêm ở mức sử dụng cao và tiền tố dùng chung ngắn, để cả hai mức giảm đều không có nhiều thứ để tác động, và định kích thước lần chạy đó bằng cách tăng mức đồng thời cho đến khi đầu ra ngừng tăng.

## Full answer

### The three bills

Bài học viết hóa đơn đồng bộ không cache dưới dạng số tài liệu nhân các token đầu vào và đầu ra của mỗi lời gọi ở mức giá đầy đủ, với một prompt dùng chung khoảng 4000 token và một đầu ra khoảng 200 token mỗi tài liệu.

1. **Đồng bộ, không cache.** Mọi lời gọi trả cho toàn bộ prompt và toàn bộ đầu ra.
2. **Đồng bộ, có cache.** System prompt được ghi một lần, và 49999 lời gọi còn lại đọc nó ở mức khoảng một phần mười giá đầu vào.
3. **Batch, có cache.** Mọi thứ ở trên, cộng mức giảm 50 phần trăm trên các lần đọc, lần ghi và đầu ra.

Kết luận của bài học: batch cộng cache đạt khoảng 10 phần trăm hóa đơn đồng bộ không cache, và pipeline được tính sẵn của nó đi từ 2,000 đô la mỗi đêm xuống khoảng 180.

### What the estimate hides

- Các token đầu ra chỉ nhận mức giảm batch. Caching tái sử dụng trạng thái attention của prompt và không làm gì cho các token được sinh, vì vậy một công việc có đầu ra dài và một prompt ngắn tiết kiệm ít hơn nhiều.
- Lời gọi đầu tiên của một batch trả khoản phí ghi cache thêm. So với hàng chục nghìn lần đọc, nó là nhiễu. Nếu batch chạy lâu hơn thời gian tồn tại cache, biến thể một giờ với lần ghi 2x của nó đáng giá khi các lần đọc vượt năm.
- Kiểm tra các trường usage trên một mẫu kết quả. Một batch mà tất cả các request đều miss cache cho thấy các lần ghi và không có lần đọc, và khi đó mức giảm thứ hai chưa bao giờ xảy ra.
- Cam kết trả về trong vòng 24 giờ và thường trong vòng vài giờ. Một đêm ngắn hơn cam kết, vì vậy hạn chót buổi sáng chỉ giữ được với lần trả về điển hình. Gửi batch trước một ngày, hoặc giữ một phương án dự phòng đồng bộ cho một batch muộn.

### When your own GPU wins

Bài tập của bài học yêu cầu độ dài tiền tố dùng chung mà tại đó batch cộng cache thắng một GPU đặt trước chạy qua đêm. GPU riêng của bạn thắng khi ba điều đúng: công việc giữ một GPU đặt trước bận mỗi đêm, tiền tố dùng chung ngắn, vì vậy có ít thứ để cache, và các đầu ra dài, vì vậy mức giảm batch là đòn bẩy duy nhất ở phía nhà cung cấp. Yêu cầu nơi lưu trú dữ liệu có thể tự quyết định điều đó.

### How to size the self-hosted run

Công thức của tài liệu vLLM cho một công việc offline: truyền toàn bộ danh sách prompt vào lớp offline engine trong một lời gọi, hoặc chạy lệnh batch trên một file request, và tăng mức đồng thời cho đến khi đầu ra ngừng tăng. Trên card của nó, đầu ra tăng đến 273.9 token mỗi giây ở 32 request đồng thời và giảm xuống 241.4 ở 64, vì pool đầy và GPU bị throttle. Tăng ngân sách token trên 8,192 để lấy throughput, vì một token đầu tiên chậm không tốn gì khi không ai chờ, và theo dõi số đang chạy so với mức sử dụng cache để thấy giới hạn nào đang ràng buộc.

## Follow-ups

- **Level 3:** Mức giảm nào trong hai mức áp dụng cho các token đầu ra? Expected: chỉ mức giảm batch. Caching hạ giá đầu vào lặp lại và không làm gì cho các token được sinh.
- **Level 3:** Lời gọi đầu tiên trong mỗi batch trả một khoản phí ghi cache thêm. Điều đó có thay đổi ước tính không? Expected: không ở khối lượng này. Một lần ghi cao hơn một phần tư, so với hàng chục nghìn lần đọc ở một phần mười giá.
- **Level 4:** Khi nào một GPU đặt trước thắng batch cộng cache? Expected: khi công việc giữ GPU bận mỗi đêm, tiền tố dùng chung ngắn và các đầu ra dài, để hai mức giảm có ít thứ để tác động. Bài tập của bài học tính độ dài tiền tố hòa vốn.
- **Level 4:** Bạn tìm mức đồng thời đúng cho công việc trên GPU của chính mình như thế nào? Expected: truyền toàn bộ danh sách vào offline engine hoặc lệnh batch, tăng mức đồng thời cho đến khi số token đầu ra mỗi giây ngừng tăng, và tăng ngân sách token. Card của tài liệu đạt đỉnh gần 32 request đồng thời.

## Wrong answers

- "Chỉ batch đưa bạn xuống một phần mười chi phí." Chỉ batch giảm một nửa hóa đơn. Yếu tố còn lại là prompt dùng chung đã cache.
- "Caching tiết kiệm trên đầu ra giống như trên đầu vào." Cache tái sử dụng trạng thái attention của prompt. Mọi token đầu ra đều được sinh và tính phí đầy đủ, trừ mức giảm batch.
- "Batch quá chậm cho một công việc hằng đêm." Cam kết là một ngày và lần trả về điển hình là vài giờ. Gửi trước một ngày, hoặc giữ một phương án dự phòng đồng bộ cho batch muộn hiếm gặp.

## Taught in

[Bài học batch API](../../../phases/17-infrastructure-and-production/15-batch-apis/) kết hợp hai mức giảm trên pipeline hằng đêm, [bài học kinh tế caching](../../../phases/17-infrastructure-and-production/14-prompt-semantic-caching/) đưa ra các giá ghi và đọc cache, và [phần công việc batch của vLLM 101](../../../manuals/vllm-101/sections/3-6-run-batch-and-offline-jobs.md) tìm trần throughput của một lần chạy tự lưu trữ.
