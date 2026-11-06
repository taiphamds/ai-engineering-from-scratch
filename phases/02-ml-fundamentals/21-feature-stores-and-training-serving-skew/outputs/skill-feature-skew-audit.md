---
name: skill-feature-skew-audit
description: Kiểm toán một pipeline đặc trưng về du hành thời gian và training-serving skew
version: 1.0.0
phase: 2
lesson: 21
tags: [feature-store, point-in-time, training-serving-skew, leakage, backfill]
---

# Feature Skew Audit

Sử dụng skill này khi một mô hình đạt điểm tốt ngoại tuyến và tệ hơn trong production. Cũng sử dụng nó khi một nhóm thêm một feature store, và trước khi một đặc trưng mới đi vào hoạt động. Làm qua các bước theo thứ tự và ghi lại mỗi phát hiện.

## Step 1: Map both paths

Với mọi đặc trưng, viết ra hai dòng:

```text
training path: <source table> -> <transformation code> -> <join to labels>
serving path:  <source> -> <transformation code> -> <store or request-time compute>
```

Nếu hai dòng nêu tên mã biến đổi khác nhau, đánh dấu đặc trưng "hai đường mã". Đó là rủi ro skew đầu tiên.

## Step 2: Check the training join for time travel

- Phép join sử dụng dấu thời gian nhãn, không chỉ khóa thực thể.
- Phép join lấy hàng mới nhất có thời gian sự kiện ở hoặc trước thời điểm nhãn.
- Phép join bỏ các hàng cũ hơn TTL.
- Các hàng backfill hoặc sửa chữa mang dấu thời gian tạo, và phép join bỏ qua các hàng được tạo sau thời điểm nhãn.
- Các cửa sổ tổng hợp kết thúc tại thời điểm nhãn. Một cửa sổ như "30 ngày quanh nhãn" gây rò rỉ.

Kiểm tra nhanh: đếm các hàng huấn luyện có hàng đặc trưng muộn hơn nhãn. Bất kỳ số đếm nào trên không là một rò rỉ.

## Step 3: Compare the definitions

Với mỗi đặc trưng, so sánh hai đường trên những điểm này:

| Điểm | Câu hỏi |
|---|---|
| Cạnh cửa sổ | Mỗi cạnh cửa sổ có được bao gồm hay loại trừ trong cả hai đường không? |
| Giá trị thiếu | Cả hai đường có sử dụng cùng mặc định cho không có lịch sử và cho các giá trị hết hạn không? |
| Đơn vị và kiểu | Cùng tiền tệ, cùng múi giờ, cùng kiểu số nguyên hoặc float? |
| Làm tròn | Cùng cách làm tròn, ở cùng bước? |
| Ánh xạ danh mục | Cùng từ vựng, cùng cách xử lý các giá trị không biết? |

## Step 4: Compare freshness

- Một giá trị huấn luyện cũ bao nhiêu tại thời điểm nhãn của nó, trung bình và tối đa?
- Một giá trị phục vụ cũ bao nhiêu lúc yêu cầu, trung bình và tối đa?
- Điều gì xảy ra khi materialization thất bại? TTL phải biến các giá trị cũ thành mặc định, không âm thầm phục vụ chúng.

Một mô hình đã huấn luyện trên các giá trị cũ tới một tuần có thể hành xử khác trên các giá trị mới. Khớp độ mới, hoặc huấn luyện lại trên các giá trị có độ mới phục vụ.

## Step 5: Measure skew

1. Ghi nhật ký các giá trị đặc trưng mà đường phục vụ sử dụng, với thực thể và thời điểm yêu cầu.
2. Tính lại cùng các khóa bằng đường huấn luyện.
3. Theo đặc trưng, báo cáo tỷ lệ không khớp và sai khác tuyệt đối trung bình.
4. Tách nguyên nhân bằng ba phép so sánh: đọc kho so với huấn luyện, tính mới so với huấn luyện, đường thứ hai so với tính mới.

Gắn cờ một đặc trưng khi hơn 1 phần trăm giá trị khác nhau, trừ khi khác biệt là một khoảng cách độ mới được ghi tài liệu.

## Step 6: Write the audit result

```text
Feature: <name, version>
Paths: shared definition | two code paths
Time travel: none found | <rows affected and cause>
Definition gaps: <window edges, defaults, units, rounding>
Freshness: training <age>, serving <age>, TTL <days>
Measured skew: <mismatch rate, mean |diff|>
Fix: <move both paths to one registry definition | fix join | align default | align TTL>
```

Thứ tự sửa: loại bỏ du hành thời gian trước, rồi chuyển cả hai đường sang một định nghĩa, rồi căn chỉnh độ mới.
