---
id: design-a-chat-service-on-l4s
title: Design a chat service on a fleet of L4 cards
card: inference-serving
kind: design
level: 4
roles: [inference-engineer, applied-ai-engineer, forward-deployed-ai-engineer]
rounds: [system-design]
tags: [capacity, goodput, fp8, prefix-cache, admission, l4]
minutes: 15
lessons: []
manuals: [vllm-101#s-tune-chat-for-many-users, sglang-101#s-quantization, sglang-101#s-sglang-benchmark-serving, sglang-101#s-eviction-policies-and-hicache]
practice: []
cheatsheet: []
related: []
updated: 2026-11-03
---

Thiết kế lớp phục vụ cho một sản phẩm chat trên một đội card L4 với Qwen/Qwen3-8B. Mục tiêu là token đầu tiên trong 1 giây và 100 ms trở xuống mỗi token cho người dùng P99. Mọi request dùng chung một system prompt 2,048 token, và các phiên chạy nhiều lượt. Bao nhiêu người dùng mỗi card, độ chính xác nào, các giới hạn nào, và bạn đo gì trước khi ra mắt?

## Short answer

Định kích thước từ pool và điểm gối, không từ throughput. Ở BF16 pool 24,094 token trên một L4 giữ khoảng 37 request 640 token, và với đặt lại cache khoảng P99 giữa token ở 16 người dùng đã là 522 ms, vì vậy một replica BF16 đáp ứng mục tiêu cho ít hơn nhiều 16 người dùng; checkpoint FP8 với cache FP8 tăng pool lên 142,369 token và phục vụ 2.87 request mỗi giây trong cùng mục tiêu ở 64 người dùng, nơi BF16 không phục vụ được request nào. Vì vậy tôi sẽ phục vụ FP8 sau một phép kiểm tra độ chính xác trên prompt của chúng ta, đặt system prompt dùng chung trước để cache giữ nó, giữ pool đủ lớn cho các phiên quay lại, giới hạn người dùng mỗi replica tại điểm gối đo được trong gateway, và chạy phép quét với flush, bản ghi xung nhịp và phân phối độ dài hỗn hợp trước ra mắt.

## Full answer

### Users per card

Điểm gối trên một L4 ở BF16 nằm giữa 8 và 16 người dùng khi prefix cache được đặt lại trước mỗi lần chạy. Với đặt lại, 50 phần trăm request đạt mục tiêu ở 8 người dùng so với 75 đến 81 phần trăm không đặt lại, và ở 16 người dùng tỷ lệ giảm từ khoảng 65 phần trăm xuống 25 phần trăm, với ITL P99 522 ms so với 82 đến 84 ms chưa flush. Token đầu tiên trung vị với đặt lại khoảng 650 ms ở 4 người dùng, 951 đến 978 ms ở 8, và 1,550 đến 1,587 ms ở 16. Dưới tốc độ đến cố định, cả hai độ chính xác đạt mục tiêu cho mọi request đến 1 request mỗi giây; BF16 giữ 0.88 request mỗi giây trong mục tiêu tại 2 được đưa vào và không còn từ 4, trong khi FP8 giữ 3.18 tại 4 được đưa vào. Vì vậy một replica BF16 mang một số ít người dùng chat, và một replica FP8 nhiều gấp vài lần; phép quét quyết định số chính xác.

### Precision

Trên cùng L4 checkpoint FP8 với cache FP8 thay đổi hình dạng toàn bộ đường cong:

| Mức đồng thời | BF16 token đầu ra/s | FP8 token đầu ra/s | BF16 TTFT trung vị | FP8 TTFT trung vị |
|---|---|---|---|---|
| 1 | 13.42 | 24.53 | 189.16 ms | 140.72 ms |
| 16 | 201.09 | 313.92 | 211.78 ms | 147.52 ms |
| 32 | 270.11 | 507.20 | 2,969.61 ms | 199.09 ms |
| 64 | 250.85 | 735.91 | 18,348.57 ms | 296.42 ms |

Pool giải thích điều đó: 24,094 token so với 142,369. Ở 64 người dùng server BF16 chạy tối đa 38 request tại mức sử dụng token 0.99 với 26 trong hàng đợi; server FP8 chạy cả 64 tại 0.29 với hàng đợi rỗng. Goodput tại mục tiêu là 0 cho BF16 ở 32 và 64 người dùng và 2.87 request mỗi giây cho FP8 ở 64. Phép kiểm tra độ chính xác trên 500 câu hỏi GSM8K cho các khoảng chồng nhau cho mọi cấu hình FP8, với scale KV 1.0 vì mô hình này không có scale; chạy cùng phép kiểm tra trên prompt riêng, và đọc cảnh báo scale trong log khởi động.

### The shared prompt and the sessions that return

Đặt system prompt dùng chung trước và giữ giống từng byte, với danh sách công cụ theo thứ tự cố định và không gì thay đổi theo request trước lượt người dùng. Pool rồi phải giữ working set. Trên L4 với prompt 2,048 token mỗi nhóm người dùng, pool 24,094 token BF16 giữ khoảng 11 prompt như vậy: ở 4 nhóm token đầu tiên trung vị là 360 ms, ở 16 nhóm server chỉ GPU loại các prompt lại cần và token đầu tiên tăng lên 3,259 ms, và ở 32 nhóm lên 5,449 ms. Một tầng host giữ prompt bị loại và cho 553 ms ở 16 nhóm và 817 ở 32; ở 64 nhóm các prompt cần hơn cả pool GPU và host cùng nhau và tầng host chỉ cắt thời gian chờ xuống 3,610 ms từ 6,821. Với FP8 pool giữ nhiều prompt hơn xa, vì vậy cách sửa đầu cho working set là pool, và tầng host đến sau.

Các phiên nhiều lượt thêm cùng vấn đề theo thời gian. Trong pool 8,192 token một trace 24 phiên làm chính sách loại bỏ mặc định thrash: hit rate giảm xuống khoảng 1.5 phần trăm ở lượt 5 và 6, và một chính sách khác chỉ nâng lên 25 đến 34 phần trăm ở đó. Một pool 16,384 token đạt 0.69 trên toàn trace với mọi chính sách. Tăng pool trước khi đổi chính sách, và định tuyến mỗi phiên đến cùng replica để tiền tố nằm nơi nó quay lại.

### Caps

Thực thi điểm gối trong gateway, không chỉ engine. Engine tiếp nhận đến khi hết bộ nhớ, và một giới hạn trên engine chỉ chọn ai chờ: ở 32 người dùng trên L4 một giới hạn 16 chuyển token đầu tiên trung vị từ 1.8 lên 12.3 s và cắt đầu ra 38 phần trăm. Đặt giới hạn gateway thấp hơn một hoặc hai bước so với điểm gối đo được, và bỏ tải hoặc xếp hàng trên đó. Một biện pháp bảo vệ thứ hai trên engine tại cùng số đếm không gây hại.

### Before launch

1. Quét mức đồng thời với flush và seed mới trước mọi lần chạy, và ghi các token đã cache. Phép quét chưa flush đặt điểm gối giữa 16 và 32 người dùng; phép đã flush đặt giữa 8 và 16.
2. Ghi xung SM và nhiệt độ của mọi lần chạy, làm mát card giữa các lần chạy, và để riêng các lần dưới sàn xung. Dưới quá tải vòng mở L4 giảm từ 1,320 xuống 465 MHz với 70 phần trăm mẫu trong thermal slowdown, vì vậy quá tải tốn throughput cũng như độ trễ.
3. Chạy cơ cấu độ dài thật. Độ dài cố định tạo các đợt và cho thời gian đến token đầu tiên trung vị 1,996 ms với ITL P99 82 ms ở 16 người dùng; độ dài hỗn hợp cho 291 ms và 300 ms. Hai hình dạng đo hai server khác nhau.
4. Chạy tốc độ đến cố định cũng như vòng kín, vì người dùng thật không chờ nhau.
5. Chọn giới hạn từ goodput tại mục tiêu, và đọc ITL P99 cạnh token đầu tiên.

## Follow-ups

- **Level 3:** Tại sao không lấy số người dùng từ đỉnh throughput của phép quét? Expected: throughput đạt đỉnh ở 32 người dùng trong khi không request nào đạt mục tiêu ở đó, và điểm gối với đặt lại nằm giữa 8 và 16 người dùng; goodput tại mục tiêu đặt giới hạn và throughput chỉ giải thích.
- **Level 4:** Sản phẩm thêm các phiên dài quay lại sau vài phút. Điều gì thay đổi? Expected: working set vượt pool GPU, loại bỏ mặc định bỏ mỗi phiên ngay trước khi quay lại, và hit rate sụp, khoảng 1.5 phần trăm ở các lượt sau trong pool 8,192 token; tăng pool trước, định tuyến mỗi phiên đến cùng replica, và chỉ thêm tầng host khi working set lớn hơn pool GPU và nhỏ hơn pool GPU cùng host.
- **Level 4:** Lưu lượng gấp đôi trong một giờ. Điều gì bảo vệ người dùng? Expected: một giới hạn tại gateway bỏ tải hoặc xếp hàng trên điểm gối, vì engine tiếp nhận đến hết bộ nhớ và giới hạn trên engine chỉ chuyển thời gian chờ sang token đầu tiên, và vì L4 làm mát thụ động dưới quá tải cũng mất xung, từ 1,320 xuống 465 MHz, vì vậy quá tải tốn throughput cũng như độ trễ.

## Wrong answers

- "Chạy 32 người dùng mỗi card; phép quét cho 275 token mỗi giây ở đó." Không request nào đạt mục tiêu ở 32 người dùng, nơi ITL P99 là 613 ms; điểm gối với đặt lại cache nằm giữa 8 và 16 người dùng.
- "Giữ BF16, FP8 là rủi ro chất lượng không thể chấp nhận." Trên 500 câu hỏi GSM8K mọi khoảng FP8 chồng BF16, và FP8 là khác biệt giữa không và 2.87 request mỗi giây trong mục tiêu ở 64 người dùng; chạy kiểm tra trên prompt của bạn và quyết định theo bằng chứng.
- "Đặt giới hạn engine ở điểm gối là xong." Giới hạn engine chỉ chọn ai chờ và chuyển token đầu tiên lên 12.3 s ở 32 người dùng; thực thi điểm gối trong gateway và bỏ tải trên đó.
- "Benchmark bằng prompt cố định 512 token, đó là chuẩn." Độ dài cố định tạo các đợt và cho token đầu tiên 1,996 ms với ITL P99 82 ms, trong khi độ dài hỗn hợp cho 291 và 300 ms; kiểm thử cơ cấu độ dài thật trước khi đặt giới hạn.

## Taught in

[Điều chỉnh chat cho nhiều người dùng](../../../manuals/vllm-101/sections/3-1-tune-chat-for-many-users.md) tìm điểm gối, [phần lượng tử hóa SGLang](../../../manuals/sglang-101/sections/4-3-quantization.md) đo FP8 trên cùng card, [phần benchmark SGLang](../../../manuals/sglang-101/sections/5-1-sglang-benchmark-serving.md) đưa ra phương pháp goodput, và [Chính sách loại bỏ và HiCache](../../../manuals/sglang-101/sections/3-5-eviction-policies-and-hicache.md) định kích thước working set.
