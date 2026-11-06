# Embodied VLAs: RT-2, OpenVLA, π0, GR00T

> Lần đầu một mô hình đọc công thức trên website và thực hiện nó trong robot nhà bếp là RT-2 (Google DeepMind, tháng 7 năm 2023). RT-2 rời rạc hóa hành động thành token văn bản, đồng tinh chỉnh VLM trên dữ liệu web cộng dữ liệu hành động robot và chứng minh kiến thức thị giác-ngôn ngữ quy mô web chuyển sang điều khiển robot. OpenVLA (tháng 6 năm 2024) phát hành bản tham khảo mở 7B. Dòng π0 của Physical Intelligence (2024-2025) thêm các chuyên gia hành động flow matching. GR00T N1 của NVIDIA (tháng 3 năm 2025) cung cấp điều khiển hai hệ thống (Hệ thống 1 / Hệ thống 2) cho robot hình người ở quy mô lớn. Thành phần cơ bản VLA — thị giác-ngôn ngữ-hành động, một mô hình duy nhất nhìn, đọc và hành động — là cầu nối giữa các mô hình hiểu của giai đoạn này và hệ thống tự hành ở Giai đoạn 15.

**Type:** Learn
**Languages:** Python (stdlib, action tokenizer + VLA inference skeleton)
**Prerequisites:** Phase 12 · 05 (LLaVA), Phase 15 (Autonomous Systems, referenced)
**Time:** ~180 minutes

## Learning Objectives

- Mô tả token hóa hành động: mã hóa bin rời rạc (RT-2), token hành động hiệu quả FAST, hành động flow matching liên tục (π0).
- Giải thích tại sao đồng tinh chỉnh trên dữ liệu web + robot giữ việc chuyển giao kiến thức tổng quát sang tác vụ mới.
- So sánh OpenVLA (Llama+VLM mở 7B), π0 (flow matching) và GR00T N1 (hai hệ thống) trên cùng tác vụ robot.
- Nêu tên tập dữ liệu Open X-Embodiment và vai trò của nó là ngữ liệu huấn luyện RT-X.

## The Problem

Robot làm việc nhà từ chỉ dẫn ngôn ngữ tự nhiên đã là mục tiêu nghiên cứu từ những năm 1970. Câu trả lời của những năm 2020: mô hình thị giác-ngôn ngữ-hành động (VLA). Cùng kiến trúc VLM dùng cho VQA, nhưng đầu ra là hành động (mô-men khớp, tư thế bộ phận chấp hành cuối, lệnh rời rạc) thay vì văn bản.

Thách thức riêng của VLA:

1. Không gian hành động liên tục (góc khớp, lực) và nhiều chiều (cánh tay 7-DOF + bộ kẹp 3-DOF = 10 chiều ở 30 Hz).
2. Dữ liệu huấn luyện riêng cho robot khan hiếm. Open X-Embodiment có ~1M quỹ đạo; văn bản-ảnh web là 5B+.
3. Tần số điều khiển quan trọng. Vòng lặp điều khiển 30 Hz có nghĩa ngân sách 33ms mỗi hành động.
4. An toàn. Hành động sai làm hỏng phần cứng, gây hại con người hoặc tài sản.

## The Concept

### Action tokenization (RT-2)

Thủ thuật của RT-2: biểu diễn mỗi mục tiêu khớp bằng token văn bản lượng tử hóa. Rời rạc hóa dải chuẩn hóa [-1, 1] thành 256 bin, ánh xạ mỗi bin sang ID từ vựng. Hành động 10-DOF trở thành 10 token tại mỗi bước điều khiển.

Đồng tinh chỉnh VLM PaLM-X trên hỗn hợp:

- Cặp ảnh-văn bản web (tạo chú thích, VQA).
- Trình diễn robot, hành động dưới dạng token.

Mô hình thấy "nhấc khối lập phương đỏ lên" (ngôn ngữ) → ảnh (thị giác) → chuỗi hành động 10 token (mục tiêu khớp rời rạc hóa). Tiền huấn luyện web giữ việc chuyển giao kiến thức tổng quát: RT-2 có thể làm theo "di chuyển về phía vật chuyển động nhanh" dù "chuyển động nhanh" không nằm trong dữ liệu huấn luyện.

Suy luận ở 3-5 Hz trong bài báo RT-2, bị giới hạn bởi giải mã tự hồi quy VLM.

### OpenVLA — the open 7B reference

OpenVLA (Kim và cộng sự, tháng 6 năm 2024) là tương đương RT-2 trọng số mở. Backbone Llama 7B, bộ mã hóa thị giác kép DINOv2 + SigLIP, token hóa hành động trên 256 bin.

Huấn luyện trên Open X-Embodiment (970k quỹ đạo trên 22 robot). Phát hành với hỗ trợ tinh chỉnh LoRA để thích nghi với robot mới.

Suy luận: 4-5 Hz trên A100 với lượng tử hóa. Đủ nhanh cho thao tác chậm, không cho điều khiển tần số cao.

### FAST tokenizer — faster action decode

Pertsch và cộng sự (2024) cho thấy token hóa bin rời rạc không hiệu quả — phần lớn hành động tập trung trong vùng nhỏ của không gian bin. FAST (Tokenizer chuỗi hành động miền tần số) nén chuỗi hành động qua DCT và lượng tử hóa hệ số.

Quỹ đạo hành động 30 bước trở thành ~10 token FAST thay vì 300 token bin rời rạc. Suy luận nhanh hơn 3-5x mà không mất chất lượng.

### π0 and flow-matching actions

π0 của Physical Intelligence (Black và cộng sự, tháng 10 năm 2024) thay token hành động rời rạc bằng chuyên gia hành động flow matching:

- Transformer hành động nhỏ đọc trạng thái ẩn VLM và xuất chuỗi hành động 50 bước liên tục qua rectified flow.
- Head hành động huấn luyện với hàm mất mát flow matching; tiền huấn luyện VLM giữ nguyên.
- Suy luận: toàn bộ chuỗi hành động được phát trong ~5 bước khử nhiễu, thực chất điều khiển 50 Hz.

Tuyên bố của π0: vượt OpenVLA và Octo trên bộ tác vụ thao tác rộng. Công thức hành động liên tục giữ tính mượt mà mà rời rạc hóa phá hủy.

π0.5 và π0-FAST là các nâng cấp tăng dần. π0-FAST kết hợp token hóa FAST với flow matching.

### GR00T N1 — dual-system for humanoids

GR00T N1 của NVIDIA (tháng 3 năm 2025) được xây cho robot hình người (>30 DOF, toàn thân):

- Hệ thống 2: VLM lớn đọc cảnh + chỉ dẫn, tạo mục tiêu con cấp cao ở ~1 Hz.
- Hệ thống 1: transformer head hành động nhỏ tạo lệnh khớp cấp thấp 50-100 Hz được điều kiện hóa trên mục tiêu con.

Sự phân chia ánh xạ vào tư duy nhanh-và-chậm của Kahneman: Hệ thống 2 lập kế hoạch, Hệ thống 1 hành động. Lợi ích: lập kế hoạch chậm cỡ VLM không chặn điều khiển nhanh; Hệ thống 1 giữ nhỏ để có độ trễ thấp.

GR00T N1.7 (cuối năm 2025) cải thiện mở rộng dữ liệu. GR00T tinh chỉnh với dữ liệu mô phỏng-sang-thực từ Omniverse.

### Open X-Embodiment

Dữ liệu huấn luyện. RT-X (tháng 10 năm 2023) tập hợp 22 tập dữ liệu bao phủ 1M quỹ đạo trên 22 robot. Open X-Embodiment là ngữ liệu mọi người dùng:

- ALOHA / Bridge V2 / Droid / RT-2 Kitchen / Language Table.
- Mỗi mẫu: (trạng thái robot, các góc nhìn camera, chỉ dẫn, chuỗi hành động).
- Vệ sinh huấn luyện: thống nhất không gian hành động, chuẩn hóa dải khớp, đổi kích thước camera.

OpenVLA và π0 huấn luyện trên Open X-Embodiment. Khoảng cách miền đến bất kỳ robot cụ thể nào được khép lại bằng tinh chỉnh LoRA trên 100-1000 trình diễn riêng cho tác vụ.

### Co-fine-tuning vs robot-only

Đồng tinh chỉnh trộn dữ liệu VQA web với quỹ đạo robot. Tỷ lệ quan trọng: quá nhiều VQA thì mô hình quên hành động; quá nhiều dữ liệu robot thì mô hình mất kiến thức tổng quát.

Tỷ lệ của RT-2: ~1:1. OpenVLA: web-so-với-robot ~0.5:1. π0: tương tự. Tỷ lệ chính xác là siêu tham số cần điều chỉnh theo kích thước tập dữ liệu.

Huấn luyện chỉ robot tạo mô hình riêng cho tác vụ thất bại trên chỉ dẫn ngoài phân phối. Đồng tinh chỉnh là sự khác biệt giữa "nhấc khối lập phương đỏ lên (trong trình diễn)" và "nhấc vật lớn thứ ba từ bên trái lên (cách diễn đạt mới)."

### Safety and action limits

Mọi VLA sản xuất được cung cấp với:

- Giới hạn khớp cứng (không thể tạo mô-men vượt thông số).
- Giới hạn vận tốc (cắt mềm).
- Ranh giới không gian làm việc (bộ phận chấp hành cuối không thể rời bàn).
- Phê duyệt có con người trong vòng lặp cho tác vụ mới.

Chúng nằm ngoài VLA dưới dạng kiểm tra tầng điều khiển. Đầu ra VLA là đề xuất, không phải lệnh.

```figure
mm-action-tokens
```

## Use It

`code/main.py`:

- Triển khai token hóa và giải token hóa hành động 256 bin.
- Phác thảo tokenizer FAST dựa trên DCT + lượng tử hóa.
- So sánh số token mỗi bước hành động giữa (bin rời rạc, FAST, flow liên tục).
- In tóm tắt dòng phát triển RT-2 → OpenVLA → π0 → GR00T.

## Ship It

Bài học này tạo ra `outputs/skill-vla-action-format-picker.md`. Với tác vụ robot (thao tác, điều hướng, toàn thân hình người), chọn giữa bin rời rạc + RT-2, FAST + OpenVLA, flow matching + π0, hoặc hai hệ thống + GR00T.

## Exercises

1. Cánh tay 10-DOF ở tốc độ điều khiển 30 Hz. Token hóa bin rời rạc ở 256 bin phát bao nhiêu token mỗi giây? VLM 7B có thể theo kịp không?

2. Token hóa FAST nén quỹ đạo 30 bước thành ~10 token. Người dùng mất gì nếu quỹ đạo có chuyển động tần số cao (ví dụ, đánh trống)?

3. Head flow matching của π0 khử nhiễu trong ~5 bước. So sánh thông lượng với giải mã tự hồi quy OpenVLA ở 4-5 Hz.

4. Sự phân chia Hệ thống 1 / Hệ thống 2 của GR00T ánh xạ vào Kahneman. Đề xuất sự phân chia khác (Hệ thống 3?) có thể giúp đi bộ hai chân.

5. Đọc Mục 4 của Open X-Embodiment về tuyển chọn tập dữ liệu. Nêu tên ba quy tắc tuyển chọn ngăn rò rỉ miền.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|------------------------|
| VLA | "Thị giác-ngôn ngữ-hành động" | Mô hình nhận ảnh + chỉ dẫn và xuất lệnh hành động |
| Action tokenization (Token hóa hành động) | "Bin rời rạc" | Lượng tử hóa mục tiêu khớp liên tục thành 256 bin mỗi chiều, mỗi bin là ID từ vựng |
| FAST tokenizer | "Token hành động tần số" | DCT + lượng tử hóa để nén quỹ đạo 30 bước thành ~10 token |
| Co-fine-tune (Đồng tinh chỉnh) | "Trộn web + robot" | Huấn luyện trên dữ liệu VQA web cùng trình diễn robot để giữ kiến thức tổng quát |
| Flow-matching action head (Head hành động flow matching) | "Đầu ra liên tục π0" | Transformer nhỏ xuất chuỗi hành động 50 bước qua rectified flow |
| System 1 / System 2 (Hệ thống 1 / Hệ thống 2) | "Điều khiển hai hệ thống" | VLM lớn lập kế hoạch chậm, head hành động nhỏ hành động nhanh; mẫu GR00T |
| Open X-Embodiment | "Tập dữ liệu RT-X" | Tập dữ liệu chéo robot 1M quỹ đạo; ngữ liệu huấn luyện |

## Further Reading

- [Brohan et al. — RT-2 (arXiv:2307.15818)](https://arxiv.org/abs/2307.15818)
- [Kim et al. — OpenVLA (arXiv:2406.09246)](https://arxiv.org/abs/2406.09246)
- [Black et al. — π0 (arXiv:2410.24164)](https://arxiv.org/abs/2410.24164)
- [NVIDIA — GR00T N1 (arXiv:2503.14734)](https://arxiv.org/abs/2503.14734)
- [Open X-Embodiment Collab — RT-X (arXiv:2310.08864)](https://arxiv.org/abs/2310.08864)
