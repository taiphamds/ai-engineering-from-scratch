---
name: w2sg-pgr
description: Audit a scalable-oversight or W2SG claim via the performance-gap-recovered metric.
version: 1.0.0
phase: 18
lesson: 11
tags: [scalable-oversight, weak-to-strong, pgr, debate, recursive-reward-modeling]
---

Với bài báo / báo cáo giám sát có thể mở rộng hoặc W2SG, kiểm tra thiết lập có hỗ trợ khẳng định không.

Tạo:

1. Nhận diện yếu / mạnh. Nêu tường minh bên giám sát yếu và mô hình mạnh. Khoảng cách năng lực đo bằng tham số, token huấn luyện, điểm phép đo chuẩn hay đánh giá riêng theo tác vụ?
2. Định nghĩa trần. Trần có giám sát của mô hình mạnh trên tác vụ là gì? Không có trần, không tính được PGR.
3. Tính PGR. PGR = (fine-tuned - weak) / (ceiling - weak). Kiểm tra dấu, độ lớn và mẫu số. Mẫu số nhỏ làm PGR tăng giả tạo.
4. Kiểm tra rò rỉ tiên nghiệm. Dữ liệu tiền huấn luyện mô hình mạnh có sự thật nền của tác vụ không? Nếu có, "khôi phục" có thể là truy xuất tiên nghiệm thay vì khái quát hóa.
5. Phân tách căn chỉnh-với-năng lực. Khoảng cách yếu-đến-mạnh là khoảng cách năng lực hay căn chỉnh? Burns và cộng sự 2023 nêu rõ khoảng cách của họ có dạng năng lực; khoảng cách dạng căn chỉnh có thể hoạt động khác.

Với kiểm tra cơ chế giám sát có thể mở rộng:
- Tranh luận: xác định kiến thức giám khảo, cấu trúc bên tranh luận và tác vụ có thưởng xu hướng sự thật không. Trích dẫn Khan và cộng sự 2024 (arXiv:2402.06782) về nơi tranh luận giúp và thất bại.
- RRM: xác định độ sâu đệ quy và điều xảy ra nếu U+1 đã không đáng tin.
- Phân rã tác vụ: xác định quy trình phân rã và tác vụ con có kiểm tra độc lập được không.

Các trường hợp loại bỏ dứt khoát:
- Mọi khẳng định PGR không có trần trên nhãn chuẩn.
- Mọi khẳng định W2SG tuyên bố giải quyết căn chỉnh — W2SG đo khôi phục năng lực, không phải căn chỉnh.
- Mọi khẳng định cơ chế tranh luận bỏ qua tài liệu thực nghiệm 2024 về khi tranh luận giúp so với gây hại.

Quy tắc từ chối:
- Nếu người dùng hỏi "W2SG có giải quyết siêu căn chỉnh không," từ chối trả lời nhị phân và giải thích PGR là đại lượng đo được, không phải giải pháp.
- Nếu người dùng hỏi cơ chế giám sát có thể mở rộng nào tốt nhất, từ chối — câu trả lời phụ thuộc tác vụ.

Đầu ra: bản kiểm tra một trang điền năm phần trên, báo cáo hoặc yêu cầu PGR, và đánh dấu khoảng cách yếu-mạnh có dạng năng lực hay căn chỉnh. Trích dẫn Burns và cộng sự 2023 và Lang và cộng sự (arXiv:2501.13124), mỗi bài một lần.
