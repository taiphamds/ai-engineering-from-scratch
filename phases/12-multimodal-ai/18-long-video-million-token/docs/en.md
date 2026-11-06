# Long-Video Understanding at Million-Token Context

> Một video 4K dài 1 giờ ở 24 FPS, được chia patch và embedding, tạo ra cỡ 60 triệu token. Một tập podcast dài 2 giờ được chép lời là 30,000 token. Một phim truyện Blu-ray đầy đủ, ngay cả khi nén bằng pool mạnh, cũng là hàng trăm nghìn token. Gemini 1.5 của Google (tháng 3 năm 2024) mở đầu kỷ nguyên này với ngữ cảnh 10 triệu token, thực hiện truy hồi kim trong đống cỏ khô đáng tin cậy trên video dài hàng giờ. LWM (Liu và cộng sự, tháng 2 năm 2024) cho thấy con đường mở rộng của ring attention. LongVILA và Video-XL mở rộng việc tiếp nhận hơn nữa. VideoAgent thay ngữ cảnh thô bằng truy xuất bằng agent. Mỗi cách tiếp cận là một đánh đổi khác nhau về tính toán, độ thu hồi và độ phức tạp kỹ thuật. Bài học này đọc chúng cạnh nhau.

**Type:** Build
**Languages:** Python (stdlib, needle-in-haystack simulator + agentic-retrieval router)
**Prerequisites:** Phase 12 · 17 (video temporal tokens)
**Time:** ~180 minutes

## Learning Objectives

- Tính tổng số token thị giác cho video dài ở các mức FPS và pool khác nhau.
- Giải thích ba con đường mở rộng: ngữ cảnh trực tiếp (Gemini 1.5), ring attention (LWM), nén token (LongVILA / Video-XL).
- So sánh VLM video ngữ cảnh thô với VLM video truy xuất bằng agent (VideoAgent) về độ chính xác và độ trễ.
- Thiết kế phép kiểm tra kim trong đống cỏ khô cho video 30 phút và đo độ thu hồi tại một phút cụ thể.

## The Problem

Một khung hình với patch cỡ Qwen2.5-VL ở độ phân giải gốc 384 là ~729 token. Với pool 3x3, đó là 81 token mỗi khung hình. Clip 30 phút ở 1 FPS = 1800 khung hình = 145,800 token. Khả thi với VLM mở năm 2025, sát giới hạn. Ở 2 FPS, 291,600 token — chỉ các ngữ cảnh lớn nhất chứa được.

Một phim 2 giờ ở 1 FPS là 583k token. Vượt phần lớn mô hình mở năm 2026; đòi hỏi Gemini 2.5 Pro hoặc pool mạnh hơn.

Ba con đường mở rộng xuất hiện.

## The Concept

### Path 1: Brute context (Gemini 1.5, Claude Opus)

Dồn phần cứng vào vấn đề. Mở rộng ngữ cảnh đến hàng triệu token, xử lý mọi thứ trong một lượt truyền xuôi.

Gemini 1.5 Pro ra mắt với 1M token; Gemini 1.5 Ultra đến 10M; Gemini 2.5 Pro năm 2026 xử lý video hàng giờ đáng tin cậy. Bài báo (arXiv:2403.05530) ghi nhận độ thu hồi kim trong đống cỏ khô 99.7% đến ~9.5M token.

Kỹ thuật: triển khai attention tùy chỉnh với phân cấp bộ nhớ (cục bộ + toàn cục + thưa) cộng với định tuyến chuyên gia MoE để hiệu quả ngữ cảnh dài. Không công bố đầy đủ chi tiết. Không mã nguồn mở.

### Path 2: Ring attention (LWM, LongVILA)

Ring attention phân phối chuỗi dài trên các thiết bị trong một "vòng", nơi mỗi thiết bị giữ một phần. Attention trên toàn chuỗi diễn ra bằng cách mỗi thiết bị gửi phần của mình sang thiết bị tiếp theo theo mẫu vòng, tính attention từng phần và tổng hợp.

LWM (Liu và cộng sự, 2024) huấn luyện mô hình ngữ cảnh 1M token theo cách này. Lượng tính toán huấn luyện tăng tuyến tính theo ngữ cảnh, không phải bậc hai — tác động bậc hai của attention được phân bổ trên các thiết bị của vòng.

LongVILA (arXiv:2408.10188) điều chỉnh mẫu này cho VLM. Video 1400 khung hình ở 192 token mỗi khung hình = ngữ cảnh 268k, được huấn luyện với ring attention trên song song 8 chiều.

### Path 3: Token compression (Video-XL, LongVA)

Rẻ hơn ngữ cảnh trực tiếp: nén mạnh trước khi LLM thấy chuỗi.

Video-XL (arXiv:2409.14485) dùng token tóm tắt thị giác: mỗi clip N khung hình tạo một token "tóm tắt" duy nhất chú ý trên N khung hình. Khi suy luận, LLM thấy một token tóm tắt mỗi clip, thu nhỏ mạnh ngữ cảnh.

LongVA mở rộng ngữ cảnh LLM từ 200k đến 2M bằng kỹ thuật "chuyển giao ngữ cảnh dài". Huấn luyện trên văn bản ngữ cảnh dài, chuyển sang video ngữ cảnh dài qua biểu diễn dùng chung.

Nén token đánh đổi độ thu hồi tại các dấu thời gian cụ thể lấy khả năng mở rộng. Mô hình biết tổng quát chuyện gì xảy ra nhưng đôi khi bỏ lỡ khung hình chính xác.

### Path 4: Agentic retrieval (VideoAgent)

Không đưa toàn bộ video vào LLM. Thay vào đó, coi video là cơ sở dữ liệu và dùng LLM truy vấn nó.

VideoAgent (arXiv:2403.10517):

1. LLM đọc câu hỏi.
2. LLM yêu cầu công cụ truy xuất các clip liên quan ("cho tôi xem các đoạn có mèo").
3. Công cụ trả dấu thời gian clip khớp.
4. LLM đọc các clip đó qua VLM.
5. LLM soạn câu trả lời hoặc đưa truy vấn tiếp theo.

Đây là mẫu LLM-là-agent áp dụng cho video dài. Suy luận rẻ hơn (chỉ mã hóa clip liên quan), kỹ thuật khó hơn (chất lượng truy xuất trở thành nút thắt).

### Needle-in-a-haystack benchmarks

Phép kiểm tra ngữ cảnh dài tiêu chuẩn: chèn một dấu đánh dấu thị giác hoặc văn bản duy nhất tại điểm ngẫu nhiên trong video, rồi đặt truy vấn đòi hỏi nhớ lại nó.

Chỉ số: Recall@k theo độ dài video và vị trí dấu đánh dấu.

Gemini 2.5 Pro đạt độ thu hồi >99% ở video dài đến 90 phút. Mô hình mở 72B (Qwen2.5-VL-72B, InternVL3-78B) đạt ~85-90% ở 30 phút và suy giảm sau 60.

VideoAgent có thể ngang hoặc vượt mô hình ngữ cảnh thô ở 2+ giờ vì truy xuất tìm trúng kim nếu công cụ tốt.

### Which path to pick

Với clip 15 phút ở độ chính xác tiên tiến nhất: mô hình mở 72B + ngữ cảnh gốc thường hoạt động. Chọn Qwen2.5-VL-72B.

Với nội dung 30 phút đến 1 giờ: LongVILA hoặc Video-XL cho mở; Gemini 2.5 Pro cho đóng. Ngưỡng chất lượng quan trọng — mức tiên tiến nhất chọn đóng.

Với nội dung 2+ giờ: VideoAgent hoặc các mẫu truy xuất tương tự. Hoặc tóm tắt thành các phần nhỏ hơn và đưa các bản tóm tắt phân cấp vào.

### 2026 production pattern

Trong thực tế, pipeline video dài trong sản xuất là lai:

1. Chạy lấy mẫu FPS động + pool mạnh trên toàn bộ video (nhận biểu diễn toàn cục 100k token).
2. Đưa vào VLM 72B để có bản tóm tắt toàn cục.
3. Nếu người dùng hỏi chi tiết, chạy truy xuất bằng agent dùng bản tóm tắt làm chỉ mục.

Điều này kết hợp ngữ cảnh trực tiếp để hiểu toàn cục và truy xuất cho chi tiết cục bộ.

```figure
mm-video-token-budget
```

## Use It

`code/main.py`:

- Tính ngân sách token cho video từ 1 phút đến 3 giờ ở các mức FPS + pool khác nhau.
- Mô phỏng lần chạy kim trong đống cỏ khô: chèn dấu đánh dấu tại dấu thời gian ngẫu nhiên, đặt câu hỏi, chấm độ thu hồi.
- Gồm mô phỏng bộ định tuyến truy xuất bằng agent chọn clip cụ thể để đưa vào VLM phía sau.

Chạy bảng ngân sách và cảm nhận khoảng cách quy mô.

## Ship It

Bài học này tạo ra `outputs/skill-long-video-strategy-planner.md`. Với thời lượng video và độ phức tạp truy vấn, nó chọn giữa ngữ cảnh trực tiếp, nén và truy xuất bằng agent, rồi tính kỳ vọng độ trễ + chất lượng.

## Exercises

1. Một bài giảng 45 phút ở 1 FPS, 81 token mỗi khung hình. Tổng token? Vừa ngữ cảnh mô hình nào?

2. Thiết kế phép kiểm tra kim trong đống cỏ khô: bạn chèn dấu đánh dấu ở phút nào và định dạng truy vấn chính xác là gì?

3. So sánh Qwen2.5-VL-72B ngữ cảnh trực tiếp (ngữ cảnh 80k) với VideoAgent (Claude 3.5 + truy xuất) trên video 1 giờ. Cách nào thắng về độ thu hồi? Cách nào thắng về độ trễ?

4. Chi phí bộ nhớ của ring attention tăng tuyến tính theo độ dài chuỗi và tuyến tính theo số thiết bị. Giải thích tại sao và điều gì hỏng nếu bỏ giai đoạn xoay vòng.

5. Đọc Mục 5 của Gemini 1.5 về kim trong đống cỏ khô. Bài báo phát hiện điều gì về độ thu hồi tại ranh giới token 1M so với 10M?

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|------------------------|
| Brute context (Ngữ cảnh trực tiếp) | "Chỉ thêm token" | Mở rộng ngữ cảnh LLM đến hàng triệu token; xử lý mọi thứ trong một lượt |
| Ring attention (Attention vòng) | "Song song kiểu LWM" | Mẫu attention phân tán trong đó mỗi thiết bị giữ một phần và xoay vòng |
| Token compression (Nén token) | "Token tóm tắt" | Giảm token mỗi clip qua bộ nén học được trước LLM |
| Needle-in-haystack (Kim trong đống cỏ khô) | "Phép kiểm tra NIH" | Chèn dấu đánh dấu duy nhất tại điểm ngẫu nhiên, yêu cầu mô hình nhớ lại khi kiểm tra |
| Agentic retrieval (Truy xuất bằng agent) | "LLM làm bộ lập kế hoạch truy vấn" | LLM yêu cầu công cụ truy xuất clip liên quan, đọc qua VLM, soạn câu trả lời |
| VideoAgent | "Mẫu truy xuất cho video" | Thiết kế truy xuất bằng agent kinh điển: câu hỏi -> công cụ -> clip -> câu trả lời |

## Further Reading

- [Gemini Team — Gemini 1.5 (arXiv:2403.05530)](https://arxiv.org/abs/2403.05530)
- [Liu et al. — LWM / RingAttention (arXiv:2402.08268)](https://arxiv.org/abs/2402.08268)
- [Xue et al. — LongVILA (arXiv:2408.10188)](https://arxiv.org/abs/2408.10188)
- [Shu et al. — Video-XL (arXiv:2409.14485)](https://arxiv.org/abs/2409.14485)
- [Wang et al. — VideoAgent (arXiv:2403.10517)](https://arxiv.org/abs/2403.10517)
