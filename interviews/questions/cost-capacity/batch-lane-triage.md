---
id: batch-lane-triage
title: Sort a workload into interactive, async or batch
card: cost-capacity
kind: concept
level: 1
roles: [applied-ai-engineer, ai-data-engineer, forward-deployed-ai-engineer]
rounds: [screen, system-design]
tags: [batch-api, workload-triage, latency-sla, cost]
minutes: 5
lessons: [phases/17-infrastructure-and-production/15-batch-apis]
manuals: []
practice: []
cheatsheet: [llm-cost-caching]
related: [cost-capacity/two-cache-layers]
updated: 2026-11-03
---

Một nhóm chạy pipeline báo cáo hằng đêm của mình qua cùng endpoint đồng bộ với sản phẩm chat, vì pipeline là production. Bạn phân loại các workload mô hình như thế nào, và workload này thuộc về đâu?

## Short answer

Phân loại mọi workload theo độ trễ mà người dùng của nó chấp nhận, không theo nơi nó chạy. Công việc tương tác có một người dùng đang chờ token đầu tiên và giữ đồng bộ với prompt caching, và công việc bán tương tác trả về trong vài phút qua một hàng đợi async. Bất cứ thứ gì mà người dùng có thể chờ hết thời gian cam kết đều thuộc batch API, cho giảm giá 50 phần trăm với cam kết trả về trong vòng 24 giờ và thường trong vài giờ. Báo cáo hằng đêm là batch khi việc trả về tại giới hạn 24 giờ vẫn đáp ứng hạn chót của nó, hoặc khi một phương án dự phòng đồng bộ xử lý một batch muộn.

## Full answer

### The three lanes

| Luồng | Người dùng | Đường đi |
|---|---|---|
| tương tác | chờ token đầu tiên | đồng bộ, với prompt caching |
| bán tương tác | gửi và kiểm tra lại sau vài phút | hàng đợi async, với một phương án dự phòng đồng bộ |
| batch | mong đợi kết quả vào buổi sáng hoặc cuối ngày | batch API, với đầu vào được cache kết hợp thêm |

### The misclassification

Quy tắc của bài học thẳng thừng: production không phải là một đặc tả độ trễ, SLA mới là nó. Sai lầm phổ biến là gọi mọi thứ là tương tác vì nó chạy trong production. Họ hàng của nó là bẫy tương tác một phần: một báo cáo có nút làm mới mà người dùng vui vẻ chờ mười phút, được phát hành dưới dạng một lời gọi đồng bộ. Bài học đặt 50 lần làm mới đồng thời ở mức 10x chi phí của cùng báo cáo được batch và gửi qua thư.

### What batch promises

Một lần trả về trong vòng 24 giờ, với lần trả về điển hình trong vài giờ, vì nhà cung cấp chạy batch khi năng lực của họ nhàn rỗi. Bài học gọi điều này là bất đồng bộ, không phải chậm.

### Stack it with caching

Một pipeline hằng đêm dùng chung một system prompt trên mọi lời gọi. Cache tiền tố đó, chạy pipeline trên batch, và phép tính của bài học đạt gần 10 phần trăm chi phí đồng bộ không cache. Ví dụ mở đầu của nó đưa một pipeline hằng đêm từ một lần chạy đồng bộ bốn giờ sang một lần chạy batch ở mức khoảng 9 phần trăm hóa đơn với ba thay đổi cấu hình.

### The other trap

Các định dạng file batch khác nhau theo nhà cung cấp, vì vậy một batch client cần một adapter cho mỗi nhà cung cấp, và một gateway quảng bá batch đa nhà cung cấp vẫn bọc các định dạng thô.

## Follow-ups

- **Level 1:** Câu hỏi nào phân loại một workload vào một luồng? Expected: việc chờ một ngày có nghĩa gì với người dùng này. Nếu họ sẽ không nhận ra, đó là batch.
- **Level 2:** Một người dùng nhấn làm mới trên một báo cáo sức khỏe và chờ mười phút mà không phàn nàn. Luồng nào? Expected: nhiều nhất là bán tương tác, và batch nếu báo cáo có thể đến qua thư. Phát hành nó đồng bộ là bẫy tương tác một phần.
- **Level 2:** Tại sao bài học gọi batch là bất đồng bộ thay vì chậm? Expected: cam kết là một lần trả về trong vòng một ngày, và lần trả về điển hình là vài giờ, vì nhà cung cấp chạy nó khi năng lực nhàn rỗi.
- **Level 3:** Điều gì hỏng khi bạn viết một batch client cho hai nhà cung cấp? Expected: các định dạng file khác nhau, vì vậy bạn cần một adapter cho mỗi nhà cung cấp.

## Wrong answers

- "Nó chạy trong production, vì vậy nó là tương tác." Production là nơi nó chạy. Luồng đến từ độ trễ mà người dùng chấp nhận.
- "Batch nghĩa là câu trả lời mất một ngày." Cam kết là trong vòng một ngày. Lần trả về điển hình là vài giờ.
- "Giảm giá 50 phần trăm không đáng với sự phức tạp." Trên một tiền tố dùng chung nó kết hợp với caching thành khoảng một phần mười chi phí đồng bộ, điều mà bài học gọi là đòn bẩy rẻ nhất mà không ai kéo.

## Taught in

[Bài học batch API](../../../phases/17-infrastructure-and-production/15-batch-apis/) định nghĩa ba luồng và hai cái bẫy.
