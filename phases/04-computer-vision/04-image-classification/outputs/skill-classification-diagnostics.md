---
name: skill-classification-diagnostics
description: Given a confusion matrix and class names, surface per-class failures and propose the single most impactful fix
version: 1.0.0
phase: 4
lesson: 4
tags: [computer-vision, classification, evaluation, debugging]
---

# Classification Diagnostics

Một lăng kính đọc ma trận nhầm lẫn. Accuracy tổng hợp cho bạn biết một bộ phân loại hoạt động. Ma trận nhầm lẫn cho bạn biết *nó chưa biết gì*.

## When to use

- Cái nhìn đầu tiên về hiệu suất validation của một bộ phân loại đã huấn luyện.
- Giữa các lần huấn luyện để quyết định thay đổi gì tiếp theo.
- Trước khi phát hành một mô hình: xác minh không lớp quan trọng nào đang âm thầm thất bại.
- Gỡ lỗi một sự suy giảm production khi accuracy tổng thể giảm một điểm và bạn cần biết tại sao.

## Inputs

- `cm`: ma trận nhầm lẫn CxC (hàng = thật, cột = dự đoán).
- `labels`: danh sách C tên lớp, theo cùng thứ tự.
- `class_priors` tùy chọn: tần suất huấn luyện từng lớp (mặc định là các tổng hàng của `cm`).

## Steps

1. **Tính các thước đo từng lớp.** Coi mọi phép chia cho không là thước đo không xác định cho lớp đó và báo cáo là `n/a`; không bao giờ âm thầm thay bằng 0.
   - precision_i = cm[i,i] / sum(cm[:, i])   (không xác định khi lớp chưa bao giờ được dự đoán)
   - recall_i    = cm[i,i] / sum(cm[i, :])   (không xác định khi lớp không có các mẫu sự thật nền)
   - f1_i        = 2 * p * r / (p + r)        (không xác định khi một trong hai thành phần không xác định)

2. **Xếp hạng tối đa ba lớp tệ nhất** theo F1. Nếu ma trận nhầm lẫn có ít hơn ba lớp, xếp hạng số lớp hiện có. Loại trừ các lớp có mọi thước đo không xác định.

3. **Tìm ô ngoài đường chéo lớn nhất mỗi hàng** — lớp thường lấy mất mẫu từ lớp này nhất. Báo cáo là `true -> predicted`.

4. **Phân loại kiểu thất bại** cho mỗi lớp tệ nhất. Sử dụng các ngưỡng định lượng này để nhãn có thể tái lập:
   - `ambiguity` — nhầm lẫn hai chiều với lớp khác: cả `cm[i,j] / sum(cm[i, :]) >= 0.15` và `cm[j,i] / sum(cm[j, :]) >= 0.15`.
   - `imbalance` — lớp có số lượng huấn luyện `< 0.5x` so với lớp gây nhầm lẫn hàng đầu của nó.
   - `label_noise` — `|precision_i - recall_i| >= 0.2` và lớp không nằm trên các nhánh mất cân bằng / mơ hồ.
   - `systematic` — không lớp gây nhầm lẫn đơn lẻ nào vượt tỷ phần 0.2 trong các lỗi của lớp này; các lỗi trải ra ba lớp khác trở lên.

5. **Khuyến nghị một hành động tiếp theo có tác động lớn nhất**:
   - `ambiguity` -> thu thập hoặc tổng hợp các ví dụ phân biệt, thêm tăng cường có mục tiêu giữ nguyên đặc trưng phân biệt.
   - `imbalance` -> lấy mẫu tăng cường lớp thiểu số hoặc áp dụng mất mát có trọng số lớp.
   - `label_noise` -> kiểm tra một mẫu phân tầng của lớp; sửa nhãn sai trước mọi thay đổi khác.
   - `systematic` -> tăng dữ liệu cho lớp hoặc tinh chỉnh với trọng số cao hơn trên mất mát của lớp này.

## Report

```
[diagnostics]
  aggregate accuracy: X.XX
  macro F1:           X.XX

[top-3 worst classes]
  1. class <name>  F1 = X.XX  prec = X.XX  rec = X.XX
     top confusion: <name> -> <other>  (N cases)
     failure mode:  ambiguity | imbalance | label_noise | systematic
     action:        <one sentence>

  2. ...
  3. ...

[recommendation]
  single biggest lever: <one sentence naming the class and the fix>
```

## Rules

- Trả về tối đa ba lớp. Nhiều hơn che giấu tín hiệu.
- Nêu tên lớp gây nhầm lẫn chủ đạo cho mỗi lớp tệ nhất; không bao giờ tóm tắt là "nhầm với nhiều lớp".
- Dựa mọi khuyến nghị vào bằng chứng ma trận nhầm lẫn. Không nói chung chung "thêm dữ liệu" mà không chỉ định lớp nào.
- Khi precision và recall chênh nhau hơn 0.2, luôn đánh dấu nhiễu nhãn là một khả năng — các lớp thật thường có P và R đồng đều sau huấn luyện.
