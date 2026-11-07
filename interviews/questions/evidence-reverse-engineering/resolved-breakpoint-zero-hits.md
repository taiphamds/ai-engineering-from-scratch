---
id: resolved-breakpoint-zero-hits
title: Every breakpoint resolved and none was hit
card: evidence-reverse-engineering
kind: debug
level: 3
roles: [agentic-ai-engineer, ai-evaluation-reliability-engineer, applied-ai-engineer]
rounds: [debugging, coding]
tags: [reverse-engineering, dynamic-analysis, debugger, inlining, verdicts]
minutes: 10
lessons: [phases/13-tools-and-protocols/42-dynamic-analysis-of-your-own-program, phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns]
manuals: []
practice: []
cheatsheet: [reverse-engineering]
related: [evidence-reverse-engineering/observed-derived-inferred, evidence-reverse-engineering/empty-list-is-not-absence]
updated: 2026-11-03
---

Một agent báo cáo "main gọi `bump`, `classify` và `sum_balances`". Bạn dựng chương trình ở `-O2`, đặt một breakpoint trên mỗi tên, và chạy dưới debugger. Chương trình in bốn dòng và thoát với trạng thái 0, và `breakpoint list` hiển thị mọi breakpoint `resolved` với `hit count = 0`. Chấm nhận định của agent và bảy nhận định tĩnh khác trong kế hoạch, và nêu sai lầm harness sẽ tạo ra một transcript không có lần dừng trên một bản dựng nơi các lời gọi thực sự xảy ra.

## Short answer

Mỗi breakpoint đã resolved, vì vậy symbol tồn tại và một trap được ghi tại địa chỉ của nó; một hit count bằng không sau một lần chạy đầy đủ với trạng thái thoát 0 nghĩa là không lần lấy lệnh nào tới nó, vì vậy với bản dựng này nhận định cạnh gọi bị bác bỏ, và chỉ nhận định đó, vì trình biên dịch inline cả ba lời gọi và gộp tổng thành hằng số 315. Nhận định đầu ra được xác nhận bằng bốn dòng và trạng thái thoát, và các nhận định thanh ghi đối số, offset trường, store và stride là not-observed, vì không lần dừng nào có thể kiểm thử chúng, với các hit count làm lý do. Sai lầm harness là `--auto-continue`: một breakpoint như vậy không báo cáo lần dừng và stop hook không bao giờ chạy, vì vậy một phiên bản đầu của harness không ghi gì ngay cả trên bản dựng chưa tối ưu nơi mọi lời gọi xảy ra; các breakpoint thông thường, một stop hook và một ngân sách cố định các lệnh `continue` sửa nó.

## Full answer

### Three verdicts and never a fourth

Một lần dừng đã kiểm thử một nhận định và đồng ý là `confirmed`; một lần dừng đã kiểm thử nó và bất đồng là `refuted`; một nhận định không lần dừng nào có thể kiểm thử là `not-observed`, với lý do. Sổ chấp nhận hai loại đầu là các bản ghi observed với authority `controlled-replay` và giữ loại thứ ba là một điều chưa biết mở. Một breakpoint resolved không bao giờ thay thế một lần chạy.

### What the refutation does and does not say

Nhận định là `main` gọi ba hàm trong chương trình này. Với bản dựng này và lần chạy này nó không gọi, và harness kiểm tra rằng lần chạy hoàn tất, vì một hit count bằng không trước khi thoát chỉ nghĩa là lần chạy chưa tới lời gọi. Nhận định không nói các hàm là mã chết, và lần chạy cũng không nói vậy: `nm` vẫn liệt kê chúng vì chúng là external và một object khác có thể gọi, và thông tin debug cho bản dựng tối ưu có bốn subprogram và không mục inlined-subroutine, vì vậy ngay cả nó cũng không ghi việc inline. Struct vẫn có `balance` tại offset 4 trong bản dựng này; không lần dừng nào đọc bộ nhớ để cho thấy nó, và `not-observed` giữ khác biệt đó.

### The unoptimized run for contrast

Cùng kế hoạch trên bản dựng `-O0` tạo mười một lần dừng: các hit count 1, 3, 1 cho ba tên và 2, 1, 1, 1 cho bốn breakpoint cạnh được đặt tại đích và fall-through của hai nhánh có điều kiện. Watchpoint trên `a->balance` kích hoạt một lần với giá trị cũ 250 và giá trị mới 255, là một lần ghi `by` bằng 5, và hàng bộ nhớ đầu được đọc tại lần dừng đầu vào được giải mã từng word theo các offset DWARF. Tất cả tám nhận định kết thúc `confirmed` ở đó.

### Two more transcript traps

Một breakpoint địa chỉ được đặt không nêu module giữ `unresolved` với `hit count = 0` suốt lần chạy, vì một số trần trước khi tiến trình tồn tại không có section đằng sau; dạng kết nối một địa chỉ listing với một địa chỉ nạp nêu module. Và `continue` đầu sau khi tiến trình thoát kết thúc toàn bộ file lệnh trừ khi `interpreter.stop-command-source-on-error` là false, vì vậy `breakpoint list` không bao giờ chạy và transcript không có hit count để đọc.

## Follow-ups

- **Level 3:** Tại sao lần chạy bác bỏ các cạnh gọi mà không làm các hàm thành mã chết? Expected: nhận định là về `main` của chương trình này; các hàm được export và một object khác có thể gọi.
- **Level 3:** Watchpoint trên `a->balance` đi đâu trong lần chạy tối ưu? Expected: không đâu; nó được đặt tại lần dừng `bump`, không bao giờ xảy ra, vì vậy nhận định store là not-observed; một biến cục bộ nằm trong thanh ghi cũng sẽ không bao giờ kích hoạt.
- **Level 4:** Transcript dừng trước `breakpoint list`. Điều gì xảy ra và điều gì thay đổi? Expected: một `continue` sau thoát kết thúc file lệnh; đặt trình thông dịch không dừng đọc nguồn khi có lỗi để bảng in.
- **Level 4:** Tại sao giữ transcript chứ không chỉ các phán quyết? Expected: các phán quyết được suy ra từ nó, bất kỳ ai có thể suy ra lại, và header ghi dòng lệnh cùng phiên bản debugger.

## Wrong answers

- "Hit count bằng không nghĩa là các hàm là mã chết." Nó nghĩa là không lần lấy lệnh nào tới chúng trong lần chạy này của bản dựng này; chúng được export và các caller khác có thể tồn tại.
- "`nm` liệt kê chúng, vì vậy chúng được gọi." Bảng symbol liệt kê các hàm được export; thông tin debug hiển thị bốn subprogram và không mục inline.
- "Dùng auto-continue để transcript giữ sạch." Một breakpoint auto-continue không báo cáo lần dừng và hook không bao giờ chạy; transcript sạch là bằng chứng rỗng.

## Taught in

[Bài học phân tích động](../../../phases/13-tools-and-protocols/42-dynamic-analysis-of-your-own-program/) chạy cả hai bản dựng và chấm mọi nhận định, và [bài học bằng chứng](../../../phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns/) lưu các phán quyết thành các bản ghi observed và phần còn lại thành các điều chưa biết.
