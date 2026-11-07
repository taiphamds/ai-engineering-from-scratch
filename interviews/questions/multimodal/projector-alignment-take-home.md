---
id: projector-alignment-take-home
title: Build and test a projection between two frozen models
card: multimodal
kind: take-home
level: 2
roles: [applied-ai-engineer]
rounds: [take-home, coding]
tags: [projector, cosine-loss, frozen-encoder, take-home]
minutes: 30
lessons: [phases/19-capstone-projects/60-projection-layer-modality-align, phases/19-capstone-projects/61-cross-attention-fusion, phases/12-multimodal-ai/05-llava-visual-instruction-tuning]
manuals: []
practice: [clip-contrastive-loss]
cheatsheet: [vlm-from-scratch]
related: [multimodal/train-only-the-projector]
updated: 2026-11-03
---

Bài làm ở nhà. Bạn nhận một encoder thị giác đóng băng xuất 197 token chiều rộng 768 mỗi ảnh và một bảng embedding văn bản đóng băng chiều rộng 512. Xây module nhỏ nhất để hai bên giao tiếp, huấn luyện nó trên các mẫu ghép cặp, và bàn giao các kiểm thử chứng minh nó hoạt động. Mô tả thiết kế, loss, cách bạn huấn luyện nó, và các kiểm thử.

## Short answer

Pool 197 token ảnh thành một vector, truyền nó qua một MLP hai lớp, 768 đến 1024 đến 512 với một GELU ở giữa, và so sánh nó với embedding caption mean-pooled qua một cosine alignment loss, một trừ cosine. Chỉ huấn luyện MLP, khoảng 1.3M tham số, với encoder và bảng đóng băng, trong vài trăm bước trên vài chục cặp. Các kiểm thử: shape đầu ra bằng chiều rộng văn bản, các phần đóng băng không có tham số huấn luyện được, loss bằng không trên các vector giống nhau và hai trên các vector đối nhau, một gradient đến projector sau một lượt backward, và loss ở bước cuối thấp hơn bước đầu.

## Full answer

### Design

```text
image tokens (B, 197, 768) -> pool -> (B, 768)
MLP: Linear(768, 1024) -> GELU -> Linear(1024, 512) -> (B, 512)
caption ids -> frozen table -> mean over tokens -> (B, 512)
loss = 1 - cos(image_emb, text_emb)
```

Pooling: token đầu tiên là lựa chọn đơn giản nhất; trung bình trên 196 token patch là lựa chọn khác, và bài tập so sánh chúng. Hai lớp, vì một ánh xạ tuyến tính không thể uốn không gian; GELU cho một lần uốn căn chỉnh hai cơ sở.

### Parameters

| Lớp | Shape | Tham số |
|---|---|---|
| tuyến tính đầu | 768 nhân 1024 | 768 nhân 1024, cộng 1024 |
| GELU | | 0 |
| tuyến tính thứ hai | 1024 nhân 512 | 1024 nhân 512, cộng 512 |

Tổng cộng khoảng 1.3M, cạnh một encoder 86M. Cả hai phần lớn có `requires_grad=False` trên mọi tham số.

### Training loop

- Xây 32 cặp tổng hợp từ một seed khi không được phép dùng tập dữ liệu, và lặp vòng chúng.
- Một bộ tối ưu chỉ trên các tham số projector.
- Chạy 200 bước và in loss mỗi 25 bước. Lần chạy của capstone giảm từ khoảng 1.07 xuống khoảng 0.80.
- In cosine cuối mỗi cặp.

### Tests

1. Shape đầu ra projector khớp chiều rộng đầu ra được cấu hình.
2. Bảng văn bản đóng băng và encoder thị giác đóng băng có không tham số cần gradient.
3. Cosine loss bằng 0 trên các vector giống nhau và 2 trên các vector ngược hướng.
4. Một gradient đến các trọng số projector sau một lượt backward.
5. Loss ở bước 200 thấp hơn ở bước 0.

### What you ship

Các trọng số projector là artifact mới duy nhất. Khi suy luận, encoder vẫn chạy lượt forward của nó, rồi projector, và đầu ra rơi vào không gian văn bản. Cùng hình dạng xuất hiện trong mọi mô hình adapter mở: pool, chiếu, huấn luyện riêng.

### The next step, for the discussion

Cosine mỗi cặp căn chỉnh hướng; một contrastive batch loss cũng sẽ đẩy mỗi ảnh xa các caption khác trong batch. Với một decoder grounding mỗi từ, cross-attention từ các query văn bản vào 197 token ảnh thay vector pooled; đó là capstone tiếp theo.

## Follow-ups

- **Level 2:** Tại sao cosine và không phải mean squared error? Expected: alignment có nghĩa cùng hướng trong không gian chung, không phải các vector bằng nhau; cosine bất biến theo thang, nên projector không bị phạt vì một norm mà bảng văn bản tình cờ có.
- **Level 2:** Một temperature được học trên cosine thay đổi gì? Expected: một bề mặt loss sắc hơn hoặc phẳng hơn; quá nhỏ cho gradient nhiễu và quá lớn đạt bình nguyên cao, như bài tập cho thấy.
- **Level 3:** Lần chạy của capstone dừng gần 0.80 sau 200 bước. Đó có phải một sàn không? Expected: không; đó là loss của một lần chạy ở 200 bước. Projector có 1024 đơn vị ẩn cho 32 cặp, nên nhiều bước hơn hoặc một rate khác có thể đẩy loss thấp hơn; trên các cặp tự nhiên, các đặc trưng encoder đặt alignment có thể đi xa đến đâu.
- **Level 3:** Module này liên hệ với một cầu nối dựa trên query như thế nào? Expected: cầu nối đó kết thúc bằng cùng loại phép chiếu đến chiều rộng văn bản; khác biệt là nó trước tiên nén các token qua các query được học thay vì pooling.

## Wrong answers

- "Fine-tune cả encoder; nó chỉ có 86M tham số." Bài làm ở nhà cho các phần đóng băng vì một lý do: vài chục cặp không thể dạy encoder gì, và kiểm thử kiểm tra bảng đóng băng sẽ thất bại.
- "Dùng một lớp tuyến tính duy nhất; nó đủ cho một phép quay." Hai cơ sở khác nhau hơn một phép quay; phi tuyến là thứ cho phép một lần uốn thu hẹp khoảng cách.
- "Bỏ các kiểm thử; loss đã giảm." Loss có thể giảm qua một bug shape hoặc một rò rỉ vào các phần đóng băng; các kiểm thử ghim hợp đồng mà chỉ loss không thể.

## Taught in

[Capstone phép chiếu](../../../phases/19-capstone-projects/60-projection-layer-modality-align/) đặc tả module, loss, vòng lặp và năm kiểm thử, và [capstone hợp nhất cross-attention](../../../phases/19-capstone-projects/61-cross-attention-fusion/) là bước sau nó.
