---
id: read-the-clock-first
title: Read the GPU clock before the throughput
card: inference-serving
kind: debug
level: 2
roles: [inference-engineer, ai-evaluation-reliability-engineer]
rounds: [debugging, screen]
tags: [benchmark, thermal-throttle, sm-clock, telemetry, l4]
minutes: 8
lessons: []
manuals: [sglang-101#s-sglang-benchmark-serving, vllm-101#s-speed-up-decode-with-eagle3]
practice: []
cheatsheet: []
related: []
updated: 2026-11-03
---

Lượt quét đầu tiên của bạn trên L4 nói rằng CUDA graph không có tác dụng: ở một người dùng, thời gian trung vị mỗi token là 103.4 ms khi có graph và 103.4 ms khi không có, và ba seed ở giới hạn đó trải từ 10.0 đến 14.9 token mỗi giây, bằng một nửa trung vị. Bạn kiểm tra gì trước khi báo cáo rằng graph không có tác dụng?

## Short answer

Kiểm tra xung nhịp GPU và nhiệt độ trong lần chạy trước khi tin một trong hai con số. L4 của tài liệu ở 87 C với giảm tốc do nhiệt bằng phần mềm đang hoạt động và xung nhịp SM là 360 MHz trên 2040 trong lượt quét đó, nên máy chủ đang kiểm thử không phải nguyên nhân. Một lượt quét có làm nguội về 72 C và ghi lại xung nhịp cho 60.16 ms mỗi token ở một người dùng so với 103.38 khi nóng, và 270.11 so với 194.16 token mỗi giây ở giới hạn 32: lượt quét nóng báo cáo thông lượng thấp hơn đến 28 phần trăm, với cùng lệnh trên cùng card.

## Full answer

### What the telemetry showed

Một truy vấn driver trong lượt quét cho dòng: 87 C, 58.36 W trên giới hạn 72.00 W, xung nhịp SM là 360 MHz so với tối đa 2040, bit giảm tốc do nhiệt bằng phần mềm hoạt động, và mức sử dụng 100 phần trăm. L4 là một card 72 W với làm mát thụ động, và card thứ hai trong cùng khung máy chạy công việc khác cùng lúc. Lượt quét đã đo một GPU nóng.

### The fix in the method

Script quét hiện lấy mẫu driver mỗi giây vào một file cạnh mỗi lần chạy. Trước mỗi lần chạy, nó chờ đến 900 s để GPU nguội xuống dưới một giới hạn, mặc định 65 C và 72 C cho khung máy này. Bản tổng hợp thêm xung nhịp SM trung vị, nhiệt độ cao nhất và tỷ lệ mẫu có bit giảm tốc do nhiệt cho mỗi điểm. Một lần chạy dưới ngưỡng xung nhịp được để riêng và lặp lại, tối đa ba lần.

Các lần chạy được làm nguội cũng không ở tốc độ đầy đủ. Xung nhịp SM trung vị của chúng là 1,080 đến 1,515 MHz trên 2,040, và ở các giới hạn 1 và 64, seed tệ nhất vẫn có bit nhiệt trong 41 đến 49 phần trăm mẫu của nó. Việc làm nguội loại bỏ sai số tệ nhất, và xung nhịp được ghi cho bạn biết còn lại bao nhiêu.

### Overload heats the card

Dưới một tốc độ đến cố định, L4 hoàn thành càng ít yêu cầu khi càng nhiều yêu cầu được đưa vào: 2.01 mỗi giây ở mức đưa vào 4, 1.91 ở 8 và 1.62 ở 16. Xung nhịp SM trung vị giảm từ 1,320 MHz ở mức đưa vào 4 xuống 465 MHz ở 16, và ở 16 bit nhiệt được bật trong 70 phần trăm mẫu. Trên một card làm mát thụ động, quá tải đánh đổi cả thông lượng lẫn độ trễ. GB10 cho thấy điều tương tự ở mức đưa vào 16 mỗi giây: 89 C và 7.3 phần trăm mẫu bị giảm tốc do nhiệt, trong khi xung nhịp của nó giữ ở 2,496 MHz đến mức 4 mỗi giây.

### Lock or record

Để so sánh hai cấu hình, khóa xung nhịp SM bằng công cụ driver, ở 900 MHz trong các lần chạy của tài liệu, và bỏ khóa sau đó. Một khóa đặt xung nhịp cao nhất và không thể ngăn GPU giảm xung xuống dưới nó: một lần chạy không có speculation giảm xuống 210 MHz dưới một khóa 900 MHz và được để riêng. Chỉ so sánh hai lần chạy ở cùng xung nhịp. Khi xung nhịp khác nhau một chút, đọc tỷ lệ giữa các lần chạy thay vì thời gian tuyệt đối, và nêu xung nhịp trong báo cáo.

Quan điểm của tài liệu: một benchmark không có xung nhịp và nhiệt độ của mỗi lần chạy không phải bằng chứng.

## Follow-ups

- **Level 2:** Bạn thêm hai cột nào vào mỗi dòng kết quả? Expected: xung nhịp SM trung vị và nhiệt độ cao nhất hoặc tỷ lệ mẫu có cờ nhiệt, để người đọc có thể để riêng các lần chạy nóng.
- **Level 3:** Bạn khóa xung nhịp ở 900 MHz và một lần chạy vẫn báo cáo 210 MHz. Bằng cách nào? Expected: một khóa đặt xung nhịp cao nhất và không thể ngăn GPU giảm xung xuống dưới nó; để riêng lần chạy đó, lặp lại sau khi làm nguội, và chỉ so sánh các lần chạy ở cùng xung nhịp.
- **Level 3:** Dưới quá tải vòng hở, card hoàn thành ít yêu cầu hơn khi bạn đưa vào nhiều hơn. Tại sao? Expected: hàng đợi tăng và card nóng lên, nên xung nhịp giảm từ 1,320 xuống 465 MHz và 70 phần trăm mẫu cho thấy giảm tốc do nhiệt ở 16 mỗi giây; trên một card làm mát thụ động, quá tải đánh đổi cả thông lượng lẫn độ trễ.
- **Level 4:** Khung máy của bạn không thể làm nguội card dưới 72 C. Bạn vẫn so sánh hai cấu hình như thế nào? Expected: chạy cả hai trong một phiên và luân phiên chúng, ghi xung nhịp cho mọi lần chạy, để riêng các lần chạy dưới một ngưỡng và lặp lại chúng, đọc tỷ lệ giữa các lần chạy ở xung nhịp tương tự thay vì thời gian tuyệt đối, và in xung nhịp cạnh mọi con số.

## Wrong answers

- "GPU hiển thị mức sử dụng 100 phần trăm, nên nó chạy ở tốc độ đầy đủ." Mức sử dụng nói GPU đã bận, không phải nhanh thế nào; cùng card đọc 100 phần trăm ở 360 MHz trên 2040 với cờ nhiệt hoạt động.
- "Một độ trải bằng một nửa trung vị giữa các seed là nhiễu bình thường." Trên một card mát, các dải nằm trong khoảng 10 phần trăm của các trung vị của chúng; một độ trải bằng một nửa trung vị là dấu hiệu xung nhịp thay đổi, nên đọc telemetry.
- "Một khóa xung nhịp khiến mọi lần chạy so sánh được." Nó giới hạn xung nhịp và không thể ngăn giảm xung; một lần chạy dưới khóa giảm xuống 210 MHz và phải được để riêng.
- "Ghi xung nhịp một lần ở đầu lượt quét." Xung nhịp giảm từ 1,320 xuống 465 MHz qua một lượt quét vòng hở khi hàng đợi tăng; lấy mẫu mỗi giây trong mọi lần chạy và báo cáo trung vị cho mỗi lần chạy.

## Taught in

[Phần benchmark của SGLang](../../../manuals/sglang-101/sections/5-1-sglang-benchmark-serving.md) cho thấy lượt quét bị giảm xung và telemetry, và [Tăng tốc decode bằng EAGLE3](../../../manuals/vllm-101/sections/4-1-speed-up-decode-with-eagle3.md) đưa ra quy tắc khóa xung nhịp.
