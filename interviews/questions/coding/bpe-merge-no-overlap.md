---
id: bpe-merge-no-overlap
title: A merge that lets two matches share a symbol
card: coding
kind: code-reading
level: 2
roles: [applied-ai-engineer, ai-data-engineer, inference-engineer]
rounds: [coding, debugging]
tags: [bpe, tokenization, off-by-one]
minutes: 8
lessons: [phases/10-llms-from-scratch/01-tokenizers, phases/19-capstone-projects/30-bpe-tokenizer-from-scratch]
manuals: []
practice: [bpe-merge-step]
cheatsheet: [tokenization]
related: [coding/bpe-train-loop]
updated: 2026-11-03
---

Hàm này viết lại một từ sau khi một phép gộp BPE được chọn. Trên từ `(7, 7, 7)` với cặp `(7, 7)` nó trả về `(300, 300, 7)`. Hãy tìm lỗi và đưa ra đầu ra đúng.

```python
def apply_merge(symbols, pair, new_id):
    out = []
    i = 0
    while i < len(symbols):
        if i + 1 < len(symbols) and symbols[i] == pair[0] and symbols[i + 1] == pair[1]:
            out.append(new_id)
            i += 1
        else:
            out.append(symbols[i])
            i += 1
    return tuple(out)
```

## Short answer

Sau một lần khớp lượt quét di chuyển một vị trí thay vì hai, vì vậy ký hiệu thứ hai của lần khớp được đọc lại: nó bắt đầu lần khớp tiếp theo hoặc được sao chép vào đầu ra. Các lần khớp không được dùng chung một ký hiệu. Kết quả đúng là `(300, 7)`: hai số bảy đầu tiên trở thành một id mới và số bảy thứ ba giữ nguyên.

## Full answer

### What the bug does

Với bước một sau một lần khớp, lượt quét thấy cặp ở các vị trí không và một, xuất id mới, rồi nhìn vào các vị trí một và hai, cũng khớp. Từ nhận thêm một ký hiệu mà nó chưa từng có, vì vậy corpus đã gộp bị sai và mọi bước sau đều đếm các cặp trên những từ bị hỏng. Mã hóa lúc suy luận tái sử dụng cùng hàm, vì vậy mọi văn bản có một ký hiệu lặp lại đều giải mã thành các byte khác với những gì được đưa vào.

### The fix

```python
        if i + 1 < len(symbols) and symbols[i] == pair[0] and symbols[i + 1] == pair[1]:
            out.append(new_id)
            i += 2
```

Quét từ trái sang phải và tiếp tục sau ký hiệu thứ hai của lần khớp. Vòng lặp gộp trong chương tokenizer chính xác là như vậy, và nhiệm vụ thực hành có một biến thể lỗi cho bước một thất bại trên `[a, a, a]`.

### Why the left-to-right rule matters

Thay thế không chồng lấn từ bên trái là một quy ước, và vòng lặp huấn luyện cùng bộ mã hóa phải dùng chung nó. Nếu huấn luyện gộp từ bên trái và bộ mã hóa gộp từ bên phải, cùng một từ sẽ nhận các id khác nhau khi huấn luyện và khi suy luận. Bảng gộp chỉ hoạt động khi cả hai phía áp dụng nó theo cùng một cách.

### A related check

Hàm trả về một tuple mới. Nó không được ghi vào chuỗi của bên gọi, vì vòng lặp huấn luyện vẫn giữ corpus cũ trong khi xây dựng corpus mới.

## Follow-ups

- **Level 2:** Cùng lỗi đó làm gì với số đếm cặp của bước huấn luyện tiếp theo? Expected: nó đếm các cặp không tồn tại trong corpus thực, vì vậy các phép gộp sau được chọn dựa trên những con số sai.
- **Level 2:** Đưa ra một đầu vào mà lỗi tạo ra một đáp án đúng. Expected: chỉ một từ không có lần khớp nào cho cặp, chẳng hạn `(7, 8, 7)` với `(7, 7)`; mỗi lần khớp để lại một bản sao thêm của ký hiệu thứ hai của nó.
- **Level 3:** Một kiểm thử khứ hồi phát hiện lỗi này như thế nào? Expected: mã hóa một chuỗi có một byte lặp lại, giải mã các id, và so sánh các byte; ký hiệu gộp thừa mở rộng thành nhiều byte hơn đầu vào đã có.

## Wrong answers

- "Thay thế cặp bằng một phương thức chuỗi trên các ký hiệu đã nối." Các id là số nguyên, không phải ký tự, và việc nối chúng che giấu các ranh giới giữa các id.
- "Thay vào đó khớp từ bên phải." Mỗi hướng đều hoạt động khi dùng riêng, nhưng huấn luyện và suy luận phải dùng cùng một hướng; từ trái sang phải là quy ước.
- "Trả về một list thay vì một tuple để nhanh hơn." Các từ là khóa dictionary và phải giữ được khả năng băm.

## Taught in

[Bài học tokenizer](../../../phases/10-llms-from-scratch/01-tokenizers/) viết vòng lặp gộp với bước hai vị trí, [bài học BPE từ đầu](../../../phases/19-capstone-projects/30-bpe-tokenizer-from-scratch/) giải thích hợp đồng gộp dùng chung, và [bài thực hành BPE](../../../practice/bpe-merge-step/) kiểm thử trường hợp chồng lấn.
