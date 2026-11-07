---
id: transfusion-two-losses
title: Two losses, one transformer, one gradient step
card: multimodal
kind: concept
level: 4
roles: [applied-ai-engineer]
rounds: [ml-depth]
tags: [transfusion, two-loss, flow-matching, attention-mask]
minutes: 15
lessons: [phases/12-multimodal-ai/13-transfusion-autoregressive-diffusion, phases/12-multimodal-ai/14-show-o-discrete-diffusion-unified, phases/12-multimodal-ai/11-chameleon-early-fusion-tokens]
manuals: []
practice: []
cheatsheet: [unified-multimodal, image-generation-compared]
related: [multimodal/vq-tokenizer-ceiling, multimodal/show-o-parallel-decoding]
updated: 2026-11-03
---

Giải thích cách một transformer đơn có thể huấn luyện mục tiêu văn bản của dự đoán next-token cùng một loss khử nhiễu trên ảnh trong một bước gradient. Bao phủ biểu diễn đầu vào, mask attention, cách loss được định tuyến theo vị trí, và vấn đề cân bằng theo sau. Sau đó nói một kiến trúc anh em thay đổi gì.

## Short answer

Văn bản đi vào như các token rời rạc qua bảng embedding; ảnh đi vào như các patch liên tục 16 nhân 16 pixel qua một phép chiếu tuyến tính, được bao bởi các tag bắt đầu và kết thúc ảnh. Một lượt forward chạy trên chuỗi hỗn hợp, và loss được chọn theo vị trí: cross-entropy trên head từ vựng cho các vị trí văn bản, và một hồi quy flow-matching cho các patch ảnh, dự đoán vận tốc từ một patch được thêm nhiễu về phía patch sạch tại một thời điểm lấy mẫu. Mask là tam giác khối, nhân quả trên văn bản và hai chiều giữa các patch của một ảnh, với văn bản attend đến các ảnh đã đóng trước nó và patch attend đến văn bản đi trước. Cả hai loss backpropagate qua cùng trọng số, nên độ lớn tương đối của chúng phải được cân bằng bằng tay; kiến trúc anh em giữ attention chung nhưng cho văn bản và ảnh trọng số riêng trong mọi block.

## Full answer

### The input

Hai loại vị trí trong một chuỗi. Một vị trí văn bản giữ một token id và đi qua bảng embedding. Một vị trí ảnh giữ một vector patch giá trị thực, được chiếu vào kích thước ẩn bằng một lớp tuyến tính, theo cách một vision transformer embed đầu vào. Các tag đánh dấu nơi ảnh bắt đầu và kết thúc.

### The mask

```text
M[i, j] = 1 if
  i and j are text and j <= i                        causal text
  or i and j are patches of the same image           bidirectional inside an image
  or i is text, j is a patch, and that image closed before i
  or i is a patch, j is text, and j precedes the image start
```

Teacher forcing trên văn bản yêu cầu phần nhân quả. Một ảnh là một ảnh chụp, nên các patch của nó đều có thể thấy nhau.

### The loss per position

- Văn bản: cross-entropy của head từ vựng đối chiếu token tiếp theo.
- Ảnh: lấy mẫu một thời điểm t, nội suy giữa patch sạch và nhiễu với trọng số t, đưa vào patch nhiễu, và hồi quy vận tốc, nhiễu trừ patch sạch, bằng một mean squared error.

Cả hai số hạng cộng vào một loss và một lượt backward; phần thân dùng chung nhận cả hai gradient.

### Generation

Văn bản decode từng token. Khi mô hình xuất tag bắt đầu ảnh, việc sinh chuyển sang một vòng lặp khử nhiễu trên các patch ảnh, được điều kiện hóa trên văn bản đến lúc đó, trong vài chục bước, rồi trở lại văn bản.

### The balancing problem

Hai loss nằm trên các thang khác nhau. Bài tập của bài học đặt một hỗn hợp 70 phần trăm vị trí văn bản và 30 phần trăm vị trí ảnh nơi image loss khoảng gấp mười lần text loss về độ lớn; không có trọng số, một head chi phối gradient dùng chung. Các trọng số, và bất kỳ sự không khớp lịch trình nào giữa hai mục tiêu, là một cuộc tìm kiếm riêng, là cái giá tránh một bộ lượng tử hóa. Phần thưởng là chất lượng ảnh trên một mô hình rời rạc cùng kích thước, thêm 3 đến 5 điểm trên điểm ảnh tiêu chuẩn trong bài báo.

### The sibling

Multimodal diffusion transformer đằng sau một bộ sinh ảnh nổi tiếng giữ attention chung xuyên phương thức nhưng cho văn bản và ảnh các trọng số query, key, value và MLP riêng trong mọi block, huấn luyện bằng rectified flow, và được cung cấp ở các biến thể 2B và 8B tham số. Các trọng số riêng loại bỏ một phần áp lực cân bằng với cái giá nhiều tham số hơn.

### Where it sits

Các thiết kế mã rời rạc đánh đổi phần nối ghép này lấy một loss và một trần tokenizer; thiết kế rời rạc có mask giữ một loss và decoding song song. Thiết kế này là lựa chọn khi độ trung thực là tối quan trọng và công thức hai loss chấp nhận được.

## Follow-ups

- **Level 3:** Tại sao các patch ảnh có thể attend hai chiều khi văn bản không thể? Expected: văn bản được sinh trái sang phải dưới teacher forcing, nên một token không được thấy mục tiêu của nó; một ảnh được tạo như một ảnh chụp, và các patch không có thứ tự.
- **Level 4:** Bạn sẽ đặt các trọng số loss như thế nào? Expected: đo độ lớn và norm gradient của mỗi loss trên một batch giữ lại, điều chỉnh chúng đến các đóng góp tương đương, và tinh chỉnh từ đó theo một đánh giá văn bản và một đánh giá ảnh cùng nhau, vì một bên có thể cải thiện trong khi bên kia suy giảm.
- **Level 4:** Thời điểm lấy mẫu t làm gì trong training loss? Expected: nó chọn patch mang bao nhiêu nhiễu, nên mô hình học toàn bộ đường từ nhiễu đến sạch; khi sinh mỗi bước di chuyển dọc đường đó.
- **Level 4:** Tập trọng số theo phương thức của kiến trúc anh em tốn gì và mang lại gì? Expected: nhiều tham số hơn mỗi block; nó mang lại năng lực riêng cho hai thống kê đầu vào rất khác và giảm cân bằng, trong khi attention chung vẫn cho các phương thức điều kiện hóa nhau.

## Wrong answers

- "Một transformer chỉ có thể có một loss." Loss là một hàm của các đầu ra theo vị trí; định tuyến một loss khác đến các vị trí khác là một mục tiêu được lấy tổng với một lượt backward.
- "Dùng mask nhân quả ở mọi nơi cho đơn giản." Attention nhân quả bên trong một ảnh giấu một phần mỗi ảnh khỏi các patch của chính nó và gây hại sinh; mask phải hai chiều bên trong một block ảnh.
- "Hai loss tự cân bằng vì chúng chia sẻ trọng số." Trọng số dùng chung là vấn đề: loss lớn hơn chi phối gradient dùng chung đến khi bạn đặt trọng số chúng.

## Taught in

[Bài học Transfusion](../../../phases/12-multimodal-ai/13-transfusion-autoregressive-diffusion/) xây bộ huấn luyện hai loss và mask và nêu thiết kế anh em của nó, và [bài học Show-o](../../../phases/12-multimodal-ai/14-show-o-discrete-diffusion-unified/) đặt nó đối chiếu các thiết kế rời rạc.
