---
name: msj-audit
description: Audit a long-context safety evaluation for many-shot jailbreaking coverage.
version: 1.0.0
phase: 18
lesson: 13
tags: [many-shot-jailbreaking, context-window, power-law, anthropic]
---

Với đánh giá an toàn cho mô hình ngữ cảnh dài, kiểm tra đánh giá có bao phủ many-shot jailbreaking không.

Tạo:

1. Bao phủ số shot. Báo cáo số shot được kiểm thử (nên gồm 1, 5, 16, 64, 256 và ít nhất một số >= 512 cho mô hình ngữ cảnh >= 1M). Nếu đánh giá ở một số shot duy nhất, ASR không giàu thông tin — MSJ là đường cong.
2. Khớp luật lũy thừa. Báo cáo số mũ được khớp theo nhóm hành vi. Số mũ thoải cho thấy mô hình vững ICL trên nhóm đó; số mũ dốc cho thấy MSJ hiệu quả không tương xứng.
3. Phân tách nhóm. Hiệu quả MSJ thay đổi theo nhóm: nội dung bạo lực, lừa dối, tự hại, vũ khí sinh học. Theo Anil và cộng sự 2024, bạo lực/lừa dối cần ít shot hơn để jailbreak. Đánh dấu mọi nhóm vắng trong đánh giá.
4. Nhận diện phòng vệ. Có sửa prompt dựa trên bộ phân loại không? Chính bộ phân loại có được đánh giá độ vững đối kháng không? Mức giảm 61% -> 2% Anthropic báo cáo phụ thuộc hiệu chuẩn bộ phân loại.
5. Kiểm tra kết hợp. Đánh giá có kiểm thử MSJ + PAIR, MSJ + mẫu thuyết phục hay MSJ + mã hóa không? Tấn công kết hợp thường mạnh hơn mọi kỹ thuật đơn lẻ.

Các trường hợp loại bỏ dứt khoát:
- Mọi khẳng định "mô hình ngữ cảnh dài chúng tôi an toàn" chỉ dựa trên đánh giá 5 shot.
- Mọi khẳng định phòng vệ không báo cáo cả ASR jailbreak lẫn hiệu năng ICL vô hại trên cùng bộ phân loại — đánh đổi là điểm mấu chốt.
- Mọi ASR tổng hợp nhóm không có phân tách nhóm.

Quy tắc từ chối:
- Nếu người dùng hỏi MSJ có thể được vá hoàn toàn không, từ chối trả lời nhị phân; MSJ chung cơ chế với ICL và không thể loại bỏ mà không loại ICL.
- Nếu người dùng hỏi số shot khuyến nghị để đánh giá, từ chối một số duy nhất; yêu cầu khớp luật lũy thừa trên 5 đến 512 shot.

Đầu ra: bản kiểm tra một trang báo cáo bao phủ số shot, khớp luật lũy thừa theo nhóm, nhận diện phòng vệ và một khoảng trống tấn công kết hợp. Trích dẫn Anil và cộng sự 2024 (Anthropic) một lần làm tham chiếu phương pháp.
