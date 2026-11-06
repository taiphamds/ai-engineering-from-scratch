---
name: skill-regression
description: Choose the right regression approach based on data characteristics and problem constraints
version: 1.0.0
phase: 2
lesson: 2
tags: [regression, linear-regression, polynomial-regression, ridge, regularization]
---

# Regression Strategy Guide

Hồi quy dự đoán các giá trị liên tục. Cách tiếp cận phù hợp phụ thuộc vào quan hệ giữa đặc trưng và mục tiêu, số đặc trưng và nguy cơ khớp quá mức.

## Decision Checklist

1. Quan hệ giữa các đặc trưng và mục tiêu có xấp xỉ tuyến tính không?
   - Có: bắt đầu với hồi quy tuyến tính thông thường
   - Không: thử các đặc trưng đa thức hoặc một mô hình phi tuyến

2. Bạn có bao nhiêu đặc trưng so với số mẫu?
   - Ít đặc trưng, nhiều mẫu: hồi quy tuyến tính thông thường hoạt động tốt
   - Nhiều đặc trưng, ít mẫu: sử dụng regularization (Ridge hoặc Lasso)
   - Nhiều đặc trưng hơn mẫu: Lasso (L1) để chọn đặc trưng, hoặc Ridge (L2) để thu nhỏ mọi trọng số

3. Bạn có cần khả năng diễn giải không?
   - Có: hồi quy tuyến tính với ít đặc trưng, hoặc Lasso để lựa chọn đặc trưng tự động
   - Không: các đặc trưng đa thức, hoặc chuyển sang các mô hình dựa trên cây hay mạng nơ-ron

4. Tập dữ liệu của bạn có nhỏ không (dưới 10,000 hàng)?
   - Sử dụng phương trình chuẩn (nghiệm dạng đóng) để có tốc độ
   - Xác thực chéo là thiết yếu để đánh giá đáng tin cậy

5. Tập dữ liệu của bạn có lớn không (hàng triệu hàng)?
   - Sử dụng gradient descent ngẫu nhiên (SGD) hoặc mini-batch gradient descent
   - Phương trình chuẩn quá chậm do nghịch đảo ma trận O(n^3)

## When to use each approach

**Hồi quy Tuyến tính Thông thường**: mốc cơ sở cho bất kỳ tác vụ hồi quy nào. Bắt đầu ở đây. Nếu R-bình phương chấp nhận được và mô hình đơn giản, dừng ở đây.

**Hồi quy Đa thức**: biểu đồ phân tán cho thấy một đường cong, không phải đường thẳng. Bắt đầu với bậc 2. Chỉ tăng nếu được hiệu năng xác thực biện minh. Bậc > 5 gần như luôn khớp quá mức.

**Hồi quy Ridge (L2)**: nhiều đặc trưng tương quan. Tất cả trọng số thu nhỏ về phía không nhưng không trọng số nào trở thành đúng bằng không. Tốt khi bạn tin mọi đặc trưng đều đóng góp.

**Hồi quy Lasso (L1)**: nhiều đặc trưng và bạn nghi chỉ một vài đặc trưng quan trọng. Lasso đẩy các trọng số đặc trưng không liên quan về đúng không, thực hiện lựa chọn đặc trưng tự động.

**Elastic Net**: kết hợp các hình phạt L1 và L2. Sử dụng khi bạn có nhiều đặc trưng tương quan và muốn một phần lựa chọn đặc trưng.

## Common mistakes

- Bỏ qua co giãn đặc trưng trước gradient descent (hội tụ trở nên cực kỳ chậm)
- Sử dụng hiệu năng tập kiểm tra để điều chỉnh siêu tham số (sử dụng tập xác thực hoặc xác thực chéo)
- Khớp đa thức bậc cao mà không kiểm tra sai số xác thực (R^2 huấn luyện luôn tăng theo bậc)
- Bỏ qua đồ thị phần dư (R^2 có thể gây hiểu lầm nếu phần dư thể hiện các mẫu)
- Xem R^2 là chỉ số duy nhất (kiểm tra phân phối phần dư, MAE và các ngưỡng riêng của miền)

## Quick reference

| Phương pháp | Khi nào sử dụng | Regularization | Lựa chọn đặc trưng |
|--------|------------|---------------|-------------------|
| OLS | Mốc cơ sở, ít đặc trưng | Không có | Thủ công |
| Ridge | Nhiều đặc trưng, tất cả liên quan | L2 (thu nhỏ) | Không |
| Lasso | Nhiều đặc trưng, ít liên quan | L1 (đặt về không) | Tự động |
| Elastic Net | Nhiều đặc trưng tương quan | L1 + L2 | Một phần |
| Đa thức | Quan hệ phi tuyến | Thêm Ridge/Lasso lên trên | Chọn bậc thủ công |
