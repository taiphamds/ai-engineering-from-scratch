# LLaVA-OneVision: Single-Image, Multi-Image, Video in One Model

> Trước LLaVA-OneVision (Li và cộng sự, tháng 8 năm 2024), thế giới VLM mở có dòng riêng: LLaVA-1.5 cho một ảnh, mô hình nhiều ảnh như Mantis và VILA, mô hình video như Video-LLaVA và Video-LLaMA. Mỗi loại thắng benchmark của mình và thất bại ở loại khác. LLaVA-OneVision lập luận một giáo trình có thể huấn luyện một mô hình thống trị cả ba kịch bản, và hiệu ứng chuyển giao tác vụ tự phát (kỹ năng một ảnh xuất sang video, suy luận nhiều ảnh xuất sang một ảnh) vượt tổng các mô hình chuyên biệt. Công thức đơn giản một cách đánh lừa: ngân sách token thị giác giữ hằng giữa kịch bản, cộng giáo trình rõ ràng đi từ một ảnh sang OneVision (nhiều ảnh) rồi video. Bài học này đọc ngân sách, giáo trình và hành vi tự phát.

**Type:** Build
**Languages:** Python (stdlib, token budget solver + curriculum planner)
**Prerequisites:** Phase 12 · 05 (LLaVA), Phase 12 · 06 (any-resolution)
**Time:** ~180 minutes

## Learning Objectives

- Thiết kế ngân sách token thị giác giữ hằng giữa đầu vào một ảnh, nhiều ảnh và video.
- Sắp giáo trình huấn luyện chuyển kỹ năng từ một ảnh sang video không quên thảm khốc.
- Giải thích tại sao một mô hình thắng các mô hình chuyên biệt cùng số tham số khi giáo trình làm đúng.
- Nêu tên ba năng lực tự phát LLaVA-OneVision báo cáo: suy luận nhiều camera, prompting set-of-mark, tác tử ảnh chụp màn hình iPhone.

## The Problem

Ảnh, nhiều ảnh và video gây áp lực khác nhau cho mô hình.

Một ảnh muốn token độ phân giải cao (AnyRes, ~2880 token thị giác) để bắt OCR và chi tiết nhỏ. Ngân sách mỗi mẫu: một ảnh, 2880 token.

Nhiều ảnh muốn vài ảnh ở độ phân giải vừa (~576 token mỗi ảnh) để suy luận giữa ảnh vừa ngữ cảnh. Ngân sách mỗi mẫu: 4-8 ảnh, mỗi ảnh 576, 2300-4600 token.

Video muốn nhiều khung ở độ phân giải thấp (~196 token mỗi khung sau pooling) để nắm động lực thời gian. Ngân sách mỗi mẫu: 8-32 khung, mỗi khung 196, 1600-6200 token.

Nếu huấn luyện mô hình riêng, chọn một ngân sách. Nếu huấn luyện một mô hình, cần ngân sách mở rộng hợp lý giữa kịch bản không làm nổ ngữ cảnh.

Trước OneVision, câu trả lời mặc định là "huấn luyện một kịch bản, bỏ qua loại khác." Video-LLaVA lắp thêm video vào mô hình ảnh bằng giai đoạn huấn luyện thêm. LLaVA-NeXT thêm nhiều ảnh bằng chia ô. Không loại nào xử lý gọn cả ba.

## The Concept

### The OneVision token budget

LLaVA-OneVision chọn ngân sách token thị giác thống nhất khoảng 3000-4000 token mỗi mẫu, phân bổ khác theo kịch bản:

- Một ảnh: AnyRes-9 (ô 3x3 + ảnh thu nhỏ), mỗi ô ở 384 với 729 patch, pooling song tuyến tính mạnh 2x2 → 182 mỗi ô. Tổng: 9 * 182 + 182 = 1820 token. Hoặc AnyRes-4 ở 729 mỗi ô = 2916 + 729.
- Nhiều ảnh: mỗi ảnh độ phân giải vừa (384, không chia ô), 729 token không pooling. Ngân sách 6 ảnh → 4374 token.
- Video: 32 khung ở độ phân giải 384 với pooling song tuyến tính mạnh 3x3 → 81 token mỗi khung. Tổng: 32 * 81 = 2592 token.

Phân bổ giữ tổng token gần hằng. LLM không bao giờ thấy batch làm nổ ngữ cảnh. Encoder tạo hình học khác mỗi kịch bản, nhưng LLM tiêu thụ cùng ngân sách.

### The three-stage curriculum

LLaVA-OneVision huấn luyện ba giai đoạn:

1. SFT một ảnh (giai đoạn SI). Mọi dữ liệu là một ảnh cộng văn bản. Huấn luyện trên đầu vào AnyRes độ phân giải cao. Dạy tri giác, OCR và hiểu chi tiết. Dùng dữ liệu LLaVA-NeXT cộng dữ liệu một ảnh riêng OneVision.
2. SFT OneVision (giai đoạn OV). Trộn một ảnh + nhiều ảnh + video (khung lấy mẫu đều). Huấn luyện trên ngân sách token thống nhất. Dạy mô hình xử lý hình dạng batch không đồng nhất. Không đặt lại trọng số — tiếp tục từ SI.
3. Chuyển giao tác vụ (giai đoạn TT). Tiếp tục với hỗn hợp tác vụ đích, thường nặng nhiều ảnh hoặc video hơn theo sản phẩm. Fine-tune tùy chọn để triển khai.

Then chốt: thứ tự giáo trình quan trọng. Huấn luyện video trước hoặc nhiều ảnh trước tạo hiệu năng ảnh kém hơn một ảnh trước, dù cùng dữ liệu. Bài báo thử loại bỏ thành phần này rõ ràng.

### Why curriculum works

Huấn luyện một ảnh xây nền tri giác. Token patch mang đặc trưng thị giác chi tiết; LLM học tích hợp với văn bản. Nhiều ảnh và video đưa thách thức cấu trúc (ảnh nào là ảnh nào, điều gì xảy ra trước) khó học khi chưa có nền tri giác mạnh.

Nếu huấn luyện mọi kịch bản từ đầu cùng nhau, mô hình thiếu khớp tri giác (dữ liệu một ảnh hạn chế mỗi batch) và quá khớp cấu trúc (nhiều dữ liệu nhiều ảnh / video). Kết quả: mô hình theo mẫu suy luận xuyên ảnh nhưng nông về thị giác.

Thứ tự giáo trình cho sức mạnh tri giác từ SI, rồi suy luận kết hợp/thời gian từ OV, không mất loại nào.

### Emergent cross-scenario skills

Bài báo LLaVA-OneVision báo ba năng lực tự phát:

1. Suy luận nhiều camera. Huấn luyện riêng trên nhiều ảnh + video; khi suy luận, yêu cầu suy luận về cảnh lái xe nhiều camera. Mô hình tích hợp đúng góc nhìn dù chưa thấy đúng định dạng đó trong huấn luyện.
2. Prompting set-of-mark. Người dùng chú giải đối tượng trong ảnh bằng dấu đánh số; mô hình suy luận về "dấu 3 đang làm gì so với dấu 7." Không huấn luyện trên dấu hay chú giải; học từ kết hợp grounding không gian + tham chiếu nhiều ảnh.
3. Tác tử ảnh chụp màn hình iPhone. Người dùng cung cấp ảnh chụp màn hình iPhone và yêu cầu lập kế hoạch nhấp tiếp. Huấn luyện trên ảnh UI, video quy trình người dùng và cặp nhiều ảnh trước/sau. Khái quát sang trường hợp tác tử.

Đây không phải tác vụ được huấn luyện; chúng xuất hiện từ cấu trúc kết hợp của giáo trình.

### Visual-token pooling

Ngân sách token cần pooling. OneVision dùng nội suy song tuyến tính trên lưới patch 2D: 24x24 = 576 patch thành 12x12 = 144 (hệ số 2x) hoặc 8x8 = 64 (hệ số 3x). Pooling trong không gian lưới patch, không không gian token, để giữ tính cục bộ.

Lựa chọn hệ số pooling mỗi kịch bản tự nó là siêu tham số. Ít pooling hơn = nhiều token hơn = biểu diễn phong phú hơn. Nhiều pooling hơn = ít token hơn = vừa nhiều khung / ảnh hơn.

### LLaVA-OneVision-1.5

Bản tiếp nối năm 2025 (LLaVA-OneVision-1.5, arXiv 2509.23661) "hoàn toàn mở" về dữ liệu huấn luyện, trọng số mô hình và mã. Sánh ngang khoảng cách độc quyền trên một số benchmark và dân chủ hóa công thức. Cùng giáo trình, nhiều dữ liệu hơn, LLM cơ sở tốt hơn. Không đổi kiến trúc.

### Contrast with Qwen2.5-VL

Qwen2.5-VL (Bài 12.09) chọn khác. Dùng M-RoPE và FPS động thay pooling cố định. Ngân sách tăng theo đầu vào — video 1 phút dùng nhiều token hơn video 5 giây. LLaVA-OneVision cố định ngân sách và co giãn pooling. Cả hai hoạt động; đánh đổi khả năng cấu hình lấy tính có thể dự đoán.

```figure
l5-onevision-budget
```

## Use It

`code/main.py` là bộ lập giáo trình và ngân sách cho VLM kiểu OneVision. Với ngân sách token mỗi mẫu và hỗn hợp kịch bản đích (chẳng hạn 40% một ảnh, 30% nhiều ảnh, 30% video), nó:

- Phân bổ độ phân giải, hệ số pooling và khung mỗi kịch bản.
- Kiểm tra mọi kịch bản vừa ngân sách dùng chung.
- Báo số token kỳ vọng, FLOPs LLM và kịch bản thiếu token.
- In lịch huấn luyện từng giai đoạn.

Dùng để lập kế hoạch fine-tune OneVision hoặc kiểm tra hợp lý chi phí mỗi yêu cầu triển khai VLM.

## Ship It

Bài học này tạo `outputs/skill-onevision-budget-planner.md`. Với phân phối tác vụ đích và ngân sách mỗi mẫu, nó phát hệ số AnyRes, pooling mỗi khung, số khung video và trọng số giai đoạn giáo trình. Dùng mỗi khi huấn luyện hoặc fine-tune VLM thống nhất kịch bản.

## Exercises

1. Sản phẩm hỗ trợ 80% một ảnh, 10% nhiều ảnh (2-4 ảnh), 10% video (8-16 khung). Thiết kế ngân sách token. Bạn đặt ngân sách dư tiết kiệm từ không làm nhiều ảnh nặng vào đâu?

2. Đọc Mục 4.3 LLaVA-OneVision (năng lực tự phát). Đề xuất kỹ năng tự phát thứ tư giáo trình có thể mở khóa nhưng bài báo không báo.

3. Đổi thứ tự giáo trình — huấn luyện nhiều ảnh trước, rồi một ảnh, rồi video. Dự đoán benchmark nào suy giảm và tại sao.

4. Bài báo báo benchmark video huấn luyện chỉ 8 khung mỗi mẫu. Có khái quát sang video 30 giây khi suy luận không? Thứ gì hỏng trước — ngân sách token hay suy luận thời gian?

5. Pooling song tuyến tính patch 24x24 xuống 12x12 là giảm 4x mỗi chiều. Triển khai pooling bằng stdlib Python và xác minh trung bình mỗi khối 2x2 khớp đầu ra song tuyến tính.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|------------------------|
| OneVision scenario (Kịch bản OneVision) | "Một ảnh, nhiều ảnh hoặc video" | Một trong ba hình dạng đầu vào VLM thống nhất xử lý; ngân sách giữ hằng giữa chúng |
| Token budget (Ngân sách token) | "Bao nhiêu token mỗi mẫu" | Tổng token thị giác LLM thấy mỗi mẫu huấn luyện / suy luận, thường 3000-4000 |
| Curriculum (Giáo trình) | "Thứ tự huấn luyện" | Thứ tự giai đoạn (một ảnh → nhiều ảnh → video) chọn để có chuyển giao tự phát |
| Bilinear pooling (Pooling song tuyến tính) | "Thu nhỏ token" | Áp dụng nội suy song tuyến tính lên lưới patch (2D) để giảm token nhưng giữ tính cục bộ |
| Emergent skill (Kỹ năng tự phát) | "Không huấn luyện, vẫn hoạt động" | Năng lực xuất hiện khi suy luận không có dữ liệu huấn luyện khớp, nhờ kết hợp giáo trình |
| AnyRes-k | "Thiết lập k ô" | k ô con độ phân giải cố định cộng một ảnh thu nhỏ, k điển hình ∈ {4, 9} |
| Task transfer (Chuyển giao tác vụ) | "Khái quát xuyên kịch bản" | Kỹ năng học trên một ảnh áp dụng sang video (và ngược lại) qua backbone dùng chung |

## Further Reading

- [Li et al. — LLaVA-OneVision (arXiv:2408.03326)](https://arxiv.org/abs/2408.03326)
- [LLaVA-OneVision-1.5: Fully Open Framework (arXiv:2509.23661)](https://arxiv.org/abs/2509.23661)
- [Lin et al. — Video-LLaVA (arXiv:2311.10122)](https://arxiv.org/abs/2311.10122)
- [Lin et al. — VILA (arXiv:2312.07533)](https://arxiv.org/abs/2312.07533)
- [Wang et al. — Qwen2-VL (arXiv:2409.12191)](https://arxiv.org/abs/2409.12191)
