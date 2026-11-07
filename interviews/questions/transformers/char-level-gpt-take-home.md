---
id: char-level-gpt-take-home
title: Take-home, a character-level decoder on a laptop
card: transformers
kind: take-home
level: 3
roles: [applied-ai-engineer, inference-engineer, ai-data-engineer]
rounds: [take-home, coding]
tags: [take-home, decoder-only, training-loop, validation-loss, sampling]
minutes: 15
lessons: [phases/07-transformers-deep-dive/14-build-a-transformer-capstone, phases/19-capstone-projects/34-transformer-block]
manuals: []
practice: [train-char-bigram]
cheatsheet: [gpt-from-scratch-training]
related: [transformers/loss-drops-to-zero-no-mask, transformers/modernize-a-2017-block]
updated: 2026-11-03
---

Đây là bài làm ở nhà chúng tôi gửi: huấn luyện một transformer chỉ có decoder nhỏ trên một tập văn bản ở cấp ký tự khoảng một megabyte, trên laptop, và trả lại mã, các đường cong loss cùng một vài mẫu. Hãy nói cách bạn tiếp cận nó, người đánh giá kiểm tra gì trong bài nộp của bạn, và những kết quả nào chứng minh mô hình hoạt động.

## Short answer

Xây dựng hình dạng tham chiếu nhỏ: tokenizer ký tự trên 65 ký hiệu của tập dữ liệu, token embedding cộng positional embedding được học, một chồng khối pre-norm với RMSNorm, causal multi-head attention và mạng SwiGLU, norm cuối cùng và head dùng chung trọng số với embedding, được huấn luyện bằng cross-entropy dịch một vị trí trên các cửa sổ ngẫu nhiên 256 ký tự. Dùng AdamW, lịch cosine với warmup và gradient clipping ở 1.0, và giữ lại 10 phần trăm cuối của văn bản để validation. Mức yêu cầu từ bài học: mô hình 4 lớp, 4 head với chiều rộng 128, khoảng 800K tham số, đi từ training loss khoảng 4.2 xuống khoảng 1.5 trong 2,000 bước, khoảng 6 phút trên laptop, với validation loss dưới 2.0 bám theo training loss và các mẫu trông giống tập dữ liệu.

## Full answer

### What to build

```text
tokens (B, N) -> embedding + position -> [norm, causal attention, residual, norm, SwiGLU, residual] x L
            -> final norm -> head tied to the embedding -> logits (B, N, V) -> shift-by-one loss
```

Tokenizer ký tự ở cấp byte không cần huấn luyện. Dữ liệu được chia 90 với 10 theo vị trí trong văn bản, để văn bản validation không bao giờ được thấy trong huấn luyện.

### The training loop

```python
for step in range(max_steps):
    x, y = get_batch("train")
    logits = model(x)
    loss = F.cross_entropy(logits.view(-1, vocab_size), y.view(-1))
    loss.backward()
    torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
    opt.step()
    opt.zero_grad()
```

Ghi log training loss và validation loss trên cùng một trục. Lấy mẫu sau huấn luyện bằng top-p và dừng sau 500 ký tự.

### What a reviewer checks

1. **Tính đúng đắn của mục tiêu.** Causal mask được áp dụng trước softmax và các mục tiêu là đầu vào được dịch một vị trí. Một unit test làm nhiễu token phía sau và kiểm tra đầu ra phía trước là tín hiệu mạnh.
2. **Loss đầu tiên.** Khoảng 4.2 ở bước không, mức cơ sở đồng đều, logarit của 65. Khởi đầu thấp hơn nhiều là lý do để kiểm tra rò rỉ.
3. **Kỷ luật validation.** Một phần dữ liệu được giữ riêng, được ghi log theo khoảng, bám theo training loss; bài học ghi nhận không có overfitting ở kích thước và ngân sách này. Validation loss thấp hơn nhiều so với training là lý do để kiểm tra cách chia và mã loss, vì 10 phần trăm cuối của văn bản cũng có thể dễ hơn.
4. **Thực hành huấn luyện.** Gradient clipping, một lịch, seed cố định, và một lượt chạy có thể tái lập.
5. **Đọc các mẫu.** Dấu xuống dòng, từ cổ và tên người nói viết hoa xuất hiện; văn bản có hình dạng của tập dữ liệu, không phải chính tập dữ liệu.

### What proves it works

Đường cong loss từ khoảng 4.2 xuống khoảng 1.5, validation loss dưới 2.0 đi theo nó, và các mẫu mà người đọc nhận ra là phong cách của tập dữ liệu. Một bản viết nêu lỗi ứng viên gặp và đã sửa có giá trị hơn một loss thấp hơn.

### Stretch goals that separate candidates

Thay vị trí được học bằng phép quay query và key rồi cho thấy validation loss ít nhất cũng thấp như trước. Thêm cache key và value vào vòng lặp lấy mẫu rồi cho thấy mẫu 500 ký tự chạy nhanh hơn 5 đến 20 lần. Huấn luyện đến 5,000 bước và báo cáo liệu validation có tiếp tục cải thiện hay không.

## Follow-ups

- **Level 2:** Training loss ở bước không là bao nhiêu và làm sao bạn biết nó đúng? Expected: khoảng logarit của kích thước từ vựng, khoảng 4.2 cho 65 ký hiệu, vì mô hình ngẫu nhiên là đồng đều.
- **Level 3:** Làm sao người đánh giá biết causal mask của bạn hoạt động mà không đọc mã? Expected: một kiểm thử thay đổi ký tự phía sau và khẳng định logits phía trước không đổi, và loss bắt đầu ở mức cơ sở ngẫu nhiên.
- **Level 3:** Tại sao dùng chung trọng số head với embedding ở kích thước này? Expected: nó tiết kiệm tham số và bài học ghi nhận cải thiện chất lượng; trọng số head là chuyển vị của embedding.
- **Level 4:** Một ứng viên thay tokenizer ký tự bằng từ vựng subword khoảng 50,000. Còn điều gì phải thay đổi? Expected: embedding và head tăng từ 65 hàng lên khoảng 50,000, mô hình cần thêm năng lực để dùng chúng, và các cửa sổ giờ bao phủ nhiều văn bản hơn trên mỗi token.

## Wrong answers

- "Dùng mô hình lớn hơn để đạt loss thấp hơn trong ngân sách thời gian." Mô hình lớn hơn huấn luyện chậm hơn trên laptop và mức yêu cầu của bài học đạt được ở 800K tham số trong khoảng 6 phút.
- "Bỏ phần dữ liệu validation; tập dữ liệu rất nhỏ." Phần chia là cách kiểm tra rò rỉ duy nhất và người đánh giá tìm nó đầu tiên.
- "Báo cáo chất lượng mẫu thay cho loss." Các mẫu là bằng chứng, không phải chỉ số; các đường cong và loss trên dữ liệu giữ riêng là thứ người đánh giá so sánh giữa các ứng viên.

## Taught in

[Capstone transformer](../../../phases/07-transformers-deep-dive/14-build-a-transformer-capstone/) đặt ra kiến trúc và các con số mục tiêu, còn [capstone khối](../../../phases/19-capstone-projects/34-transformer-block/) xây dựng khối mà nó xếp chồng.
