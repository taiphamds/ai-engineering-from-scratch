# Benchmarks: WebArena and OSWorld

> WebArena kiểm thử khả năng agent web xuyên bốn ứng dụng tự host. OSWorld kiểm thử khả năng agent máy tính để bàn xuyên Ubuntu, Windows, macOS. Khi phát hành (2023–2024), cả hai cho thấy một khoảng cách lớn giữa các agent tốt nhất và con người. Khoảng cách đang thu hẹp; các chế độ lỗi chưa thay đổi.

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 19 (SWE-bench, GAIA)
**Time:** ~60 minutes

## Learning Objectives

- Mô tả bốn ứng dụng tự host của WebArena và vì sao đánh giá dựa trên thực thi quan trọng.
- Giải thích vì sao OSWorld sử dụng ảnh chụp màn hình hệ điều hành thực thay vì các API trợ năng.
- Nêu tên hai chế độ lỗi OSWorld chính: định vị GUI và kiến thức vận hành.
- Tóm tắt những gì OSWorld-G và OSWorld-Human thêm vào trên benchmark cơ sở.

## The Problem

Các agent tổng quát có thể gọi công cụ. Chúng có thể điều khiển một trình duyệt qua 20 lần nhấp để hoàn thành thanh toán mua sắm không? Chúng có thể cấu hình một máy Linux chỉ bằng bàn phím và chuột không? Đây là những câu hỏi mà WebArena và OSWorld trả lời.

## The Concept

### WebArena (Zhou et al., ICLR 2024)

- 812 tác vụ tầm dài xuyên bốn ứng dụng web tự host: một trang mua sắm, một diễn đàn, một công cụ phát triển giống GitLab, một CMS doanh nghiệp.
- Cộng các tiện ích: bản đồ, máy tính, bảng nháp.
- Đánh giá dựa trên thực thi qua các API gym — đơn hàng đã được đặt chưa, issue đã được đóng chưa, trang CMS đã được cập nhật chưa?
- Khi phát hành: agent GPT-4 tốt nhất đạt thành công 14.41% so với con người 78.24%.

Cách định khung tự host quan trọng — benchmark không chập chờn vì các ứng dụng đích được ghim và có thể tái tạo.

### Extensions

- **VisualWebArena** — các tác vụ dựa trên thị giác nơi thành công phụ thuộc việc diễn giải hình ảnh (ảnh chụp màn hình như các quan sát hạng nhất).
- **TheAgentCompany** (tháng 12 năm 2024) — thêm terminal + lập trình; giống một môi trường làm việc từ xa thực hơn.

### OSWorld (Xie et al., NeurIPS 2024)

- 369 tác vụ máy tính thực xuyên Ubuntu, Windows, macOS.
- Điều khiển bàn phím và chuột tự do đối với các ứng dụng thực.
- Ảnh chụp màn hình 1920×1080 làm quan sát.
- Khi phát hành: mô hình tốt nhất 12.24% so với con người 72.36%.

### Primary failure modes

1. **Định vị GUI.** Ánh xạ pixel → phần tử. Các mô hình gặp khó khăn khi định vị các phần tử UI đáng tin cậy trong 1920×1080.
2. **Kiến thức vận hành.** Menu nào có thiết lập, phím tắt nào, ngăn tùy chọn nào. Phần đuôi tri thức mà con người xây dựng qua nhiều năm.

### Follow-ups

- **OSWorld-G** — bộ định vị 564 mẫu + tập huấn luyện Jedi. Tách định vị khỏi lập kế hoạch để bạn có thể đo chúng riêng biệt.
- **OSWorld-Human** — các quỹ đạo hành động chuẩn được tuyển chọn thủ công. Cho thấy các agent hàng đầu sử dụng số bước gấp 1.4-2.7 lần cần thiết (khoảng cách hiệu quả quỹ đạo).

### Why this matters

Claude computer use, OpenAI CUA, Gemini 2.5 Computer Use (Bài 21) đều huấn luyện trên các khối lượng công việc được định hình bởi WebArena và OSWorld. Các benchmark là mục tiêu; các mô hình sản xuất là câu trả lời được phát hành.

### Where benchmarking goes wrong

- **Các đánh giá chỉ ảnh chụp màn hình.** OSWorld do ảnh chụp màn hình dẫn dắt; đánh giá một agent sử dụng DOM hoặc API trợ năng trên OSWorld bỏ lỡ thách thức định vị.
- **Bỏ qua độ dài quỹ đạo.** Chỉ chấm điểm tỷ lệ thành công bỏ lỡ sự kém hiệu quả số bước 1.4-2.7 lần mà OSWorld-Human phơi bày.
- **Các ứng dụng tự host cũ.** Các ứng dụng của WebArena ghim các phiên bản cụ thể; cập nhật mà không tuyển chọn lại phá vỡ tính so sánh.

```figure
ae-agent-human-gap
```

## Build It

`code/main.py` triển khai một bộ kiểm thử agent web mô phỏng:

- Một máy trạng thái "ứng dụng mua sắm" tối thiểu: list_items, add_to_cart, checkout.
- Các quỹ đạo chuẩn cho 3 tác vụ.
- Một agent được viết kịch bản thử từng tác vụ.
- Bộ đánh giá dựa trên thực thi (kiểm tra trạng thái) và thước đo hiệu quả quỹ đạo (số bước so với chuẩn).

Chạy nó:

```
python3 code/main.py
```

Đầu ra: tỷ lệ thành công và hiệu quả quỹ đạo cho từng tác vụ, phản chiếu phương pháp của OSWorld-Human.

## Use It

- **WebArena Verified** tự host trên một cụm nội bộ để đánh giá liên tục.
- **OSWorld** trong một nhóm VM cho các agent máy tính để bàn.
- **Các agent sử dụng máy tính** (Bài 21) — Claude, OpenAI CUA, Gemini — tất cả được huấn luyện trên các khối lượng công việc như thế này.
- **Các luồng sản phẩm riêng của bạn** — ghi lại các quỹ đạo chuẩn cho 20 tác vụ hàng đầu của bạn; chạy các agent đối với chúng hàng tuần.

## Ship It

`outputs/skill-web-desktop-harness.md` xây dựng một bộ kiểm thử agent web/máy tính để bàn với đánh giá dựa trên thực thi và thước đo hiệu quả quỹ đạo.

## Exercises

1. Mở rộng bộ kiểm thử mô phỏng bằng một ứng dụng thứ hai (một diễn đàn). Viết 3 tác vụ cộng các quỹ đạo chuẩn.
2. Thêm báo cáo hiệu quả quỹ đạo cho từng tác vụ. Trên bản mô phỏng của bạn, agent gấp 1 lần, 2 lần hay 3 lần chuẩn?
3. Triển khai một công cụ "gây nhiễu" — một công cụ mà quỹ đạo chuẩn không bao giờ sử dụng. Agent được viết kịch bản có bị cám dỗ không?
4. Đọc OSWorld-G. Bạn sẽ tách các lỗi định vị khỏi các lỗi lập kế hoạch trong các đánh giá riêng như thế nào?
5. Đọc README các ứng dụng của WebArena. Điều gì hỏng khi bạn nâng cấp một trong các phiên bản ứng dụng được ghim?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Nó thực sự có nghĩa gì |
|------|----------------|------------------------|
| WebArena | "Benchmark agent web" | 812 tác vụ xuyên 4 ứng dụng tự host; đánh giá kiểu gym |
| VisualWebArena | "WebArena thị giác" | WebArena dựa trên thị giác; các ảnh chụp màn hình là các quan sát |
| OSWorld | "Benchmark agent máy tính để bàn" | 369 tác vụ trên Ubuntu/Windows/macOS thực |
| GUI grounding (Định vị GUI) | "Ánh xạ pixel sang phần tử" | Mô hình định vị các phần tử UI trong 1920x1080 |
| Operational knowledge (Kiến thức vận hành) | "Bí quyết hệ điều hành" | Menu nào, phím tắt nào, ngăn tùy chọn nào |
| OSWorld-G | "Bộ định vị" | 564 mẫu chỉ định vị + tập huấn luyện |
| OSWorld-Human | "Các quỹ đạo chuẩn" | Các chuỗi hành động chuyên gia thủ công để đo hiệu quả |
| Trajectory efficiency (Hiệu quả quỹ đạo) | "Số bước trên chuẩn" | Số bước agent chia cho số tối thiểu của con người |

## Further Reading

- [Zhou et al., WebArena (arXiv:2307.13854)](https://arxiv.org/abs/2307.13854) — benchmark web bốn ứng dụng
- [Xie et al., OSWorld (arXiv:2404.07972)](https://arxiv.org/abs/2404.07972) — benchmark máy tính để bàn xuyên hệ điều hành
- [Anthropic, Introducing computer use](https://www.anthropic.com/news/3-5-models-and-computer-use) — khả năng của Claude được định hình bởi benchmark
- [OpenAI, Computer-Using Agent](https://openai.com/index/computer-using-agent/) — các số liệu OSWorld và WebArena
