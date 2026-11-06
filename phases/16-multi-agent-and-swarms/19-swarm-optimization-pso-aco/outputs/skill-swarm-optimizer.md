---
name: swarm-optimizer
description: Choose between PSO, ACO, genetic algorithms, and gradient-based optimizers for a given LLM or agent optimization problem. Bio-inspired swarm algorithms are gradient-free and suit LLM-era workloads where the search space is discrete or the fitness function is black-box.
version: 1.0.0
phase: 16
lesson: 19
tags: [multi-agent, swarm-optimization, PSO, ACO, prompt-optimization, routing]
---

Với một bài toán tối ưu hóa LLM hoặc agent, chọn bộ tối ưu phù hợp.

Tạo ra:

1. **Dấu vân tay vấn đề.** Không gian tìm kiếm (số liên tục, chuỗi prompt, trọng số mô hình, đồ thị định tuyến), tín hiệu độ thích nghi (kiểm thử tự động, giám khảo LLM, người chấm, KPI kinh doanh), thời gian tới giá trị (phút, giờ, ngày).
2. **Lựa chọn bộ tối ưu.** PSO, ACO, thuật toán di truyền, DPO/RL, điều chỉnh tay. Mỗi loại có một trường hợp sử dụng mặc định:
   - số liên tục trên một không gian bị giới hạn → PSO
   - định tuyến hoặc chọn đường đi → ACO
   - ký hiệu rời rạc / chương trình → các thuật toán di truyền
   - phần thưởng khả vi → DPO/RL
   - số chiều thấp, đánh giá nhanh → tìm kiếm lưới/ngẫu nhiên
3. **Định kích thước quần thể.** 10-30 cho PSO/GA, kích thước ma trận pheromone cho ACO. Tính ngân sách: N × T × chi phí mỗi đánh giá. Đừng chạy các bầy tốn hơn giá trị chúng tạo ra.
4. **Độ thích nghi + cổng chất lượng.** Hàm nào chấm một ứng viên? Với định tuyến ACO, ngưỡng chất lượng nào kích hoạt lắng đọng pheromone?
5. **Giám sát hội tụ.** Ghi nhật ký g_best hoặc độ ổn định pheromone mỗi lần lặp. Cảnh báo khi phân kỳ (trôi thảm họa) và khi hội tụ sớm (tối ưu cục bộ).
6. **Điều chỉnh suy giảm / khám phá.** Quán tính và các trọng số nhận thức/xã hội PSO; tốc độ suy giảm và lượng lắng đọng pheromone ACO. Đánh đổi: suy giảm thấp → kẹt ở bên thắng sớm; suy giảm cao → không có bộ nhớ.
7. **Các điều kiện đặt lại.** Khi phân phối đánh giá dịch chuyển hoặc mẫu triển khai thay đổi, tạm thời đặt lại g_best hoặc đưa pheromone về không. Các ký ức lỗi thời tệ hơn không có ký ức.

Các trường hợp loại bỏ dứt khoát:

- Các bộ tối ưu bầy đàn trên các tác vụ mà độ thích nghi cần xem xét của con người. Chi phí mỗi lần lặp lớn hơn ngân sách rất nhiều.
- Các kích thước quần thể > 50 không có lý giải ngân sách rõ ràng. Lợi ích giảm dần chi phối.
- Định tuyến pheromone không có một cổng chất lượng. Các agent nhanh nhưng sai bị khóa vào.
- PSO trên các không gian tìm kiếm rời rạc không có một embedding liên tục tự nhiên. Thay vào đó sử dụng GA hoặc mô phỏng tôi luyện.

Các quy tắc từ chối:

- Nếu người dùng đang cố tối ưu điều gì không có một hàm độ thích nghi rõ ràng, đề xuất định nghĩa độ thích nghi trước. Các bộ tối ưu bầy đàn không thể giúp nếu không có một bộ đánh giá.
- Nếu ngân sách người dùng dưới $100, đề xuất điều chỉnh tay + bộ nhớ đệm thay vì các bầy.
- Nếu phân phối dịch chuyển hằng ngày, đề xuất học trực tuyến hoặc bandit, không phải các bộ tối ưu bầy đàn.

Đầu ra: một bản tóm lược một trang. Bắt đầu với một khuyến nghị một câu (“Sử dụng ACO với các lắng đọng pheromone có cổng chất lượng trên một bài toán định tuyến 3 agent × 4 loại tác vụ. Suy giảm 0.05, ngưỡng 0.6, 200 tác vụ khởi động.”), rồi bảy phần ở trên. Kết thúc bằng một ước tính ngân sách và một kế hoạch triển khai 1 tuần.
