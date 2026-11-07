---
id: preference-loss-picker
title: Pick a preference loss for four kinds of data
card: post-training
kind: design
level: 3
roles: [applied-ai-engineer, ai-data-engineer, ai-evaluation-reliability-engineer]
rounds: [system-design, ml-depth]
tags: [dpo, kto, simpo, orpo, ipo, preference-data]
minutes: 15
lessons: [phases/18-ethics-safety-alignment/03-direct-preference-optimization-family, phases/10-llms-from-scratch/08-dpo]
manuals: []
practice: [dpo-loss]
cheatsheet: [alignment-training, rlhf-dpo]
related: [post-training/dpo-chosen-logprob-falls]
updated: 2026-11-03
---

Bốn nhóm mang đến bốn tập dữ liệu. Một nhóm có các lượt nhấp thích và không thích trên các câu trả lời đơn. Một nhóm có các so sánh ghép cặp mà các câu trả lời được thích phần lớn dài gấp đôi các câu bị loại. Một nhóm không có checkpoint SFT và muốn một giai đoạn huấn luyện duy nhất từ mô hình nền. Một nhóm có các cặp mà một số preference gần tung đồng xu và các preference khác nhất trí. Bạn khuyến nghị loss preference nào cho mỗi nhóm, và tại sao?

## Short answer

Nhóm lượt nhấp nhận loss lý thuyết triển vọng hoạt động trên các nhãn đơn. Nhóm lệch độ dài nhận loss không có reference chuẩn hóa theo độ dài và thêm một margin, để một bên thắng dài hơn không thắng bằng số token. Nhóm không có giai đoạn SFT nhận odds-ratio loss, thêm một số hạng preference vào likelihood SFT và huấn luyện từ bản nền trong một lượt; nhóm có các độ mạnh preference hỗn hợp nhận loss ánh xạ đồng nhất, có margin bị chặn. Mỗi loại sửa một giả định DPO thông thường đưa ra.

## Full answer

### Start from what DPO assumes

Phép suy ra DPO giả định dữ liệu ghép cặp, một reference SFT là neo thật, các cặp trong phân phối, và một preference ánh xạ thành log-odds không bị chặn. Mỗi thành viên của họ bỏ hoặc sửa một trong những điều này.

| Dữ liệu hoặc ràng buộc | Loss | Nó thay đổi gì |
|---|---|---|
| Các câu trả lời đơn với nhãn tốt hoặc xấu | KTO | utility lý thuyết triển vọng trên một nhãn; mất mát nặng hơn lợi ích; không cần cặp |
| Bên thắng dài hơn nhiều bên thua | SimPO | log xác suất trung bình mỗi token cộng một margin; không có reference model |
| Không có checkpoint SFT, một giai đoạn | ORPO | negative log-likelihood SFT cộng một số hạng preference odds-ratio; số hạng SFT là regularizer |
| Độ mạnh preference thay đổi rộng | IPO | sai số bình phương trên một mục tiêu một chia hai beta; khoảng cách bị chặn |
| Log xác suất chosen giảm trong các log DPO | BPO | DPO cộng một hình phạt trên các di chuyển xuống của câu trả lời chosen |
| Một tập ghép cặp sạch lớn | DPO | một beta thận trọng |

### The reasoning for each team

1. Các lượt nhấp dồi dào và không ghép cặp. Ép chúng thành các cặp vứt đi phần lớn dữ liệu; loss không ghép cặp dùng mọi nhãn.
2. Trong DPO thông thường, một bên thắng dài có log xác suất âm hơn theo cấu tạo, nên khoảng cách tăng vì lý do sai và policy học độ dài. Chuẩn hóa theo độ dài loại bỏ động cơ. Không có reference, sự trôi cần biện pháp bảo vệ riêng.
3. Loss một giai đoạn huấn luyện mô hình nền theo instruction và thích câu trả lời chosen cùng lúc; số hạng likelihood giữ nó được neo nơi DPO dùng reference.
4. Trong DPO, một cặp gần tung đồng xu và một cặp nhất trí đều đẩy về một khoảng cách không bị chặn. Loss bị chặn giữ khoảng cách tỷ lệ với độ mạnh preference.

### What every team keeps

Một đánh giá giữ lại có sinh, early stopping, và một kiểm tra log xác suất chosen tuyệt đối. Không loss nào trong số này thoát tối ưu hóa quá mức; chúng di chuyển nơi nó tác động.

### How to decide in practice

Chạy các ứng viên trên một bộ kiểm tra và chọn theo tác vụ. Ý của bài học là loss tốt nhất cho suy luận toán không có lý do là loss tốt nhất cho an toàn.

## Follow-ups

- **Level 3:** Nhóm lượt nhấp cũng có một tập ghép cặp nhỏ. Kết hợp chúng? Expected: có; huấn luyện bằng loss không ghép cặp trên các lượt nhấp và xác thực trên các cặp, hoặc đặt trọng số hai loss; các cặp là tín hiệu sạch hơn cho đánh giá.
- **Level 3:** Tại sao loại bỏ reference tiết kiệm bộ nhớ, và nó tốn gì? Expected: một mô hình trong bộ nhớ thay vì hai; cái giá là không có neo, nên policy có thể trôi, và số hạng margin cùng early stopping gánh công việc đó.
- **Level 4:** Một nhóm chạy DPO và quan sát xác suất các câu trả lời chosen giảm trong khi margin tăng. Dòng nào áp dụng, và tại sao đó không phải một vấn đề tinh chỉnh? Expected: biến thể bảo tồn chosen; gradient DPO thông thường chỉ quan tâm hiệu, nên không beta nào sửa hướng.
- **Level 4:** Bạn lập luận với một người hoài nghi rằng các loss này vẫn tối ưu hóa quá mức như thế nào? Expected: các đường cong gold reward theo KL đã công bố cho các phương pháp trực tiếp cho thấy cùng đỉnh và sụp như các pipeline reward-model; reward ngầm truy vấn các mẫu ngoài phân phối, và KL regularization không ổn định nó.

## Wrong answers

- "Chuyển các lượt nhấp thành cặp bằng cách ghép một câu trả lời tốt và xấu cho cùng prompt." Nó chỉ giữ các prompt có cả hai nhãn và phát minh các so sánh người đánh giá chưa bao giờ làm; loss không ghép cặp dùng các nhãn nguyên trạng.
- "Cắt các bên thắng dài để các cặp cân bằng." Điều đó phá các câu trả lời người ta thích; cách sửa nằm ở chuẩn hóa loss, không phải dữ liệu.
- "Dùng DPO ở mọi nơi và tinh chỉnh beta theo nhóm." Beta không thể tạo cặp, loại bỏ một reference, chặn một khoảng cách hoặc cung cấp một giai đoạn SFT; mỗi điều đó là một loss khác.

## Taught in

[Bài học họ DPO](../../../phases/18-ethics-safety-alignment/03-direct-preference-optimization-family/) đưa ra mỗi loss và chế độ lỗi nó sửa, và [bài học DPO](../../../phases/10-llms-from-scratch/08-dpo/) lập bảng các mô hình, cặp và reference mỗi phương pháp cần.
