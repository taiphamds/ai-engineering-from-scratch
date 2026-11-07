---
id: sliding-window-dataset
title: Count the windows a token stream gives you
card: tokenization-decoding
kind: code-reading
level: 2
roles: [ai-data-engineer, applied-ai-engineer, inference-engineer]
rounds: [coding, ml-depth]
tags: [dataset, sliding-window, stride, shift-by-one, reproducibility]
minutes: 8
lessons: [phases/19-capstone-projects/31-tokenized-dataset-sliding-window]
manuals: []
practice: []
cheatsheet: [gpt-from-scratch-training]
related: [tokenization-decoding/read-the-decoder-round-trip]
updated: 2026-11-03
---

Đọc mã dataset này từ bài học. `ids` là toàn bộ kho ngữ liệu dưới dạng một tensor các id token.

```python
@staticmethod
def count_windows(num_ids, context_length, stride):
    usable = num_ids - (context_length + 1)
    if usable < 0:
        return 0
    return 1 + usable // stride

def __getitem__(self, index):
    start = index * self.stride
    end = start + self.context_length + 1
    window = self.ids[start:end]
    return window[:-1].clone(), window[1:].clone()
```

Tại sao mỗi cửa sổ cần thêm một id so với độ dài ngữ cảnh, số lượng thay đổi thế nào khi bạn giảm stride còn một nửa, và loader làm gì để hai lần chạy thấy cùng thứ tự?

## Short answer

Mục tiêu là đầu vào dịch trái một vị trí, nên một ví dụ T id đầu vào cần T cộng 1 id, và số lượng là 1 cộng phần nguyên của (N trừ T trừ 1) chia stride, hoặc không khi luồng quá ngắn. Giảm stride từ T xuống T chia 2 cho khoảng gấp đôi số ví dụ với một nửa mỗi cửa sổ được dùng chung với cửa sổ lân cận, và stride 1 nhân số lượng lên khoảng T. Loader đặt seed cho một generator bằng seed cơ sở cộng chỉ số epoch, nên thứ tự xáo trộn giống nhau ở mỗi lần khởi động lại và mỗi epoch nhận một thứ tự xáo trộn mới.

## Full answer

### The shape contract

Một mô hình ngôn ngữ nhân quả tiêu thụ các id đầu vào `(B, T)` và các id mục tiêu `(B, T)` trong đó mục tiêu ở vị trí t là đầu vào tại t cộng 1. Một lát T cộng 1 id cho cả hai tensor từ cùng bộ nhớ, khiến lỗi dịch không thể xảy ra: `window[:-1]` và `window[1:]`.

### The count

```text
examples = max(0, 1 + (N - (T + 1)) // S)
```

Cửa sổ cuối bị bỏ khi không thể lấp T cộng 1 id. Padding nó cũng hợp lệ, nhưng làm phức tạp loss mask, nên bài học bỏ.

### Stride against redundancy

| Stride | Chồng lấn | Số ví dụ |
|---|---|---|
| T | không có | khoảng N chia T |
| T chia 2 | một nửa mỗi cửa sổ | khoảng gấp đôi |
| 1 | gần như tất cả | khoảng T lần |

Nhiều chồng lấn hơn dịch các ranh giới cửa sổ, nên mô hình thấy nhiều tác vụ dự-đoán-token-tiếp-theo khác biệt hơn mỗi epoch, với cái giá tính toán nhiều hơn mỗi epoch. Phần lớn các lần tiền huấn luyện dùng stride bằng độ dài ngữ cảnh vì kho ngữ liệu đã lớn hơn những gì một epoch có thể bao phủ.

### Memory

Dataset lưu một bản sao luồng id và tính điểm bắt đầu mỗi cửa sổ khi cần, nên chi phí bộ nhớ không tăng theo số ví dụ mà stride tạo.

### Determinism

```python
generator = torch.Generator()
generator.manual_seed(base_seed + epoch)
```

Cùng seed cơ sở cho cùng thứ tự trong mỗi epoch của mỗi lần chạy, và chỉ số epoch cho mỗi epoch một thứ tự xáo trộn mới. Không có điều này, hai lần chạy khác một siêu tham số cũng khác thứ tự dữ liệu, và các đường cong loss phân kỳ vì các lý do không liên quan tới thay đổi.

## Follow-ups

- **Level 2:** Tại sao không padding cửa sổ cuối thay vì bỏ? Expected: padding cần một loss mask để các vị trí pad không được tính; bỏ giữ loss đơn giản.
- **Level 3:** Tại sao đặt seed theo từng epoch mà không một lần mỗi lần chạy? Expected: một generator được đặt seed một lần và tiến qua các epoch cũng có thể tái lập, nhưng thứ tự epoch k khi đó phụ thuộc vào phát lại mọi epoch trước; đặt seed bằng seed cơ sở cộng chỉ số epoch xây trực tiếp thứ tự epoch k, điều một lần chạy được tiếp tục cần.
- **Level 3:** Một stride 1 tốn gì và mang lại gì? Expected: tính toán mỗi epoch khoảng T lần và dư thừa nặng, đổi lấy đa dạng ranh giới tối đa.
- **Level 4:** Bạn tách luồng id thành huấn luyện và validation sau khi tạo cửa sổ. Điều gì sai? Expected: các cửa sổ chồng lấn vượt qua phần tách, nên văn bản validation xuất hiện trong huấn luyện; tách luồng trước, rồi tạo cửa sổ mỗi phần.

## Wrong answers

- "Số ví dụ là N chia T." Điều đó bỏ qua id thêm mỗi cửa sổ và stride; công thức có cả hai.
- "Một seed cố định khiến mỗi epoch thấy cùng thứ tự." Chỉ số epoch được cộng vào seed, nên mỗi epoch nhận một thứ tự xáo trộn mới và mỗi lần chạy có thể tái lập.
- "Mục tiêu là cùng cửa sổ như đầu vào." Nó là cửa sổ dịch trái một vị trí; cùng các id cho cả hai tensor từ một lát.

## Taught in

[Capstone dataset cửa sổ trượt](../../../phases/19-capstone-projects/31-tokenized-dataset-sliding-window/) cung cấp công thức đếm, lát dịch-một-vị-trí và loader có seed.
