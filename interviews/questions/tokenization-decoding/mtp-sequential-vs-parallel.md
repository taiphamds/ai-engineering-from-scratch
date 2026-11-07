---
id: mtp-sequential-vs-parallel
title: Which multi-token design gives a free draft
card: tokenization-decoding
kind: concept
level: 3
roles: [inference-engineer, applied-ai-engineer, ai-data-engineer]
rounds: [ml-depth, design-review]
tags: [multi-token-prediction, speculative-decoding, pretraining, causal-chain, shared-head]
minutes: 10
lessons: [phases/10-llms-from-scratch/18-multi-token-prediction]
manuals: []
practice: []
cheatsheet: [speculative-decoding]
related: [tokenization-decoding/hidden-state-drafts]
updated: 2026-11-03
---

Một nhóm tiền huấn luyện muốn giám sát mỗi vị trí trên nhiều hơn token tiếp theo. Một thiết kế đặt nhiều head đầu ra độc lập trên backbone. Một thiết kế khác nối chuỗi các mô-đun nhỏ, một mô-đun mỗi độ sâu thêm. Thiết kế nào cho bạn một draft suy đoán dùng được ở suy luận, và nó tốn gì trong huấn luyện?

## Short answer

Thiết kế nối chuỗi. Mô-đun k nhận trạng thái ẩn của độ sâu trước và embedding của token tiếp theo thực tế, chạy block transformer nhỏ riêng, và dùng lại embedding chung cùng head đầu ra chung, nên dự đoán token tại t cộng k cộng 1 của nó được điều kiện hóa trên token tại t cộng k, đó là cùng chuỗi nhân quả mà một decoder đi theo và cho phép mô-đun draft các token ở suy luận với mức chấp nhận ở độ sâu một từ 80 phần trăm trở lên cho thông lượng khoảng 1.8 lần. Các head độc lập đều đọc cùng trạng thái ẩn và không thể điều kiện hóa theo nhau. Chi phí huấn luyện là tiền huấn luyện chậm hơn khoảng 10 phần trăm và khoảng 14 h bình phương tham số mỗi mô-đun, với một trọng số loss 0.3 lúc đầu và 0.1 về sau.

## Full answer

### The sequential recipe

Với một tiền tố tới vị trí i, độ sâu không là backbone chính, và độ sâu k xây trên độ sâu k trừ 1:

```text
h_i^(k) = T_k( M_k · concat( RMSNorm(h_i^(k-1)), RMSNorm(E(t_{i+k})) ) )
logits_{i+k+1} = Out( h_i^(k) )
L_k = cross-entropy( logits_{i+k+1}, t_{i+k+1} )
L_MTP = (lambda / D) · sum over k of L_k
```

`E` là bảng embedding và `Out` là head đầu ra, cả hai dùng chung với mô hình chính. `M_k` gấp trạng thái ẩn trước và embedding của token tiếp theo thành một vector. `T_k` là một block transformer. Tổng loss là loss token tiếp theo chính cộng `L_MTP`, với lambda ở 0.3 cho 10 phần trăm huấn luyện đầu và 0.1 sau đó.

### Why the chain matters

Để dự đoán trước hai token, mô-đun một thấy token tiếp theo thực sự là gì. Ở suy luận bạn đưa token được draft cho nó thay vào đó, và nó dự đoán token sau. Đó chính xác là cách một draft trạng thái ẩn hoạt động, nên mô-đun đã huấn luyện là một mạng draft miễn phí. Các head song song phát từ một trạng thái ẩn, nên head hai không thể dùng câu trả lời head một. Một bộ xác minh vẫn có thể kiểm tra các phỏng đoán, nhưng chúng được chấp nhận ít thường xuyên hơn.

### The accounting

Theo từng mô-đun: phép chiếu là `2 h^2`, block là khoảng `12 h^2` cho attention và một MLP có cổng, nên khoảng `14 h^2`. Ở kích thước ẩn 7168 và một mô-đun, đó là khoảng 720M trên giấy; con số đã công bố là 14B trên một mô hình chính 671B, khoảng 2 phần trăm, vì MLP của mô-đun thừa hưởng cấu trúc expert của mô hình chính. Embedding và head không thêm gì, vì chúng được dùng chung.

### What you get

1. Một tín hiệu huấn luyện dày hơn: mọi trạng thái ẩn được giám sát trên D cộng 1 mục tiêu, và báo cáo cho thấy các mức tăng nhất quán trên các đánh giá suy luận, toán và mã.
2. Một draft ở suy luận với mức chấp nhận 80 phần trăm trở lên ở độ sâu một, cho thông lượng sinh khoảng 1.8 lần, và chi phí lúc huấn luyện được trả lại lần đầu mô hình phục vụ.

### Against a post-hoc draft

| | Draft trạng thái ẩn được huấn luyện sau | Các mô-đun tích hợp |
|---|---|---|
| Khi huấn luyện | sau tiền huấn luyện | trong tiền huấn luyện |
| Hoạt động với các trọng số hiện có | có | không, huấn luyện lại |
| Các tham số draft | một hoặc hai lớp | một block cùng một phép chiếu |
| Sự chấp nhận | 0.88 đến 0.92 | 0.80 trở lên ở độ sâu một |
| Lợi ích ngoài tốc độ | không có | tín hiệu huấn luyện dày hơn |

Dùng thiết kế tích hợp khi bạn kiểm soát tiền huấn luyện và kích thước ẩn ít nhất 4096; ở quy mô 1B, overhead gây hại nhiều hơn giúp. Dùng draft được huấn luyện sau khi các trọng số đã tồn tại.

## Follow-ups

- **Level 3:** Tại sao dùng chung embedding và head đầu ra với mô hình chính? Expected: không tham số thêm, và mô-đun dự đoán trong cùng không gian từ vựng như backbone.
- **Level 3:** Tại sao overhead tham số đã công bố lớn hơn ước lượng `14 h^2`? Expected: MLP của mô-đun có cùng cấu trúc expert như mô hình chính, nhân các tham số của nó lên.
- **Level 4:** Với hai mô-đun, mô-đun thứ hai nhận gì làm đầu vào? Expected: trạng thái ẩn của mô-đun đầu và embedding của token phía trước hai vị trí, để dự đoán token phía trước ba vị trí.
- **Level 4:** Một nhóm muốn thêm điều này vào một mô hình dense hiện có bằng cách fine-tune một head mới. Câu trả lời của bạn? Expected: mô-đun chưa được huấn luyện và backbone chưa được loss thêm định hình; quan điểm của bài học là nó cần một lần tiền huấn luyện, và một draft được huấn luyện sau là công cụ đúng cho các trọng số hiện có.

## Wrong answers

- "Loss thêm thay thế dự đoán token tiếp theo." Nó được cộng vào loss chính với một trọng số nhỏ; mục tiêu chính giữ nguyên.
- "Mô-đun có thể được gắn vào một mô hình đã huấn luyện bằng một fine-tune nhanh." Thiết kế là một lựa chọn tiền huấn luyện; các trọng số hiện có nhận một draft được huấn luyện sau thay vào đó.

## Taught in

[Bài học multi-token prediction](../../../phases/10-llms-from-scratch/18-multi-token-prediction/) cung cấp công thức tuần tự, loss, tính toán tham số và so sánh với các draft được huấn luyện sau.
