---
id: rmsnorm-vs-layernorm
title: Swap the final LayerNorm for RMSNorm without breaking it
card: coding
kind: code-reading
level: 3
roles: [inference-engineer, applied-ai-engineer, ai-data-engineer]
rounds: [coding, ml-depth]
tags: [layernorm, rmsnorm, normalization]
minutes: 10
lessons: [phases/19-capstone-projects/35-gpt-model-assembly]
manuals: []
practice: [layer-norm-rms-norm]
cheatsheet: [transformers-attention, gpt-from-scratch-training]
related: [coding/decay-split-param-groups]
updated: 2026-11-03
---

Bài học lắp ráp nói rằng đổi activation và thay LayerNorm bằng RMSNorm biến mô hình của nó thành họ mô hình mở tiếp theo. Một ứng viên nộp RMSNorm này:

```python
def rms_norm(x, weight, eps):
    mean = x.mean(axis=-1, keepdims=True)
    var = ((x - mean) ** 2).mean(axis=-1, keepdims=True)
    return weight * (x - mean) / np.sqrt(var) + eps
```

Điều gì sai, và hàm đúng tính điều gì?

## Short answer

Đây là một LayerNorm không có độ dịch, không phải một RMSNorm, và nó cộng epsilon sau căn bậc hai thay vì bên trong nó. RMSNorm không trừ trung bình. Nó chia đầu vào cho căn của trung bình các bình phương trên trục cuối cùng, với epsilon bên trong căn, và nhân với một trọng số được học.

## Full answer

### The two normalizations

```python
def layer_norm(x, gamma, beta, eps):
    mean = x.mean(axis=-1, keepdims=True)
    var = ((x - mean) ** 2).mean(axis=-1, keepdims=True)
    return gamma * (x - mean) / np.sqrt(var + eps) + beta


def rms_norm(x, weight, eps):
    ms = (x ** 2).mean(axis=-1, keepdims=True)
    return weight * x / np.sqrt(ms + eps)
```

LayerNorm đưa mỗi vector token về tâm và điều chỉnh tỷ lệ, rồi áp dụng một hệ số tỷ lệ và độ dịch được học. RMSNorm giữ hướng của vector và chỉ chỉnh độ lớn của nó. Nó không có phép trừ trung bình và không có độ dịch, tiết kiệm một phép rút gọn cho mỗi token và một vector tham số cho mỗi lớp.

### The epsilon

Epsilon tồn tại để giữ cho phép chia được xác định khi phương sai hoặc trung bình bình phương gần không. Bên trong căn nó chặn dưới mẫu số. Bên ngoài căn nó không giúp gì cho phương sai bằng không và dịch mọi đầu ra đi một hằng số, điều này sai trong cả hai trường hợp. Nhiệm vụ thực hành có một biến thể lỗi cho mỗi cách đặt này.

### Over which axis

Cả hai phép chuẩn hóa đều rút gọn trên trục cuối cùng, trục đặc trưng, độc lập cho mỗi token trong mỗi phần tử batch. Rút gọn trên trục batch biến lớp thành một thống kê batch, thay đổi theo thành phần batch và làm hỏng suy luận một ví dụ.

### Biased variance

LayerNorm dùng phương sai có độ chệch, trung bình của các độ lệch bình phương trên số lượng đặc trưng. Ước lượng không chệch với mẫu số ít hơn một là một quy ước thống kê không thuộc về đây và khiến đầu ra không khớp với mọi phiên bản thư viện chuẩn theo một hệ số phụ thuộc vào chiều rộng.

### Why the swap is safe in the assembly

Phép chuẩn hóa cuối cùng nằm giữa block cuối và head buộc chung, và cả hai hàm nhận và trả về cùng hình dạng. Đổi lớp, bỏ tham số độ dịch, và head, embedding cùng vòng lặp sinh được giữ nguyên.

## Follow-ups

- **Level 3:** Đối số epsilon của bên gọi kiểm soát điều gì, và điều gì xảy ra nếu hàm bỏ qua nó? Expected: mức sàn của mẫu số; bỏ qua nó và dùng một hằng số cố định khiến phép so sánh với bản tham chiếu thất bại khi bên gọi truyền một giá trị khác.
- **Level 3:** Tại sao RMSNorm không có tham số độ dịch? Expected: nó không đưa đầu vào về tâm, vì vậy không có trung bình nào để khôi phục; bias của lớp tuyến tính tiếp theo có thể hấp thụ một độ dịch nếu cần.
- **Level 4:** Một checkpoint đã tiền huấn luyện có các hệ số tỷ lệ và độ dịch LayerNorm và bạn thay bằng RMSNorm. Điều gì hỏng? Expected: độ dịch không có nơi để nạp và hệ số tỷ lệ đã được học trên các đầu vào đã đưa về tâm, vì vậy mô hình được nạp không còn khớp với hàm đã huấn luyện.

## Wrong answers

- "RMSNorm là LayerNorm bỏ độ dịch." Nó cũng bỏ phép trừ trung bình; không có sự khác biệt đó nó sẽ không phải là một lớp khác.
- "Vị trí epsilon không quan trọng đối với các đầu vào bình thường." Nó quan trọng chính xác đối với các đầu vào mà nó tồn tại để xử lý, những đầu vào có phương sai gần không.
- "Dùng phương sai không chệch, nó đúng hơn." Các phiên bản thư viện chuẩn dùng dạng có độ chệch; lựa chọn là một hợp đồng, không phải một câu hỏi thống kê.

## Taught in

[Bài học lắp ráp GPT](../../../phases/19-capstone-projects/35-gpt-model-assembly/) đặt LayerNorm cuối cùng và nêu việc đổi sang RMSNorm, và [bài thực hành chuẩn hóa](../../../practice/layer-norm-rms-norm/) kiểm tra cả hai hàm.
