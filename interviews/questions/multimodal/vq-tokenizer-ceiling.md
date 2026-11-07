---
id: vq-tokenizer-ceiling
title: Why the tokenizer caps a generated image
card: multimodal
kind: concept
level: 3
roles: [applied-ai-engineer]
rounds: [ml-depth]
tags: [vq-vae, tokenizer-ceiling, transfusion, image-generation]
minutes: 12
lessons: [phases/12-multimodal-ai/11-chameleon-early-fusion-tokens, phases/12-multimodal-ai/12-emu3-next-token-for-generation, phases/12-multimodal-ai/13-transfusion-autoregressive-diffusion, phases/12-multimodal-ai/14-show-o-discrete-diffusion-unified]
manuals: []
practice: []
cheatsheet: [unified-multimodal, image-generation-compared]
related: [multimodal/emu3-generation-cost, multimodal/early-or-late-fusion]
updated: 2026-11-03
---

Trong họ sinh thống nhất, chất lượng một ảnh được sinh được nói là bị chặn bởi tokenizer, không phải transformer. Giải thích tại sao, cho thấy điều gì di chuyển trần giữa hai thế hệ mô hình, và nói thiết kế nào tránh hoàn toàn trần và với chi phí nào.

## Short answer

Một tokenizer ảnh rời rạc mất mát: decoder chỉ có thể render những gì mã mang, nên ảnh tốt nhất mô hình có thể từng tạo là tái dựng của chính tokenizer trên một ảnh thực. Mô hình từ vựng dùng chung đầu tiên dùng 1024 mã mỗi ảnh 512 nhân 512 từ một codebook 8192 và tái dựng ở khoảng 26 đến 28 dB; thế hệ tiếp theo dùng số mã gấp bốn, 4096, và một codebook lớn gấp bốn, 32768, và đạt 30.5 dB, gần 32 dB của continuous latent diffusion. Thiết kế tránh trần giữ các patch ảnh liên tục và huấn luyện một diffusion loss trên chúng cạnh text loss trong một transformer; nó bỏ bộ lượng tử hóa và tăng độ trung thực, và trả bằng hai loss trên các thang khác nhau để cân bằng và một vòng lặp lấy mẫu lúc sinh.

## Full answer

### Why the cap exists

Transformer dự đoán mã. Decoder biến mã thành pixel mà không có đầu vào khác. Bất kỳ chi tiết nào bộ lượng tử hóa bỏ đi lúc encode không thể trở lại: một transformer hoàn hảo dự đoán chính xác các mã của một ảnh thực render tái dựng của tokenizer trên ảnh đó, không gì tốt hơn. Chất lượng tái dựng do đó là một cận trên cho độ trung thực với một ảnh thực, là điều các con số dB bên dưới đo. Các chỉ số phân phối đo một thuộc tính khác và không chia sẻ cận này.

### What moved the cap

| Thế hệ mô hình | Mã mỗi ảnh 512 nhân 512 | Codebook | Tái dựng |
|---|---|---|---|
| mô hình từ vựng dùng chung đầu tiên | 1024 | 8192 | khoảng 26 đến 28 dB |
| mô hình sinh next-token | 4096 | 32768 | 30.5 dB |
| continuous latent diffusion, để tham chiếu | liên tục | không có | khoảng 32 dB |

Số mã gấp bốn mang chi tiết không gian gấp bốn, và một codebook lớn gấp bốn mang các giá trị mịn hơn mỗi mã. Đóng góp chính của mô hình mới hơn là một tokenizer tốt hơn, và với nó dự đoán next-token ngang một mô hình diffusion trên một benchmark sinh ảnh.

### The cost of more codes

Mỗi mã là một lượt decode trong sinh next-token thông thường, nên số mã gấp bốn là thời gian sinh gấp bốn. Masked parallel decoding giữ mã rời rạc và dự đoán tất cả vị trí bị mask cùng lúc trong khoảng 16 lượt, trả lại chi phí của lưới lớn hơn.

### The design without a cap

Giữ ảnh liên tục. Chiếu các patch bằng một lớp tuyến tính, như một vision transformer làm ở đầu vào, và huấn luyện một transformer với hai loss: cross-entropy trên các token văn bản và một flow-matching loss trên các patch ảnh nhiễu. Không có bộ lượng tử hóa để chặn chi tiết. Bài báo báo cáo một điểm ảnh tốt hơn một mô hình rời rạc cùng kích thước 3 đến 5 điểm. Cái giá: hai loss khác độ lớn có các trọng số cần tinh chỉnh, một mask attention tam giác khối, và một vòng lặp khử nhiễu vài chục bước mỗi ảnh lúc sinh.

### Which to pick

Mã rời rạc khi một stack next-token phải xử lý hiểu và sinh ảnh cùng video với một loss, và bạn chấp nhận trần tokenizer. Patch liên tục khi độ trung thực ảnh là ưu tiên và phần nối ghép hai loss chấp nhận được.

## Follow-ups

- **Level 3:** Tại sao điểm tái dựng của tokenizer là con số đúng để đọc trước khi huấn luyện transformer? Expected: nó là trần; không lượng scale transformer nào nâng một ảnh được sinh trên những gì decoder có thể render từ mã.
- **Level 3:** Ngoài codebook và số mã, điều gì nâng một tokenizer? Expected: thiết kế bộ lượng tử hóa; các mô hình mới hơn dùng một họ bộ lượng tử hóa inverse-bottleneck sử dụng tốt codebook lớn hơn, nơi một codebook lớn hơn ngây thơ để các mã không được dùng.
- **Level 4:** Mask attention khác như thế nào trong thiết kế liên tục? Expected: nhân quả trên token văn bản, hai chiều giữa các patch của một ảnh, văn bản attend đến các ảnh đã đóng trước nó, và các patch ảnh attend đến văn bản đi trước; một mask tam giác khối.
- **Level 4:** Thiết kế rời rạc có mask nằm ở phía nào của sự đánh đổi này? Expected: rời rạc, với trần tokenizer, nhưng với decoding song song trong vài lượt; nó đánh đổi độ trung thực của diffusion liên tục lấy huấn luyện đơn giản hơn và lấy mẫu nhanh.

## Wrong answers

- "Scale transformer và các ảnh sắc hơn." Transformer dự đoán mã; độ sắc vượt tái dựng của tokenizer không tồn tại trong các mã để dự đoán.
- "Một codebook lớn hơn là đủ." Số mã đặt chi tiết không gian và codebook đặt chi tiết giá trị; tokenizer mới hơn tăng cả hai, và thiết kế bộ lượng tử hóa quyết định liệu một codebook lớn có được dùng.
- "Các patch liên tục tốt hơn tuyệt đối, nên mã rời rạc lỗi thời." Patch liên tục tốn hai loss để cân bằng và một vòng lặp khử nhiễu mỗi ảnh; họ rời rạc giữ một loss và một decoder cho mọi phương thức, là lý do cả hai sống sót.

## Taught in

[Bài học Chameleon](../../../phases/12-multimodal-ai/11-chameleon-early-fusion-tokens/) nêu tokenizer là trần tái dựng, [bài học Emu3](../../../phases/12-multimodal-ai/12-emu3-next-token-for-generation/) cho thấy một tokenizer tốt hơn di chuyển nó như thế nào, và [bài học Transfusion](../../../phases/12-multimodal-ai/13-transfusion-autoregressive-diffusion/) đưa ra thiết kế liên tục và các chi phí.
