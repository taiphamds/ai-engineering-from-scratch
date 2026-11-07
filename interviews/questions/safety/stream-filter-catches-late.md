---
id: stream-filter-catches-late
title: The detector said benign and the stream was cut
card: safety
kind: debug
level: 3
roles: [agentic-ai-engineer, applied-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [debugging, system-design]
tags: [safety-gate, streaming-filter, prefix-injection, encoding-trick, trace]
minutes: 9
lessons: [phases/19-capstone-projects/87-end-to-end-safety-gate, phases/19-capstone-projects/82-jailbreak-taxonomy]
manuals: []
practice: []
cheatsheet: [guardrails-moderation]
related: [safety/gate-aggregation-table, safety/one-regex-is-not-a-detector]
updated: 2026-11-03
---

Cổng của bạn chặn phần lớn các cuộc tấn công trước khi mô hình chạy. Trong trace của một yêu cầu, bộ phát hiện nói lành tính, mô hình bắt đầu trả lời bằng một quy trình nó không bao giờ được cung cấp, và phản hồi bị cắt sau vài token rồi được đưa ra như một phần đã che dữ liệu. Giải thích lớp nào đã hành động, tại sao lớp đầu bỏ lỡ, và liệu kết quả có đúng không.

## Short answer

Bộ lọc streaming đã hành động: nó đệm một cửa sổ ngắn các chunk được phát ra, quét nó để tìm các cụm từ tiếp nối đã biết, kết thúc stream khi khớp và đánh dấu đầu ra là kết thúc sớm, điều bộ tổng hợp xem là một tín hiệu trung bình và ánh xạ thành redact. Bộ phát hiện bỏ lỡ vì prompt là một thủ thuật mã hóa hoặc một prefix injection có bề mặt mà các quy tắc đầu vào không bao phủ. Kết quả đúng với thiết kế: phần tiếp nối có hại không bao giờ hoàn tất, và trace ghi lần bỏ lỡ cho nhóm bộ phát hiện.

## Full answer

### The layer that acted

Cổng chạy tại ba checkpoint. Trước sinh là bộ phát hiện. Trong sinh là một bộ lọc trên stream của mô hình: mô hình giả sinh các chunk bốn token, bộ lọc giữ tối đa hai chunk, chạy một regex các cụm từ tiếp nối trên cửa sổ, và khi khớp thì dừng iterator và trả về đầu ra một phần được đánh dấu kết thúc sớm. Sau sinh chạy bộ định tuyến phân loại và bộ máy quy tắc trên bất cứ thứ gì đã được phát ra.

### Why the detector missed

Hai danh mục phân loại được xây để đi qua các quy tắc đầu vào. Một thủ thuật mã hóa giấu các token bị cấm trong base64, rot13, leet speak hoặc các ký tự zero width, và một tập quy tắc không giải mã dạng đó không thấy gì. Một prefix injection kết thúc prompt bằng các từ đầu của câu trả lời, nên mô hình tiếp tục từ một sự đồng ý được giả định thay vì quyết định; chính prompt có thể trông vô hại. Mô hình giả của capstone tạo ra một phần tiếp nối có hại trên đúng tập con tấn công đó, có chủ đích, để có thể thấy các lớp tương tác.

### Why redact and not block

Kết thúc sớm là một tín hiệu trung bình. Lượt sau sinh trên văn bản một phần không tìm thấy gì cao. Mức tối đa là trung bình, nên hành động là redact: các bộ che dữ liệu của bộ phân loại và bộ sửa quy tắc chạy trên phần đó, và nó được đưa ra với một trace cho thấy phán quyết bộ phát hiện, mẫu kết thúc đã khớp, các phán quyết sau sinh, hành động cuối và độ trễ.

### What to do with the trace

Thêm prompt vào hệ phân loại như một fixture với danh mục và mức nghiêm trọng. Thêm hoặc điều chỉnh một quy tắc bộ phát hiện cho họ của nó. Chạy lại bộ chạy chỉ số và đọc thay đổi recall trong danh mục đó và thay đổi dương tính giả trên danh sách lành tính. Trace tồn tại để một lần bỏ lỡ trở thành một fixture thay vì một câu chuyện.

### The limit

Cửa sổ giữ hai chunk. Một cụm từ tiếp nối bị chia qua nhiều chunk hơn thoát khỏi bộ lọc, và lượt sau sinh là chốt chặn dự phòng. Một cổng chỉ xem xét sau sinh sẽ để một prefix injection stream quy trình của nó tới người dùng trước bất kỳ kiểm tra nào.

## Follow-ups

- **Level 3:** Tại sao bộ lọc giữ hai chunk thay vì quét riêng từng chunk? Expected: một cụm từ tiếp nối có thể trải qua một ranh giới chunk; cửa sổ cho phép regex thấy qua nó với cái giá là một độ trễ ngắn.
- **Level 3:** Lớp này tồn tại cho các danh mục phân loại nào? Expected: các thủ thuật mã hóa đi qua các quy tắc đầu vào, và prefix injection, nơi prompt đặt các từ đầu của câu trả lời.
- **Level 4:** Hành động tiếp theo cho nhóm bộ phát hiện là gì, và họ biết nó hoạt động bằng cách nào? Expected: thêm prompt như một fixture với danh mục của nó, thêm hoặc điều chỉnh một quy tắc, và đọc recall theo từng danh mục và tỷ lệ dương tính giả lành tính từ bộ chạy chỉ số.

## Wrong answers

- "Cổng thất bại vì bộ phát hiện nói lành tính." Cổng được chia lớp để một lần bỏ lỡ trong một lớp được lớp tiếp theo bắt; trace cho thấy thiết kế hoạt động.
- "Không đưa ra gì khi stream bị cắt." Thiết kế ánh xạ kết thúc sớm thành redact và đưa phần còn lại qua các bộ che dữ liệu; một lần block cần một tín hiệu cao.
- "Thay vào đó quét toàn bộ đầu ra sau sinh." Một góc nhìn chỉ hậu kiểm để một prefix injection stream quy trình tới người dùng trước kiểm tra; bộ lọc tồn tại để dừng stream sớm.

## Taught in

[Capstone cổng an toàn đầu cuối](../../../phases/19-capstone-projects/87-end-to-end-safety-gate/) xây dựng bộ lọc streaming và trace, và [capstone phân loại jailbreak](../../../phases/19-capstone-projects/82-jailbreak-taxonomy/) định nghĩa các danh mục đến được nó.
