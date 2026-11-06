---
name: memory-blocks
description: Generate a Letta-shaped three-tier memory system (core blocks, recall, archival) with a sleep-time consolidation agent off the critical path.
version: 1.0.0
phase: 14
lesson: 08
tags: [memory, letta, blocks, sleep-time, consolidation]
---

Với một runtime đích, một mô hình chính và một mô hình lúc ngủ (có thể mạnh hơn), tạo một hệ thống bộ nhớ ba tầng với các kiểu khối tường minh và hợp nhất bất đồng bộ.

Tạo:

1. Kiểu `Block` với `label`, `value`, `limit`, `description`, `version`, `history`. Mọi lần ghi tăng phiên bản và ghi lại giá trị cũ. Cung cấp `near_limit(threshold=0.8)`.
2. Một `BlockStore` với tối thiểu ba khối mặc định: `human` (các sự thật về người dùng), `persona` (quan niệm về bản thân của agent) và `task` (phạm vi hiện tại). Cho phép các khối do người dùng định nghĩa.
3. Một kho `Recall` — log lượt được phân trang theo phiên. Tự ghi mọi lượt. Phần đuôi bị loại bỏ khi chạm giới hạn nhưng vẫn có thể truy xuất.
4. Một kho `Archival` — ít nhất hai backend (vector, KV). Chèn trả về id bản ghi. Vô hiệu hóa thay vì xóa khi có mâu thuẫn.
5. Một `PrimaryAgent` xử lý các lượt và chỉ phát ra các lần ghi thô. Không tóm tắt trên đường tới hạn.
6. Một `SleepTimeAgent` chạy giữa các lượt: tóm tắt các khối vượt ngưỡng, vô hiệu hóa các bản ghi lưu trữ bị mâu thuẫn, ghi `learned_context` vào các khối dùng chung.

Các trường hợp từ chối cứng:

- Bất kỳ thao tác bộ nhớ nào chạy đồng bộ trong một lượt đối diện người dùng ngoại trừ tra cứu trực tiếp. Tóm tắt, hợp nhất, vô hiệu hóa thuộc về lượt lúc ngủ.
- Xóa các bản ghi lưu trữ khi có mâu thuẫn. Vô hiệu hóa để lịch sử vẫn có thể được kiểm toán.
- Ghi vào khối Persona hoặc Safety mà không có một bước đánh giá. Các khối này định hình hành vi toàn cục; các lần ghi âm thầm che giấu lỗi.

Các quy tắc từ chối:

- Nếu runtime không thể lưu giữ các khối xuyên các phiên, từ chối phát hành một sản phẩm được mô tả là "bộ nhớ." Hạ mức tuyên bố.
- Nếu agent lúc ngủ không có đầu ra trace, từ chối. Hợp nhất âm thầm là một vùng chết gỡ lỗi.
- Nếu người dùng yêu cầu "không vô hiệu hóa, luôn tin lần ghi mới nhất," từ chối cho bất kỳ miền nào mà các khẳng định lịch sử quan trọng (tuân thủ, y tế, pháp lý).

Đầu ra: một file cho mỗi thành phần cộng một `README.md` nêu tên các khối mặc định, nhịp lúc ngủ và chính sách giải quyết mâu thuẫn. Kết thúc bằng "đọc gì tiếp theo" chỉ đến Bài 09 nếu agent cần suy luận đồ thị trên bộ nhớ, hoặc Bài 23 nếu sản phẩm cần các span OTel trên các thao tác bộ nhớ.
