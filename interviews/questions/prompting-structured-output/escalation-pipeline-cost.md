---
id: escalation-pipeline-cost
title: Make each reasoning stage earn its cost
card: prompting-structured-output
kind: tradeoff
level: 4
roles: [applied-ai-engineer, agentic-ai-engineer]
rounds: [system-design, ml-depth]
tags: [self-consistency, tree-of-thought, cost, latency, escalation]
minutes: 15
lessons: [phases/11-llm-engineering/02-few-shot-cot]
manuals: []
practice: []
cheatsheet: [prompt-engineering]
related: [prompting-structured-output/self-consistency-at-temperature-zero, prompting-structured-output/cot-when-it-hurts]
updated: 2026-11-03
---

Một nhóm chạy mọi câu hỏi qua pipeline nâng cấp đầy đủ từ bài học: một chuỗi xác định, rồi năm chuỗi lấy mẫu với một phiếu bầu, rồi một tìm kiếm cây khi phiếu yếu. Độ trễ và chi phí giờ là phàn nàn hàng đầu. Là kỹ sư staff, bạn tái cấu trúc pipeline như thế nào, và bạn đo gì để bảo vệ hình dạng mới?

## Short answer

Khiến pipeline chứng minh mỗi giai đoạn đáng chi phí. Phần lớn câu hỏi nên kết thúc ở giai đoạn rẻ, nên bắt đầu phiếu bầu ở tối thiểu ba mẫu và chỉ mở rộng khi bất đồng, và dành tìm kiếm cây, tốn đến 39 lời gọi ở hệ số phân nhánh 3 và độ sâu 3, cho các câu hỏi nơi phiếu bầu thất bại. Đo độ chính xác theo chi phí mỗi câu hỏi cho mỗi giai đoạn trên một tập giữ lại, và báo cáo tỷ phần câu hỏi mỗi giai đoạn giải quyết.

## Full answer

### What the lesson's pipeline does

Chuỗi xác định chạy một lần. Phiếu bầu chạy năm mẫu ở temperature 0.7 và chấp nhận khi 4 trong 5 đồng ý, độ tự tin 0.8, và đa số khớp đáp án xác định. Bất cứ điều gì khác đến tìm kiếm cây, nơi mỗi node là một lời gọi mô hình.

### Where the money goes

| Giai đoạn | Lời gọi | Chi phí token bổ sung |
|---|---|---|
| Một chuỗi few-shot | 1 | 300 đến 600 token |
| Phiếu bầu trên năm chuỗi | 5 | token gấp năm |
| Tìm kiếm cây | 10 đến 40 hoặc hơn | token gấp 10 đến 40 lần |
| Một mô hình suy luận | 1 | ẩn, nội bộ gấp 2 đến 10 lần |

Chạy trên mọi câu hỏi, chỉ phiếu bầu đã nhân hóa đơn gấp năm, và tìm kiếm cây không bị chặn ở phần đuôi.

### The restructure

1. **Định tuyến theo tác vụ trước.** Nhớ lại đơn giản và phân loại một bước nhận một lời gọi zero-shot đơn; chuỗi và phiếu bầu dành cho các vấn đề nhiều bước.
2. **Bầu nhỏ, mở rộng khi nghi ngờ.** Ba mẫu là tối thiểu cho một phiếu bầu có ý nghĩa và năm nắm phần lớn lợi ích; bắt đầu ở ba và chỉ thêm mẫu khi ba mẫu bất đồng.
3. **Giới hạn cây.** Giữ nó cho các vấn đề có không gian tìm kiếm lớn nhưng đánh giá được, đặt một ngân sách lời gọi mỗi câu hỏi, và báo cáo ngân sách bị chạm thường xuyên thế nào.
4. **Kiểm thử một mô hình suy luận như thay thế trực tiếp.** Nó chạy chuỗi nội bộ và bao hàm phiếu bầu trên nhiều tác vụ; chi phí ẩn của nó thuộc cùng đường cong với các giai đoạn khác.

### What defends it

- Đường cong độ chính xác theo tổng token từ một lượt quét N trên 1, 3, 5, 7 và 10 trên một tập giữ lại, với điểm gối được đánh dấu.
- Tỷ phần câu hỏi được giải quyết ở mỗi giai đoạn, và độ chính xác mỗi giai đoạn trên các câu hỏi nó giải quyết.
- Tỷ phần câu hỏi chỉ tìm kiếm cây trả lời đúng, đối chiếu tỷ phần hóa đơn của nó.

## Follow-ups

- **Level 3:** Tìm kiếm cây tốn gì ở các mặc định của bài học? Expected: mỗi node là một lời gọi mô hình, nên hệ số phân nhánh 3 và độ sâu 3 có nghĩa đến 39 lời gọi.
- **Level 4:** Một mô hình suy luận nằm ở đâu trong hình dạng mới? Expected: như một thay thế trực tiếp cho chuỗi và phiếu bầu trên nhiều tác vụ, một lời gọi với suy luận nội bộ ẩn ở token gấp 2 đến 10 lần, được so sánh trên cùng đường cong độ chính xác theo chi phí.
- **Level 4:** Bạn chọn kích thước phiếu bầu như thế nào? Expected: quét N trên 1, 3, 5, 7 và 10 trên một tập giữ lại và vẽ độ chính xác theo tổng token; bài học đặt điểm gối gần 5 và phiếu bầu có ý nghĩa tối thiểu ở 3.
- **Level 4:** Con số nào biện minh cho việc giữ tìm kiếm cây? Expected: tỷ phần câu hỏi chỉ tìm kiếm cây trả lời đúng, đối chiếu tỷ phần hóa đơn; nếu tỷ phần đó gần không, cắt giai đoạn.

## Wrong answers

- "Chạy tìm kiếm cây trên mọi thứ để có độ chính xác tốt nhất." Nó tốn 10 đến 40 lời gọi hoặc hơn mỗi câu hỏi, và bài học giữ nó cho các không gian tìm kiếm lớn, đánh giá được.
- "Bỏ phiếu bầu và giữ một chuỗi ở temperature không." Một chuỗi rẻ nhưng không mang tín hiệu độ tự tin; tỷ phần phiếu là điều nói khi nào dừng hoặc nâng cấp.
- "Đặt cổng độ tự tin ở 1.0 cho chắc." Khi đó bất kỳ bất đồng đơn lẻ nào kích hoạt tìm kiếm cây; bài học chấp nhận 4 trong 5.

## Taught in

Bài học [few-shot và chain-of-thought](../../../phases/11-llm-engineering/02-few-shot-cot/) xây pipeline nâng cấp và đưa ra chi phí mỗi kỹ thuật.
