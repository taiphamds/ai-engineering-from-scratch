---
id: fifty-cases-is-not-enough
title: A four point win on fifty cases
card: evaluation
kind: estimate
level: 2
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer, ai-data-engineer]
rounds: [screen, ml-depth]
tags: [sample-size, confidence-interval, wilson, regression]
minutes: 8
lessons: [phases/11-llm-engineering/10-evaluation]
manuals: []
practice: []
cheatsheet: [llm-evaluation]
related: [evaluation/mean-hides-the-tail]
updated: 2026-11-03
---

Một thay đổi prompt đạt 90 phần trăm trên tập chuẩn 50 trường hợp của bạn, và baseline đạt 86 trên cùng tập. Tác giả muốn phát hành nó như một chiến thắng bốn điểm. Bạn có thể chắc đến mức nào, và bạn sẽ cần kích thước mẫu nào để đưa ra quyết định này?

## Short answer

Ở 50 trường hợp và độ chính xác quan sát được 90 phần trăm, khoảng 95 phần trăm chạy từ 78 đến 97 phần trăm, một độ trải 19 điểm. Một khoảng cách bốn điểm nằm sâu bên trong độ trải đó, vì vậy chiến thắng không thể phân biệt với nhiễu. Bạn cần khoảng 200 trường hợp để phát hiện một thay đổi 5 phần trăm, và 500 hoặc hơn khi hai hệ thống gần nhau.

## Full answer

### The table

| Trường hợp | Độ chính xác quan sát được | Độ rộng khoảng 95 phần trăm | Phát hiện một thoái lui 5 phần trăm |
|---|---|---|---|
| 50 | 90 phần trăm | 19 điểm | không |
| 100 | 90 phần trăm | 12 điểm | vừa đủ |
| 200 | 90 phần trăm | 9 điểm | có |
| 500 | 90 phần trăm | 5 điểm | với độ tin cậy |
| 1000 | 90 phần trăm | 3 điểm | chính xác |

Độ rộng giảm gần theo căn bậc hai của kích thước mẫu. Gấp bốn số trường hợp cắt độ rộng khoảng một nửa.

### The interval

Với một tỷ lệ đạt bài học dùng khoảng Wilson, giữ đúng ở các mẫu nhỏ và các tỷ lệ gần không hoặc một. Khoảng chuẩn thất bại ở cả hai nơi, và đó là những nơi các bản phát hành được quyết định.

### The paired case

Cả hai phiên bản chạy trên cùng 50 trường hợp, vì vậy so sánh chúng theo cặp. Một kiểm định ghép cặp hoặc một bootstrap ghép cặp trên các chênh lệch theo trường hợp chặt hơn hai khoảng riêng. Nó vẫn không cứu được một khoảng cách bốn điểm trên 50 trường hợp, nhưng là kiểm định đúng khi tập đủ lớn.

### How to build to 200

Bài học chia tập thành một lõi chuẩn gồm 50 đến 100 trường hợp được tuyển chọn, 20 đến 50 trường hợp đối kháng và 100 đến 200 mẫu lưu lượng thật. Quản lý phiên bản tập, và chỉ so sánh hai lần chạy trên cùng phiên bản.

## Follow-ups

- **Level 2:** Tại sao khoảng co chậm khi bạn thêm trường hợp? Expected: độ rộng giảm theo căn bậc hai của kích thước mẫu, vì vậy gấp bốn số trường hợp giảm một nửa độ rộng.
- **Level 2:** Hai lần chạy dùng các trường hợp giống hệt. Điều đó có giúp không? Expected: có; một phép so sánh ghép cặp trên các chênh lệch theo trường hợp chặt hơn hai khoảng độc lập.
- **Level 3:** Bài học dùng khoảng nào cho một tỷ lệ đạt, và tại sao? Expected: khoảng Wilson, vì nó hoạt động đúng ở các mẫu nhỏ và các tỷ lệ cực đoan nơi xấp xỉ chuẩn thất bại.
- **Level 3:** Bạn có thể chi trả 200 lời gọi bộ chấm mỗi lần chạy. Bạn chia chúng như thế nào? Expected: một lõi chuẩn, một phần đối kháng và một mẫu lưu lượng production, có phiên bản và cố định giữa hai lần chạy bạn so sánh.

## Wrong answers

- "Bốn điểm là bốn điểm." Trên 50 trường hợp khoảng rộng 19 điểm; một khoảng cách bốn điểm là nhiễu.
- "Chạy cùng 50 trường hợp ba lần." Lặp các trường hợp đo phương sai của mô hình, không phải tổng thể; khoảng trên các trường hợp vẫn rộng.
- "Luôn dùng một nghìn trường hợp." Một nghìn trường hợp cho độ rộng 3 điểm nhưng tốn gấp năm một lần chạy 200 trường hợp; dùng 200 cho các quyết định thường lệ và 500 hoặc hơn cho các quyết định sát nhau.

## Taught in

[Bài học đánh giá và kiểm thử](../../../phases/11-llm-engineering/10-evaluation/) đưa ra bảng kích thước mẫu, khoảng Wilson và ba lớp của một tập đánh giá.
