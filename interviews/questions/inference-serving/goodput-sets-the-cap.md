---
id: goodput-sets-the-cap
title: Pick a concurrency cap when throughput keeps rising
card: inference-serving
kind: tradeoff
level: 3
roles: [inference-engineer, ai-evaluation-reliability-engineer]
rounds: [system-design, ml-depth]
tags: [goodput, concurrency, tpot, latency-target, benchmark]
minutes: 12
lessons: [phases/17-infrastructure-and-production/08-inference-metrics-goodput]
manuals: [sglang-101#s-sglang-benchmark-serving]
practice: []
cheatsheet: [inference-load-testing]
related: [inference-serving/kv-pool-users-fit]
updated: 2026-11-03
---

Bạn phục vụ một mô hình chat trên một GPU. Một lượt quét tải cho thấy thông lượng đầu ra vẫn tăng ở mức giới hạn 64 yêu cầu đồng thời, nên nhóm muốn đặt giới hạn là 64. Sản phẩm cần token đầu tiên trong chưa đến một giây và một luồng văn bản đều đặn sau đó. Bạn chọn giới hạn nào, và bạn bảo vệ lựa chọn đó như thế nào?

## Short answer

Chọn giới hạn từ goodput, không phải từ thông lượng. Goodput chỉ đếm những yêu cầu đáp ứng mọi mục tiêu độ trễ, nên nó giảm về không rất lâu trước khi thông lượng ngừng tăng. Trong lượt quét ở tài liệu SGLang, goodput BF16 cao nhất ở giới hạn 4 và bằng 0 từ giới hạn 8. Chỉ dùng đường cong thông lượng để giải thích lựa chọn.

## Full answer

### Why throughput hides the knee

Một pool KV lớn cho phép máy chủ tiếp nhận nhiều yêu cầu hơn. Trên GB10 trong tài liệu, pool chứa 234,600 token, nên thông lượng BF16 vẫn tăng ở giới hạn 64. Nhiều yêu cầu được tiếp nhận hơn chia sẻ mỗi bước decode, nên mỗi yêu cầu nhận ít token mỗi giây hơn. Thông lượng đo máy chủ. Độ trễ đo người dùng.

### Define the target first

Tài liệu tính một yêu cầu là tốt khi token đầu tiên của nó đến trong dưới 1 s và thời gian trung bình mỗi token dưới 100 ms. Viết mục tiêu xuống trước lượt quét. Một con số goodput không có mục tiêu của nó không có ý nghĩa gì.

### Read the sweep

| Giới hạn | Goodput BF16 | TPOT trung vị BF16 | Goodput FP8 | TPOT trung vị FP8 |
|---|---|---|---|---|
| 4 | 0.44 req/s | 71.01 ms | 0.80 req/s | 38.60 ms |
| 8 | 0 | 102.21 ms | 1.07 req/s | 54.96 ms |
| 16 | 0 | 154.24 ms | 1.10 req/s | 81.90 ms |
| 32 | 0 | 201.91 ms | 0 | 104.12 ms |

Ở giới hạn 8, yêu cầu BF16 trung vị đã mất hơn 100 ms mỗi token. Thông lượng ở giới hạn đó là 74.11 tok/s và vẫn tăng. FP8 giữ được mục tiêu đến giới hạn 16. Vì vậy câu trả lời phụ thuộc vào bản dựng: khoảng 4 cho BF16 và khoảng 16 cho FP8 trên máy này.

### Defend it

- Chạy ba seed mỗi điểm và cho thấy dải, để người đánh giá có thể thấy các khoảng cách là có thật.
- Đặt lại prefix cache trước mỗi lần chạy. Một cache đã được làm nóng khiến token đầu tiên có vẻ nhanh.
- Một giới hạn là một vòng kín. Người dùng thực đến theo đồng hồ riêng của họ, nên cũng chạy một lượt quét vòng hở với tốc độ yêu cầu và kiểm tra goodput ở đó.

## Follow-ups

- **Level 2:** Sự khác biệt giữa thông lượng và goodput là gì? Expected: thông lượng đếm tất cả token hoặc yêu cầu mỗi giây; goodput chỉ đếm những yêu cầu đáp ứng mọi mục tiêu độ trễ.
- **Level 3:** Tại sao một giới hạn vòng kín không bao giờ cho thấy hàng đợi tăng lên? Expected: mỗi client chờ câu trả lời của nó trước khi gửi yêu cầu tiếp theo, nên máy chủ không bao giờ nhận nhiều công việc hơn lượng nó hoàn thành.
- **Level 3:** FP8 giữ được mục tiêu ở giới hạn 16 còn BF16 thì không. Bạn kiểm tra gì trước khi chuyển bản dựng? Expected: chất lượng đầu ra trên bộ đánh giá riêng của bạn, và kích thước pool KV, vì FP8 giải phóng bộ nhớ cho một pool lớn hơn.
- **Level 4:** GPU nóng lên ở tải cao. Điều đó thay đổi lượt quét của bạn như thế nào? Expected: ghi lại xung nhịp GPU và trạng thái nhiệt với mỗi lần chạy, và để GPU nguội về một nhiệt độ cố định trước mỗi lần chạy.

## Wrong answers

- "Đặt giới hạn ở nơi thông lượng đạt đỉnh." Đường cong thông lượng không có đỉnh trong lượt quét, và mọi yêu cầu BF16 đều không đạt mục tiêu từ giới hạn 8.
- "Chỉ dùng TTFT trung vị." Một trung vị có thể che giấu một nửa số yêu cầu chậm, và thời gian mỗi token có thể không đạt trong khi token đầu tiên nhanh.
- "Báo cáo goodput từ một lần chạy." Một lần chạy có thể sai vì những lý do bạn không bao giờ thấy, nên dùng ba seed và báo cáo khoảng.

## Taught in

[Phần benchmark của SGLang 101](../../../manuals/sglang-101/sections/5-1-sglang-benchmark-serving.md#goodput-finds-the-knee-that-throughput-hides) đo goodput theo giới hạn, và [bài học về các chỉ số suy luận](../../../phases/17-infrastructure-and-production/08-inference-metrics-goodput/) định nghĩa từng chỉ số.
