---
id: attention-shape-bug
title: Attention runs, and the context has the wrong shape
card: transformers
kind: debug
level: 2
roles: [applied-ai-engineer, inference-engineer, ai-data-engineer]
rounds: [debugging, coding]
tags: [attention, shapes, broadcasting, encoder-decoder, testing]
minutes: 8
lessons: [phases/05-nlp-foundations-to-advanced/10-attention-mechanism, phases/07-transformers-deep-dive/02-self-attention-from-scratch]
manuals: []
practice: [scaled-dot-product-attention]
cheatsheet: [transformers-attention]
related: [transformers/query-key-value-lookup]
updated: 2026-11-03
---

Một mô-đun attention giữa một encoder và một decoder chạy không có ngoại lệ, nhưng độ chính xác của mô hình từ từ tụt sau triển khai tham chiếu. Khi bạn in tensor ngữ cảnh, chiều thứ hai là độ dài encoder thay vì độ dài decoder. Trình bày cho tôi chẩn đoán.

## Short answer

Một mô-đun chạy mà vẫn tạo sai shape là một bug broadcast, và một broadcast im lặng là bug attention tệ nhất vì nó làm giảm độ chính xác thay vì gây sự cố. Viết các shape mong đợi trước: scores và weights là batch nhân độ dài decoder nhân độ dài encoder, và ngữ cảnh là batch nhân độ dài decoder nhân chiều rộng trạng thái encoder. Rồi tìm matmul có các toán hạng bị đổi hoặc không được chuyển vị, sửa bằng một phép chuyển vị hoặc reshape, và thêm các assert trên các shape và trên các trọng số cộng thành một.

## Full answer

### The shape table

| Tensor | Hình dạng |
|---|---|
| Các trạng thái encoder H | (T_enc, d_h); d_h là hai lần kích thước ẩn cho một encoder hai chiều |
| Trạng thái decoder s | (d_s,) |
| Điểm cho một vị trí encoder | vô hướng |
| Các trọng số sau softmax | (T_enc,) cho một bước decoder |
| Vector ngữ cảnh | (d_h,), cùng shape như một trạng thái encoder |

Được batch qua các bước decoder, các trọng số là `(batch, T_dec, T_enc)` và ngữ cảnh là `(batch, T_dec, d_h)`.

### How the wrong shape appears

Ngữ cảnh là `weights @ H`. Nếu mã xây các điểm như `H @ H.T` vì tensor query bị thay bằng các trạng thái encoder, các shape vẫn nhân được và kết quả có độ dài encoder ở nơi độ dài decoder thuộc về. Không gì phát sinh lỗi. Các lớp phía sau broadcast hoặc reshape tensor và loss tiếp tục giảm, chỉ chậm hơn.

### The diagnosis steps

1. In shape của mọi tensor trung gian và so với bảng.
2. Kiểm tra công thức điểm. Với dạng cộng, vector chiếu thu một vector chiều attention thành một vô hướng; với dạng tích vô hướng, query và key phải có cùng chiều rộng, và một encoder hai chiều gấp đôi chiều rộng key, nên dạng tích vô hướng thất bại trừ khi một ma trận W nằm giữa chúng.
3. Kiểm tra trạng thái decoder nào cấp query. Một công thức cổ điển dùng trạng thái trước bước hiện tại và công thức kia dùng trạng thái sau nó. Trộn chúng cho các gradient sai tinh vi rất khó thấy.
4. Sửa bằng một phép chuyển vị, reshape hoặc phép chiếu. Từ chối mọi cách sửa chỉ làm im lặng sự không khớp bằng broadcast.

### The regression test

```text
assert output.shape == (batch, T_dec, d_h)
assert weights.shape == (batch, T_dec, T_enc)
assert weights.sum(dim=-1) is close to 1
```

Dòng thứ ba bắt một softmax được lấy trên sai trục, đó là bug im lặng kia trong lớp này.

## Follow-ups

- **Level 2:** Kiểm thử đơn lẻ nào bắt phần lớn các bug attention? Expected: các trọng số có shape batch nhân độ dài decoder nhân độ dài encoder và cộng thành một dọc trục cuối.
- **Level 2:** Ma trận điểm ra vuông ở chiều encoder. Điều gì đã xảy ra? Expected: các key được chấm so với chính chúng; tensor query bị thay bằng các trạng thái encoder.
- **Level 3:** Tại sao điểm tích vô hướng thuần thất bại với một encoder hai chiều? Expected: trạng thái encoder có chiều rộng ẩn gấp đôi, nên không còn khớp trạng thái decoder; dùng dạng tổng quát với một ma trận giữa chúng.
- **Level 3:** Tại sao quy ước trạng thái là một vấn đề gradient chứ không phải vấn đề shape? Expected: cả hai trạng thái có cùng shape, nên không gì thất bại; gradient chảy tới sai bước và mô hình học một alignment hơi sai.

## Wrong answers

- "Reshape đầu ra về shape mong đợi và tiếp tục." Các giá trị bên trong sai; một reshape chỉ giấu sự không khớp.
- "Hạ learning rate; mô hình chỉ không ổn định." Lần chạy không phải không ổn định; nó đang tính sai đại lượng.
- "Thêm một mask để sửa shape." Một mask thay đổi các vị trí nào nhận trọng số, không phải bố trí tensor.

## Taught in

[Bài học cơ chế attention](../../../phases/05-nlp-foundations-to-advanced/10-attention-mechanism/) cung cấp bảng shape và prompt gỡ lỗi shape, và [bài học self-attention](../../../phases/07-transformers-deep-dive/02-self-attention-from-scratch/) cung cấp các phép chiếu.
