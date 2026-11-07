---
id: the-client-is-part-of-the-measurement
title: Two clients, two numbers, one server
card: inference-serving
kind: concept
level: 2
roles: [inference-engineer, ai-evaluation-reliability-engineer, applied-ai-engineer]
rounds: [screen, ml-breadth]
tags: [benchmark, client-bias, temperature, prompt-lengths, load-testing]
minutes: 8
lessons: [phases/17-infrastructure-and-production/22-load-testing-llm-apis]
manuals: [vllm-101#s-benchmark-your-server-in-15-minutes, sglang-101#s-sglang-benchmark-serving]
practice: []
cheatsheet: []
related: []
updated: 2026-11-03
---

Hai kỹ sư benchmark cùng máy chủ trong cùng ngày và báo cáo các con số khác nhau vài phần trăm. Cả hai dùng client benchmark tiêu chuẩn. Trước khi xem máy chủ, điều gì về các client có thể giải thích khoảng cách, và bạn sẽ đặt quy tắc nào cho nhóm?

## Short answer

Client là một phần của phép đo. Trên một máy chủ vLLM, client SGLang đọc token đầu tiên trung vị cao hơn 3 đến 10 phần trăm và thông lượng đầu ra thấp hơn 2 đến 8 phần trăm so với client vLLM, hai client gửi các prompt random khác nhau, và temperature 0.7 tăng thời gian mỗi token thêm 10 đến 13 phần trăm ở một người dùng so với temperature 0. Các quy tắc: một client, một temperature, một phân phối độ dài prompt với range ratio được nêu, một lần xóa cache và một seed mới mỗi lần chạy, xung nhịp được ghi lại, và tất cả những điều đó được viết cạnh mọi con số.

## Full answer

### Three clients on one server

Tài liệu chạy client SGLang, `vllm bench serve` và phiên bản Rust của nó với một máy chủ vLLM có Qwen/Qwen3-0.6B, với đặt lại cache trước mọi lần chạy và các client luân phiên qua hai vòng. Token đầu ra mỗi giây ở 64 người dùng:

| Temperature | Client SGLang | vllm bench | vllm bench, Rust |
|---|---|---|---|
| 0 | 359, 348 | 379, 377 | 371, 365 |
| 0.7 | 331, 343 | 360, 363 | 356, 353 |

Hai client vLLM khớp nhau trong nhiễu ở 1, 16 và 64 người dùng. Client SGLang đọc một máy chủ chậm hơn: token đầu tiên trung vị cao hơn 3 đến 10 phần trăm, và ở 16 và 64 người dùng, thông lượng đầu ra thấp hơn 2 đến 8 phần trăm. Hai client gửi các token prompt khác nhau từ các tập dữ liệu random của chúng, nên một phần của một khoảng cách nhỏ có thể đến từ prompt. Temperature 0.7 tăng thời gian trung vị mỗi token so với temperature 0 thêm 10 đến 13 phần trăm ở một người dùng và 3 đến 6 phần trăm ở 16 và 64 người dùng.

### Four defaults that change the result

Client SGLang đưa ra các lựa chọn trước khi đo bất cứ thứ gì:

| Thiết lập | Mặc định | Nó làm gì với kết quả |
|---|---|---|
| `--random-range-ratio` | 0.0 | mỗi độ dài được rút từ 1 đến độ dài bạn yêu cầu, nên prompt trung bình bằng khoảng một nửa nó |
| `ignore_eos` | bật | mọi yêu cầu sinh chính xác độ dài đầu ra bạn yêu cầu |
| `--request-rate` | inf | tất cả yêu cầu được gửi ở thời điểm 0, và chỉ giới hạn đồng thời giữ chúng lại |
| `--warmup-requests` | 1 | một yêu cầu chạy trước khi đồng hồ bắt đầu |

Dòng đầu tiên là cái bẫy. Với ratio mặc định, độ dài đầu vào 512 cho prompt trung bình gần 256 token, và báo cáo nói 512. Truyền 1.0 hoặc viết phân phối độ dài cạnh kết quả. Với 1.0, 32 prompt dài 512 token cho tổng đầu vào 16384 trong báo cáo.

### Fixed lengths form waves

Với ratio ở 1.0, mọi yêu cầu có cùng độ dài, nên các yêu cầu bắt đầu cùng nhau kết thúc cùng nhau và các yêu cầu thay thế của chúng đến cùng nhau. Ở 16 người dùng trên L4, độ dài cố định cho thời gian trung vị đến token đầu tiên là 1,996 ms và P99 ITL là 82 ms; độ dài hỗn hợp cho 291 ms và 300 ms. Hai thiết lập đo hai máy chủ khác nhau. Độ dài cố định đo các đợt bùng phát, với token đầu tiên chậm và các token mượt. Độ dài hỗn hợp đo lưu lượng đều đặn, với token đầu tiên nhanh và những lần khựng trong luồng. Giữ 1.0 để so sánh hai bản dựng, và chạy hỗn hợp độ dài thực của bạn trước khi đặt một mục tiêu độ trễ.

### The client's own queue

Client SGLang gửi mọi yêu cầu từ một tiến trình Python. Một nghiên cứu năm 2026 tìm thấy rằng một client như vậy thêm hàng đợi riêng ở tốc độ yêu cầu cao rồi báo cáo token đầu tiên và thời gian mỗi token cao hơn mức máy chủ cho. Trước khi tin một con số ở tốc độ cao, so sánh một tiến trình client với hai tiến trình mỗi tiến trình gửi một nửa tốc độ. Bài học nêu cùng cái bẫy cho một công cụ kiểm thử tải tổng quát: tokenization dưới khóa trình thông dịch trong client làm tăng độ trễ giữa token được báo cáo, và một prompt gửi trong vòng lặp cache hit trong prefix cache trên gần như mọi yêu cầu và làm tăng thông lượng.

### Hand-written scripts

Một báo cáo đo 13 token mỗi giây cho một mô hình lớn trên tám GPU so với 60 từ một API được lưu trữ. Script đếm các từ tách theo dấu cách và đưa thời gian token đầu tiên vào tốc độ. Một từ không phải một token, và TTFT không phải thời gian decode. Dùng client benchmark, đếm token và giữ TTFT và TPOT riêng biệt.

### The rules

1. Một client, một phiên bản, được nêu tên trong mọi kết quả.
2. Một temperature, được nêu trong mọi kết quả.
3. `--random-range-ratio 1.0`, hoặc phân phối độ dài được viết xuống.
4. Một lần xóa cache và một seed mới trước mọi lần chạy, và các token đã cache được ghi lại.
5. Xung nhịp GPU được ghi lại và các lần chạy nóng được để riêng.
6. Thông lượng chỉ được báo cáo cùng với TTFT và TPOT trung vị và P99 ở cùng giới hạn.

## Follow-ups

- **Level 2:** Tại sao range ratio mặc định mô tả một nửa công việc? Expected: mỗi độ dài được rút từ 1 đến độ dài yêu cầu, nên prompt trung bình bằng khoảng một nửa nó; với 1.0 mọi prompt có toàn bộ độ dài và tổng token đầu vào trong báo cáo xác nhận điều đó.
- **Level 3:** Độ dài cố định cho token đầu tiên muộn và luồng đều đặn, độ dài hỗn hợp thì ngược lại. Bạn dùng cái nào? Expected: độ dài cố định để so sánh hai bản dựng, vì chúng lặp lại chính xác; hỗn hợp độ dài thực của bạn trước khi đặt mục tiêu độ trễ, vì hai hình dạng đo hai máy chủ khác nhau.
- **Level 3:** Vòng lặp đo thời gian viết tay của một đồng đội đọc 13 token mỗi giây trong khi một API được lưu trữ đọc 60. Vòng lặp sai ở đâu? Expected: nó đếm các từ tách theo dấu cách và đưa thời gian token đầu tiên vào tốc độ; một từ không phải một token và TTFT không phải thời gian decode, nên dùng client benchmark.
- **Level 4:** Ở 16 yêu cầu mỗi giây, client báo cáo một token đầu tiên mà bạn không tin. Bạn kiểm tra chính client như thế nào? Expected: một client đơn tiến trình thêm hàng đợi riêng ở tốc độ cao; chạy hai tiến trình client mỗi tiến trình gửi một nửa tốc độ và so sánh, và ghi mức sử dụng CPU của client.

## Wrong answers

- "Cả hai là client tiêu chuẩn, nên các con số so sánh được." Trên một máy chủ, client SGLang đọc thời gian token đầu tiên cao hơn 3 đến 10 phần trăm và thông lượng thấp hơn 2 đến 8 phần trăm so với client vLLM; một khoảng cách vài phần trăm có thể chỉ đến từ client.
- "Temperature không thay đổi tốc độ." Temperature 0.7 tăng thời gian trung vị mỗi token thêm 10 đến 13 phần trăm ở một người dùng và 3 đến 6 phần trăm ở 16 và 64 người dùng so với temperature 0.
- "Đặt độ dài đầu vào là 512 và các prompt dài 512 token." Với range ratio mặc định 0.0, prompt trung bình khoảng 256 token; truyền 1.0 hoặc nêu phân phối.
- "Một công cụ kiểm thử tải xử lý được HTTP thì xử lý được lưu lượng mô hình." Một công cụ tổng quát gửi một prompt trong vòng lặp, cache hit trong prefix cache gần như mỗi lần, và nó không đọc các khoảng cách token của một luồng; dùng một client lấy mẫu độ dài prompt và đếm token.

## Taught in

[Benchmark máy chủ của bạn trong 15 phút](../../../manuals/vllm-101/sections/5-1-benchmark-your-server-in-15-minutes.md) và [phần benchmark của SGLang](../../../manuals/sglang-101/sections/5-1-sglang-benchmark-serving.md) so sánh các client, và [bài học kiểm thử tải](../../../phases/17-infrastructure-and-production/22-load-testing-llm-apis/docs/en.md) nêu hai cái bẫy của client.
