---
id: residual-stream-and-dropout
title: What the skip path does and where dropout may go
card: transformers
kind: concept
level: 2
roles: [applied-ai-engineer, inference-engineer, ai-data-engineer]
rounds: [ml-depth, screen]
tags: [residual-stream, dropout, feed-forward, swiglu, block]
minutes: 8
lessons: [phases/07-transformers-deep-dive/05-full-transformer, phases/19-capstone-projects/34-transformer-block]
manuals: []
practice: []
cheatsheet: [transformers-attention]
related: [transformers/pre-norm-vs-post-norm]
updated: 2026-11-03
---

Khối transformer có hai đường skip, một quanh attention và một quanh mạng feed-forward. Chúng làm gì cho huấn luyện, lớp con nào trong hai lớp di chuyển thông tin giữa các token, và tại sao lớp dropout đặt trên chính đường skip lại phá vỡ điều gì đó?

## Short answer

Đường skip làm gradient có tính cộng qua độ sâu, nên norm của nó giữ cùng thang đo qua chồng mười hai lớp thay vì co lại ở mỗi lớp, và nó cho phép mỗi khối học một cập nhật nhỏ cho biểu diễn đang tích lũy thay vì thay thế hoàn toàn. Chỉ attention trộn token; MLP áp dụng cùng hai lớp cho từng vị trí riêng. Dropout thuộc về sau softmax attention, trên đầu ra attention trước phép cộng residual, và sau lớp tuyến tính thứ hai của MLP; trên đường skip nó phá vỡ ánh xạ đồng nhất mang gradient, và các chồng ban đầu làm như vậy huấn luyện thiếu ổn định.

## Full answer

### The block as a function

Khối decoder nhận tensor có hình dạng `(batch, sequence, embedding)` và trả về cùng hình dạng. Bên trong, hai lớp con thực hiện công việc:

```text
x = x + attention(norm(x))
x = x + mlp(norm(x))
```

Mỗi dòng là cập nhật cộng vào luồng chảy từ trên xuống dưới qua mọi khối. Bài học gọi tensor đó là luồng residual.

### Why the additive path matters

Không có đường skip, gradient biến mất sau khoảng sáu lớp. Có nó, gradient của loss theo một lớp đầu có số hạng trực tiếp không đi qua các lớp con, nên độ sâu thêm số hạng thay vì nhân các hệ số suy giảm. Tác động thứ hai là về biểu diễn: khối không phải tái tạo đầu vào của nó; nó thêm những gì nó đã học.

### Who talks to whom

Attention là nơi duy nhất các token trao đổi thông tin. MLP hoạt động theo từng vị trí: cùng trọng số áp dụng độc lập cho mọi token, với chiều rộng ẩn gấp bốn chiều rộng embedding và GELU trong khối cổ điển. Khối hiện đại dùng SwiGLU, ba ma trận ở chiều rộng khoảng 2.6 lần để số tham số khớp MLP cũ gấp bốn, và bỏ các số hạng bias.

### Dropout on the branches, never on the identity

Attention dropout sau softmax, residual dropout trên đầu ra attention, và residual dropout sau lớp tuyến tính thứ hai của MLP. Dropout áp dụng lên số hạng đồng nhất ngẫu nhiên loại bỏ một phần của nó, và đường gradient đã làm độ sâu khả thi không còn đáng tin cậy.

## Follow-ups

- **Level 2:** Bạn sẽ bỏ lớp con nào nếu mô hình chỉ cần các phép biến đổi theo từng token? Expected: attention; MLP không bao giờ nhìn qua các vị trí.
- **Level 3:** Tại sao FFN hiện đại dùng hệ số mở rộng khoảng 2.6 thay vì 4? Expected: SwiGLU có ba ma trận trọng số, nên chiều rộng 2.6 lần khớp số tham số của MLP hai ma trận ở mức 4 lần.
- **Level 3:** Tại sao các chồng hiện đại bỏ các số hạng bias trong các lớp tuyến tính? Expected: bài học báo cáo cải thiện perplexity nhẹ và mô hình nhỏ hơn.
- **Level 4:** Người đánh giá muốn regularize mô hình nhỏ bằng dropout trên số hạng đồng nhất. Câu trả lời của bạn? Expected: không; giữ dropout trên đầu ra nhánh, vì tính đồng nhất cộng là thứ cho phép gradient đến các lớp đầu.

## Wrong answers

- "Đường skip tồn tại để giữ hình dạng đầu ra bằng hình dạng đầu vào." Hình dạng dù sao cũng khớp; đường skip liên quan đến luồng gradient và các cập nhật cộng.
- "Dropout ở bất kỳ đâu trong khối đều tương đương." Dropout trên số hạng đồng nhất làm hỏng đường gradient; dropout trên đầu ra nhánh thì không.
- "Mạng feed-forward trộn thông tin giữa các token." Nó áp dụng cùng MLP cho từng vị trí riêng; việc trộn chỉ xảy ra trong attention.

## Taught in

[Bài học về transformer đầy đủ](../../../phases/07-transformers-deep-dive/05-full-transformer/) nêu tên sáu thành phần của khối, còn [capstone khối](../../../phases/19-capstone-projects/34-transformer-block/) giải thích luồng residual và vị trí đặt dropout.
