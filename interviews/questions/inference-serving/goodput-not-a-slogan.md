---
id: goodput-not-a-slogan
title: Why 255 tokens per second is a slogan
card: inference-serving
kind: concept
level: 1
roles: [inference-engineer, applied-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [screen, ml-breadth]
tags: [goodput, throughput, p99, ttft, tpot]
minutes: 6
lessons: [phases/17-infrastructure-and-production/08-inference-metrics-goodput]
manuals: [sglang-101#s-sglang-benchmark-serving, vllm-101#s-benchmark-your-server-in-15-minutes]
practice: []
cheatsheet: []
related: []
updated: 2026-11-03
---

Một đồng đội đăng trong kênh nhóm rằng server làm được 255 token mỗi giây. Đó có phải một kết quả? Bạn yêu cầu gì, và con số đơn lẻ nào cho biết nơi dừng thêm người dùng?

## Short answer

Đó là khẩu hiệu, không phải kết quả, vì con số throughput không có độ trễ đi cùng không mô tả gì người dùng cảm nhận. Hỏi mức đồng thời, trung vị và P99 token đầu tiên và thời gian mỗi token tại mức đó, client và temperature, và xung nhịp. Goodput là con số đặt giới hạn: request mỗi giây, hoặc tỷ lệ request, đạt mọi mục tiêu độ trễ cùng lúc, và trên GB10 của tài liệu goodput server BF16 cao nhất ở giới hạn 4 trong khi throughput tiếp tục tăng đến giới hạn 64.

## Full answer

### The same server, two loads

Con số 255 đến từ capture riêng của tài liệu. Cùng server cho throughput đó với thời gian đến token đầu tiên trung vị 0.8 s ở một tải và 3.9 s ở tải khác:

| Giới hạn | Token đầu ra/s | TTFT trung vị | P99 TTFT | TPOT trung vị |
|---|---|---|---|---|
| 1 | 175.15 | 162.98 ms | 270.18 ms | 4.38 ms |
| 8 | 255.63 | 785.79 ms | 2180.87 ms | 22.52 ms |
| 32 | 252.74 | 3917.54 ms | 8262.86 ms | 93.61 ms |

Từ giới hạn 8 đến 32 throughput giảm khoảng 1 phần trăm, token đầu tiên trung vị chậm hơn 5 lần, và thời gian trung vị mỗi token chậm hơn 4.2 lần. Server không còn tính toán nhàn rỗi để cho; người dùng mới chỉ chờ một phần của cùng các bước.

### Goodput

Goodput là tỷ lệ request, hoặc tốc độ request mỗi giây, đạt mọi giới hạn độ trễ cùng lúc: token đầu tiên dưới một giới hạn, thời gian mỗi token dưới một giới hạn, và thời gian đầu cuối dưới một giới hạn. Một request trượt bất kỳ giới hạn nào là không tốt. Quy tắc bài học: throughput cao tại goodput 60 phần trăm là thất bại, và throughput thấp hơn tại goodput 99 phần trăm là mục tiêu.

Mục tiêu tài liệu là token đầu tiên dưới 1 s và thời gian trung bình mỗi token dưới 100 ms. Trên GB10 với Qwen3-30B-A3B:

| Giới hạn | BF16 goodput | BF16 TPOT trung vị | FP8 goodput | FP8 TPOT trung vị |
|---|---|---|---|---|
| 4 | 0.44 req/s | 71.01 ms | 0.80 req/s | 38.60 ms |
| 8 | 0, đến 0.04 trong một seed | 102.21 ms | 1.07 req/s | 54.96 ms |
| 16 | 0 | 154.24 ms | 1.10 req/s | 81.90 ms |
| 32 | 0 | 201.91 ms | 0 | 104.12 ms |

Goodput BF16 cao nhất ở giới hạn 4. Ở giới hạn 8 request trung vị mất hơn 100 ms mỗi token, vì vậy ít nhất một nửa request trượt mục tiêu, và goodput là 0, đến 0.04 trong một seed, trong khi throughput tại giới hạn đó là 74.11 token mỗi giây và vẫn tăng. FP8 giữ mục tiêu đến giới hạn 16. Chọn giới hạn từ goodput tại mục tiêu riêng, và chỉ dùng đường cong throughput để giải thích.

### Why the mean is the wrong statistic

Bài học đưa ra hình dạng: một batch decode có một prefill dài bên cạnh có thể gửi phần lớn token gần 7 ms mỗi token và vài token gần 60 ms, vì vậy trung bình đọc 9 ms trong khi P99 đọc 65 ms, và người dùng thường gặp P99. Báo cáo trung vị, P90 và P99 cùng nhau. Các công cụ cũng bất đồng về định nghĩa: với request có token đầu tiên 500 ms và 100 token đầu ra qua 700 ms decode, một công cụ loại token đầu tiên báo 7.07 ms mỗi token và một công cụ gồm nó báo 12.00 ms. Nêu công cụ và định nghĩa với mọi con số.

### Where the knee is, and who enforces it

Một vòng kín không bao giờ tụt lại, vì mỗi client chờ câu trả lời trước khi gửi request tiếp theo. Tốc độ đến cố định không chờ. Dưới rate cố định server GB10 BF16 đã có thời gian trung vị mỗi token 177.5 ms ở 0.5 request mỗi giây và chỉ đạt mục tiêu cho 0.07 request mỗi giây, trong khi FP8 đạt mục tiêu cho mọi request đến 1 mỗi giây và giảm xuống 0.17 ở 2. Thực thi điểm gối ngoài engine, trong client hoặc gateway, vì giới hạn tiếp nhận riêng của engine đến từ bộ nhớ và nằm ở 4096 request đang chạy trên server đó, xa trên điểm gối.

### The floor behind one number

Bài học cho thấy thời gian mỗi token đến từ đâu trên một L4: một bước decode đọc 16.41 GB trọng số, mất ít nhất 54.7 ms ở 300 GB/s, và bước đo được mất 60.16 ms. Mục tiêu 100 ms mỗi token để lại ít chỗ trên card đó cho mô hình 8B ở BF16, là lý do pool và độ chính xác quan trọng trước scheduler.

## Follow-ups

- **Level 1:** Những con số nào đi cạnh một con số throughput? Expected: mức đồng thời hoặc tốc độ request, và trung vị cùng P99 của token đầu tiên và thời gian mỗi token tại điểm đó, với client, temperature và xung làm ngữ cảnh.
- **Level 2:** Goodput giảm về không ở giới hạn 8 trong khi throughput vẫn tăng. Cả hai đúng như thế nào? Expected: server viết thêm token mỗi giây, nhưng request trung vị mất hơn 100 ms mỗi token, vì vậy ít nhất nửa request trượt mục tiêu và gần như không request nào đạt mọi giới hạn; throughput đếm token và goodput đếm request đến đúng giờ.
- **Level 3:** Tại sao trung bình là thống kê sai cho thời gian mỗi token? Expected: phân phối có đuôi phải dài; một batch có prefill dài bên cạnh có thể gửi phần lớn token gần 7 ms và vài token gần 60, vì vậy trung bình đọc 9 ms trong khi P99 đọc 65, và người dùng thường gặp P99.
- **Level 4:** Hai công cụ báo thời gian mỗi token khác cho cùng lần chạy. Tại sao, và bạn làm gì? Expected: một loại token đầu tiên khỏi phép tính giữa token và công cụ kia gồm nó, 7.07 so với 12.00 ms trong ví dụ bài học; nêu công cụ và định nghĩa với mọi con số, và giữ một công cụ cho mọi lần chạy so sánh.

## Wrong answers

- "255 token mỗi giây là năng lực server." Cùng server cho throughput đó với thời gian đến token đầu tiên trung vị 0.8 s ở một tải và 3.9 s ở tải khác; con số không có độ trễ không phải kết quả.
- "Thêm người dùng đến khi throughput ngừng tăng, rồi dừng." Trên GB10 throughput BF16 tiếp tục tăng đến giới hạn 64 trong khi goodput là 0 hoặc gần từ giới hạn 8; mục tiêu độ trễ, không phải đường cong throughput, đặt giới hạn.
- "Báo cáo thời gian trung bình mỗi token." Phân phối lệch phải, vì vậy trung bình 9 ms có thể che P99 65; báo cáo trung vị, P90 và P99.
- "Giới hạn tiếp nhận riêng của engine bảo vệ người dùng." Giới hạn engine đến từ bộ nhớ, cạn lâu sau khi độ trễ không chấp nhận được; thực thi điểm gối trong client hoặc gateway.

## Taught in

[Phần benchmark SGLang](../../../manuals/sglang-101/sections/5-1-sglang-benchmark-serving.md) và [Benchmark server trong 15 phút](../../../manuals/vllm-101/sections/5-1-benchmark-your-server-in-15-minutes.md) đo điểm gối, và [bài học metric suy luận](../../../phases/17-infrastructure-and-production/08-inference-metrics-goodput/docs/en.md) định nghĩa goodput.
