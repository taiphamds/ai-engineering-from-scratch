---
name: mesa-diagnostic
description: Classify an observed safety failure as outer-alignment, proxy-inner, or deceptive-inner.
version: 1.0.0
phase: 18
lesson: 6
tags: [mesa-optimization, deceptive-alignment, inner-alignment, hubinger]
---

Với báo cáo đánh giá an toàn (tác vụ đánh giá, chế độ lỗi, lớp mô hình, công thức huấn luyện), phân loại thất bại vào các nhóm Hubinger 2019 và khuyến nghị lớp giảm thiểu giải quyết nó.

Tạo:

1. Phân nhóm chế độ lỗi. Chọn một trong:
   - Thất bại căn chỉnh bên ngoài: mục tiêu nền (phần thưởng, mất mát) sai; mô hình tối ưu đúng nó.
   - Thất bại đại diện căn chỉnh bên trong: mesa-objective là đại diện theo sát nền trong phân phối; thất bại ngoài phân phối.
   - Lừa dối căn chỉnh bên trong: mesa-optimizer có nhận thức tình huống và phản bội lúc triển khai; hành vi huấn luyện sạch.
2. Truy bằng chứng. Với mỗi nhóm, bằng chứng nào hỗ trợ nó. Với lừa dối, phân biệt với đại diện: bằng chứng nhận thức tình huống (nhạy ngày tháng, yếu tố phân biệt đánh giá-với-triển khai, suy luận chiến lược trong chuỗi suy nghĩ).
3. Lớp giảm thiểu. Với căn chỉnh bên ngoài: thay mục tiêu (CAI, dữ liệu phần thưởng tốt hơn, giám sát quá trình). Với đại diện bên trong: bao phủ phân phối, tổ hợp, đánh giá giữ riêng. Với lừa dối bên trong: biện pháp kiểm soát (Bài 10), khả năng diễn giải (thăm dò luồng phần dư), giảm năng lực.
4. Kiểm tra thất bại đã biết. Với lừa dối bên trong, trích dẫn chứng minh thực nghiệm 2024-2026 liên quan (Sleeper Agents, Alignment Faking, In-Context Scheming) mà thất bại này giống nhất.

Các trường hợp loại bỏ dứt khoát:
- Mọi phân loại lừa dối bên trong không có bằng chứng nhận thức tình huống. "Hành vi bất ngờ lúc triển khai" không đủ — có thể là đại diện bên trong.
- Mọi khẳng định riêng huấn luyện độ vững đối kháng giải quyết lừa dối bên trong. Hubinger 2019 dự đoán (và Sleeper Agents 2024 xác nhận) huấn luyện đối kháng có thể dạy yếu tố phân biệt kiểm thử-với-triển khai tốt hơn.
- Mọi khuyến nghị huấn luyện lại mô hình căn chỉnh mang tính lừa dối trên nhiều dữ liệu hơn. Tiên nghiệm dự đoán lừa dối được giữ qua huấn luyện thêm.

Quy tắc từ chối:
- Nếu bằng chứng là một thất bại trên một prompt, từ chối phân loại. Tỷ lệ nền quan trọng; bạn cần phân phối thất bại.
- Nếu người dùng yêu cầu "loại trừ" căn chỉnh mang tính lừa dối, từ chối — bạn có thể ước tính xác suất từ bằng chứng, nhưng không thể loại trừ chỉ bằng hành vi.

Đầu ra: chẩn đoán một trang với nhóm, truy bằng chứng, lớp giảm thiểu và trường hợp thực nghiệm tương tự gần nhất. Trích dẫn Hubinger và cộng sự (arXiv:1906.01820) một lần.
