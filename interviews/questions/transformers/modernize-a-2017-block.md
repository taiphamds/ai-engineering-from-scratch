---
id: modernize-a-2017-block
title: Review a 2017-style block against today's defaults
card: transformers
kind: design
level: 3
roles: [inference-engineer, applied-ai-engineer]
rounds: [design-review, ml-depth]
tags: [transformer-block, rmsnorm, swiglu, rope, grouped-query-attention, design-review]
minutes: 12
lessons: [phases/07-transformers-deep-dive/05-full-transformer, phases/07-transformers-deep-dive/14-build-a-transformer-capstone, phases/07-transformers-deep-dive/04-positional-encoding]
manuals: []
practice: [layer-norm-rms-norm, rope]
cheatsheet: [transformers-attention]
related: [transformers/pre-norm-vs-post-norm, transformers/residual-stream-and-dropout]
updated: 2026-11-03
---

Bạn tiếp nhận một khối decoder được viết theo kiểu năm 2017: layer normalization sau phép cộng residual, mạng feed-forward ReLU có chiều rộng gấp bốn, vị trí tuyệt đối hình sin được cộng vào đầu vào, các số hạng bias trên mọi lớp tuyến tính, và full multi-head attention. Đánh giá nó so với những gì decoder production hiện nay phát hành và giải thích từng thay đổi bạn yêu cầu.

## Short answer

Chuyển chuẩn hóa ra trước mỗi lớp con và đổi sang RMSNorm; thay mạng ReLU bằng SwiGLU ở chiều rộng khoảng 2.6 lần để ba ma trận của nó khớp số tham số cũ; thay sinusoid bằng phép quay query và key; bỏ các bias; và dùng grouped-query attention để thu nhỏ cache lúc decode. Mỗi thay đổi là một phép thay hàm và hình dạng tensor không dịch chuyển. Bằng chứng: pre-norm huấn luyện sâu mà không cần thủ thuật warmup, SwiGLU cải thiện khoảng nửa điểm perplexity trong các bài báo mô hình đã công bố, phép quay cho vị trí tương đối và một nút điều chỉnh cho ngữ cảnh dài, còn grouped-query cắt bộ nhớ cache theo tỷ lệ query head trên key-value head.

## Full answer

### The review table

| Thành phần | Như đã viết | Yêu cầu | Tại sao |
|---|---|---|---|
| Chuẩn hóa | LayerNorm sau phép cộng | RMSNorm trước lớp con | pre-norm huấn luyện chồng sâu mà không cần warmup; RMSNorm bỏ phép trừ trung bình với độ ổn định tương đương |
| Hàm kích hoạt FFN | ReLU | SwiGLU | khoảng 0.5 điểm perplexity trong các so sánh đã công bố |
| Hệ số mở rộng FFN | 4 với hai ma trận | khoảng 2.6 với ba ma trận | cùng ngân sách tham số |
| Vị trí | sinusoid trên embedding | phép quay Q và K | vị trí tương đối không tốn thêm và cơ số để điều chỉnh cho ngữ cảnh dài |
| Attention | full multi-head | grouped-query, hoặc latent | ít key-value head hơn trong cache, chất lượng gần như đầy đủ |
| Các số hạng bias | có | không | cải thiện perplexity nhẹ và mô hình nhỏ hơn |

### What stays

Bộ khung: embedding, một chồng khối mà mỗi khối cộng attention và FFN vào luồng residual, norm cuối cùng và head. Cross-entropy dịch một vị trí. Causal mask. Kiến trúc capstone trong bài học chính là bộ khung này với các thành phần hiện đại được cắm vào, và head của nó dùng chung trọng số với token embedding.

### How to land the changes safely

1. Thực hiện mỗi phép thay sau một cờ và xác nhận hình dạng đầu ra sau mọi lần đổi, theo cách bước xây dựng của bài học làm.
2. Huấn luyện khối cũ và mới trên tác vụ sao chép nhỏ trong số bước cố định rồi so sánh loss; bài tập của bài học dùng 100 bước của tác vụ đồ chơi.
3. Dùng lời gọi attention hợp nhất từ framework để kernel chia ô được điều phối khi đầu vào cho phép.
4. Giữ norm cuối cùng trước head, thứ pre-norm yêu cầu còn post-norm thì không.

### What needs a retrain

Tất cả những điều này thay đổi hàm mà khối tính, nên checkpoint được huấn luyện với khối cũ không thể áp dụng chúng bằng cách sửa mã. Grouped-query là ngoại lệ được tài liệu nghiên cứu xử lý riêng: checkpoint multi-head đã huấn luyện có thể được chuyển đổi và fine-tune.

## Follow-ups

- **Level 3:** Tại sao hệ số mở rộng SwiGLU khoảng 2.6 chứ không phải 4? Expected: ba ma trận thay vì hai, được chọn để tổng tham số khớp mạng cũ.
- **Level 3:** Thay đổi nào trong sáu thay đổi có thể áp dụng cho checkpoint hiện có mà không huấn luyện lại? Expected: không thay đổi nào áp dụng trọn vẹn; grouped-query có thể chuyển đổi với một lượt fine-tune, các thay đổi còn lại đổi hàm và cần huấn luyện.
- **Level 4:** Bạn sẽ từ chối thay đổi gì trong đánh giá? Expected: bộ khung residual, causal mask và next-token loss; khối hiện đại tinh chỉnh các thành phần, không phải bộ khung.
- **Level 4:** Nhóm muốn giữ sinusoid vì nó không có tham số. Câu trả lời của bạn? Expected: phép quay cũng không có tham số, áp dụng bên trong attention, mã hóa khoảng cách tương đối và mở rộng đến ngữ cảnh dài hơn bằng điều chỉnh cơ số.

## Wrong answers

- "RMSNorm là phép xấp xỉ rẻ hơn đánh đổi độ chính xác." Bài học ghi nhận nó ít nhất cũng ổn định như vậy với ít hơn một phép toán.
- "SwiGLU tăng gấp đôi tham số feed-forward." Ở chiều rộng khoảng 2.6 lần, ba ma trận của nó khớp số đếm hai ma trận cũ.
- "Pre-norm loại bỏ nhu cầu chuẩn hóa cuối cùng." Nó làm phát sinh nhu cầu đó: luồng residual không được chuẩn hóa, nên head cần norm cuối cùng.

## Taught in

[Bài học về transformer đầy đủ](../../../phases/07-transformers-deep-dive/05-full-transformer/) đưa ra bảng năm 2017 so với 2026, [capstone](../../../phases/07-transformers-deep-dive/14-build-a-transformer-capstone/) lắp ráp khối hiện đại, và [bài học về mã hóa vị trí](../../../phases/07-transformers-deep-dive/04-positional-encoding/) đề cập phép quay.
