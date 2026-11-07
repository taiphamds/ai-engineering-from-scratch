---
id: pre-norm-vs-post-norm
title: Why the norm moved in front of the sublayer
card: transformers
kind: tradeoff
level: 2
roles: [inference-engineer, applied-ai-engineer, ai-data-engineer]
rounds: [ml-depth, coding]
tags: [pre-norm, post-norm, layer-norm, rmsnorm, warmup]
minutes: 8
lessons: [phases/07-transformers-deep-dive/05-full-transformer, phases/19-capstone-projects/34-transformer-block]
manuals: []
practice: [layer-norm-rms-norm]
cheatsheet: [transformers-attention]
related: []
updated: 2026-11-03
---

Bài báo năm 2017 đặt layer normalization sau phép cộng residual. Hầu như mọi mô hình từ khoảng 2019 đặt nó trước lớp con. Điều gì đã thay đổi, bạn sẽ minh họa khác biệt trong một buổi chiều như thế nào, và RMSNorm thay đổi thêm điều gì trên đó?

## Short answer

Post-norm đưa gradient của đường skip qua một phép chuẩn hóa ở mỗi lớp, nên ở độ sâu lớn, gradient co lại và lượt chạy cần lịch warmup để tồn tại. Pre-norm giữ đường skip không chuẩn hóa, nên gradient đến embedding thông suốt và chồng sâu huấn luyện mà không cần thủ thuật warmup. Minh họa bằng cách xếp chồng mười hai lớp của mỗi biến thể với cùng khởi tạo rồi in gradient norm tại embedding sau một lượt truyền ngược. RMSNorm sau đó bỏ phép trừ trung bình, ít hơn một phép toán, với cùng độ ổn định trong thực tế.

## Full answer

### The two placements

```text
pre-norm:   x + sublayer(LN(x))
post-norm:  LN(x + sublayer(x))
```

Cùng hình dạng, hành vi huấn luyện khác nhau. Trong khối post-norm, phép cộng residual được theo sau bởi norm, nên tín hiệu đi xuống chồng được chuẩn hóa ở mỗi lớp và gradient đi ngược phải qua mọi norm. Ở độ sâu mười hai và learning rate `3e-4`, gradient đó co đủ nhanh để cần warmup. Trong khối pre-norm, norm nằm trong nhánh, trước attention và trước MLP, còn đường skip mang tín hiệu thô.

### The afternoon experiment

1. Xây dựng chồng sáu lớp hoặc mười hai lớp với cờ `pre_ln`.
2. Đưa cùng đầu vào ngẫu nhiên cho cả hai biến thể với trọng số giống hệt.
3. Chạy một lượt truyền ngược và in gradient norm tại embedding.

Chồng pre-norm cho gradient embedding lớn hơn khoảng một bậc độ lớn so với chồng post-norm ở cùng learning rate.

### What pre-norm needs that post-norm did not

Norm cuối cùng trước head đầu ra. Luồng residual không được chuẩn hóa trong mô hình pre-norm, nên head cần một phép chuẩn hóa ở cuối.

### RMSNorm

LayerNorm trừ trung bình và chia cho độ lệch chuẩn. RMSNorm chia cho căn trung bình bình phương và bỏ phép trừ trung bình. Nó rẻ hơn một phép toán và thực nghiệm cho thấy ít nhất cũng ổn định như vậy, đó là lý do khối hiện đại dùng nó.

### Where dropout goes

Sau softmax attention, trên đầu ra attention trước phép cộng residual, và sau lớp tuyến tính thứ hai của MLP. Không bao giờ trên chính đường skip, vì điều đó phá vỡ tính đồng nhất cộng cho phép gradient chảy ở độ sâu lớn.

## Follow-ups

- **Level 2:** Chính xác thì norm nằm ở đâu trong khối pre-norm? Expected: bên trong mỗi nhánh residual, trước attention và trước MLP, cộng một norm cuối cùng trước head.
- **Level 3:** Tại sao mô hình pre-norm cần norm cuối cùng trong khi mô hình post-norm không cần? Expected: đường skip pre-norm không được chuẩn hóa, nên head sẽ thấy luồng không bị chặn nếu không có nó.
- **Level 3:** Mô hình post-norm sáu lớp của bạn huấn luyện ổn còn phiên bản hai mươi bốn lớp phân kỳ. Tại sao? Expected: gradient đường skip suy giảm ở mỗi norm, và tác động tích lũy theo độ sâu; thêm warmup hoặc chuyển sang pre-norm.
- **Level 4:** Điều gì sẽ thuyết phục bạn giữ LayerNorm thay vì RMSNorm? Expected: khác biệt chất lượng hoặc độ ổn định được đo trên lượt chạy của bạn; bằng chứng của bài học là RMSNorm đạt ngang nó trong khi rẻ hơn.

## Wrong answers

- "Hai vị trí đặt tính cùng một hàm theo thứ tự khác nhau." Phép hợp thành khác nhau: một chuẩn hóa luồng, cái kia chỉ chuẩn hóa đầu vào nhánh.
- "Warmup là chi tiết learning-rate không liên quan đến norm." Bài học gắn nhu cầu warmup trực tiếp với đường gradient post-norm.
- "RMSNorm cần trung bình để ổn định." Nó chủ ý bỏ trung bình và đạt ngang LayerNorm trong thực tế.

## Taught in

[Bài học về transformer đầy đủ](../../../phases/07-transformers-deep-dive/05-full-transformer/) giải thích việc chuyển sang pre-norm và RMSNorm, còn [capstone khối](../../../phases/19-capstone-projects/34-transformer-block/) xây dựng cả hai biến thể và đo gradient.
