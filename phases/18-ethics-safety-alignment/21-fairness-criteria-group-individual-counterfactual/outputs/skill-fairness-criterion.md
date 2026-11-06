---
name: fairness-criterion
description: Identify which fairness criterion a claim invokes and audit the associated assumptions.
version: 1.0.0
phase: 18
lesson: 21
tags: [fairness, demographic-parity, equalized-odds, counterfactual-fairness, impossibility]
---

Với khẳng định hoặc chính sách công bằng, xác định tiêu chí được viện dẫn, giả định khẳng định phụ thuộc và định lý bất khả thi hàm ý gì cho tiêu chí còn lại.

Tạo:

1. Nhận diện tiêu chí. Gắn nhãn khẳng định nhắm một trong: ngang bằng nhân khẩu học, cân bằng odds, bình đẳng độ chính xác sử dụng có điều kiện, công bằng cá nhân, công bằng phản thực. Phải giải quyết khẳng định mơ hồ trước tiếp tục.
2. Kiểm tra tỷ lệ nền. Tỷ lệ nền theo nhóm trong triển khai là gì? Dưới tỷ lệ nền không bằng nhau, bất khả thi Chouldechova / KMR 2017 áp dụng: không mô hình nào thỏa mãn cả ba tiêu chí nhóm.
3. Phụ thuộc DAG nhân quả. Nếu khẳng định công bằng phản thực, DAG nhân quả là gì? Công bằng phản thực chỉ có cơ sở đến mức DAG có cơ sở. Thiếu DAG làm khẳng định mất hiệu lực.
4. Thước đo tương đồng. Nếu khẳng định công bằng cá nhân, thước đo tương đồng d là gì? Lựa chọn riêng theo tác vụ và là quyết định chính sách, không phải thống kê.
5. Tính hợp pháp can thiệp. Nếu khẳng định dùng suy luận phản thực, có can thiệp lên thuộc tính được bảo vệ không? Nếu có, cân nhắc phản thực truy ngược (arXiv:2401.13935) để tránh vấn đề pháp lý.

Các trường hợp loại bỏ dứt khoát:
- Mọi khẳng định "công bằng" không nhận diện tiêu chí.
- Mọi khẳng định "thỏa mãn mọi tiêu chí công bằng" dưới tỷ lệ nền không bằng nhau không thừa nhận Chouldechova / KMR 2017.
- Mọi khẳng định công bằng phản thực không có DAG nhân quả công bố.

Quy tắc từ chối:
- Nếu người dùng hỏi tiêu chí công bằng nào "đúng," từ chối xếp hạng và giải thích đó là lựa chọn chính sách.
- Nếu người dùng hỏi mô hình "công bằng" không, từ chối khẳng định nhị phân; công bằng tương đối theo tiêu chí.

Đầu ra: bản kiểm tra một trang điền năm phần trên, đánh dấu bất khả thi nếu áp dụng và nêu lựa chọn chính sách ngầm trong khẳng định. Trích dẫn Dwork và cộng sự 2012, Kusner và cộng sự 2017, Chouldechova 2017, mỗi tài liệu một lần khi phù hợp.
