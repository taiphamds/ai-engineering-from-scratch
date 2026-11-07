---
id: observed-derived-inferred
title: Three words for one sentence about grade(55)
card: evidence-reverse-engineering
kind: concept
level: 1
roles: [agentic-ai-engineer, ai-evaluation-reliability-engineer, applied-ai-engineer]
rounds: [screen, ml-breadth]
tags: [reverse-engineering, evidence, confidence, authority, decompiler]
minutes: 6
lessons: [phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns]
manuals: [reverse-engineering-101#s-the-evidence-record]
practice: []
cheatsheet: [reverse-engineering]
related: []
updated: 2026-11-03
---

Một agent hỏi decompiler về `grade`, đọc nhánh mặc định của pseudocode, và báo cáo "grade(55) trả về 0, observed". Dòng pseudocode là `uVar1 = -(param_1 >> 0x1f) ^ (uint)((ulong)((long)param_1 * 0x66666667) >> 0x3f);` và các byte tại điểm đó là `xor eax, eax`. Từ nào trong ba từ confidence thuộc về mỗi nhận định ẩn trong câu đó?

## Short answer

Confidence là một trong ba từ và không bao giờ là một con số: `observed` là một sự kiện đọc từ byte hoặc một lần chạy, `derived` là một sự kiện tính từ các bản ghi observed, và `inferred` là một kỳ vọng mà chưa quan sát nào nêu. Bản ghi là observed về điều decompiler in, với authority `shipped-artifact`, vì file trên đĩa là nguồn. Việc giá trị mặc định là 0 là derived, từ `xor` trong listing và từ biểu thức, luôn là 0 và không bao giờ nói 0. Việc `grade(55)` trả về 0 khi hàm chạy giữ inferred cho đến khi một bản ghi `execute_function` với authority `controlled-replay` đồng ý với nó.

## Full answer

### The two enums

| Giá trị | Ý nghĩa |
|---|---|
| `observed` | đọc từ byte hoặc từ một lần chạy |
| `derived` | tính từ các bản ghi observed |
| `inferred` | một kỳ vọng mà không quan sát nào nêu |
| `shipped-artifact` | file trên đĩa là nguồn |
| `controlled-replay` | một lần chạy bạn kiểm soát tạo ra sự kiện |
| `analyst-inference` | phán đoán riêng của bạn |
| `historical-reference` | một cây hoặc tài liệu cũ |
| `external-service` | một dịch vụ ngoài file và host |

Khi một bên tạo không nói gì, bản ghi nhận `observed` và `shipped-artifact`. Đọc `observed` cẩn thận: trong một hồ sơ hàm nó nghĩa là công cụ ghi lại điều decompiler trả về, với các byte làm authority. Nó không nghĩa là pseudocode là mã nguồn chương trình.

### The two confusions that cost the most

Nhầm lẫn đầu coi pseudocode là một quan sát hành vi. Nó là một quan sát điều decompiler in. Biểu thức trên và lệnh đều tạo 0 cho mọi đầu vào, và agent không biết điều đó; nó tin văn bản vì một công cụ tạo ra. Nhầm lẫn thứ hai coi một danh sách rỗng là bằng chứng vắng mặt. Độ bao phủ thiếu là chưa biết, không phải vắng mặt.

### How a claim moves

Một nhận định chuyển từ inferred sang được hỗ trợ chỉ qua các lần chạy observed: `pass` khi mọi đầu vào có một lần chạy đồng ý và không lần nào bất đồng, `fail` khi bất kỳ lần chạy nào bất đồng, `unknown` khi một số đầu vào có các lần chạy và số khác không, `unsupported` khi không đầu vào nào có một lần chạy. Một lần chạy một bản dựng host của cùng mã nguồn được tính, với giới hạn rằng chính object chưa bao giờ chạy. Câu đó đi cùng nhận định, vì một báo cáo bỏ nó đã mất thông tin người đọc cần.

## Follow-ups

- **Level 1:** Tại sao confidence là một từ thay vì một xác suất? Expected: ba từ nêu loại hỗ trợ, và một con số sẽ che giấu đó là loại nào.
- **Level 2:** Một lần chạy cùng mã nguồn được biên dịch cho host đồng ý với dự đoán. Nhận định về object x86-64 có là observed không? Expected: có, với giới hạn rằng một bản dựng host đã chạy và object không chạy; đó là quan sát mạnh nhất khi không có emulator.
- **Level 2:** Một lần chạy dưới harness riêng của bạn nhận authority nào? Expected: `controlled-replay`, trái với `shipped-artifact` cho một lần đọc file.
- **Level 3:** Signature của decompiler nói hàm trả về 16 byte và nhận một tham số thứ ba. Từ nào? Expected: suy luận của provider; hồ sơ đánh dấu confidence kiểu trả về thấp, và bản ghi nên nói vậy.

## Wrong answers

- "Nó là observed vì một công cụ tạo ra." Văn bản của công cụ là observed; hành vi nó mô tả là derived hoặc inferred.
- "Cho nó confidence chín mươi phần trăm." Confidence là một hạng mục có ba giá trị, không phải một con số.
- "Biểu thức là một lỗi decompiler." Nó đúng và khó đọc; hai cách viết của một bit triệt tiêu, và lệnh nói điều đó trong hai byte.

## Taught in

[Bài học bằng chứng](../../../phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns/) xây một sổ với ba từ và năm authority, và [phần bản ghi bằng chứng](../../../manuals/reverse-engineering-101/sections/5-1-the-evidence-record.md) cho thấy các trường trên một hồ sơ được ghi.
