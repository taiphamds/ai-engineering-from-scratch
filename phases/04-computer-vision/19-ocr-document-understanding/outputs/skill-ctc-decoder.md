---
name: skill-ctc-decoder
description: Write greedy and beam-search CTC decoders from scratch, including length normalisation
version: 1.0.0
phase: 4
lesson: 19
tags: [ocr, ctc, decoding, sequence-models]
---

# CTC Decoder

Tạo hai quy trình giải mã cho đầu ra CTC: tham lam (nhanh) và chùm (tốt hơn trên đầu vào nhiễu).

## When to use

- Chạy suy luận OCR trên các đầu ra CRNN tùy chỉnh.
- Đo hiệu năng mô hình OCR được tiền huấn luyện với các bộ giải mã khác nhau.
- Triển khai tìm kiếm chùm đơn giản mà không kéo ctcdecode vào.

## Inputs

- `log_probs`: log-softmax (T, N, C) trên vốn từ (chỉ số 0 = blank theo quy ước).
- `vocab`: danh sách C ký tự.
- `beam_width` (chỉ chùm): thường 5-10.

## Greedy decoder

```python
def greedy_ctc_decode(log_probs, vocab, blank=0):
    preds = log_probs.argmax(dim=-1).transpose(0, 1).cpu().tolist()
    out = []
    for seq in preds:
        decoded = []
        prev = None
        for idx in seq:
            if idx != prev and idx != blank:
                decoded.append(vocab[idx])
            prev = idx
        out.append("".join(decoded))
    return out
```

## Beam search decoder

```python
import heapq
import math

def beam_ctc_decode(log_probs, vocab, beam_width=5, blank=0):
    T, N, C = log_probs.shape
    lp = log_probs.cpu()
    results = []
    for n in range(N):
        beams = {("",): (0.0, -math.inf)}  # (prefix_tuple) -> (p_blank, p_nonblank)
        for t in range(T):
            logits_t = lp[t, n]
            new_beams = {}
            for prefix, (p_b, p_nb) in beams.items():
                for c in range(C):
                    p = logits_t[c].item()
                    if c == blank:
                        nb = p_b + p
                        nnb = p_nb + p
                        upd = new_beams.get(prefix, (-math.inf, -math.inf))
                        new_beams[prefix] = (
                            _logsumexp(upd[0], _logsumexp(nb, nnb)),
                            upd[1],
                        )
                    else:
                        last = prefix[-1] if prefix else ""
                        char = vocab[c]
                        if char == last:
                            # Case 1: stay on same prefix (collapse from p_nb)
                            upd = new_beams.get(prefix, (-math.inf, -math.inf))
                            new_beams[prefix] = (upd[0], _logsumexp(upd[1], p_nb + p))
                            # Case 2: extend prefix via blank-separated repeat ("a_a" -> "aa")
                            new_prefix = prefix + (char,)
                            upd = new_beams.get(new_prefix, (-math.inf, -math.inf))
                            new_beams[new_prefix] = (upd[0], _logsumexp(upd[1], p_b + p))
                        else:
                            new_prefix = prefix + (char,)
                            upd = new_beams.get(new_prefix, (-math.inf, -math.inf))
                            nb = _logsumexp(p_b, p_nb) + p
                            new_beams[new_prefix] = (upd[0], _logsumexp(upd[1], nb))
            beams = dict(heapq.nlargest(
                beam_width,
                new_beams.items(),
                key=lambda kv: _logsumexp(kv[1][0], kv[1][1]),
            ))
        best = max(beams.items(), key=lambda kv: _logsumexp(kv[1][0], kv[1][1]))[0]
        results.append("".join(best))
    return results


def _logsumexp(a, b):
    if a == -math.inf: return b
    if b == -math.inf: return a
    m = max(a, b)
    return m + math.log(math.exp(a - m) + math.exp(b - m))
```

## Rules

- Chỉ số blank trong CTC là 0 theo quy ước trong `nn.CTCLoss` của PyTorch.
- Tìm kiếm chùm cải thiện accuracy trên đầu vào độ tin cậy thấp; trên đầu vào sạch cải thiện <1% CER.
- Không bao giờ cắt chùm dưới 5; đánh đổi accuracy-độ trễ phẳng đi dưới mức đó.
- Khi chạy tìm kiếm chùm trong ngân sách độ trễ eo hẹp, hạ xuống tham lam; chất lượng giảm ít trên hầu hết dữ liệu OCR production.
- Với vốn từ lớn (CJK có 3000+ ký tự), chuyển sang `ctcdecode` (C++) thay phiên bản Python thuần trên; chùm Python nhanh chóng thành nút thắt.
