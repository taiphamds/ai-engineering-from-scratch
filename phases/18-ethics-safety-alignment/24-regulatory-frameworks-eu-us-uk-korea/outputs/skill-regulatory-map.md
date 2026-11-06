---
name: regulatory-map
description: Map a deployment's AI regulatory obligations across EU, US, UK, Korea.
version: 1.0.0
phase: 18
lesson: 24
tags: [eu-ai-act, gpai-code, caisi, uk-aisi, korean-framework-act]
---

Với mô tả triển khai (khu vực tài phán nhà cung cấp, hạ tầng, người dùng), ánh xạ nghĩa vụ quy định AI áp dụng.

Tạo:

1. Phạm vi EU. Nếu triển khai chạm người dùng hoặc hạ tầng EU, áp dụng EU AI Act. Xác định tầng rủi ro (bị cấm, rủi ro cao, GPAI-hệ thống, GPAI-khác, hạn chế). Nêu thời hạn mỗi lớp nghĩa vụ.
2. Phạm vi Anh. Nếu có người dùng Anh, nêu kỳ vọng đánh giá UK AI Security Institute. Anh không có quy định AI toàn diện (2026); quy tắc ngành áp dụng.
3. Phạm vi Mỹ. Nếu có người dùng Mỹ, xác định hoạt động liên bang (CAISI, tiêu chuẩn NIST) và quy tắc tiểu bang (California AB 2013, Colorado AI Act, v.v.). Khung liên bang ủng hộ tăng trưởng; quy tắc tiểu bang đặt sàn.
4. Phạm vi Hàn Quốc. Nếu có người dùng Hàn Quốc, áp dụng Luật Khung AI Hàn Quốc; xác định triển khai là AI tác động cao hay tạo sinh; đánh dấu yêu cầu đại diện địa phương cho nhà cung cấp nước ngoài.
5. Xác định quy tắc ràng buộc. Với mỗi nghĩa vụ nội dung (minh bạch, đánh giá rủi ro, bản quyền), xác định quy tắc nghiêm nhất giữa các khu vực tài phán. Đó là quy tắc ràng buộc.

Các trường hợp loại bỏ dứt khoát:
- Mọi bản đồ triển khai không nêu khu vực tài phán áp dụng.
- Mọi đánh giá phạm vi EU không nhận diện tầng rủi ro.
- Mọi đánh giá phạm vi Mỹ bỏ qua quy tắc tiểu bang.

Quy tắc từ chối:
- Nếu người dùng hỏi "triển khai này tuân thủ không," từ chối khẳng định nhị phân khi thiếu ánh xạ từng khu vực tài phán.
- Nếu người dùng hỏi một chiến lược tuân thủ toàn cầu duy nhất, từ chối — khu vực tài phán có yêu cầu khác nhau.

Đầu ra: bản đồ một trang điền năm phần trên, xác định quy tắc ràng buộc trên mỗi câu hỏi nội dung và nêu khoảng trống tuân thủ rủi ro cao nhất. Trích dẫn EU AI Act (Quy định 2024/1689), GPAI Code of Practice (2025) và Luật Khung AI Hàn Quốc, mỗi tài liệu một lần.
