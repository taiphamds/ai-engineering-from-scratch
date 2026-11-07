---
id: fail-closed-proof-record
title: A proof record that stays unknown without a compiler
card: evidence-reverse-engineering
kind: design
level: 4
roles: [agentic-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [system-design, design-review]
tags: [reverse-engineering, proof, verification, evidence, fail-closed]
minutes: 15
lessons: [phases/13-tools-and-protocols/36-rebuild-and-prove-equal, phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns]
manuals: [reverse-engineering-101#s-verify-reconstruction, reverse-engineering-101#s-a-proof-harness-outside-rea]
practice: []
cheatsheet: [reverse-engineering]
related: [evidence-reverse-engineering/byte-match-is-not-source, evidence-reverse-engineering/hazard-grid-estimate]
updated: 2026-11-03
---

Thiết kế bản ghi chứng minh cho một hàm được xây dựng lại mà một sổ nghĩa vụ sẽ chấp nhận. Bộ xác minh riêng của công cụ phân tích chấm các nhận định được khai báo với các bản ghi so sánh, và giới hạn cố định của nó là "Đạt nghĩa là mọi nhận định được khai báo đã đạt; nó không thiết lập sự tương đương triển khai toàn cục"; quy tắc sẵn sàng của nó nói rằng không gì yếu hơn đạt cộng thành đạt. Host CI của bạn không có trình biên dịch C. Nói bản ghi chứa gì, id hình thành như thế nào, các nhận định nào nó có thể và không thể mang từ công cụ, và nó nhận trạng thái gì trên host đó.

## Short answer

Tạo một bản ghi bằng chứng riêng, vì không công cụ công khai nào xuất nó, và cho nó `predicate_type: rea.reconstruction-proof`, `operation: verify_reconstruction_obligations`, `confidence: observed`, `authority: controlled-replay`, và một `normalized_result` với `passed`, `status` và một danh sách nhận định, mỗi nhận định là `behavioral` hoặc `structural-function` với trạng thái và các id `ev_` của các hồ sơ hàm nó dựa vào, lặp lại trong `evidence_links`. Id là `ev_` cộng SHA-256 của bản ghi không có id trên JSON gọn với khóa đã sắp xếp. Tổng hợp là fail-closed: `fail` thắng, rồi `unknown`, và một danh sách nhận định rỗng là `unknown`. Bộ xác minh của công cụ chỉ có thể chấm một nhận định `structural-function` là cùng văn bản provider trên một chiều, vì vậy hành vi và byte đến từ hai nhánh riêng của bạn; trên một host không có trình biên dịch các nhận định hành vi là `unknown`, và bản ghi nói `unknown` ngay cả khi cả hai nhận định byte đạt.

## Full answer

### Why the tool's pass is not enough

Một nhận định `structural-function` nêu một trong chín chiều của một bản ghi `compare_functions`, và bộ xác minh tính trạng thái theo một thứ tự cố định: bất kỳ giới hạn nào làm nó `unknown`, một `changed` observed làm nó `fail`, một `unknown` observed hoặc một điều chưa biết còn lại đang mở làm nó `unknown`, nếu không `pass`. Lần chạy được ghi gửi bốn nhận định và nhận hai lần đạt và hai thất bại. Các nhận định `total` thất bại dù cả hai bản dựng đến từ một dòng mã nguồn, vì `-O2` trải vòng lặp thành 62 lệnh nơi `-O1` có 13; văn bản khác không nghĩa là hành vi khác. Chiều ngược cũng đúng: một bản dựng lại có hằng số sai trong một bảng tra cứu in cùng văn bản assembly, vì vậy một nhận định văn bản có thể đạt trên một hàm sai. Không gì trong công cụ chạy một hàm hoặc biên dịch một hàm.

### The two legs you run

Nhánh một biên dịch bản gốc và ứng viên vào một chương trình dưới các tên khác, chạy một lưới với một lớp mỗi nguy cơ, và ghi mọi ô, gồm một trap. Nhánh hai biên dịch lại ứng viên với các cờ gốc, mask các trường relocation, so sánh các bản ghi relocation theo hình dạng, và đọc các hằng số chúng trỏ tới. Mỗi nhánh tạo một nhận định mỗi hàm, và mỗi nhận định liên kết các bản ghi hồ sơ của hàm nó bao phủ. Nhận định hành vi không có trình biên dịch là `unknown`, không phải bỏ qua và không phải đạt.

### Authority and id

`authority` là `controlled-replay`, vì chứng minh đến từ một harness bạn chạy chứ không chỉ từ object file; `shipped-artifact` sẽ tuyên bố rằng riêng file hỗ trợ sự bằng nhau, điều nó không làm được. Id không loại gì ngoài chính nó: thêm một nhận định hoặc một lần chạy thay đổi nội dung và id, vì vậy một chứng minh được tạo sau trên một host có trình biên dịch là một bản ghi mới, và cả hai được giữ. Không công cụ công khai nào xuất bản ghi này; sổ nghĩa vụ mong đợi nó, và bạn tạo nó.

### Driving the verifier at all

Bộ xác minh của công cụ là một trong 65 công cụ MCP không có lệnh CLI, vì vậy một stdio client gửi `initialize`, thông báo initialized và `tools/call`. Cả hai hồ sơ và bản ghi so sánh phải trong cùng kết nối, vì bộ xác minh đọc bundle của kết nối, và một lần đóng xóa các bản ghi được giữ; xuất bundle trước khi đóng.

### The readiness rule, copied

Một kết quả giai đoạn fail, unknown, unsupported, truncated hoặc skipped không bao giờ cộng thành pass. Câu đó là hàm tổng hợp.

## Follow-ups

- **Level 3:** Tại sao authority là `controlled-replay` chứ không phải `shipped-artifact`? Expected: sự kiện đến từ một lần chạy và biên dịch lại bạn kiểm soát; riêng file không thể cho thấy hai hàm bằng nhau.
- **Level 4:** Bộ xác minh cho cả hai nhận định `percent_change` đạt trong khi trạng thái tổng thể của phép so sánh là `unknown`. Bằng cách nào? Expected: mỗi nhận định đọc chiều riêng; chiều chưa biết là `references`, và điều chưa biết còn lại nó mở chỉ nêu `overall` và `references`.
- **Level 4:** Một trình biên dịch xuất hiện trên host CI tuần tới. Điều gì xảy ra với bản ghi? Expected: các nhận định hành vi chạy lại và đạt, nội dung thay đổi, vì vậy một id mới được tạo, và bản ghi `unknown` trước được giữ làm lịch sử.

## Wrong answers

- "Một lần đạt từ bộ xác minh chứng minh bản dựng lại bằng bản gốc." Giới hạn riêng của nó nói khác; nó so sánh văn bản decompiler trên một chiều.
- "Đánh dấu các nhận định hành vi đạt trên CI vì các byte khớp." Không gì yếu hơn đạt cộng thành đạt; một lần chạy thiếu là `unknown`.
- "Giữ cùng id sau khi thêm các kết quả chạy." Id là một content hash; một bản ghi thay đổi là một bản ghi mới.

## Taught in

[Bài học xây dựng lại](../../../phases/13-tools-and-protocols/36-rebuild-and-prove-equal/) tạo bản ghi và tổng hợp fail-closed của nó, [phần xác minh](../../../manuals/reverse-engineering-101/sections/7-1-verify-reconstruction.md) cho thấy bốn nhận định được chấm và quy tắc sẵn sàng, và [phần harness chứng minh](../../../manuals/reverse-engineering-101/sections/7-2-a-proof-harness-outside-rea.md) chạy hai nhánh.
