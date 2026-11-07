---
id: read-a-benchmark-claim
title: Read a multi-agent benchmark claim before you believe it
card: multi-agent
kind: concept
level: 2
roles: [agentic-ai-engineer, ai-evaluation-reliability-engineer, ai-developer-relations-engineer]
rounds: [ml-breadth, screen]
tags: [benchmarks, contamination, baseline, cost-disclosure, topology]
minutes: 8
lessons: [phases/16-multi-agent-and-swarms/24-evaluation-coordination-benchmarks]
manuals: []
practice: []
cheatsheet: [agent-benchmarks, multi-agent]
related: [multi-agent/five-agents-and-a-vote]
updated: 2026-11-03
---

Một bài báo báo cáo rằng hệ thống lập trình đa agent của nó thắng các agent đơn với một khoảng cách lớn trên một benchmark kỹ thuật phần mềm nổi tiếng. Nhóm của bạn muốn áp dụng kiến trúc. Bạn hỏi gì trước khi tin con số?

## Short answer

Hỏi benchmark nào và phần chia nào, liệu benchmark được phát hành sau mốc kết thúc huấn luyện của mô hình, baseline so sánh là gì, bao nhiêu lần thử được chạy, bao nhiêu loại tác vụ được bao phủ, và kết quả tốn bao nhiêu token và thời gian thực. Phần chia quan trọng nhất: các mô hình tiên phong đạt khoảng 23 phần trăm trên phần chia không nhiễm của benchmark đó so với hơn 70 phần trăm trên phần chia cũ, nên một con số không có phần chia không nói gì.

## Full answer

### The checklist

| Câu hỏi | Tại sao nó quan trọng |
|---|---|
| Benchmark nào, phần chia nào | Phần chia mới hơn được xây để chống nhiễm, và điểm khác nhau với hệ số ba giữa các phần chia |
| Nhiễm | Một benchmark phát hành trước mốc kết thúc của mô hình có thể đã rò rỉ vào huấn luyện, nên điểm có thể bị thổi phồng |
| Baseline | So với một baseline agent đơn, ngẫu nhiên, và công trình đa agent trước đó, không phải so với một phiên bản chưa tinh chỉnh của cùng hệ thống |
| Tính có ý nghĩa | Số lần thử và một khoảng tin cậy, vì các mô hình tiên phong có variance cao và các lần chạy đơn gây hiểu lầm |
| Đa dạng tác vụ | Một tác vụ hay nhiều, vì production cần tổng quát hóa |
| Công khai chi phí | Token mỗi tác vụ và thời gian thực, vì một kết quả mạnh ở chi phí gấp 20 lần là một quyết định kinh doanh |

### What the other benchmarks teach

Bài học khảo sát năm họ benchmark, và hai trong số chúng là những cảnh báo. Trên một benchmark phối hợp đa phương thức với thông tin bất đối xứng, các mô hình tiên phong chật vật để thắng một baseline ngẫu nhiên. Trên một benchmark y khoa có bốn nhóm tác vụ, các hệ thống đa agent không vượt trội một mô hình đơn trên phần lớn nhóm; phân rã giúp nơi các tác vụ con có thể tách và gây hại nơi chi phí phối hợp vượt mức tăng chuyên môn hóa. Một benchmark cấu trúc liên kết thấy đồ thị tốt nhất cho nghiên cứu, chuỗi cho lập trình từng bước, hình sao cho công việc sự thật nhanh, và chi phí phối hợp qua khoảng 4 agent; lập kế hoạch nhận thức thêm khoảng 3 phần trăm mức đạt cột mốc.

### What the number in the prompt may mean

Nếu nó trên phần chia không nhiễm, bộ khung nhóm agent đã tạo một chênh lệch đo được ở đó, trong khoảng 30 đến 40 điểm, và đó là một trong những lập luận thực nghiệm mạnh hơn cho phối hợp. Nếu nó trên phần chia cũ, kết quả không còn là bằng chứng về năng lực.

### What no benchmark measures well

Phối hợp dài hạn qua nhiều ngày, khả năng chống chịu một agent độc hại, sự trôi khi triển khai, và hiệu suất chuẩn hóa theo chi phí. Với trục bạn quan tâm, xây một benchmark nội bộ từ phân phối production của bạn, bao gồm một baseline ngẫu nhiên trong mọi so sánh, báo cáo chi phí cạnh độ chính xác, và xây lại nó hằng quý.

## Follow-ups

- **Level 2:** Tại sao so sánh một hệ thống phối hợp với đoán ngẫu nhiên? Expected: nếu hệ thống không thể thắng ngẫu nhiên với một khoảng cách lớn, tác vụ có thể không được đặt tốt, như các kết quả phối hợp đa phương thức cho thấy.
- **Level 2:** Mức đạt cột mốc đo gì mà thành công cuối không đo? Expected: tiến triển một phần, để một hệ thống đi được phần lớn đường được phân biệt với một hệ thống thất bại ngay từ đầu.
- **Level 3:** Bạn tự kiểm tra nhiễm như thế nào? Expected: so sánh ngày phát hành benchmark với mốc kết thúc huấn luyện của mô hình, và giữ lại một phần tác vụ ngoài bất kỳ tập tinh chỉnh nào trong các đánh giá riêng.
- **Level 3:** Điểm của bài báo được báo cáo không có một nguồn sơ cấp từ nhà cung cấp mô hình. Bạn xử lý nó như thế nào? Expected: như sơ bộ, và bạn không đưa ra một quyết định production dựa trên nó đến khi một lần chạy độc lập tái lập nó.

## Wrong answers

- "Một khoảng cách lớn trên một benchmark đã biết là đủ để áp dụng." Không có phần chia, baseline, các lần thử và chi phí, khoảng cách là một tiêu đề, không phải bằng chứng.
- "Đa agent luôn giúp trên các tác vụ lập trình." Các kết quả y khoa và đa phương thức cho thấy các miền nơi nó không giúp, và mức tăng lập trình phụ thuộc vào phần chia và bộ khung.
- "Benchmark nội bộ của chúng ta kém nghiêm ngặt hơn một benchmark công khai." Một benchmark công khai cung cấp thông tin, và chỉ một benchmark nội bộ phản ánh phân phối production và các ràng buộc chi phí của bạn.

## Taught in

[Bài học đánh giá và benchmark phối hợp](../../../phases/16-multi-agent-and-swarms/24-evaluation-coordination-benchmarks/) liệt kê năm họ benchmark và danh sách kiểm tra xem xét kỹ.
