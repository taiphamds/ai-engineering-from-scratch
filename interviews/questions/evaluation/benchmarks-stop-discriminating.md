---
id: benchmarks-stop-discriminating
title: Two points on a saturated benchmark
card: evaluation
kind: concept
level: 1
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer, forward-deployed-ai-engineer, ai-developer-relations-engineer]
rounds: [screen, ml-breadth, customer]
tags: [benchmarks, contamination, saturation, model-selection]
minutes: 6
lessons: [phases/10-llms-from-scratch/10-evaluation]
manuals: []
practice: []
cheatsheet: [llm-evaluation]
related: [evaluation/benchmark-jump-capability-or-leak]
updated: 2026-11-03
---

Một nhà cung cấp cho bạn thấy mô hình mới của họ đạt 89 phần trăm trên một benchmark trắc nghiệm công khai và mô hình bạn chạy hôm nay đạt 87. Họ nói khoảng cách chứng minh mô hình mới thông minh hơn. Tại sao bạn chưa bị thuyết phục, và thay vào đó bạn yêu cầu gì?

## Short answer

Các benchmark công khai ngừng phân biệt các mô hình khi mọi mô hình frontier nằm trong một dải hẹp gần đỉnh. Ba cơ chế gây ra điều này: dữ liệu huấn luyện chứa bài kiểm thử, cơ cấu huấn luyện được điều chỉnh theo định dạng kiểm thử, và bão hòa, nơi những câu hỏi còn lại mơ hồ hoặc gán nhãn sai. Một khoảng cách hai điểm trong dải đó là nhiễu hoặc ghi nhớ. Yêu cầu một lần chạy trên nhiệm vụ của bạn với dữ liệu của bạn.

## Full answer

### The compression

Benchmark trong bài học có 15,908 câu hỏi trên 57 môn. Trong ba năm các mô hình frontier dồn vào một khoảng 3 điểm ở đỉnh. Một mô hình đạt 88.7 phần trăm trên đó không thể đếm các chữ cái trong một từ ngắn, một nhiệm vụ không cần kiến thức thế giới. Điểm đo benchmark, không phải công việc.

### Three mechanisms

1. **Nhiễm bẩn dữ liệu.** Các corpus huấn luyện thu thập web, và các câu hỏi nằm trên web. Không ai phải gian lận để các câu trả lời đi vào huấn luyện.
2. **Dạy để làm bài kiểm thử.** Các phòng thí nghiệm điều chỉnh cơ cấu huấn luyện theo định dạng. Trên một bài trắc nghiệm 4 lựa chọn, một mô hình học phân phối đáp án tăng điểm mà không biết các đáp án.
3. **Bão hòa.** Khi mọi mô hình đạt 85 đến 90 phần trăm, 10 đến 15 phần trăm câu hỏi còn lại thường mơ hồ, gán nhãn sai hoặc ít người biết. Đi từ 87 lên 89 có thể nghĩa là thêm hai câu hỏi được ghi nhớ.

### What to ask for

- Một đánh giá tùy chỉnh trên nhiệm vụ của bạn: ít nhất 50 trường hợp cho một prototype và 200 hoặc hơn cho một quyết định production, với các trường hợp biên và đầu vào đối kháng.
- Kết quả theo hạng mục, không phải một điểm tổng hợp.
- Một phép kiểm tra nhiễm bẩn: tìm các câu hỏi đánh giá và các bản diễn đạt lại gần giống trong corpus huấn luyện.

Các benchmark vẫn giúp lựa chọn mô hình sơ bộ. Quyết định cuối cần đánh giá của bạn.

## Follow-ups

- **Level 1:** Nêu ba nhóm đánh giá. Expected: benchmark công khai, đánh giá tùy chỉnh trên dữ liệu riêng của bạn, và đánh giá của con người.
- **Level 2:** Một mô hình không biết một đáp án. Định dạng kiểm thử vẫn giúp nó như thế nào? Expected: bài kiểm thử có bốn lựa chọn với một phân phối đáp án gần đồng đều, vì vậy chỉ kiến thức định dạng nâng điểm.
- **Level 2:** Các benchmark vẫn hữu ích cho gì? Expected: lựa chọn mô hình sơ bộ trước khi bạn xây một đánh giá tùy chỉnh.
- **Level 3:** Bạn sẽ kiểm thử liệu một benchmark đã rò rỉ vào huấn luyện như thế nào? Expected: tìm các câu hỏi đánh giá và các bản diễn đạt lại gần giống trong corpus huấn luyện, và báo cáo tỷ lệ xuất hiện.

## Wrong answers

- "Hai điểm trên một benchmark chuẩn là một khoảng cách thật." Ở đỉnh của một benchmark bão hòa những câu hỏi còn lại thường mơ hồ hoặc ít người biết, vì vậy hai điểm có thể là hai câu hỏi được ghi nhớ.
- "Các phòng thí nghiệm gian lận bằng cách huấn luyện trên bài kiểm thử." Thu thập ở quy mô web kéo các câu hỏi vào mà không có chủ ý; hiệu ứng giống nhau, và cách sửa là một cuộc kiểm toán nhiễm bẩn, không phải một lời buộc tội.
- "Thay vào đó dùng benchmark lập trình." Một benchmark hoàn thành hàm với 164 bài toán bao phủ việc sinh hàm riêng lẻ và không nói gì về gỡ lỗi hoặc tái cấu trúc xuyên các file.

## Taught in

[Bài học đánh giá trong giai đoạn LLM từ đầu](../../../phases/10-llms-from-scratch/10-evaluation/) giải thích nhiễm bẩn, dạy để làm bài kiểm thử và bão hòa.
