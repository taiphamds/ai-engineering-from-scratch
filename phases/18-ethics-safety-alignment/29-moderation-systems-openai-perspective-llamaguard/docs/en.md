# Moderation Systems — OpenAI, Perspective, Llama Guard

> Các hệ thống kiểm duyệt production vận hành hóa các chính sách an toàn được định nghĩa trong Bài 12-16. OpenAI Moderation API: `omni-moderation-latest` (2024) được xây dựng trên GPT-4o phân loại văn bản + hình ảnh trong một lần gọi; tốt hơn 42% trên tập kiểm tra đa ngôn ngữ so với phiên bản trước; schema phản hồi trả về 13 boolean danh mục — harassment, harassment/threatening, hate, hate/threatening, illicit, illicit/violent, self-harm, self-harm/intent, self-harm/instructions, sexual, sexual/minors, violence, violence/graphic; miễn phí cho hầu hết nhà phát triển. Các mẫu phân tầng: Kiểm duyệt đầu vào (trước sinh), Kiểm duyệt đầu ra (sau sinh), Kiểm duyệt tùy chỉnh (quy tắc lĩnh vực). Các lần gọi song song bất đồng bộ che độ trễ; một phản hồi giữ chỗ có thể lấp thời gian chờ trong khi kiểm duyệt đầu vào hoàn tất. Llama Guard 3/4 (Bài 16): 14 nguy cơ MLCommons, Code Interpreter Abuse, 8 ngôn ngữ (v3), nhiều hình ảnh (v4). Perspective API (Google Jigsaw): chấm điểm độc hại có trước làn sóng LLM-làm-người-kiểm-duyệt; chủ yếu độ độc hại một chiều với các biến thể severe-toxicity/insult/profanity; đường cơ sở cho nghiên cứu kiểm duyệt nội dung. Ngừng hỗ trợ: Azure Content Moderator bị ngừng hỗ trợ tháng 2 năm 2024, ngừng hoạt động tháng 2 năm 2027, được thay bằng Azure AI Content Safety.

**Type:** Build
**Languages:** Python (stdlib, three-layer moderation harness)
**Prerequisites:** Phase 18 · 16 (Llama Guard / Garak / PyRIT)
**Time:** ~60 minutes

## Learning Objectives

- Mô tả hệ phân loại nhóm OpenAI Moderation API và khác với tập MLCommons Llama Guard 3 thế nào.
- Mô tả mẫu ba lớp kiểm duyệt (đầu vào, đầu ra, tùy chỉnh) và nêu một chế độ lỗi mỗi lớp.
- Mô tả vị trí Perspective API là đường cơ sở thời trước LLM và tại sao vẫn dùng trong nghiên cứu.
- Nêu dòng thời gian ngừng hỗ trợ Azure.

## The Problem

Bài 12-16 mô tả tấn công và công cụ phòng vệ. Bài 29 đề cập hệ thống kiểm duyệt triển khai hiện thực hóa phòng vệ ở bề mặt người dùng chạm sản phẩm. Mẫu ba lớp là cấu hình mặc định 2026.

## The Concept

### OpenAI Moderation API

`omni-moderation-latest` (2024). Xây trên GPT-4o. Phân loại văn bản + ảnh trong một lệnh gọi. Miễn phí cho phần lớn nhà phát triển.

Nhóm (13 boolean trong schema phản hồi):
- harassment, harassment/threatening
- hate, hate/threatening
- self-harm, self-harm/intent, self-harm/instructions
- sexual, sexual/minors
- violence, violence/graphic
- illicit, illicit/violent

Hỗ trợ đa phương thức áp dụng cho `violence`, `self-harm` và `sexual` nhưng không cho `sexual/minors`; còn lại chỉ văn bản.

Với bộ kiểm thử mã trong `code/main.py`, chúng ta gộp nhóm con `/threatening`, `/intent`, `/instructions` và `/graphic` vào nhóm cha cấp cao để đơn giản sư phạm. Mã sản xuất nên dùng schema đủ 13 nhóm.

Tốt hơn 42% trên tập kiểm thử đa ngôn ngữ so với endpoint kiểm duyệt thế hệ trước. Điểm theo nhóm; ứng dụng đặt ngưỡng.

### Llama Guard 3/4

Đề cập trong Bài 16. 14 nhóm nguy hại MLCommons (tổ chức khác 13 boolean schema phản hồi OpenAI). Hỗ trợ 8 ngôn ngữ (v3). Llama Guard 4 (tháng 4 năm 2025) đa phương thức nguyên bản, 12B.

Hệ phân loại OpenAI và Llama Guard chồng lấp nhưng khác biệt. OpenAI có "illicit" là nhóm rộng; Llama Guard có "tội phạm bạo lực" và "tội phạm phi bạo lực" riêng. Triển khai chọn theo mức phù hợp chính sách-hệ phân loại.

### Perspective API (Google Jigsaw)

Hệ thống chấm độc hại có trước làn sóng LLM-làm-bộ-kiểm-duyệt (trước 2020). Nhóm: TOXICITY, SEVERE_TOXICITY, INSULT, PROFANITY, THREAT, IDENTITY_ATTACK. Điểm chính một chiều (TOXICITY) có biến thể chiều con.

Dùng rộng làm đường cơ sở nghiên cứu kiểm duyệt nội dung vì API ổn định, có tài liệu và nhiều năm dữ liệu hiệu chuẩn. Với trường hợp dùng gần LLM hiện đại, Llama Guard hoặc OpenAI Moderation thường phù hợp hơn.

### The three-layer pattern

1. **Kiểm duyệt đầu vào.** Phân loại prompt người dùng trước sinh. Từ chối nếu bị đánh dấu. Độ trễ: một lệnh gọi bộ phân loại.
2. **Kiểm duyệt đầu ra.** Phân loại đầu ra mô hình trước chuyển giao. Thay bằng từ chối nếu bị đánh dấu. Độ trễ: một lệnh gọi bộ phân loại sau sinh.
3. **Kiểm duyệt tùy chỉnh.** Quy tắc riêng theo miền (regex, danh sách cho phép, chính sách kinh doanh). Chạy ở đầu vào hoặc đầu ra.

Ba lớp tuần tự theo thiết kế: kiểm duyệt đầu vào phải hoàn tất trước sinh, kiểm duyệt đầu ra chạy sau sinh. Song song áp dụng trong một lớp — chạy nhiều bộ phân loại (ví dụ: OpenAI Moderation + Llama Guard + Perspective) đồng thời trên cùng văn bản ẩn độ trễ theo bộ phân loại. Như tối ưu tùy chọn, phản hồi giữ chỗ ("chờ một chút, đang kiểm tra...") có thể hiển thị trong khi kiểm duyệt đầu vào hoàn tất và truyền token-1 bị hoãn. Hành vi khi đánh dấu cấu hình được: từ chối, làm sạch, chuyển con người rà soát.

### Failure modes

- **Chỉ đầu vào.** Không bắt ảo giác đầu ra (tấn công mã hóa Bài 12-14 vượt bộ phân loại đầu vào).
- **Chỉ đầu ra.** Cho mọi đầu vào đến mô hình; tăng chi phí; phơi suy luận nội bộ cho kẻ tấn công.
- **Chỉ tùy chỉnh.** Không vững trên các nhóm; regex mong manh.

Phân lớp là mặc định. Thắt lưng và dây đeo quần.

### Azure deprecation

Azure Content Moderator: ngừng hỗ trợ tháng 2 năm 2024, ngừng hoạt động tháng 2 năm 2027. Thay bằng Azure AI Content Safety, dựa trên LLM và tích hợp Azure OpenAI. Chuyển đổi là dự án cấp lĩnh vực 2024-2027 cho triển khai Azure.

### Where this fits in Phase 18

Bài 16 đề cập công cụ kiểm duyệt trong ngữ cảnh red-team. Bài 29 đề cập kiểm duyệt triển khai. Bài 30 khép bằng bằng chứng năng lực lưỡng dụng hiện tại.

```figure
an-moderation-layers
```

## Use It

`code/main.py` xây bộ kiểm thử kiểm duyệt ba lớp: bộ kiểm duyệt đầu vào (từ khóa + điểm nhóm), đầu ra (cùng bộ phân loại trên đầu ra), tùy chỉnh (quy tắc miền). Bạn có thể chạy đầu vào qua và quan sát lớp nào bắt gì.

## Ship It

Bài học này tạo ra `outputs/skill-moderation-stack.md`. Với triển khai, khuyến nghị cấu hình ngăn xếp kiểm duyệt: bộ phân loại nào ở đầu vào, đầu ra, quy tắc tùy chỉnh nào và giám khảo nào cho trường hợp biên.

## Exercises

1. Chạy `code/main.py`. Chạy đầu vào vô hại, sát ranh giới và có hại qua cả ba lớp. Báo cáo lớp nào kích hoạt cho mỗi loại.

2. Mở rộng bộ kiểm thử với chấm độc hại kiểu Perspective-API trên nhóm cụ thể. So sánh hành vi ngưỡng với điểm nhóm.

3. Đọc tài liệu OpenAI Moderation API và danh sách nhóm Llama Guard 3. Ánh xạ mỗi nhóm OpenAI sang nhóm Llama Guard gần nhất. Xác định ba nhóm không ánh xạ rõ.

4. Thiết kế ngăn xếp kiểm duyệt cho triển khai trợ lý mã (ví dụ: GitHub Copilot). Xác định nhóm liên quan nhất và ít nhất, đề xuất quy tắc tùy chỉnh.

5. Azure Content Moderator ngừng hoạt động tháng 2 năm 2027. Lập kế hoạch chuyển sang Azure AI Content Safety. Xác định yếu tố rủi ro cao nhất khi chuyển.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|-----------------|------------------------|
| OpenAI Moderation | "omni-moderation-latest" | Bộ phân loại (văn bản) 13 nhóm dựa trên GPT-4o với hỗ trợ đa phương thức một phần |
| Perspective API | "độc hại Google Jigsaw" | Đường cơ sở chấm độc hại thời trước LLM |
| Llama Guard | "MLCommons 14 nhóm" | Bộ phân loại nguy hại Meta (v3: văn bản 8B, 8 ngôn ngữ; v4: đa phương thức 12B) |
| Input moderation (Kiểm duyệt đầu vào) | "bộ lọc trước sinh" | Bộ phân loại trên prompt người dùng trước lệnh gọi mô hình |
| Output moderation (Kiểm duyệt đầu ra) | "bộ lọc sau sinh" | Bộ phân loại trên đầu ra mô hình trước chuyển giao |
| Custom moderation (Kiểm duyệt tùy chỉnh) | "quy tắc miền" | Quy tắc riêng triển khai (regex, danh sách cho phép, chính sách) |
| Layered moderation (Kiểm duyệt phân lớp) | "cả ba lớp" | Mẫu triển khai sản xuất tiêu chuẩn |

## Further Reading

- [OpenAI Moderation API docs](https://platform.openai.com/docs/api-reference/moderations) — endpoint omni-moderation
- [Meta PurpleLlama + Llama Guard](https://github.com/meta-llama/PurpleLlama) — repo Llama Guard
- [Google Jigsaw Perspective API](https://perspectiveapi.com/) — chấm độc hại
- [Azure AI Content Safety](https://learn.microsoft.com/en-us/azure/ai-services/content-safety/) — phương án thay thế Azure
