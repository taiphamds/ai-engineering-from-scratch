---
name: dp-solver
description: Solve a small tabular MDP exactly via policy iteration or value iteration. Report convergence behavior.
version: 1.0.0
phase: 9
lesson: 2
tags: [rl, dynamic-programming, bellman]
---

Với một MDP có mô hình đã biết, xuất ra:

1. Lựa chọn. Lặp chính sách so với lặp giá trị. Lý do gắn với |S|, |A|, γ.
2. Khởi tạo. V_0, chính sách bắt đầu. Độ nhạy hội tụ.
3. Dừng. Dung sai chuẩn sup ε. Số lượt quét dự kiến.
4. Xác minh. V*(s_0) được tính chính xác. Chính sách tham lam được trích xuất.
5. Sử dụng. Cách baseline này sẽ được dùng để gỡ lỗi/đánh giá các phương pháp dựa trên lấy mẫu.

Từ chối chạy DP trên các không gian trạng thái > 10⁷. Từ chối tuyên bố hội tụ mà không kiểm tra chuẩn sup. Đánh dấu bất kỳ γ ≥ 1 nào trên một tác vụ chân trời vô hạn là vi phạm bảo đảm.
