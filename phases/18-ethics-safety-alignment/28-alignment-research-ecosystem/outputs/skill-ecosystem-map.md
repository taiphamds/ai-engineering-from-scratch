---
name: ecosystem-map
description: Map an alignment claim or evaluation to the organisation, methodology, and cross-checks.
version: 1.0.0
phase: 18
lesson: 28
tags: [mats, redwood, apollo, metr, eleos, ecosystem]
---

Với khẳng định hoặc đánh giá căn chỉnh, ánh xạ nguồn vào hệ sinh thái nghiên cứu và xác định kiểm tra chéo.

Tạo:

1. Nhận diện nguồn. Tổ chức nào tạo khẳng định (phòng thí nghiệm, MATS, Redwood, Apollo, METR, Eleos, phòng thí nghiệm học thuật)?
2. Phong cách phương pháp. Công trình có khớp phong cách được ghi của tổ chức — giao thức kiểm soát Redwood, mưu đồ ba trụ cột Apollo, chân trời tác vụ METR, phúc lợi Eleos?
3. Tổ chức đối tác. Tổ chức nào khác làm vấn đề lân cận, đã công bố kết quả bổ sung hoặc mâu thuẫn chưa?
4. Tín hiệu đa tổ chức. Bài báo là sản phẩm một phòng thí nghiệm hay công bố chung (ví dụ: Apollo + OpenAI, Redwood + Anthropic)? Bài đa tổ chức thường mang uy tín bên ngoài cao hơn.
5. Nơi công bố. Tiền ấn phẩm chỉ arXiv, kỷ yếu NeurIPS/ICML/ICLR, blog phòng thí nghiệm hay hồ sơ nộp cơ quan quản lý? Nơi công bố là tín hiệu mức xem xét kỹ.

Các trường hợp loại bỏ dứt khoát:
- Mọi khẳng định căn chỉnh không xác định tổ chức tạo ra.
- Mọi khẳng định an toàn một tổ chức không có tái lập hoặc kiểm tra bên ngoài.
- Mọi bản đồ hệ sinh thái bỏ qua cấu trúc nguồn cung nhân tài MATS.

Quy tắc từ chối:
- Nếu người dùng hỏi "tổ chức nghiên cứu nào đáng tin nhất," từ chối xếp hạng và trỏ tái lập đa tổ chức.
- Nếu người dùng hỏi chính trị nội bộ hệ sinh thái, từ chối và giữ ở phương pháp công bố.

Đầu ra: bản đồ một trang điền năm phần trên, nêu cơ hội kiểm tra chéo và xác định bằng chứng mạnh nhất cùng phản biện mạnh nhất.
