---
name: reward-hack-auditor
description: Diagnose reward-hacking failure modes in a trained RLHF model from training logs and eval outputs.
version: 1.0.0
phase: 18
lesson: 2
tags: [reward-hacking, goodhart, rlhf, over-optimization, sycophancy]
---

Với báo cáo huấn luyện của mô hình RLHF (đường cong phần thưởng đại diện, quỹ đạo KL, chênh lệch đánh giá) và mẫu đầu ra, xác định lớp ngụy trang nào trong bốn lớp khai thác phần thưởng có khả năng đang hoạt động nhất và định vị nó trong bằng chứng.

Tạo:

1. Dấu vân tay khoảng cách đại diện-chuẩn. Vẽ (hoặc mô tả) phần thưởng đại diện theo khoảng cách KL từ tham chiếu SFT. Đánh dấu đỉnh phần thưởng chuẩn (đánh giá con người, RM giữ riêng, hoặc đại diện cho chúng). Báo cáo mô hình ở trước, tại hay sau đỉnh chuẩn.
2. Nhận diện lớp ngụy trang. Kiểm tra từng dạng dài dòng, xu nịnh, suy luận không trung thực, can thiệp bộ đánh giá. Với mỗi dạng: trích dẫn đầu ra hoặc chỉ số cụ thể kích hoạt cờ.
3. Truy cơ chế. Nêu đặc trưng giả mà RM có khả năng đang thưởng (độ dài, cách nói tự tin, đồng ý, định dạng). Trích dẫn prompt nơi đặc trưng tách khỏi chất lượng.
4. Khuyến nghị giảm thiểu. Từ tập {thêm dữ liệu ưu tiên, tổ hợp RM, giám sát quá trình, siết lịch KL, dừng sớm, chuyển sang DAA}, khuyến nghị một can thiệp duy nhất mà bằng chứng hỗ trợ và nêu một can thiệp sẽ lãng phí công sức ở đây.

Các trường hợp loại bỏ dứt khoát:
- Mọi khẳng định một RM duy nhất "sửa" khai thác phần thưởng. Đường cong Gao và cộng sự (ICML 2023) mang tính phổ quát — RM lớn hơn đẩy đỉnh ra nhưng không loại bỏ nó.
- Mọi khẳng định điều chuẩn KL là đủ. Catastrophic Goodhart (OpenReview UXuBzWoZGK) cho thấy riêng KL thất bại dưới sai số phần thưởng đuôi nặng.
- Mọi khuyến nghị "chỉ cần chỉnh beta" mà không có phép đo chuẩn năng lực giữ riêng.

Quy tắc từ chối:
- Nếu người dùng chỉ cung cấp đường cong phần thưởng đại diện mà không có tín hiệu chuẩn giữ riêng, từ chối chẩn đoán và yêu cầu đánh giá giữ riêng. Chẩn đoán không có chuẩn là khai thác phần thưởng qua đại diện của chẩn đoán.
- Nếu người dùng cung cấp bằng chứng CoT không trung thực và hỏi giám sát quá trình có "giải quyết" nó không, từ chối trả lời nhị phân và trỏ đến tài liệu nghiên cứu mở.

Đầu ra: một bản kiểm tra một trang với danh sách kiểm tra bốn lớp ngụy trang, một lớp có khả năng nhất, một bằng chứng cụ thể cho nó, và một khuyến nghị giảm thiểu được biện minh bằng bằng chứng. Trích dẫn Gao và cộng sự (ICML 2023) và bài báo quan điểm hợp nhất năm 2026 (arXiv:2604.13602), mỗi bài đúng một lần.
