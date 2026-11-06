---
name: skill-drift-monitoring
description: Lập kế hoạch các monitor drift cho một mô hình đã triển khai và phân loại một báo động drift
version: 1.0.0
phase: 2
lesson: 20
tags: [monitoring, drift, psi, kolmogorov-smirnov, chi-square, alerting]
---

# Drift Monitoring

Sử dụng skill này trong hai tình huống. Sử dụng Phần A khi một mô hình sắp ra mắt và cần monitor. Sử dụng Phần B khi một báo động drift kích hoạt.

## Part A: Plan the monitors

### Step 1: List the signals per layer

| Tầng | Tín hiệu tối thiểu |
|---|---|
| Sức khỏe hệ thống | Độ trễ p99, tỷ lệ lỗi, số yêu cầu mỗi phút |
| Đầu vào | Một kiểm định drift theo đặc trưng quan trọng, tỷ lệ giá trị thiếu, danh mục mới |
| Dự đoán | Phân phối điểm (PSI trên các thập phân vị điểm), tỷ lệ dự đoán dương tính |
| Kết quả | Chỉ số ngoại tuyến từ thiết kế, chỉ được tính trên các sự kiện có nhãn |

### Step 2: Pick the test for each input

- Đặc trưng số: PSI trên các thập phân vị tham chiếu, cộng thống kê KS `D`
- Đặc trưng phân loại: kiểm định chi-square trên một bảng hai hàng, cộng Cramér's V
- Đặc trưng có năm hoặc ít hơn giá trị phân biệt: coi nó là phân loại

### Step 3: Set the windows

- Tham chiếu: dữ liệu huấn luyện, hoặc một giai đoạn production mà ai đó đã kiểm tra
- Hiện tại: một cửa sổ đủ lớn để các cửa sổ sạch giữ dưới mức lời cảnh báo. Chạy các kiểm định trên dữ liệu sạch cũ để đo điều này.
- Bao quát một chu kỳ tuần đầy đủ trong tham chiếu khi lưu lượng thay đổi theo ngày trong tuần

### Step 4: Set the alert policy

Viết ra các con số này trước khi ra mắt:

```text
family alpha          = 0.01
per-test alpha        = family alpha / number of tests
PSI warn / drift      = 0.10 / 0.25
KS D for drift        = 0.10 together with p < per-test alpha
Cramér's V for drift  = 0.10 together with p < per-test alpha
persistence           = 2 consecutive drift windows before an alert
outcome alert         = metric below reference metric - tolerance, for 2 windows
```

Gửi lời cảnh báo đến dashboard. Gửi báo động đến một người.

### Step 5: Record the label delay

Nêu rõ mất bao lâu để nhãn đến và nhóm theo dõi gì cho đến khi chúng đến. Nếu độ trễ dài hơn một tuần, thêm một ước tính hiệu năng sử dụng các xác suất được hiệu chuẩn. Một ước tính như vậy xử lý covariate drift nhưng không thể phát hiện concept drift.

## Part B: Triage an alert

### Step 1: Rule out a pipeline defect

Kiểm tra những điều này trước, vì chúng trông như drift:

- Một thay đổi schema, một cột đổi tên hoặc một thay đổi đơn vị
- Một đợt tăng vọt giá trị thiếu hoặc một giá trị mặc định
- Một danh mục mới đến từ thay đổi mã, không phải từ người dùng
- Một phép join bị hỏng điền các đặc trưng bằng null

### Step 2: Name the kind of drift

| Bằng chứng | Drift có khả năng | Hành động |
|---|---|---|
| Đầu vào thay đổi, chỉ số kết quả ổn định | Covariate drift | Tiếp tục theo dõi. Chỉ huấn luyện lại nếu lưu lượng chuyển vào các vùng ít dữ liệu. |
| Tỷ lệ dương tính thay đổi, đầu vào theo lớp trông như cũ | Prior drift | Hiệu chuẩn lại điểm hoặc di chuyển ngưỡng quyết định |
| Đầu vào ổn định, chỉ số kết quả giảm | Concept drift | Thu thập nhãn mới, rồi huấn luyện lại trên dữ liệu có nhãn gần đây |
| Đầu vào thay đổi và chỉ số kết quả giảm | Covariate drift gây thiệt hại, hoặc cả hai loại | Huấn luyện lại trên dữ liệu có nhãn gần đây và kiểm tra mô hình mới trên giai đoạn mới nhất |

### Step 3: Check the size of the effect

Một p-value nhỏ với một cửa sổ lớn nói lên ít điều. Báo cáo PSI, `D` hoặc Cramér's V, và thay đổi trong chỉ số kết quả. Xếp hạng các đặc trưng đã drift theo tầm quan trọng của chúng với mô hình.

### Step 4: Write the triage note

```text
Alert: <signal, window end, value, threshold>
Pipeline check: <defect found or none>
Drift kind: covariate | prior | concept | unclear
Impact: <outcome metric change, or "labels pending until <date>">
Action: wait | recalibrate | collect labels | retrain | roll back
Owner and review date: <name, date>
```

Sau mọi lần huấn luyện lại, đặt lại cửa sổ tham chiếu về dữ liệu huấn luyện mới.
