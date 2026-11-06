# Multimodal Agents and Computer-Use (Capstone)

> Sản phẩm tiên tiến nhất năm 2026 là agent đa phương thức đọc ảnh chụp màn hình, nhấp nút, điều hướng giao diện web, điền biểu mẫu và hoàn tất quy trình đầu cuối. SeeClick và CogAgent (2024) chứng minh thành phần cơ bản định vị GUI. Ferret-UI thêm di động. ChartAgent giới thiệu sử dụng công cụ thị giác cho biểu đồ. VisualWebArena và AgentVista (2026) là các benchmark mà mức tiên tiến nhất theo đuổi — và ngay cả Gemini 3 Pro và Claude Opus 4.7 cũng đạt ~30% trên các tác vụ khó của AgentVista. Bài tổng kết này kết nối mọi mạch của Giai đoạn 12: nhận thức (VLM độ phân giải cao), suy luận (LLM có sử dụng công cụ), định vị (đầu ra tọa độ), bộ nhớ dài hạn và đánh giá.

**Type:** Capstone
**Languages:** Python (stdlib, action schema + agent loop skeleton)
**Prerequisites:** Phase 12 · 05 (LLaVA), Phase 12 · 09 (Qwen-VL JSON), Phase 14 (Agent Engineering)
**Time:** ~240 minutes

## Learning Objectives

- Thiết kế vòng lặp agent đa phương thức: nhận thức → suy luận → hành động → quan sát → lặp lại.
- Xây dựng lược đồ đầu ra định vị GUI (tọa độ nhấp, nhập văn bản, cuộn, kéo) mà VLM có thể phát dưới dạng JSON.
- So sánh agent chỉ ảnh chụp màn hình với agent cây trợ năng với agent lai.
- Thiết lập đánh giá benchmark agent đa phương thức trên một phần nhỏ VisualWebArena.

## The Problem

Quy trình trang đặt vé: "tìm cho tôi chuyến bay đến Tokyo ngày 15 tháng 4, ghế cạnh lối đi dưới $800, đặt vé."

Agent đa phương thức cần:

1. Chụp ảnh màn hình trình duyệt.
2. Phân tích ảnh chụp màn hình + URL + mục tiêu thành kế hoạch.
3. Phát hành động có cấu trúc: nhấp (tại x,y), nhập "Tokyo" (tại phần tử E), cuộn xuống, chọn (nút radio).
4. Áp dụng hành động vào trình duyệt.
5. Quan sát trạng thái mới (ảnh chụp màn hình tiếp theo).
6. Lặp lại đến khi tác vụ xong.

Mỗi bước là một lời gọi VLM đa phương thức. Đầu ra VLM phải là JSON phân tích cú pháp được. Lỗi tích lũy qua các bước, nên phục hồi quan trọng.

## The Concept

### GUI grounding — the primitive

Định vị GUI là: với ảnh chụp màn hình và chỉ dẫn ngôn ngữ tự nhiên, xuất tọa độ (x, y) để nhấp (hoặc hành động khác).

SeeClick (arXiv:2401.10935) là kết quả mở đầu tiên ở quy mô lớn: tinh chỉnh VLM trên dữ liệu GUI tổng hợp + thực, xuất tọa độ dưới dạng token văn bản thuần. Hoạt động.

CogAgent (arXiv:2312.08914) thêm mã hóa độ phân giải cao 1120x1120 cho giao diện dày đặc. Điểm: ~84% trên điều hướng web.

Ferret-UI (arXiv:2404.05719) tập trung giao diện di động, tích hợp dữ liệu trợ năng iOS.

Định dạng đầu ra thường là JSON:

```json
{"action": "click", "x": 384, "y": 220, "element_desc": "Search button"}
```

`element_desc` giúp phục hồi: nếu tọa độ dịch chuyển giữa các ảnh chụp màn hình, gợi ý ngữ nghĩa cho hệ thống định vị lại.

### Action schemas

Lược đồ hành động điển hình có 6-10 loại hành động:

- `click`: (x, y)
- `type`: (văn bản, x?, y?)
- `scroll`: (hướng, lượng)
- `drag`: (x0, y0, x1, y1)
- `select`: (chỉ số tùy chọn)
- `hover`: (x, y)
- `navigate`: (url)
- `wait`: (ms)
- `done`: (thành công, giải thích)

Agent phát một hành động mỗi bước. Lớp bọc trình duyệt thực thi và trả trạng thái mới.

### Screenshot-only vs accessibility-tree

Hai chế độ đầu vào:

- Chỉ ảnh chụp màn hình: toàn bộ ảnh, không thông tin cấu trúc. Tổng quát nhất; hoạt động trên mọi ứng dụng.
- Cây trợ năng: thông tin DOM / trợ năng iOS có cấu trúc. Đáng tin cậy hơn nhiều để định vị; hoạt động nơi có cây.
- Lai: cả hai, với cây làm bộ định vị đáng tin cậy cho hành động đơn lẻ và ảnh chụp màn hình cho ngữ cảnh ngữ nghĩa.

Agent sản xuất dùng lai khi có thể. Tự động hóa trình duyệt (Selenium + trợ năng) luôn có cây; ứng dụng máy tính đôi khi có.

### Long-horizon memory

Quy trình 20 bước tạo 20 ảnh chụp màn hình. Ngữ cảnh VLM đầy nhanh chóng. Ba chiến lược nén:

- Chuỗi tóm tắt: sau mỗi 5 bước, tóm tắt những gì đã xảy ra, bỏ ảnh chụp màn hình cũ.
- Bỏ khung hình: giữ ảnh chụp màn hình đầu tiên, cuối cùng và mỗi ảnh thứ 3.
- Nhật ký do công cụ ghi: thực thi hành động, giữ nhật ký văn bản những gì đã làm; không nhìn lại ảnh chụp màn hình cũ.

API sử dụng máy tính của Claude dùng mẫu nhật ký. Đơn giản hơn, đáng tin cậy hơn.

### Visual tool use

ChartAgent (arXiv:2510.04514) giới thiệu sử dụng công cụ thị giác để hiểu biểu đồ: cắt, phóng to, OCR, gọi phát hiện bên ngoài. Agent có thể xuất "cắt đến vùng (100, 200, 300, 400) rồi gọi OCR" dưới dạng lời gọi công cụ. Công cụ trả văn bản; VLM tiếp tục suy luận.

Mẫu này khái quát hóa: prompting set-of-mark, chú giải vùng và công cụ phát hiện bên ngoài đều phù hợp cùng lược đồ "xuất lời gọi công cụ, nhận phản hồi có cấu trúc".

### The 2026 benchmarks

- ScreenSpot-Pro. Định vị GUI trên ~1k ảnh chụp màn hình web. SOTA mở Qwen2.5-VL-72B ~85%. Mức tiên tiến nhất ~90%.
- VisualWebArena. Tác vụ web đầu cuối (cửa hàng, diễn đàn, rao vặt). SOTA mở ~20%. Gemini 3 Pro ~27%.
- AgentVista (arXiv:2602.23166). Benchmark khó nhất năm 2026. Quy trình thực tế trên 12 miền. Mô hình tiên tiến nhất đạt 27-40%; mô hình mở 10-20%.
- WebArena / WebShop. Benchmark cũ hơn; đã bão hòa bởi mức tiên tiến nhất.

### Why it's still hard

Nút thắt hiệu năng agent:

1. Định vị thị giác ở quy mô tinh. "Nhấp dấu X nhỏ" thường thất bại ở độ phân giải di động.
2. Lập kế hoạch dài hạn. Sau 10 hành động, agent trôi khỏi mục tiêu.
3. Phục hồi lỗi. Khi lần nhấp thất bại (sai nút), phát hiện + phục hồi hiếm khi có trong dữ liệu huấn luyện.
4. Ngữ cảnh chéo trang. Nhảy giữa các tab hoặc biểu mẫu dài làm mất trạng thái.

Hướng nghiên cứu: kiến trúc bộ nhớ, lập kế hoạch lại tường minh, xác minh đa phương thức (đối chiếu ảnh chụp màn hình để xác định hành động thành công).

### The capstone build-it

Tác vụ tổng kết: xây dựng agent sử dụng máy tính:

1. Đọc HTML + ảnh chụp màn hình của trang giả lập đặt vé.
2. Lập kế hoạch chuỗi nhiều bước: tìm kiếm → chọn → điền biểu mẫu → gửi.
3. Phát hành động JSON khớp lược đồ hành động.
4. Đánh giá trên một phần cố định 10 tác vụ.

Bài học cung cấp mã khung dễ mở rộng thành trình duyệt thực.

```figure
mm-agent-loop
```

## Use It

`code/main.py` là khung bài tổng kết:

- Định nghĩa JSON lược đồ hành động (10 hành động).
- Trạng thái trình duyệt giả lập dưới dạng dict.
- Khung vòng lặp agent: nhận trạng thái, phát hành động, áp dụng, lặp.
- Benchmark nhỏ 10 tác vụ (trang tổng hợp) để đo tỷ lệ thành công đầu cuối.
- Hook phục hồi lỗi khi hành động thất bại.

## Ship It

Bài học này tạo ra `outputs/skill-multimodal-agent-designer.md`. Với sản phẩm sử dụng máy tính (miền, tập hành động, mục tiêu đánh giá), thiết kế vòng lặp agent đầy đủ, chiến lược bộ nhớ, chế độ định vị và điểm benchmark kỳ vọng.

## Exercises

1. Mở rộng lược đồ hành động với công cụ `screenshot_region` (cắt + phóng to). Tác vụ nào được lợi?

2. Đọc AgentVista (arXiv:2602.23166). Mô tả nhóm tác vụ khó nhất và tại sao mô hình tiên tiến nhất vẫn thất bại.

3. Nén bộ nhớ dài hạn: thiết kế chuỗi tóm tắt với ≤4 ảnh chụp màn hình giữ trực tiếp, số lượng ghi nhật ký bất kỳ.

4. Xây dựng hook phục hồi lỗi: khi hành động thất bại (không tìm thấy nút), agent làm gì tiếp theo?

5. So sánh Claude 4.7 chỉ ảnh chụp màn hình với Qwen2.5-VL lai ảnh chụp màn hình + cây trợ năng trên 10 tác vụ web. Cách nào thắng ở tác vụ nào?

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|------------------------|
| GUI grounding (Định vị GUI) | "Tọa độ nhấp" | Mô hình xuất (x,y) cho đích của chỉ dẫn trên ảnh chụp màn hình |
| Action schema (Lược đồ hành động) | "Định nghĩa công cụ" | Mô tả JSON các hành động hợp lệ (nhấp, nhập, cuộn, kéo) |
| Accessibility tree (Cây trợ năng) | "DOM có cấu trúc" | Phân cấp giao diện máy đọc được từ API trình duyệt/iOS |
| Hybrid agent (Agent lai) | "Ảnh chụp màn hình + cây" | Dùng cả ảnh và thông tin có cấu trúc; đáng tin cậy hơn chỉ một trong hai |
| Visual tool use (Sử dụng công cụ thị giác) | "Phóng to/cắt/phát hiện" | Agent gọi công cụ thị giác bên ngoài (OCR, phát hiện) giữa kế hoạch |
| Summary-chain (Chuỗi tóm tắt) | "Nén bộ nhớ" | Bản tóm tắt văn bản định kỳ thay lịch sử ảnh chụp màn hình dài |
| VisualWebArena | "Benchmark web E2E" | Benchmark năm 2024 cho tác vụ web đầu cuối |
| AgentVista | "Benchmark khó năm 2026" | Quy trình thực tế 12 miền; ngay cả Gemini 3 Pro đạt ~30% |

## Further Reading

- [Cheng et al. — SeeClick (arXiv:2401.10935)](https://arxiv.org/abs/2401.10935)
- [Hong et al. — CogAgent (arXiv:2312.08914)](https://arxiv.org/abs/2312.08914)
- [You et al. — Ferret-UI (arXiv:2404.05719)](https://arxiv.org/abs/2404.05719)
- [ChartAgent (arXiv:2510.04514)](https://arxiv.org/abs/2510.04514)
- [Koh et al. — VisualWebArena (arXiv:2401.13649)](https://arxiv.org/abs/2401.13649)
- [AgentVista (arXiv:2602.23166)](https://arxiv.org/abs/2602.23166)
