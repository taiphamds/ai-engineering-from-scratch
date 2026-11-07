---
id: five-agents-and-a-vote
title: Five agents and a vote made the answers worse
card: multi-agent
kind: tradeoff
level: 2
roles: [agentic-ai-engineer, applied-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [design-review, ml-breadth]
tags: [self-consistency, heterogeneity, debate, topology, coordination-tax]
minutes: 10
lessons: [phases/16-multi-agent-and-swarms/15-voting-debate-topology]
manuals: []
practice: []
cheatsheet: [multi-agent, agent-reasoning-patterns]
related: [multi-agent/three-copies-of-one-model-voted]
updated: 2026-11-03
---

Một nhóm thêm một ensemble vào một tác vụ hỏi đáp: năm agent trên cùng mô hình tranh luận đến khi đồng ý, rồi trả lời. Độ chính xác giảm dưới agent đơn. Họ muốn thêm agent. Điều gì đã sai, và bạn sẽ thay đổi gì trước?

## Short answer

Tranh luận có giúp hay không phụ thuộc vào cấu trúc, không phải số lượng: ai nói với ai, bao nhiêu vòng, liệu các agent có khác nhau, và liệu có ai phản biện. Năm bản sao của một mô hình chia sẻ các lỗi, nên phiếu bầu có tương quan, và tranh luận đến đồng thuận thưởng cho agent tự tin nhất qua sự tuân theo. Thay thành phần trước số lượng: bắt đầu từ self-consistency với một mô hình mạnh, rồi đổi một agent thành một mô hình nền khác, giới hạn các vòng ở hai hoặc ba, và thêm một giám khảo không bỏ phiếu.

## Full answer

### The baseline they skipped

Self-consistency lấy mẫu một mô hình nhiều lần ở temperature trên không và lấy đa số trên các đường suy luận. Trên một tập toán tiểu học, nó cho các mức tăng lớn với 40 mẫu so với một lần decode tham lam. Giới hạn của nó là các lỗi của một mô hình có tương quan theo cấu tạo. Một bias có hệ thống có trong mọi mẫu. Đó cũng là ensemble của nhóm với phối hợp bổ sung.

### Heterogeneity is the knob

Thay một trong các agent bằng một mô hình nền khác cho mức tăng lớn hơn thêm một bản sao nữa. Mỗi nguồn lỗi độc lập đáng giá hơn một mẫu tương quan khác. Trong giới hạn, ba mô hình khác nhau thắng năm bản sao của một mô hình trên các tác vụ có ground truth rõ. Tên trong tài liệu nghiên cứu cho thiết kế dựa vào điều này là tranh luận đối kháng không đồng nhất: các mô hình khác nhau, và một trong chúng phản biện.

### Rounds and conformity

Tranh luận cũng có thể làm giảm độ chính xác. Các agent điều chỉnh lập trường để khớp một người phê bình ngay cả khi người phê bình sai, và tranh luận đến đồng thuận thưởng cho ai thúc ép mạnh nhất. Giới hạn các vòng, hai đến ba là điển hình, và giao quyết định cuối cho một giám khảo riêng chấm đồng thuận và không bỏ phiếu. Một khảo sát các chiến lược tranh luận tìm thấy rằng các biến thể có cấu trúc như self-consistency thường kém hơn nó ở cùng ngân sách, và tranh luận giúp nhiều nhất khi các agent không đồng nhất và cấu trúc đối kháng.

### Topology and the tax

| Cấu trúc liên kết | Tốt nhất cho |
|---|---|
| Đồ thị, bất kỳ đến bất kỳ | Nghiên cứu, nơi các agent phê bình nhau |
| Hình sao, một trung tâm | Hợp nhất sự thật nhanh |
| Chuỗi | Tinh chỉnh từng bước |

Trên một đồ thị, chi phí phối hợp xuất hiện qua khoảng 4 agent: thời gian thực và token tăng nhanh hơn chất lượng, vì mọi cửa sổ đầy đầu ra của mọi bên ngang hàng. Trần mang tính thực nghiệm và gắn với dung lượng ngữ cảnh hiện tại, không phải cơ bản.

### A sequence that measures each step

1. Self-consistency ở năm mẫu trên một mô hình mạnh. Đây là baseline ít tốn kém.
2. Bỏ phiếu không đồng nhất ở ba agent nếu độ chính xác quan trọng. Đo chênh lệch.
3. Chỉ tranh luận khi tác vụ có cấu trúc và các vòng bị giới hạn là khả thi.
4. Ghi log cụm thiểu số mỗi lần. Một thiểu số liên tục đúng là một tín hiệu đa dạng.
5. Báo cáo token và thời gian thực cạnh độ chính xác, vì độ chính xác tốt hơn ở chi phí gấp mười lần là một quyết định kinh doanh.

## Follow-ups

- **Level 2:** Tại sao thêm một bản sao thứ sáu của cùng mô hình không giúp? Expected: nó thêm một mẫu tương quan nữa, nên bias dùng chung có thêm một phiếu.
- **Level 2:** Giám khảo làm gì mà các bên bỏ phiếu không thể? Expected: nó chấm đồng thuận cuối mà chưa có một lập trường, nên áp lực tuân theo không làm nó thay đổi.
- **Level 3:** Khi nào self-consistency thông thường là đáp án cuối đúng? Expected: một tác vụ đơn giản có ground truth rõ, nơi năm mẫu của một mô hình mạnh chính xác như bất kỳ ensemble nào và rẻ hơn nhiều.
- **Level 3:** Tác vụ mang dạng ý kiến. Điều gì xảy ra với phiếu bầu? Expected: các agent hội tụ vào câu trả lời trông tự tin nhất thay vì đúng nhất, nên một cuộc bỏ phiếu là một thăm dò ý kiến và nên được gắn nhãn như vậy.

## Wrong answers

- "Thêm agent đến khi phiếu bầu ổn định." Một phiếu bầu sai ổn định vẫn sai, và qua khoảng bốn agent trên một đồ thị, chi phí tăng nhanh hơn chất lượng.
- "Để chúng tranh luận đến khi đồng ý, vì đồng thuận có nghĩa tự tin." Tranh luận không giới hạn thưởng cho sự tuân theo, và câu trả lời được đồng ý là câu ồn ào nhất, không phải câu đúng.
- "Dùng cùng mô hình ở các temperature khác nhau để có đa dạng." Đó là self-consistency, và bias có hệ thống của mô hình sống sót qua mọi temperature.

## Taught in

[Bài học cấu trúc liên kết bỏ phiếu và tranh luận](../../../phases/16-multi-agent-and-swarms/15-voting-debate-topology/) xây dựng bốn cấu trúc liên kết và đo chi phí phối hợp.
