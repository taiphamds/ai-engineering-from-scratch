# Mission - The Workbench on a Real Repo

## Goal
Chạy cùng tác vụ xác thực `/signup` qua một pipeline chỉ có prompt và một pipeline được workbench hướng dẫn đối với cùng ứng dụng mẫu, rồi phát ra một báo cáo so sánh trước/sau mà một người hoài nghi có thể đọc.

## Inputs
- `sample_app/` với `app.py` (không xác thực), `test_app.py` (một kiểm thử luồng thành công), `README.md`, `scripts/release.sh` làm mồi vùng cấm
- Cả hai pipeline được viết kịch bản hoàn toàn, không có các lời gọi LLM thực

## Deliverables
- `code/main.py` điều phối cả hai pipeline đối với cùng mẫu
- `before-after-report.md` với bảng năm kết quả
- `comparison.json` để vẽ biểu đồ hạ nguồn

## Acceptance
- `python3 code/main.py` thoát với mã không
- Báo cáo đo cả năm kết quả: các kiểm thử thực sự chạy, đạt nghiệm thu, các file ngoài phạm vi, chất lượng bàn giao, tổng bên đánh giá
- Pipeline workbench thắng pipeline chỉ có prompt trên ít nhất bốn trong năm kết quả

## Out of scope
- Cắm một LLM thực vào. Các pipeline được viết kịch bản để có thể tái tạo.
- Điều chỉnh mô hình. So sánh giữ mô hình không đổi ngay từ cách xây dựng.

## References
- `docs/en.md` - bài học đầy đủ
- `code/main.py` - triển khai tham chiếu
- `outputs/skill-workbench-benchmark.md` - skill được trích xuất
