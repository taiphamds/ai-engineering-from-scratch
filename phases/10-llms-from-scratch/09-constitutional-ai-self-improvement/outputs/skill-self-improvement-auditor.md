---
name: self-improvement-auditor
description: Audit a proposed self-improvement or constitutional AI pipeline before it runs at scale.
version: 1.0.0
phase: 10
lesson: 9
tags: [alignment, cai, grpo, rlhf, self-improvement, reward-hacking]
---

Với một pipeline huấn luyện đề xuất tuyên bố dùng Constitutional AI, RLAIF, GRPO hoặc bất kỳ dạng dữ liệu sở thích tự sinh nào, tạo một bản kiểm tra gồm:

1. Quy tắc phần thưởng. Nêu bộ xác minh chính xác (regex, sympy, bộ kiểm thử, giám khảo LLM). Phân loại tất định, LLM ngẫu nhiên hoặc lai. Từ chối mọi vòng lặp "tự cải thiện" không có căn cứ bên ngoài — mô hình không thể lấy tín hiệu từ hư không.
2. Thống kê nhóm. Với pipeline GRPO, xác nhận kích thước nhóm, cách tính lợi thế (z-score so với hạng tương đối), và điều xảy ra khi độ lệch chuẩn phần thưởng nhóm sụp về không. Pipeline phải bỏ qua hoặc giảm trọng số nhóm phương sai bằng không, không chia cho epsilon rồi giả vờ tín hiệu là thật.
3. Ngân sách KL. Một mức trần số cho KL(policy || reference) tích lũy qua lần chạy. Pipeline phải dừng, đặt lại hoặc chuyển sang tham chiếu ấm hơn khi chạm trần. KL không bị chặn là trôi không bị chặn.
4. Mức đa dạng tối thiểu. Một cận dưới đo được trên độ lệch chuẩn phần thưởng mỗi nhóm, phương sai độ dài phản hồi hoặc entropy n-gram, tùy tác vụ cho phép. Nếu mức tối thiểu bị vi phạm N vòng liên tiếp, pipeline phải trộn dữ liệu con người mới hoặc phân phối prompt rộng hơn.
5. Hạn ngạch dữ liệu con người. Tỷ lệ tối thiểu của hỗn hợp huấn luyện phải vẫn do con người viết, thường 5-10%. Pipeline chỉ tự chưng cất sụp đổ sau 3-5 vòng. Nêu rõ điều này.
6. Bộ giám sát sụp đổ mode. Đánh dấu kiểm tra tự động: độ lệch chuẩn phần thưởng qua các vòng, số n-gram duy nhất trên prompt giữ lại, phân phối độ dài, tỷ lệ từ chối. Bất kỳ thứ nào vượt ngưỡng đều dừng huấn luyện.
7. Trôi hiến pháp. Với pipeline CAI, yêu cầu file hiến pháp quản lý phiên bản, nhật ký thay đổi và "tập kiểm thử hồi quy hiến pháp" — các prompt mà hành vi kỳ vọng không được đổi qua các lần sửa.

Từ chối phê duyệt pipeline:
- tuyên bố "không dữ liệu con người" mà không có bộ xác minh ngoài (quy tắc, công cụ, môi trường).
- dùng PRM mà không có phép dò thao túng phần thưởng quá trình (mô hình có viết các bước trông đúng mà không đẩy chứng minh tiến lên không?).
- chạy hơn 5 vòng tinh chỉnh lấy mẫu loại bỏ mà không có benchmark đa dạng giữ lại.
- chia sẻ mô hình tham chiếu với chính sách (không tham chiếu nghĩa là không KL, nghĩa là không điểm neo).
- chấm bằng giám khảo LLM cùng mô hình với chính sách (nhiễm giám khảo).

Đầu ra: bản kiểm tra một trang với đạt/không đạt mỗi cổng, giá trị đo được hoặc được nêu, và bước chính xác trong pipeline tạo mỗi tín hiệu. Nếu bất kỳ cổng nào không đạt, liệt kê thay đổi tối thiểu khả dụng để chuyển nó thành đạt.
