---
id: emergence-or-scorer-artifact
title: A benchmark jumps between two model sizes
card: transformers
kind: concept
level: 4
roles: [ai-evaluation-reliability-engineer, applied-ai-engineer, inference-engineer]
rounds: [ml-depth, design-review]
tags: [scaling-laws, emergence, metrics, cross-entropy, evaluation]
minutes: 12
lessons: [phases/07-transformers-deep-dive/13-scaling-laws, phases/07-transformers-deep-dive/07-gpt-causal-language-modeling]
manuals: []
practice: []
cheatsheet: [scaling-laws-pretraining]
related: [transformers/compute-split-params-tokens]
updated: 2026-11-03
---

Giữa hai kích thước mô hình, độ chính xác của một benchmark đi từ gần không lên cao. Nhóm gọi đó là khả năng nổi lên và yêu cầu ngân sách lớn hơn để tìm bước nhảy tiếp theo. Bạn đánh giá tuyên bố đó như thế nào trước khi ký?

## Short answer

Hỏi bộ chấm điểm là gì. Exact match và độ chính xác có ngưỡng là gián đoạn: mô hình trả lời đúng hầu hết chữ số vẫn được điểm không cho đến khi trả lời đúng tất cả, nên cải thiện trơn trong các xác suất bên dưới hiện ra thành một vách dốc. Chấm lại cùng các checkpoint bằng chỉ số liên tục như cross-entropy của các câu trả lời mục tiêu; nếu đường cong đó trơn, bước nhảy thuộc về bộ chấm điểm chứ không phải mô hình. Lập kế hoạch ngân sách theo đường cong liên tục, thứ mà quy luật scaling dự đoán đáng tin cậy.

## Full answer

### The argument

Phân tích năm 2023 về sự nổi lên cho thấy các khả năng thường được viện dẫn, trong đó có số học và suy luận nhiều bước, được đo bằng cách chấm điểm gián đoạn. Dưới một chỉ số liên tục, cùng các mô hình đó cải thiện trơn theo quy mô. Đến năm 2026, đồng thuận đang được dùng là: các dự đoán từ loss liên tục đáng tin cậy, và các bước nhảy benchmark thường là hiện tượng do bộ chấm điểm tạo ra.

### What to do with the checkpoints you have

1. Giữ cố định prompt và mục tiêu.
2. Với mỗi checkpoint, ghi log xác suất theo từng token của câu trả lời đúng và cross-entropy trên các token câu trả lời.
3. Vẽ cả hai theo số tham số và theo lượng tính toán huấn luyện.
4. Thêm bộ chấm điểm cho điểm một phần, như tỷ lệ chữ số đúng, để xem vách dốc biến mất ở đâu.

Nếu đường cong xác suất trơn, mô hình đã tiến gần hơn suốt quá trình và benchmark che giấu điều đó.

### What it means for the budget

Khớp loss trên các checkpoint và đọc xem kích thước tiếp theo nằm ở đâu trên đường cong liên tục. Sau đó hiệu chuẩn benchmark gián đoạn theo đường cong đó: ở loss nào thì độ chính xác vượt ngưỡng sản phẩm? Lấy mẫu thêm kích thước gần điểm đó thay vì đặt cược vào bất ngờ. Ngưỡng sản phẩm có thể có thật với người dùng và vẫn có thể dự đoán với người lập kế hoạch.

### Where real changes of regime do show up

In-context learning, làm theo một vài ví dụ mà không fine-tuning, thường được mô tả là xuất hiện quanh khoảng 6B đến 13B. Lập trường của bài học vẫn là đo nó bằng chỉ số liên tục trước khi gọi nó là gián đoạn, vì cùng vấn đề bộ chấm điểm vẫn áp dụng.

## Follow-ups

- **Level 3:** Đưa ra ví dụ về bộ chấm điểm gián đoạn và đối ứng liên tục của nó. Expected: exact match trên câu trả lời nhiều chữ số so với log-probability hoặc độ chính xác ở cấp chữ số của cùng câu trả lời.
- **Level 4:** Điều này thay đổi cách bạn lập kế hoạch ngân sách huấn luyện như thế nào? Expected: dự đoán loss từ quy luật, hiệu chuẩn benchmark theo loss, và đặt các lượt chạy gần ngưỡng thay vì hy vọng có bước nhảy.
- **Level 4:** Ngưỡng sản phẩm thực sự là nhị phân với người dùng. Lập luận về hiện tượng do bộ chấm điểm tạo ra còn quan trọng không? Expected: có; ngưỡng là có thật với sản phẩm, nhưng vị trí của nó có thể dự đoán từ đường cong trơn, là thứ bạn cần để lập ngân sách.
- **Level 4:** Điều gì sẽ thuyết phục bạn rằng một bước nhảy không phải hiện tượng do bộ chấm điểm tạo ra? Expected: chỉ số liên tục cũng cho thấy một chỗ gãy ở cùng quy mô, được lặp lại qua các seed và thứ tự dữ liệu.

## Wrong answers

- "Độ chính xác là sự thật nền và loss là đại diện." Độ chính xác có ngưỡng cứng vứt bỏ thông tin cho thấy xu hướng; loss là thứ mô hình tối ưu và quy luật dự đoán.
- "Sự nổi lên có nghĩa quy luật scaling bị phá vỡ." Quy luật mô tả loss liên tục, giữ nguyên hình dạng trong khi điểm số có ngưỡng nhảy vọt.
- "Huấn luyện mô hình lớn hơn rồi xem." Đó là thử nghiệm tốn kém mà phân tích giúp bạn tránh; trước tiên hãy chấm lại những gì bạn đã có.

## Taught in

[Bài học về các quy luật scaling](../../../phases/07-transformers-deep-dive/13-scaling-laws/) đề cập sự nổi lên so với loss trơn, và [bài học về mô hình hóa ngôn ngữ nhân quả](../../../phases/07-transformers-deep-dive/07-gpt-causal-language-modeling/) đặt in-context learning trên trục quy mô.
