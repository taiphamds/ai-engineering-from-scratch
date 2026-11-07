---
id: eval-platform-ship-gate
title: Design the gate that decides whether a model ships
card: system-design
kind: design
level: 3
roles: [ai-evaluation-reliability-engineer, applied-ai-engineer, inference-engineer, ai-data-engineer]
rounds: [system-design, design-review]
tags: [eval-gate, manifest, regression, contamination, reproducibility]
minutes: 20
lessons: [phases/10-llms-from-scratch/13-building-complete-llm-pipeline]
manuals: []
practice: []
cheatsheet: [llm-pipeline-capstone, llm-evaluation]
related: [system-design/pipeline-rollback-plan, system-design/finetune-pipeline-design, system-design/rag-service-company-docs]
updated: 2026-11-03
---

Một nhóm huấn luyện và align các mô hình trong một pipeline nhiều giai đoạn và đưa kết quả tới phục vụ. Thiết kế nền tảng đánh giá quyết định liệu một artifact có thể phát hành không: nó đọc gì, một cổng là gì, hai cổng nào bắt phần lớn thảm họa, nó xử lý một cổng thất bại bằng cách nào, và một bên thứ ba phát lại một quyết định bằng cách nào.

## Short answer

Nền tảng đọc một manifest mô tả hoàn chỉnh lần chạy, với một seed, một phiên bản mã, và một hash đầu vào và đầu ra cho mọi giai đoạn, và nó đánh giá các cổng số được viết trước khi lần chạy bắt đầu. Một cổng hồi quy giữ mô hình mới theo mô hình trước trên các benchmark cốt lõi và bắt các bug huấn luyện; một cổng ngân sách KL chặn policy đã aligned trôi xa bao nhiêu khỏi tham chiếu và bắt alignment quá tay. Một cổng thất bại giữ lần chạy cho một người review được nêu tên có override được ghi trong manifest, và bất cứ ai có thể phát lại quyết định vì báo cáo đánh giá được định địa chỉ theo nội dung và hash dữ liệu đánh giá là một phần của nó.

## Full answer

### What the platform reads

Manifest là file duy nhất mô tả lần chạy đủ tốt để phát lại: phiên bản pipeline, seed, phiên bản mã, và theo từng giai đoạn một công thức, một hash đầu vào, một hash đầu ra, thời gian thực và chi phí. Hash đầu ra của một giai đoạn là hash đầu vào của giai đoạn tiếp theo, nên một artifact hỏng hoặc bị đổi dừng pipeline trước bất kỳ đánh giá nào. Các artifact có kiểu: một báo cáo đánh giá mang các điểm benchmark, các diff hồi quy và hash của dữ liệu đánh giá, nên một báo cáo không thể bị nhầm với một checkpoint hoặc gắn vào sai mô hình.

### Gates

Mọi cổng là một ngưỡng số được viết trước khi huấn luyện bắt đầu, chẳng hạn một benchmark cốt lõi ít nhất baseline cộng 0.5, một benchmark lập trình ít nhất baseline cộng 1.0, một benchmark tính trung thực không giảm, một tỷ lệ từ chối an toàn nhiều nhất 0.05, một KL từ tham chiếu nhiều nhất 25.0, và một tổng chi phí nhiều nhất 50000. Không cổng "trông tốt" và không ký duyệt chủ quan. Nếu mọi cổng đạt, artifact được đánh dấu có thể phát hành; nếu bất kỳ cổng nào thất bại, lần chạy bị giữ.

### The two gates that matter most

- Hồi quy: mô hình mới phải ít nhất tốt bằng mô hình trước trên tập cốt lõi. Điều này bắt các bug huấn luyện, các hỗn hợp dữ liệu xấu và các tokenizer hỏng.
- Ngân sách KL: policy đã aligned không được trôi xa hơn một lượng đặt trước khỏi tham chiếu. Điều này bắt alignment đã làm mô hình quá tay thành một hành vi hẹp.

Mọi pipeline production có cả hai.

### Contamination

Một cổng so sánh hash dữ liệu đánh giá với các shard huấn luyện bằng khớp chính xác hoặc độ trùng n-gram dài, và thất bại khi độ trùng vượt một tỷ lệ nhỏ, giữ một mức tăng benchmark trung thực. Bài tập của bài học pipeline đặt tỷ lệ đó ở 0.1% với khớp 13-gram.

### Holds, overrides and replay

Một lần chạy bị giữ là một điểm quyết định, không phải một thất bại. Một người review được nêu tên hoặc phê duyệt rollback hoặc override, và override được ghi vào manifest với tên. Phát lại hoạt động vì manifest, báo cáo đánh giá được định địa chỉ theo nội dung và hash dữ liệu đánh giá định danh các đầu vào chính xác; một đồng đội ở châu lục khác chạy cổng theo cùng các hash và phải nhận cùng phán quyết. Có thể tái lập không phải xác định: các trọng số có thể khác ở mức làm tròn nhỏ giữa các lần chạy, nên phát lại kiểm tra các hash và các chỉ số chính, không phải tensor giống hệt từng bit.

### Where the platform plugs in

Cổng chạy sau đánh giá và sau lượng tử hóa, vì các trọng số được lượng tử hóa phải vượt qua cùng các ngưỡng như mô hình đầy đủ. Ba lệnh là plan, run và gate; plan miễn phí và bắt các ngưỡng thiếu cùng các hash cũ trước khi bất kỳ tính toán nào bị tiêu.

## Follow-ups

- **Level 3:** Tại sao các ngưỡng phải được viết trước lần chạy? Expected: một ngưỡng được chọn sau khi thấy các điểm được di chuyển để cho mô hình qua; một cổng chỉ là cổng nếu nó có thể thất bại.
- **Level 3:** Một thay đổi tập đánh giá vô hiệu hóa gì? Expected: chỉ quyết định phát hành; hash dữ liệu đánh giá thay đổi, báo cáo được tính lại, và các artifact huấn luyện giữ hợp lệ.
- **Level 4:** Mô hình được lượng tử hóa vượt qua mọi cổng ngoại trừ tỷ lệ từ chối an toàn, tăng nhẹ. Bạn phát hành gì? Expected: không có gì nếu không có một override được ghi nhật ký; cổng tồn tại cho artifact phục vụ, và công thức của bài học giữ các đánh giá an toàn trên một lượng tử hóa chính xác cao hơn ở nơi các chênh lệch quan trọng.
- **Level 4:** Nền tảng ngăn một mô hình được huấn luyện qua sai giai đoạn đến cổng bằng cách nào? Expected: các artifact có kiểu và các chữ ký giai đoạn có kiểu, để một checkpoint được tinh chỉnh sở thích không thể được đưa vào đường có giám sát và sự không khớp thất bại ở thời điểm plan.

## Wrong answers

- "Cho một người review xem các mẫu và ký duyệt." Các ký duyệt chủ quan không phải cổng; một cổng là một con số có thể thất bại, và vai trò của người review là override được ghi nhật ký.
- "Chạy lại huấn luyện để xác nhận một kết quả." Tiền huấn luyện tốn nhiều tuần; phát lại thay vào đó kiểm tra các hash và chỉ số theo manifest.
- "Một benchmark là đủ nếu nó là benchmark đúng." Tập hồi quy và ngân sách KL bắt các lỗi khác nhau, và một cổng an toàn bắt một lỗi thứ ba.

## Taught in

[Bài học pipeline LLM hoàn chỉnh](../../../phases/10-llms-from-scratch/13-building-complete-llm-pipeline/) định nghĩa manifest, các artifact có kiểu, cổng đánh giá và các quy tắc override cùng phát lại.
