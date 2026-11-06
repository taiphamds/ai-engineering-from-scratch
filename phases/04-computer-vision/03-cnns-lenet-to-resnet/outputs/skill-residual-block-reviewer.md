---
name: skill-residual-block-reviewer
description: Review a PyTorch residual block for skip-connection correctness, BN placement, activation order, and shape alignment
version: 1.0.0
phase: 4
lesson: 3
tags: [computer-vision, resnet, code-review, pytorch]
---

# Residual Block Reviewer

Một người đánh giá tập trung cho bất kỳ `nn.Module` PyTorch nào tuyên bố triển khai một khối phần dư. Phát hiện bốn sai lầm gây ra gần như mọi bản viết lại ResNet hỏng.

## When to use

- Ai đó viết một BasicBlock hoặc Bottleneck tùy chỉnh và mất mát là NaN hoặc accuracy mắc kẹt.
- Bạn đang chuyển một khối từ framework này sang framework khác và muốn xác minh tương đương.
- Bạn đang đánh giá một PR thay đổi nội bộ ResNet (pre-activation, squeeze-excite, anti-alias).
- Một mô hình phát hành ổn trên đầu vào cỡ CIFAR nhưng sập trên độ phân giải ImageNet vì shortcut sai.

## Inputs

- Một định nghĩa lớp PyTorch, dưới dạng văn bản mã nguồn hoặc một đường dẫn có thể import.
- `variant` tùy chọn: `basic` | `bottleneck` | `preact` | `seblock`.

## Four checks

### 1. Shortcut shape alignment

Với bất kỳ khối nào có `stride != 1` hoặc `in_channels != out_channels`, đường shortcut **phải** là một module khớp hình dạng — thường là một tích chập 1x1 cộng BN. Một `nn.Identity()` đơn thuần trong trường hợp này chắc chắn gây lỗi không khớp hình dạng khi truyền xuôi.

Chẩn đoán:
```
[shortcut]
  detected:  nn.Identity | 1x1 Conv + BN | 1x1 Conv + BN + ReLU | other
  required:  shape-matching Conv if (stride != 1 or in_c != out_c) else Identity
  verdict:   ok | wrong | unnecessarily heavy
```

### 2. BN placement relative to the addition

Phép cộng `out + shortcut(x)` phải xảy ra **trước** ReLU cuối (hậu kích hoạt, ResNet gốc) hoặc hoàn toàn không có ReLU cuối (ResNet v2 tiền kích hoạt). Một khối áp dụng ReLU trong nhánh chính rồi thêm shortcut thô tạo ra phạm vi kích hoạt bất đối xứng làm hại huấn luyện.

Chẩn đoán:
```
[activation order]
  pattern:  post-act (conv-BN-ReLU-conv-BN-add-ReLU) | pre-act (BN-ReLU-conv-BN-ReLU-conv-add) | other
  verdict:  ok | suspect
```

### 3. Bias on conv layers

Các tích chập ngay sau là BatchNorm nên có `bias=False`. Beta của BN đã tham số hóa bias, nên bias tích chập bổ sung lãng phí tham số và có thể làm chậm hội tụ.

Chẩn đoán:
```
[bias]
  convs with BN and bias=True: <count>
  recommended fix: set bias=False on those layers
```

### 4. In-place ReLU and autograd

`nn.ReLU(inplace=True)` trên tensor sẽ được cộng với shortcut ghi đè các giá trị có thể vẫn cần cho phép cộng phần dư. Đánh dấu mọi `inplace=True` không được theo sau bởi một lớp tạo tensor mới trước phép cộng.

Chẩn đoán:
```
[in-place]
  risky inplace ops: <list>
  fix: inplace=False before the residual add
```

## Report

```
[block-review]
  variant:       basic | bottleneck | preact | se | other
  shortcut:      ok | wrong | heavy
  activation:    ok | suspect
  bias-bn:       ok | <N> convs need bias=False
  in-place:      ok | <N> risky ops
  summary:       one sentence
```

## Rules

- Không viết lại khối. Chỉ báo cáo.
- Nếu khối đúng, nói `ok` ở mọi nơi rồi dừng. Không đề xuất.
- Nếu nhiều thứ sai, liệt kê theo thứ tự trên (shortcut trước vì nó là nguyên nhân gây sập thường gặp nhất).
- Không bao giờ đánh dấu một biến thể tiền kích hoạt hoặc squeeze-excite có chủ đích là sai khi người dùng đã chỉ định nó.
