---
id: query-key-value-lookup
title: Explain query, key and value in one minute
card: transformers
kind: concept
level: 1
roles: [applied-ai-engineer, ai-data-engineer, ai-developer-relations-engineer, inference-engineer]
rounds: [screen, ml-breadth]
tags: [attention, query-key-value, encoder-decoder, self-attention]
minutes: 6
lessons: [phases/05-nlp-foundations-to-advanced/10-attention-mechanism, phases/07-transformers-deep-dive/02-self-attention-from-scratch]
manuals: []
practice: [scaled-dot-product-attention]
cheatsheet: [transformers-attention]
related: []
updated: 2026-11-03
---

Một đồng đội mới đã đọc từ "attention" cả trăm lần mà vẫn không nói được query, key hay value là gì. Giải thích ba thứ cho họ trong một phút. Sau đó nói điều gì đã thay đổi giữa phiên bản encoder-decoder năm 2014 và phiên bản bên trong transformer.

## Short answer

Attention là phép tra cứu mềm. Mỗi token tạo query hỏi thông tin, key cho biết token chứa gì, và value mà token trao khi được chọn. Query được chấm điểm với mọi key, điểm số đi qua softmax, và đầu ra là tổng có trọng số của các value. Trong phiên bản năm 2014, query là trạng thái decoder còn key và value là cùng các trạng thái encoder; transformer lấy cả ba từ một chuỗi qua ba phép chiếu được học.

## Full answer

### The three projections

Với chuỗi X gồm n token có d chiều mỗi token:

```text
Q = X @ Wq    (n, dk)   what each token looks for
K = X @ Wk    (n, dk)   what each token contains
V = X @ Wv    (n, dv)   what each token returns when picked
scores = Q @ K.T        (n, n)
```

Hàng i của ma trận điểm số là góc nhìn của một token về toàn bộ chuỗi. Softmax biến hàng thành các trọng số có tổng bằng một. Đầu ra cho token i là tổng có trọng số của tất cả vector value.

### The database picture

Cơ sở dữ liệu thực khớp query với một key và trả về một value. Attention khớp query với mọi key bằng điểm tương đồng và trả về sự pha trộn của mọi value. Sự pha trộn là thứ cho phép mô hình kết hợp thông tin từ nhiều vị trí trong một bước.

### What the 2014 version had

Attention encoder-decoder năm 2014 dùng trạng thái decoder trước làm query và chấm điểm nó với mọi trạng thái ẩn encoder. Vector ngữ cảnh là trung bình có trọng số của cùng các trạng thái encoder đó. Trong thiết kế đó, key và value là cùng một thứ. Hai hàm điểm số phổ biến: điểm cộng đưa cặp qua tanh và vector được học, và điểm nhân lấy tích vô hướng. Cách sửa ba dòng phá vỡ nút thắt kích thước cố định của encoder-decoder.

### What a transformer changed

Self-attention truy vấn một chuỗi với chính nó, và tách key khỏi value bằng các phép chiếu được học khác nhau. Multi-head attention chạy song song nhiều phép như vậy. Tổng có trọng số của value là cùng ý tưởng. Hàm điểm số thay đổi: điểm tanh cộng và tích vô hướng thuần nhường chỗ cho tích vô hướng chia căn bậc hai của chiều rộng key.

## Follow-ups

- **Level 1:** Đầu ra có hình dạng gì cho một token? Expected: chiều value, vì đầu ra là tổng có trọng số của các vector value.
- **Level 2:** Tại sao cho key và value các phép chiếu riêng? Expected: token có thể được khớp trên một loại thông tin và trả về loại khác.
- **Level 2:** Tại sao điểm tích vô hướng thuần cần query và key có cùng số chiều? Expected: tích vô hướng chỉ được định nghĩa cho các vector có độ dài bằng nhau; dạng tổng quát chèn ma trận W để bỏ ràng buộc đó.
- **Level 3:** Nêu bẫy quy ước giữa hai hàm điểm số cổ điển. Expected: một dùng trạng thái decoder trước bước hiện tại và cái kia dùng trạng thái sau nó; trộn chúng tạo gradient sai một cách tinh vi.

## Wrong answers

- "Key và value phải là cùng vector." Chúng là như vậy trong phiên bản cổ điển, nhưng transformer học các phép chiếu riêng cho chúng.
- "Attention chọn một token khớp tốt nhất duy nhất." Softmax cho trọng số với mọi vị trí, và đầu ra pha trộn tất cả value.
- "Query đến từ encoder." Trong attention encoder-decoder, query đến từ decoder còn key và value đến từ encoder.

## Taught in

[Bài học về cơ chế attention](../../../phases/05-nlp-foundations-to-advanced/10-attention-mechanism/) xây dựng phiên bản cổ điển và [bài học về self-attention](../../../phases/07-transformers-deep-dive/02-self-attention-from-scratch/) xây dựng các phép chiếu.
