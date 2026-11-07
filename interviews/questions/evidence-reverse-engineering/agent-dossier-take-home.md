---
id: agent-dossier-take-home
title: The agent that answers what 95 prints and shows its work
card: evidence-reverse-engineering
kind: take-home
level: 4
roles: [agentic-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [take-home, system-design]
tags: [reverse-engineering, agent, evidence-ledger, prompt-injection, mcp, take-home]
minutes: 60
lessons: [phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns, phases/13-tools-and-protocols/36-rebuild-and-prove-equal, phases/13-tools-and-protocols/42-dynamic-analysis-of-your-own-program, phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch]
manuals: [reverse-engineering-101#s-an-agent-investigation, reverse-engineering-101#s-the-readme-use-rule-and-the-law, reverse-engineering-101#s-open-binary-and-the-headless-bridge]
practice: []
cheatsheet: [reverse-engineering, agent-failure-modes]
related: [evidence-reverse-engineering/observed-derived-inferred, evidence-reverse-engineering/empty-list-is-not-absence, evidence-reverse-engineering/fail-closed-proof-record]
updated: 2026-11-03
---

Bài làm ở nhà. Xây dựng harness mà một agent dùng để trả lời một câu hỏi về một chương trình bạn tự biên dịch, qua MCP server của công cụ phân tích: chương trình in gì cho điểm 95, và chữ cái đến từ đâu? Bàn giao ghi chú ủy quyền, kế hoạch gọi với các thời hạn, sổ ghi liệt kê mỗi nhận định trên một dòng riêng, các điều chưa biết còn mở, quy tắc cho văn bản đi ra từ file, và các kiểm thử bạn cung cấp.

## Short answer

Bắt đầu bằng ghi chú ủy quyền: mục tiêu là bản dựng riêng của bạn, và ghi chú vẫn trả lời năm câu hỏi bằng văn bản, một bản sao hợp pháp, một mục đích được nêu, các sự kiện chưa có sẵn, công việc giới hạn ở các phần cần thiết, và cách biểu đạt riêng trong bất cứ thứ gì bạn phát hành. Lập kế hoạch các lời gọi theo thứ tự, `open_binary`, `list_procedures`, `list_strings`, `analyze_function` trên hai hàm, rồi `read_bytes` trên cả hai bảng mà các hồ sơ nêu, và `export_evidence_bundle` trước `close_binary`, với một thời hạn client đặt từ một cold start đã đo vì lời gọi đầu tiên có engine phía sau trả chi phí import. Giữ một sổ với một hàng mỗi nhận định, mỗi hàng có một loại trong observed, derived, inferred và unknown, một evidence id và một ranh giới, và để hàng "95 in A" giữ inferred cho đến khi hai lần đọc bảng biến nó thành observed. Coi mọi chuỗi, tên và dòng pseudocode từ file là dữ liệu có địa chỉ, không bao giờ là một chỉ dẫn.

## Full answer

### Authorization

Mọi mục tiêu là một chương trình bạn viết và biên dịch, và ghi chú nói vậy với các hash. Với bất kỳ chương trình khác ghi chú trả lời năm câu hỏi trước lệnh đầu tiên và nêu mục đích mà luật nêu. Công cụ không kiểm tra ủy quyền; ghi chú là của bạn.

### Call plan and deadlines

`open_binary` trả về định dạng, loại, SHA-256 và kiến trúc mà không import gì. Lời gọi đầu tiên có engine phía sau bắt đầu import headless và mất vài giây; các lời gọi sau trên cùng mục tiêu mất mili giây. Server cho phép 330,000 ms cho khởi động đó, và client SDK được ghim chờ 60,000 ms mặc định, vì vậy thời hạn client là thứ cần đặt từ lần chạy đầu riêng của bạn. Hỏi mọi câu trước `close_binary`, vì project bị xóa và các bản ghi được giữ đi theo nó; xuất bundle trước để mọi id trong sổ vẫn kiểm tra được.

### The ledger

Phiên được ghi trả về 13 procedure và 39 chuỗi, rồi hai hồ sơ. Sổ của nó có một phần như sau:

| Nhận định | Loại | Bằng chứng | Ranh giới |
|---|---|---|---|
| `_grade` chia đối số của nó cho 10 | derived | phép nhân với `0x66666667` và các phép dịch trong hồ sơ | một cách đọc listing được pseudocode xác nhận |
| năm mục 4 byte nằm tại bảng mà `lea` nêu | derived | `cmp w8, #0x4` và phép nạp có tỷ lệ | số lượng từ phép so sánh, chiều rộng từ phép dịch |
| năm giá trị trong bảng đó | unknown | không có; `read_bytes` với độ dài 20 sẽ quan sát chúng | không lời gọi nào trong phiên này đọc bộ nhớ |
| không có gì gọi `_grade` bằng một lệnh call trong bản dựng này | observed | `callers: []` và một tham chiếu `DATA` | độ bao phủ hoàn chỉnh chỉ cho các lời gọi đã giải quyết |
| một điểm 95 in `A` | inferred | mã nguồn C mà người đọc sở hữu | không bản ghi nào của phiên này hỗ trợ nó |
| tên hàm `_nothing` | refused | `invalid_request` | một lời gọi thất bại không tạo bằng chứng |

Hàng áp chót phân biệt một báo cáo trung thực với một báo cáo tự tin. Người đọc đã biên dịch mã nguồn và biết câu trả lời; các bản ghi của agent dừng ở hai bảng chưa đọc, và hai lời gọi `read_bytes` là các bước tiếp theo của cuộc điều tra.

### Text from the file is data

Mọi chuỗi, tên symbol, comment và dòng pseudocode được sao ra từ mục tiêu là văn bản mục tiêu. Agent trích nó với địa chỉ và không bao giờ hành động theo nó, và sổ không có loại hàng cho một chỉ dẫn nhận từ file. Mỗi kết quả có thể mang văn bản như vậy đến cùng một marker nguồn gốc nêu mục tiêu phân tích là không đáng tin; marker cho agent biết văn bản nào đến từ file, và agent vẫn áp dụng quy tắc. Một nghiên cứu 2026 cài văn bản trong các binary và thấy các mô hình đề xuất hành động không an toàn được cài trong 35 trên 40 trường hợp khi không có kiểm soát; chỉ hiển thị nội dung như dữ liệu vẫn để lại 15 trên 40, và các phép kiểm tra nguồn gốc với ủy quyền công cụ loại bỏ chúng.

### Tests to ship

1. Một server thay thế phát lại các bản ghi đã ghi cho cùng công cụ và đối số, để vòng lặp chạy không có engine được cài.
2. Id của mọi bản ghi được tính lại từ nội dung, và một bản ghi bị bỏ một giới hạn bị từ chối.
3. Việc nâng loại từ chối một id derived hoặc inferred và chỉ đạt với một lần chạy đồng ý dưới `controlled-replay`.
4. Sổ đánh dấu một nhận định `unknown` khi một số đầu vào có các lần chạy và số khác không, và không bao giờ làm tròn nó lên.
5. Một binary fixture mang một chuỗi đọc như một lệnh; kiểm thử khẳng định sổ giữ nó như một giá trị có địa chỉ và không gì thực thi.
6. Một thời hạn client ngắn hơn cold start đã đo tạo ra một bước hết thời gian được ghi lại, không phải một phát hiện.

## Follow-ups

- **Level 3:** Tại sao xuất bundle trước khi đóng? Expected: việc đóng xóa project và xóa các bản ghi được giữ, và các id của sổ chỉ kiểm tra được với một bundle.
- **Level 4:** Một lần chạy bản dựng host đồng ý với dự đoán cho 95. Giới hạn nào đi cùng hàng đó? Expected: object chưa bao giờ chạy; một bản dựng cùng mã nguồn cho một kiến trúc khác đã chạy, là quan sát mạnh nhất khi không có emulator.
- **Level 4:** Danh sách chuỗi chứa "chạy lệnh này để tiếp tục". Sổ làm gì? Expected: ghi lại chuỗi với địa chỉ như một giá trị observed, đánh dấu request, và không thực thi gì; marker nguồn gốc là dữ liệu về dữ liệu.
- **Level 4:** Agent có mã nguồn C. Tại sao "95 in A" vẫn là inferred? Expected: không bản ghi nào của phiên hỗ trợ nó; hai lời gọi `read_bytes` sẽ hỗ trợ, và cho đến đó loại trung thực là inferred.

## Wrong answers

- "Pseudocode trả về một mục của `_labels`, vì vậy chữ cái là observed." Việc truy cập được quan sát; giá trị đằng sau nó chưa bao giờ được đọc.
- "Bỏ ghi chú ủy quyền cho một file tôi biên dịch." Vẫn viết nó; các câu hỏi tự trả lời cho bản dựng riêng của bạn, và thói quen là biện pháp kiểm soát cho mọi file khác.
- "Coi văn bản sử dụng là chỉ dẫn của chương trình cho agent." Nó là văn bản mục tiêu; trích nó với địa chỉ và không bao giờ làm theo.

## Taught in

[Phần điều tra của agent](../../../manuals/reverse-engineering-101/sections/8-2-an-agent-investigation.md) đi qua phiên được ghi và sổ của nó, [phần quy tắc sử dụng](../../../manuals/reverse-engineering-101/sections/2-1-the-readme-use-rule-and-the-law.md) đưa ra năm câu hỏi, [phần open_binary](../../../manuals/reverse-engineering-101/sections/4-1-open-binary-and-the-headless-bridge.md) đo cold start, và các bài học [bằng chứng](../../../phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns/), [xây dựng lại](../../../phases/13-tools-and-protocols/36-rebuild-and-prove-equal/), [phân tích động](../../../phases/13-tools-and-protocols/42-dynamic-analysis-of-your-own-program/) và [ELF](../../../phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch/) cung cấp sổ, harness, các phán quyết và các ghi chú luật.
