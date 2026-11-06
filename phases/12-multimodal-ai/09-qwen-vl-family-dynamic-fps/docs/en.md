# Qwen-VL Family and Dynamic-FPS Video

> Họ Qwen-VL — Qwen-VL (2023), Qwen2-VL (2024), Qwen2.5-VL (2025), Qwen3-VL (2025) — là dòng mô hình thị giác-ngôn ngữ mở ảnh hưởng nhất năm 2026. Mỗi thế hệ đặt cược kiến trúc quyết định duy nhất mà phần còn lại hệ sinh thái mở sao chép trong mười hai tháng: độ phân giải động nguyên bản qua M-RoPE, lấy mẫu FPS động với căn chỉnh thời gian tuyệt đối, window attention trong ViT và định dạng đầu ra tác tử có cấu trúc. Đến Qwen3-VL, công thức ổn định: encoder ViT 2D-RoPE với đầu vào tỷ lệ khung hình nguyên bản, projector MLP vào nền ngôn ngữ Qwen3 lớn và các giai đoạn huấn luyện nhấn mạnh OCR, grounding, hành vi tác tử như mục tiêu hạng nhất. Bài học này đọc họ theo thời gian để hiểu tại sao mỗi núm ở chỗ đó.

**Type:** Learn
**Languages:** Python (stdlib, M-RoPE encoder + dynamic-FPS sampler)
**Prerequisites:** Phase 12 · 06 (patch-n'-pack)
**Time:** ~120 minutes

## Learning Objectives

- Tính phép quay ba trục M-RoPE (thời gian, chiều cao, chiều rộng) và giải thích tại sao cần cả ba.
- Chọn chiến lược lấy mẫu FPS động cho video và suy luận về token mỗi giây so với độ chính xác phát hiện sự kiện.
- Nêu tên bốn nâng cấp thế hệ Qwen-VL theo thứ tự và điều mỗi loại cho phép.
- Kết nối định dạng đầu ra tác tử JSON kiểu Qwen2.5-VL và phân tích lệnh gọi công cụ có cấu trúc từ phản hồi VLM.

## The Problem

Qwen-VL phát hành tháng 8 năm 2023 như đáp trả trực tiếp LLaVA-1.5 và BLIP-2. Khoảng trống nhóm Qwen nhắm có ba phần: độ phân giải, video và đầu ra có cấu trúc.

Độ phân giải: LLaVA-1.5 chạy ở 336x336. Phù hợp ảnh chụp, vô dụng cho hóa đơn tiếng Trung hoặc ảnh chụp bảng tính dày đặc. Đổi mới đầu Qwen-VL là 448x448 và đầu ra hộp giới hạn có grounding, cho mô hình chỉ vào vật.

Video: Video-LLaMA xếp encoder từng khung và đưa vào LLM. Hoạt động cho clip ngắn, không cho video nhiều phút nơi trục thời gian là tín hiệu. Nhóm Qwen muốn một encoder hiểu thời gian.

Đầu ra có cấu trúc: LLaVA phát văn bản tự do. Tác tử cần JSON. Qwen-VL huấn luyện trên định dạng đầu ra JSON rõ ràng gồm tọa độ hộp giới hạn như văn bản.

Mọi thế hệ Qwen-VL mở rộng một trong ba trục này.

## The Concept

### Qwen-VL (August 2023)

Thế hệ đầu: OpenCLIP ViT-bigG/14 làm encoder (2.5B tham số), Q-Former tương thích LLama (1 bước với 256 query), cơ sở Qwen-7B. Đóng góp:

- Độ phân giải 448x448 (khi đó SOTA cho VLM mở).
- Grounding: huấn luyện trên cặp ảnh-văn bản với đầu ra token tọa độ rõ ràng. "Con mèo ở <box>(112, 204), (280, 344)</box>".
- Huấn luyện đa ngôn ngữ Trung + Anh từ đầu.

Benchmark lúc đó: cạnh tranh GPT-4V trên tiếng Anh, thống trị tiếng Trung. Giám sát grounding là điểm chính thực sự.

### Qwen2-VL (September 2024) — M-RoPE and native resolution

Qwen2-VL thay ngăn xếp độ phân giải cố định + Q-Former bằng encoder ViT độ phân giải động nguyên bản. Thay đổi chính:

- Độ phân giải động nguyên bản. ViT nhận mọi HxW chia hết cho 28 (patch 14 với gộp không gian 2x). Ảnh 1120x672 (40x24 patch đã gộp) tạo 960 token thị giác. Không đổi kích thước, không chia ô, không ảnh thu nhỏ.
- M-RoPE (Multimodal RoPE). Mỗi token mang vị trí 3D (t, h, w) thay 1D. Với ảnh t=0, với video t = frame_index. RoPE quay vector query/key theo tần số mỗi trục. Không bảng embedding vị trí.
- Projector MLP. Bỏ Q-Former; dùng MLP 2 lớp trên token patch đã gộp.
- Video với FPS động. Video mặc định lấy mẫu ở 1-2 FPS, nhưng mô hình nhận số khung tùy ý.

Kết quả: Qwen2-VL-7B ngang GPT-4o trên vài benchmark đa phương thức và vượt DocVQA (94.5 so với 88.4). Đổi kiến trúc là bước quyết định.

### Qwen2.5-VL (February 2025) — dynamic FPS + absolute time

Chuyển dịch lớn Qwen2.5-VL là video. FPS động không chỉ "lấy thêm khung khi cần." Bài báo hình thức hóa:

- Thời gian tuyệt đối trong các ID vị trí. Thay vì các chỉ số khung hình (khung hình 0, 1, 2...), trục thời gian của M-RoPE theo các timestamp thực tế, vì vậy khoảng cách giữa ID của hai khung hình theo số giây giữa chúng. "Tại 0:04, con mèo nhảy." Không có token văn bản bổ sung mang thời gian, vì vậy mã hóa không thêm độ dài chuỗi.
- FPS động. Lấy mẫu 1 FPS cho cảnh chậm, 4+ FPS cho hành động. Người dùng hoặc trainer chọn; M-RoPE thích ứng.
- Window attention trong ViT. Attention không gian chia cửa sổ (cục bộ trong khối) cho thông lượng; attention toàn cục mỗi vài lớp.
- Định dạng đầu ra JSON rõ ràng. Huấn luyện trên dữ liệu gọi công cụ: "{\"tool\": \"click\", \"coords\": [380, 220]}". Sẵn làm tác tử ngay.
- Co giãn MRoPE-v2. Vị trí co giãn theo kích thước đầu vào tối đa để video 10 phút không hết phạm vi tần số.

Benchmark: Qwen2.5-VL-72B vượt GPT-4o trên hầu hết benchmark video, ngang Gemini 2.0 trên tài liệu và lập SOTA mô hình mở cho GUI grounding (ScreenSpot: độ chính xác 84% so với 38% GPT-4o).

### Qwen3-VL (November 2025)

Qwen3-VL là nâng cấp gia tăng củng cố thay vì tái phát minh: backbone LLM lớn hơn (Qwen3-72B), dữ liệu huấn luyện mở rộng, OCR cải thiện, suy luận mạnh hơn qua "chế độ suy nghĩ" Qwen3. ViT và M-RoPE giữ nguyên. Bài báo tập trung cải thiện dữ liệu và huấn luyện hơn kiến trúc.

Bài học từ dòng phát triển: đến năm 2025 kiến trúc Qwen-VL ổn định. Thế hệ thêm mở rộng tính toán và dữ liệu, không thành phần cơ bản.

### M-RoPE mathematically

RoPE cổ điển quay query `q` chiều `d` theo vị trí `m` bằng tọa độ ghép cặp:

```math
\begin{aligned}
q_{\text{rot}}[2i] &= q[2i] \cos(m \theta_i) - q[2i+1] \sin(m \theta_i) \\
q_{\text{rot}}[2i+1] &= q[2i] \sin(m \theta_i) + q[2i+1] \cos(m \theta_i) \\
\theta_i &= 10000^{-2i/d}
\end{aligned}
```

M-RoPE chia chiều ẩn thành ba dải. Chẳng hạn `d = 96`. Gán 32 chiều cho thời gian, 32 chiều chiều cao, 32 chiều chiều rộng. Mỗi dải quay theo vị trí trục riêng. Patch ở (t=5, h=10, w=20) nhận phép quay `R_t(5)`, `R_h(10)`, `R_w(20)` áp dụng cho ba dải.

Token văn bản dùng `t = text_index, h = 0, w = 0` (hoặc lựa chọn chuẩn hóa), giữ tương thích. Khung video dùng `t = frame_time, h = row, w = col`. Ảnh đơn dùng `t = 0`.

Lợi ích: một mã hóa vị trí xử lý văn bản, ảnh và video không phân nhánh mã hoặc bảng vị trí khác.

### Dynamic-FPS sampling logic

Với video dài `T` giây và ngân sách token đích `B`:

1. Tính FPS tối đa đủ chi phí: `fps_max = B / (T * tokens_per_frame)`.
2. Chọn FPS đích từ `{1, 2, 4, 8}` thỏa `fps <= fps_max`.
3. Nếu chuyển động cao (heuristic optical-flow hoặc yêu cầu rõ của người dùng), chọn FPS cao hơn. Nếu chuyển động thấp, chọn thấp hơn.
4. Lấy mẫu đều ở FPS đã chọn; đặt ID thời gian M-RoPE của mỗi khung hình từ timestamp tính bằng giây của nó.

Qwen2.5-VL huấn luyện logic này ngầm; khi suy luận người dùng kiểm soát qua tham số `fps`. Chuỗi hành động 60 giây ở 4 FPS với 81 token mỗi khung = 19440 token, quản lý được trong ngữ cảnh 32k.

### Structured agent output

Huấn luyện tác tử Qwen2.5-VL nhắm rõ lệnh gọi công cụ có cấu trúc:

```
{
  "tool": "mouse_click",
  "coords": [1024, 512],
  "button": "left",
  "modifier": null
}
```

Phân tích là tất định: JSON.parse trên đầu ra mô hình. So với dạng tự do "nhấp ở (1024, 512)" cần regex và xử lý mơ hồ. Chuyển dịch là lý do điểm ScreenSpot Qwen2.5-VL nhảy từ 55% Qwen2-VL lên 84%.

```figure
mm-mrope-axes
```

## Use It

`code/main.py` triển khai:

- Tính vị trí M-RoPE cho chuỗi đóng gói trộn văn bản, patch ảnh và khung video.
- Bộ lấy mẫu FPS động: với (duration, budget, motion_level), chọn FPS và phát dấu thời gian khung.
- Bộ phân tích đầu ra JSON Qwen2.5-VL minh họa xử lý phản hồi gọi công cụ có trường tọa độ.

Chạy, rồi cảm nhận khác biệt khi đổi FPS cố định sang FPS động trên video 5 phút.

## Ship It

Bài học này tạo `outputs/skill-qwen-vl-pipeline-designer.md`. Với tác vụ video (giám sát, tác tử, nhận dạng hành động, khả năng tiếp cận), nó phát cấu hình Qwen2.5-VL (ngân sách khung, chiến lược FPS, cờ window-attention, chế độ đầu ra tác tử) và ước lượng độ trễ. Dùng mỗi khi triển khai mô hình họ Qwen-VL cho sản phẩm video.

## Exercises

1. Tính phép quay M-RoPE cho patch ở (t=3, h=5, w=7) với chiều ẩn 48 (16 mỗi dải, theta cơ sở 10000). Cho góc quay ba cặp đầu trong mỗi dải.

2. Bản ghi camera an ninh 10 phút ở 1 FPS tạo bao nhiêu khung? Ở độ phân giải 384 với pooling 3x, tổng bao nhiêu token? Ngữ cảnh 32k mặc định Qwen2.5-VL xử lý được không?

3. Chọn FPS cho pha bóng quần vợt 30 giây so với demo công thức nấu 30 giây so với bản ghi tác tử UI 30 giây. Lý giải từng loại bằng logic FPS động.

4. Qwen2.5-VL bỏ hoàn toàn Q-Former. Tại sao MLP đơn giản hoạt động năm 2025 nhưng không năm 2023? (Gợi ý: quy mô dữ liệu và chất lượng encoder.)

5. Phân tích ba đầu ra JSON gọi công cụ Qwen2.5-VL thành dict Python. Điều gì thất bại với JSON sai định dạng và cookbook Qwen khuyến nghị chiến lược phục hồi nào?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|------------------------|
| M-RoPE | "RoPE đa phương thức" | Embedding vị trí quay 3D với dải thời gian, chiều cao và chiều rộng trong chiều ẩn |
| Dynamic FPS (FPS động) | "Lấy mẫu thông minh" | Tốc độ lấy mẫu khung chọn mỗi video theo chuyển động, thời lượng và ngân sách token |
| Absolute time encoding (Mã hóa thời gian tuyệt đối) | "M-RoPE căn chỉnh theo thời gian" | Các ID vị trí thời gian được đặt từ timestamp của mỗi khung hình, để mô hình nhìn thấy số giây thực tế, không phải chỉ số khung hình, mà không có token bổ sung |
| Window attention (Attention cửa sổ) | "Attention cục bộ" | Self-attention không gian giới hạn trong cửa sổ nhỏ cho tốc độ; attention toàn cục thêm định kỳ |
| Structured agent output (Đầu ra tác tử có cấu trúc) | "Chế độ JSON" | Giám sát dữ liệu huấn luyện dạy VLM phát JSON phân tích được với tọa độ và tên công cụ |
| min_pixels / max_pixels | "Cận độ phân giải" | Điều khiển mỗi yêu cầu Qwen2.5-VL giới hạn tổng pixel và do đó số token |
| Grounding (Định vị) | "Chỉ vào nó" | Xuất tọa độ hộp giới hạn thành token văn bản; dùng từ Qwen-VL v1 |

## Further Reading

- [Bai et al. — Qwen-VL (arXiv:2308.12966)](https://arxiv.org/abs/2308.12966)
- [Wang et al. — Qwen2-VL (arXiv:2409.12191)](https://arxiv.org/abs/2409.12191)
- [Qwen Team — Qwen2.5-VL Technical Report (arXiv:2502.13923)](https://arxiv.org/abs/2502.13923)
- [Qwen Team — Qwen3-VL (arXiv:2511.21631)](https://arxiv.org/abs/2511.21631)
- [Zhu et al. — InternVL3 (arXiv:2504.10479)](https://arxiv.org/abs/2504.10479)
