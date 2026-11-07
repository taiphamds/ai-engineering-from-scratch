---
id: cross-attention-mask-bug
title: A caption decoder with its masks swapped
card: multimodal
kind: code-reading
level: 2
roles: [applied-ai-engineer]
rounds: [coding, debugging]
tags: [cross-attention, causal-mask, kv-cache, code-reading]
minutes: 12
lessons: [phases/19-capstone-projects/61-cross-attention-fusion, phases/12-multimodal-ai/04-flamingo-gated-cross-attention]
manuals: []
practice: []
cheatsheet: [vlm-from-scratch]
related: [multimodal/perceiver-fixed-tokens]
updated: 2026-11-03
---

Decoder thị giác-ngôn ngữ của một đồng đội huấn luyện tốt, nhưng khi suy luận các caption sai từ token thứ hai trở đi, và một kiểm thử với một ảnh 197 token crash với một lỗi shape. Đọc block và vòng lặp decode và tìm các vấn đề.

```python
def causal_mask(n):
    return torch.tril(torch.ones(n, n, dtype=torch.bool))


class DecoderBlock(nn.Module):
    def forward(self, text, image, mask):
        text = text + self.self_attn(self.ln1(text), mask=None)
        text = text + self.cross_attn(self.ln2(text), image, mask=mask)
        text = text + self.ffn(self.ln3(text))
        return text


def generate(model, image, prompt_ids, steps):
    ids = prompt_ids
    for _ in range(steps):
        memory = model.encode_image(image)
        mask = causal_mask(ids.shape[1])
        logits = model.decode(ids, memory, mask)
        ids = torch.cat([ids, logits[:, -1].argmax(-1, keepdim=True)], dim=1)
    return ids
```

## Short answer

Các mask bị đổi chỗ. Self-attention trên văn bản chạy không có mask, nên mọi vị trí thấy tương lai trong huấn luyện, và mô hình học sao chép token tiếp theo thay vì dự đoán nó, điều hỏng ngay khi phải sinh. Cross-attention nhận mask văn bản nhân quả, vuông theo độ dài văn bản và không thể áp dụng cho các điểm trải trên văn bản nhân ảnh, do đó có lỗi shape với 197 token ảnh. Vòng lặp decode cũng encode lại ảnh trên mọi bước; encode một lần, cache các key và value ảnh, và tái sử dụng chúng.

## Full answer

### The mask discipline

| Attention | Query | Key | Mask |
|---|---|---|---|
| Self-attention trên văn bản | văn bản, độ dài Nt | văn bản, độ dài Nt | nhân quả, tam giác dưới Nt nhân Nt |
| Cross-attention vào ảnh | văn bản, độ dài Nt | ảnh, độ dài Nv | không có |

Văn bản không được nhìn trước trong tự hồi quy. Ảnh được quan sát đầy đủ trước khi bất kỳ văn bản nào tồn tại, và các patch của nó không có thứ tự, nên mọi vị trí văn bản có thể attend đến mọi patch.

### Bug 1: no mask on self-attention

Với `mask=None`, vị trí i attend đến các vị trí sau nó. Dưới teacher forcing, mục tiêu của vị trí i là token tại i cộng một, giờ nhìn thấy, nên loss giảm nhanh và mô hình học tra nó. Khi suy luận, tương lai không tồn tại, và từ token thứ hai các caption hỏng. Đó là triệu chứng trong báo cáo.

### Bug 2: the causal mask on cross-attention

Các điểm cross-attention có shape Nt nhân Nv. Một mask nhân quả shape Nt nhân Nt chỉ vừa khi Nv bằng Nt, và khi đó nó âm thầm che một phần ảnh khỏi các token văn bản sớm. Với một bộ nhớ ảnh 197 token và văn bản ngắn hơn, các shape không broadcast và lượt forward ném lỗi. Capstone thêm một hàm xác thực shape, để sai lầm này ném một lỗi rõ thay vì làm hỏng một đường cong loss.

### Observation 3: no key and value cache

Ảnh không thay đổi trong decoding. Encode nó trên mọi bước và chiếu lại các key và value của nó nhân chi phí encoder nặng với số token được sinh. Encode một lần, chiếu một lần, lưu các key và value, và truyền chúng cho mọi bước. Capstone kiểm thử rằng các đường có cache và không cache cho logit giống hệt.

### The fixed block

```python
def forward(self, text, image_kv, text_mask):
    text = text + self.self_attn(self.ln1(text), mask=text_mask)
    text = text + self.cross_attn(self.ln2(text), image_kv, mask=None)
    text = text + self.ffn(self.ln3(text))
    return text
```

## Follow-ups

- **Level 2:** Tại sao training loss trông ổn với bug đầu tiên? Expected: teacher forcing đặt token mục tiêu trong đầu vào một vị trí sau, và attention không mask có thể đọc nó; loss đo một lần tra, không phải một dự đoán.
- **Level 2:** Khi nào cross-attention cần một mask? Expected: với nhiều ảnh và đoạn văn bản xen kẽ, nơi một đoạn chỉ được thấy các ảnh trước nó; với một ảnh và một caption, không có.
- **Level 3:** Gate từ thiết kế Flamingo thêm gì vào block này, và tại sao? Expected: một vô hướng được học qua một hyperbolic tangent trên residual cross-attention, bắt đầu ở không, để một mô hình ngôn ngữ đóng băng giữ hành vi văn bản khi khởi tạo và trộn ảnh vào dần.
- **Level 3:** Bạn kiểm thử đường cache như thế nào? Expected: chạy cùng prompt có và không có cache và assert rằng các logit khớp trong dung sai float; capstone cung cấp kiểm thử đó.

## Wrong answers

- "Dùng mask nhân quả trên cả hai attention cho chắc." Các điểm cross-attention là văn bản nhân ảnh, nên một mask văn bản vuông hoặc ném lỗi hoặc che một phần ảnh; ảnh không cần mask.
- "Các caption sai vì encoder ảnh yếu." Một mô hình đúng ở token đầu và sai từ token thứ hai đã rò rỉ tương lai trong huấn luyện; mask là nguyên nhân.
- "Tính lại ảnh mỗi bước là ổn, encoder nhỏ." Encoder là phần nặng nhất mỗi lời gọi, và ảnh không bao giờ thay đổi; cache là thứ khiến tạo caption nhanh.

## Taught in

[Capstone hợp nhất cross-attention](../../../phases/19-capstone-projects/61-cross-attention-fusion/) đặt các shape mask và cache key và value, và [bài học Flamingo](../../../phases/12-multimodal-ai/04-flamingo-gated-cross-attention/) thêm gate và mask xen kẽ.
