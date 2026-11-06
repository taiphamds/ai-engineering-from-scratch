---
id: harness-or-a-smarter-model
title: Build the harness now, or wait for a smarter model
card: agents
kind: tradeoff
level: 3
roles: [agentic-ai-engineer, forward-deployed-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [system-design, design-review]
tags: [harness, model-capability, reliability, receipts, primitives]
minutes: 10
lessons: [phases/14-agent-engineering/31-agent-workbench-why-models-fail]
manuals: []
practice: []
cheatsheet: [agent-harness]
related: [agents/seven-surfaces-one-symptom-each, agents/vendor-patterns-to-primitives]
updated: 2026-11-03
---

Lãnh đạo muốn tạm dừng công việc harness trong hai quý và chờ thế hệ mô hình tiếp theo, theo lý thuyết rằng một mô hình tốt hơn sẽ không cần giàn giáo. Lập luận bằng bằng chứng, và nói phần nào trong lập luận của họ là đúng.

## Short answer

Ngày nay phần kỹ thuật gánh tải nằm quanh mô hình, không bên trong nó, và các con số nói vậy. Cùng mô hình chuyển một coding agent từ ngoài top 30 lên hạng năm trên một benchmark terminal khi chỉ harness thay đổi, và một nhóm xóa 80 phần trăm các công cụ của agent thấy mức thành công đi từ 80 phần trăm lên 100 phần trăm. Phần lớn các dự án agent doanh nghiệp thất bại ở quanh runtime, không phải suy luận. Lãnh đạo đúng rằng các mô hình hấp thụ các thủ thuật harness theo thời gian, đó là lý do bạn dựng harness từ các primitive sống sót qua một lần đổi mô hình.

## Full answer

### The receipts

| Quan sát | Những gì đã thay đổi | Kết quả |
|---|---|---|
| Coding agent trên một benchmark terminal | Chỉ harness, cùng mô hình | Ngoài top 30 lên hạng năm |
| Agent của một nhóm | Xóa 80 phần trăm các công cụ | Tỷ lệ thành công từ 80 phần trăm lên 100 phần trăm |
| Các agent pháp lý | Chỉ tối ưu hóa harness | Độ chính xác tăng hơn gấp đôi |
| Các dự án agent doanh nghiệp | Không có | 88 phần trăm không đạt production, với các thất bại quanh runtime |
| Ba framework mở trên một benchmark | Không có | Khoảng 50 phần trăm hoàn thành nhiệm vụ |
| Một web agent trong ngữ cảnh dài | Ngữ cảnh dài hơn | Từ 40 đến 50 phần trăm xuống dưới 10 phần trăm, chủ yếu các vòng lặp vô hạn và mất mục tiêu |

Hai hàng cuối là lập luận chống lại việc chờ. Các vòng lặp vô hạn và mất mục tiêu không phải thất bại suy luận. Chúng là thiếu một ngân sách lượt, thiếu một file trạng thái và thiếu một phạm vi.

### What the harness is made of

Bảy bề mặt là một lớp hướng đến người dùng. Bên dưới chúng là các primitive mà mọi hệ thống production đáng tin cậy đã có: các hàm, worker, trigger, một runtime, một đường truyền, hàng đợi, lưu giữ phiên và một chính sách ủy quyền. Vòng lặp agent là một worker tiêu thụ các sự kiện, gọi các hàm, viết các bản ghi và phát ra các trigger. Không điều nào trong đó đặc thù cho thế hệ mô hình này, và không điều nào biến mất khi mô hình cải thiện.

### What leadership gets right

Các mô hình thực sự hấp thụ các thủ thuật harness. Một mẫu từng là một thủ thuật prompt hai năm trước hiện là native, và sơ đồ token suy nghĩ của vòng lặp gốc trở thành một kênh suy luận. Khẳng định trung thực không phải harness thắng mãi mãi. Đó là ngày nay tải nằm quanh mô hình, và các primitive bạn dựng để gánh nó là những primitive bạn sẽ cần cho bất kỳ hệ thống production nào, có mô hình hay không.

### The proposal to leadership

Dựng các bề mặt thành các primitive, không thành văn bản prompt. Giữ trạng thái, phạm vi, phản hồi, gate và bàn giao dưới dạng các file và phép kiểm tra không biết mô hình nào nằm trong vòng lặp. Khi mô hình tiếp theo đến, đổi nó và giữ các bề mặt. Công việc harness không phải một cược chống lại mô hình. Nó là phần hệ thống bạn giữ.

## Follow-ups

- **Level 3:** Bằng chứng nào trong số này là yếu nhất, và tại sao? Expected: tỷ lệ thất bại doanh nghiệp, vì nó là một con số khảo sát không có một phép so sánh được kiểm soát, trong khi thay đổi thứ hạng benchmark giữ mô hình cố định.
- **Level 3:** Một mô hình mới hơn không còn cần bộ phát hiện lặp. Bạn loại bỏ gì? Expected: chưa gì cả, vì bộ phát hiện là một trigger cộng một hàm tốn ít, và bạn chỉ loại bỏ nó khi dữ liệu trace cho thấy nó không bao giờ kích hoạt.
- **Level 4:** Bạn làm cho khoản đầu tư harness nhìn thấy được đối với lãnh đạo mỗi quý thế nào? Expected: chạy cùng tập nhiệm vụ có và không có các bề mặt trên mô hình hiện tại, báo cáo việc hoàn thành, các vi phạm phạm vi và can thiệp, và cho thấy khoảng cách.
- **Level 4:** Một phần harness có khả năng được các mô hình hấp thụ tiếp theo nhất là gì? Expected: một lựa chọn có lý lẽ, như tự sửa trên các lỗi công cụ, với lập luận rằng mô hình thấy quan sát và bề mặt chỉ định dạng nó.

## Wrong answers

- "Mô hình là sản phẩm, nên harness là chi phí phụ." Harness quyết định thứ hạng trên benchmark trong khi mô hình giữ nguyên.
- "Một cửa sổ ngữ cảnh dài hơn sẽ sửa việc mất mục tiêu." Kết quả ngữ cảnh dài trong bài học đi theo hướng ngược lại, với việc hoàn thành giảm xuống dưới 10 phần trăm khi ngữ cảnh tăng.
- "Công việc harness là prompt engineering dưới một tên khác." Prompting nói với mô hình bạn muốn gì ở lượt này, và harness mang công việc qua các lượt và phiên trong các file và phép kiểm tra.

## Taught in

[Bài học tại sao các mô hình có năng lực vẫn thất bại](../../../phases/14-agent-engineering/31-agent-workbench-why-models-fail/) thu thập các bằng chứng và quy harness về các primitive.
