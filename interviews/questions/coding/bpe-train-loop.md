---
id: bpe-train-loop
title: Train a BPE merge list from word counts
card: coding
kind: take-home
level: 2
roles: [applied-ai-engineer, ai-data-engineer, inference-engineer]
rounds: [coding, take-home]
tags: [bpe, tokenization, merge-table]
minutes: 30
lessons: [phases/19-capstone-projects/30-bpe-tokenizer-from-scratch, phases/10-llms-from-scratch/01-tokenizers]
manuals: []
practice: [bpe-merge-step]
cheatsheet: [tokenization]
related: [coding/bpe-merge-no-overlap, coding/tokenizer-roundtrip-specials]
updated: 2026-11-03
---

Bạn nhận một corpus dưới dạng một dictionary ánh xạ từ các từ, mỗi từ là một tuple các byte id, đến số lần từ đó xuất hiện. Viết vòng lặp huấn luyện tạo ra một danh sách các phép gộp có thứ tự, và nêu ba quy tắc làm cho vòng lặp có tính xác định. Sau đó cho tôi biết vòng lặp không được làm gì với dữ liệu của bên gọi.

## Short answer

Mỗi bước đếm mọi cặp kề nhau bên trong mỗi từ, được gán trọng số theo tần suất từ, chọn cặp có số đếm cao nhất, viết lại mọi lần xuất hiện của cặp đó thành một id mới, và ghi lại phép gộp. Ba quy tắc là: các cặp không bao giờ vượt qua ranh giới từ, khi bằng nhau thì chọn cặp nhỏ nhất theo thứ tự tuple, và vòng lặp dừng khi không còn cặp nào lặp lại. Dictionary đầu vào và các tuple của nó không bao giờ bị thay đổi; vòng lặp xây dựng một corpus mới ở mỗi bước.

## Full answer

### The loop

```python
def train(units, num_merges, first_id=256):
    merges = []
    units = dict(units)
    for i in range(num_merges):
        pairs = count_pairs(units)
        best = best_pair(pairs)
        if best is None or pairs[best] < 2:
            break
        new_id = first_id + i
        units = {apply_merge(word, best, new_id): freq for word, freq in units.items()}
        merges.append((best, new_id))
    return merges, units
```

Các id đầu tiên được dành cho các byte thô, vì vậy phép gộp đầu tiên nhận id trống tiếp theo và mỗi phép gộp sau nhận id kế tiếp. Danh sách gộp theo thứ tự huấn luyện chính là tokenizer. Mã hóa văn bản mới áp dụng cùng các phép gộp theo cùng thứ tự, vì vậy một thay đổi thứ tự lúc suy luận giải mã ra một luồng id khác.

### Weighted counts

Một cặp bên trong một từ xuất hiện năm lần cộng năm vào số đếm, không phải một. Đếm mỗi lần xuất hiện một lần khiến các từ dài hiếm gặp lấn át các từ ngắn phổ biến, và thứ tự gộp thay đổi. Các cặp không đi từ cuối một từ sang đầu từ tiếp theo; việc tách từ là thứ giữ các phép gộp bên trong từ và cho phép chúng khái quát hóa.

### Ties and the stop rule

Hai cặp có cùng số đếm phải được xử lý theo cùng một cách trong mọi lần chạy, vì vậy cặp nhỏ nhất theo thứ tự tuple thắng. Không có một quy tắc cố định, thứ tự dictionary quyết định và hai lần huấn luyện trên cùng corpus tạo ra các tokenizer khác nhau. Vòng lặp dừng sớm khi số đếm tốt nhất dưới hai, vì một cặp xuất hiện một lần không nén được gì và chỉ tiêu tốn các vị trí trong từ vựng.

### Do not change the input

Dictionary và các tuple của bên gọi giữ nguyên như trước. Xóa rồi điền lại dictionary tại chỗ, hoặc viết lại các tuple thông qua một list, thay đổi dữ liệu mà bên gọi có thể vẫn còn dùng. Mỗi bước xây dựng một dictionary mới từ các từ đã gộp.

## Follow-ups

- **Level 2:** Tại sao số lượng ký hiệu giảm khi huấn luyện tiến triển, và điều đó làm gì với chi phí của một bước? Expected: mỗi phép gộp làm ngắn các từ, vì vậy số lượng cặp trên corpus giảm và các bước sau rẻ hơn.
- **Level 2:** Quy tắc xử lý bằng nhau bảo vệ điều gì? Expected: khả năng tái lập; cùng một corpus phải cho cùng một danh sách gộp trên mọi máy.
- **Level 3:** Hai từ gộp thành cùng một tuple sau một bước. Dictionary mới phải làm gì? Expected: cộng các tần suất của chúng với nhau thay vì chỉ giữ tần suất cuối cùng.
- **Level 3:** Kích thước từ vựng liên quan đến số phép gộp như thế nào? Expected: khối byte cơ sở cộng một id cho mỗi phép gộp, cộng bất kỳ id đặc biệt dành riêng nào.

## Wrong answers

- "Đếm mỗi cặp một lần cho mỗi từ." Việc gán trọng số theo tần suất là thứ khiến các cặp phổ biến thắng sớm.
- "Lấy cặp đầu tiên có số đếm lớn nhất." Thứ tự dictionary không ổn định giữa các đầu vào, vì vậy tokenizer trở nên không thể tái lập.
- "Tiếp tục gộp cho đến khi dùng hết ngân sách." Một cặp xuất hiện một lần không thu được gì và lãng phí từ vựng.

## Taught in

[Bài học BPE từ đầu](../../../phases/19-capstone-projects/30-bpe-tokenizer-from-scratch/) đưa ra vòng lặp huấn luyện và hợp đồng bảng gộp, [bài học tokenizer](../../../phases/10-llms-from-scratch/01-tokenizers/) đi qua một chuỗi gộp bằng tay, và [bài thực hành BPE](../../../practice/bpe-merge-step/) kiểm tra quy tắc xử lý bằng nhau và quy tắc dừng.
