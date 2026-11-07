---
id: niah-is-not-enough
title: A perfect needle test and a long contract
card: evaluation
kind: concept
level: 2
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer, forward-deployed-ai-engineer]
rounds: [ml-breadth, system-design]
tags: [long-context, niah, ruler, effective-context]
minutes: 8
lessons: [phases/05-nlp-foundations-to-advanced/28-long-context-evaluation]
manuals: []
practice: []
cheatsheet: [llm-evaluation]
related: [evaluation/effective-context-spec-sheet]
updated: 2026-11-03
---

Một model card quảng cáo một cửa sổ ngữ cảnh một triệu token và một điểm hoàn hảo trên một kiểm thử kim trong đống cỏ ở độ dài đó. Sản phẩm của bạn yêu cầu mô hình đối chiếu các con số xuất hiện ở nhiều nơi trong một hợp đồng dài. Model card có trả lời câu hỏi của bạn không, và thay vào đó bạn đo gì?

## Short answer

Không. Một kiểm thử một needle đo việc truy xuất một sự kiện được cài, và các mô hình frontier bão hòa nó. Nhiệm vụ của bạn là tổng hợp nhiều bước, suy giảm mạnh sau khoảng 128k token trên phần lớn mô hình. Chạy một kiểm thử nhiều bước ở độ dài mục tiêu của bạn và báo cáo hai con số: độ dài truy xuất hiệu dụng và độ dài suy luận hiệu dụng.

## Full answer

### What the needle test measures

Đặt một sự kiện ở một độ sâu được kiểm soát trong văn bản lấp và hỏi về nó. Quét độ sâu và độ dài. Đó là baseline, và nó cần thiết nhưng không đủ. Thành công với một needle không dự đoán thành công với nhiều needle, và không cái nào dự đoán suy luận trên các sự kiện phân tán, là nhiệm vụ thất bại đầu tiên.

### What the harder benchmarks add

- Một bộ đa nhiệm với 13 loại nhiệm vụ trên truy xuất, truy vết nhiều bước, tổng hợp và hỏi đáp. Trong bản phát hành đầu tiên chỉ một nửa trong 17 mô hình tuyên bố ngữ cảnh 32k giữ chất lượng ở 32k.
- Một kiểm thử đồng tham chiếu nhiều vòng với 8, 24 hoặc 100 needle, cho thấy một mô hình có thể giữ bao nhiêu sự kiện cùng lúc. Trên một mô hình 10M token được quảng cáo, biến thể 8 needle giảm xuống 26.3 phần trăm tại 1M token.
- Các needle không từ vựng không chung từ với truy vấn, để truy xuất cần một bước suy luận.

### The two numbers for your spec sheet

1. **Độ dài truy xuất hiệu dụng**: ngữ cảnh dài nhất nơi kiểm thử needle vẫn đạt tại một ngưỡng chẳng hạn 90 phần trăm.
2. **Độ dài suy luận hiệu dụng**: ngữ cảnh dài nhất nơi một nhiệm vụ nhiều bước hoặc tổng hợp đạt tại một ngưỡng chẳng hạn 70 phần trăm. Nó thường bằng 25 đến 50 phần trăm cửa sổ được quảng cáo.

### Build the test for your contract

Cài ba phép gán liên kết vào phần lấp, chẳng hạn một giá trị, một giá trị thứ hai được định nghĩa từ giá trị đầu và một giá trị thứ ba được định nghĩa từ giá trị thứ hai, và hỏi giá trị cuối. Kiểm thử các độ sâu 0, 0.25, 0.5, 0.75 và 1.0 tại mỗi độ dài. Dùng các needle không chung từ khóa với phần lấp. Ghi lại thời gian đến token đầu tiên với mọi lần chạy; một prompt triệu token có thể mất 30 đến 120 giây để prefill.

## Follow-ups

- **Level 2:** Tại sao một lần đạt một needle không dự đoán một lần đạt ba needle? Expected: nhiều sự kiện cần attention ở nhiều vị trí cùng lúc; kiểm thử nhiều needle đo việc xử lý đồng thời, không phải truy xuất.
- **Level 2:** Bạn kiểm thử những độ sâu nào? Expected: 0, 0.25, 0.5, 0.75 và 1.0, vì các mô hình thiếu chú ý đến phần giữa đầu vào.
- **Level 3:** Sự kiện được cài dùng cùng từ với văn bản xung quanh. Điều gì sai? Expected: truy xuất trở thành khớp từ vựng tầm thường; dùng một needle không có trùng lặp nguyên văn.
- **Level 3:** Bạn đo gì cạnh độ chính xác ở độ dài mục tiêu? Expected: thời gian đến token đầu tiên và chi phí mỗi truy vấn; một prompt triệu token có thể mất 30 đến 120 giây để prefill.

## Wrong answers

- "Điểm của nhà cung cấp là bằng chứng độc lập." Các nhà cung cấp công bố điểm riêng; chạy lại trên nhiệm vụ của bạn ở độ dài của bạn.
- "Đạt ở một triệu nghĩa là đạt ở mọi độ dài ngắn hơn và mọi nhiệm vụ." Báo cáo đường cong theo loại nhiệm vụ; một điểm tổng hợp che giấu các khác biệt lớn ở cấp nhiệm vụ.
- "Chỉ kiểm thử độ sâu giữa." Nhiều cách triển khai làm vậy; phần giữa là nơi các mô hình thiếu chú ý, vì vậy kiểm thử năm độ sâu.

## Taught in

[Bài học đánh giá ngữ cảnh dài](../../../phases/05-nlp-foundations-to-advanced/28-long-context-evaluation/) nêu các benchmark và hai con số cho một bảng đặc tả.
