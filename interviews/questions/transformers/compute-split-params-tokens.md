---
id: compute-split-params-tokens
title: Split a fixed compute budget between size and tokens
card: transformers
kind: tradeoff
level: 4
roles: [inference-engineer, ai-data-engineer, applied-ai-engineer]
rounds: [system-design, ml-depth]
tags: [scaling-laws, compute-optimal, over-training, pretraining, inference-cost]
minutes: 15
lessons: [phases/07-transformers-deep-dive/13-scaling-laws]
manuals: []
practice: []
cheatsheet: [scaling-laws-pretraining]
related: [transformers/block-parameter-count]
updated: 2026-11-03
---

Bạn dẫn dắt một lượt pretraining với ngân sách tính toán cố định. Một kế hoạch huấn luyện mô hình 175B tham số trên 300B token. Kế hoạch khác huấn luyện mô hình nhỏ hơn nhiều trên nhiều token hơn hẳn. Bạn chọn kế hoạch nào, bảo vệ nó trước lãnh đạo như thế nào, và khi nào bạn cố ý huấn luyện vượt quá điểm mà quy luật scaling gọi là tối ưu?

## Short answer

Lượng tính toán bằng khoảng 6 lần số tham số nhân số token huấn luyện, nên ngân sách cố định tích số và để ngỏ cách chia. Cách chia tối ưu về tính toán là khoảng 20 token mỗi tham số; kế hoạch đầu có khoảng 1.7 token mỗi tham số, mà bài học gọi là huấn luyện thiếu mười lần, và mô hình 70B được huấn luyện trên 1.4T token đánh bại mô hình 175B đó trên mọi benchmark với chi phí suy luận thấp hơn 2.5 lần. Nếu mô hình sẽ phục vụ khối lượng lớn, hãy chủ ý vượt điểm tối ưu: huấn luyện mô hình nhỏ hơn và lâu hơn, vì huấn luyện được trả tiền một lần còn suy luận được trả tiền mãi mãi.

## Full answer

### The law

```text
L(N, D) = A / N^alpha + B / D^beta + E
alpha about 0.34, beta about 0.28, E about 1.69, A about 406, B about 411
```

N là số tham số không tính embedding, D là số token huấn luyện, E là loss không thể giảm của chính dữ liệu. Tối thiểu hóa L dưới ràng buộc `C = 6 N D` và hai đại lượng tối ưu tăng theo khoảng căn bậc hai của ngân sách:

```text
N_opt about 0.22 * (C / 6)^0.5
D_opt about 4.5  * (C / 6)^0.5
D_opt / N_opt about 20
```

Các số mũ được khớp dịch chuyển chậm, khoảng 0.45 cho N và 0.55 cho D với các hằng số ở trên, nên tỷ lệ thay đổi theo ngân sách; mã của bài học tìm điểm tối ưu bằng grid search.

### What the two plans look like

| Kế hoạch | N | D | Token mỗi tham số |
|---|---|---|---|
| Lớn và ngắn | 175B | 300B | khoảng 1.7 |
| Tối ưu về tính toán | 70B | 1.4T | 20 |
| Tối ưu cho suy luận | 8B | 15T | 1,875 |

Các hàng không dùng chung một ngân sách: hàng thứ hai và thứ ba dùng lượng tính toán khoảng gấp đôi hàng thứ nhất, nên chúng so sánh tỷ lệ, không phải các phương án có cùng chi phí. Hàng cuối là một họ mô hình production đã huấn luyện một mô hình nhỏ vượt tỷ lệ tối ưu về tính toán chín mươi bốn lần. Với dịch vụ trả lời một nghìn tỷ token mỗi tháng, suy luận chi phối tổng chi phí, và mô hình vừa phần cứng tiêu dùng với độ trễ chỉ bằng một phần sẽ thắng dù training loss trên mỗi FLOP huấn luyện kém hơn. Khoảng mà bài học đưa ra cho workload do suy luận chi phối là 100 đến 500 token mỗi tham số tùy khối lượng phục vụ.

### How to defend it

1. Trình bày ngân sách dưới dạng `6 N D` và các đường đồng mức loss theo N và D; kế hoạch đầu nằm xa thung lũng.
2. Trình bày hóa đơn suy luận ở khối lượng dự kiến cho từng N; khoản tiết kiệm của mô hình nhỏ lặp lại hằng tháng.
3. Trình bày khoảng cách loss bạn chấp nhận khi huấn luyện quá mức, đọc từ quy luật tại N và D đã chọn.

### What changes the constants but not the shape

Tuyển chọn dữ liệu có thể dịch chuyển các đường cong hơn 2 lần lượng tính toán hiệu dụng. Mô hình mixture-of-experts tách tổng tham số khỏi FLOP hoạt động, nên quy luật áp dụng trên mỗi tham số hoạt động. Một optimizer tốt hơn đã dịch chuyển hằng số khoảng 2 lần trong một kết quả năm 2024. Không điều nào trong số này thay đổi hình dạng quy luật lũy thừa.

### The fine-tuning corollary

Quy tắc kinh nghiệm của bài học: nếu dữ liệu tác vụ của bạn chứa ít hơn 20 token trên mỗi tham số của mô hình cơ sở, hãy dự kiến bão hòa ở một sàn loss nào đó. Xem nó như cảnh báo cần đo, không phải quy tắc cho kích thước cơ sở.

## Follow-ups

- **Level 3:** Số hạng E là gì và tại sao không ngân sách nào loại bỏ được nó? Expected: loss không thể giảm, entropy của chính dữ liệu; quy luật tiến gần nó nhưng không bao giờ vượt qua.
- **Level 4:** Kiến trúc chuyên gia thưa thay đổi kế hoạch như thế nào? Expected: FLOP đi theo các tham số hoạt động, nên D tối ưu được xác định theo N hoạt động trong khi tổng N quyết định bộ nhớ.
- **Level 4:** Web cạn token chất lượng cao cho ngân sách của bạn. Những đòn bẩy là gì? Expected: bài học đặt tiếng Anh đã lọc ở khoảng 5 đến 10 nghìn tỷ token; các đòn bẩy là dữ liệu tổng hợp, dữ liệu đa ngôn ngữ và đa phương thức, cùng tuyển chọn tốt hơn.
- **Level 4:** Bạn sẽ kiểm tra quy luật trên stack của mình trước khi đặt cược ngân sách như thế nào? Expected: khớp nó trên năm mô hình nhỏ từ 100K đến 10M tham số trên cùng dữ liệu và so sánh các số mũ với các số đã công bố.

## Wrong answers

- "Mô hình lớn hơn luôn thắng với lượng tính toán cố định." Mô hình 70B được huấn luyện trên 1.4T token đánh bại mô hình 175B được huấn luyện trên 300B.
- "Tối ưu về tính toán cũng là mô hình rẻ nhất để phục vụ." Nó tối thiểu hóa training loss trên mỗi FLOP huấn luyện; chi phí phục vụ tăng theo N, đó là lý do mô hình production huấn luyện quá mức.
- "Dự đoán loss vô dụng vì các khả năng xuất hiện đột ngột." Loss liên tục trơn và có thể dự đoán; các bước nhảy benchmark đột ngột phần lớn là hiện tượng do bộ chấm điểm tạo ra.

## Taught in

[Bài học về các quy luật scaling](../../../phases/07-transformers-deep-dive/13-scaling-laws/) đưa ra quy luật, cách chia tối ưu và lý do huấn luyện quá mức.
