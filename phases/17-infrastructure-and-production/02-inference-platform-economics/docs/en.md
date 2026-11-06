# Inference Platform Economics — Fireworks, Together, Baseten, Modal, Replicate, Anyscale

> Thị trường suy luận năm 2026 không còn là cho thuê thời gian GPU. Nó phân nhánh thành chip tùy chỉnh (Groq, Cerebras, SambaNova), các nền tảng GPU (Baseten, Together, Fireworks, Modal), và các chợ ưu tiên API (Replicate, DeepInfra). Fireworks tăng giá $1/giờ mỗi GPU vào ngày 1 tháng 5 năm 2026, và định giá $4B trên 10T+ token/ngày cho bạn biết mô hình dựa trên khối lượng hoạt động. Baseten chốt Series E $300M ở $5B vào tháng 1 năm 2026. Quy tắc định vị cạnh tranh đơn giản: Fireworks tối ưu độ trễ, Together tối ưu bề rộng danh mục, Baseten tối ưu độ trau chuốt doanh nghiệp, Modal tối ưu DX thuần Python, Replicate tối ưu độ bao phủ đa phương thức, Anyscale tối ưu Python phân tán. Bài này cho bạn một ma trận có thể đưa cho một nhà sáng lập.

**Type:** Learn
**Languages:** Python (stdlib, toy per-call economics comparator)
**Prerequisites:** Phase 17 · 01 (Managed LLM Platforms), Phase 17 · 04 (Serving Engine Internals)
**Time:** ~60 minutes

## Learning Objectives

- Nêu ba phân khúc thị trường (chip tùy chỉnh, các nền tảng GPU, ưu tiên API) và ánh xạ mỗi nhà cung cấp tới một phân khúc.
- Giải thích vì sao mô hình giá API “theo token” nén về đường cong chi phí của engine phục vụ, không phải của phần cứng.
- Tính chi phí hiệu dụng mỗi yêu cầu trên ít nhất ba nhà cung cấp và giải thích khi nào theo phút (Baseten, Modal) vượt theo token.
- Xác định nền tảng nào là mặc định phù hợp cho một khối lượng công việc nhất định (serverless bùng phát, thông lượng cao ổn định, các biến thể tinh chỉnh, đa phương thức).

## The Problem

Bạn đánh giá các nền tảng siêu quy mô được quản lý. Bạn quyết định cần một nhà cung cấp hẹp hơn, nhanh hơn — Fireworks cho độ trễ, Together cho bề rộng, Baseten cho một mô hình tùy chỉnh được tinh chỉnh. Giờ bạn có sáu lựa chọn thực và các trang giá không khớp nhau. Fireworks hiển thị $/M token; Baseten hiển thị $/phút; Modal hiển thị $/giây; Replicate hiển thị $/dự đoán. Bạn không thể so sánh trực tiếp nếu không mô hình hóa khối lượng công việc.

Tệ hơn, mô hình kinh doanh sau mỗi trang giá khác nhau. Fireworks chạy engine tùy chỉnh riêng (FireAttention) trên các GPU dùng chung; giá theo token phản ánh đường cong mức sử dụng của họ. Baseten cho bạn Truss + các GPU chuyên dụng; theo phút phản ánh tính độc quyền. Modal là serverless Python thực — tính phí theo giây với khởi động nguội dưới một giây. Cùng đầu ra (một phản hồi LLM), ba hàm chi phí khác nhau.

Bài này mô hình hóa sáu bên và cho bạn biết khi nào mỗi bên thắng.

## The Concept

### The three segments

**Chip tùy chỉnh** — Groq (LPU), Cerebras (WSE), SambaNova (RDU). Thường giải mã nhanh hơn 5-10x so với một cụm dựa trên GPU trên cùng mô hình. Giá theo token cao hơn (Groq ở ~$0.99/M trên Llama-70B cuối năm 2025) nhưng không thể bị vượt cho các trường hợp sử dụng nhạy độ trễ. Groq là lựa chọn sản xuất cho các agent giọng nói và dịch thời gian thực.

**Các nền tảng GPU** — Baseten, Together, Fireworks, Modal, Anyscale. Chạy trên NVIDIA (H100, H200, B200 năm 2026) hoặc đôi khi AMD. Lớp kinh tế giữa “thuê GPU thô” (RunPod, Lambda) và “dịch vụ được nhà cung cấp siêu quy mô quản lý” (Bedrock).

**Các chợ ưu tiên API** — Replicate, DeepInfra, OpenRouter, Fal. Danh mục rộng, trả theo dự đoán hoặc trả theo giây, nhấn mạnh thời gian tới lệnh gọi đầu tiên.

### Fireworks — latency-optimized GPU platform

- Engine FireAttention (tùy chỉnh); được tiếp thị là độ trễ thấp hơn 4x so với vLLM trên các cấu hình tương đương.
- Tầng xử lý lô ở ~50% giá serverless cho các khối lượng công việc không tương tác.
- Mô hình tinh chỉnh được phục vụ cùng giá với mô hình cơ sở — một điểm khác biệt thực so với các nhà cung cấp tính phụ phí cho LoRA của bạn.
- Giữa năm 2026: tăng giá thuê GPU theo nhu cầu $1/giờ có hiệu lực ngày 1 tháng 5 năm 2026. Giá theo khối lượng có thể đàm phán ở quy mô lớn.
- Tín hiệu tài chính: định giá $4B, xử lý 10T+ token/ngày.

### Together — breadth-optimized

- 200+ mô hình bao gồm các bản phát hành mã nguồn mở trong vài ngày sau công bố thượng nguồn.
- Rẻ hơn 50-70% so với Replicate trên các mô hình LLM tương đương — định vị “AI Native Cloud” là khối lượng và danh mục.
- Suy luận + tinh chỉnh + huấn luyện trong một API.

### Baseten — enterprise-polish-optimized

- Framework Truss: đóng gói mô hình với các phụ thuộc, bí mật, cấu hình phục vụ trong một manifest.
- Dải GPU từ T4 tới B200. Tính phí theo phút với giảm thiểu khởi động nguội hợp lý.
- SOC 2 Type II, sẵn sàng HIPAA. Lựa chọn fintech và chăm sóc sức khỏe phổ biến.
- Định giá $5B, Series E tháng 1 năm 2026 ($300M từ CapitalG, IVP, NVIDIA).

### Modal — Python-native-optimized

- Cơ sở hạ tầng dưới dạng mã bằng Python thuần. Trang trí một hàm bằng `@modal.function(gpu="A100")` và triển khai bằng một lệnh.
- Tính phí theo giây. Khởi động nguội 2-4s với làm nóng trước; <1s cho các mô hình nhỏ.
- Series B $87M ở định giá $1.1B (2025). Điểm trải nghiệm nhà phát triển mạnh nhất trong các khảo sát độc lập.

### Replicate — multimodal breadth

- Trả theo dự đoán. Nền tảng mặc định cho các mô hình hình ảnh, video, và âm thanh.
- Hệ sinh thái tích hợp (Zapier, Vercel, các plugin CMS).
- Kém cạnh tranh hơn về giá LLM theo token nhưng thắng về đa dạng đa phương thức.

### Anyscale — Ray-native

- Được xây trên Ray; RayTurbo là engine suy luận độc quyền của Anyscale (cạnh tranh với vLLM).
- Tốt nhất cho các khối lượng công việc Python phân tán nơi bước suy luận là một node trong một đồ thị lớn hơn.
- Các cụm Ray được quản lý; tích hợp chặt với Ray AIR và Ray Serve.

### Per-token versus per-minute — when each wins

Theo token hợp lý khi khối lượng công việc không nhạy độ trễ và bùng phát — bạn chỉ trả cho những gì dùng. Theo phút hợp lý khi mức sử dụng cao và có thể dự đoán — bạn vượt theo token một khi làm bão hòa GPU.

Quy tắc thô: với các khối lượng công việc trên mức sử dụng duy trì ~30% của một GPU chuyên dụng, theo phút (Baseten, Modal) bắt đầu vượt theo token (Fireworks, Together). Dưới mức đó, theo token thắng vì bạn tránh trả cho nhàn rỗi.

### Custom engine is the real moat

Mọi nền tảng trên vLLM và SGLang tuyên bố một engine tùy chỉnh. FireAttention, RayTurbo, ngăn xếp suy luận Baseten. Các tuyên bố engine tùy chỉnh nghiêng về tiếp thị — cách định hình thẳng thắn là vLLM + SGLang đại diện khoảng 80% suy luận mã nguồn mở sản xuất, và các điểm khác biệt ở lớp nền tảng là DX, quy chi phí, và các SLA.

### Numbers you should remember

- Thuê GPU Fireworks: tăng $1/giờ có hiệu lực ngày 1 tháng 5 năm 2026.
- Tuyên bố Fireworks: độ trễ thấp hơn 4x so với vLLM trên các cấu hình tương đương.
- Together: rẻ hơn 50-70% so với Replicate trên các LLM.
- Định giá Baseten: $5B (Series E, tháng 1 năm 2026, vòng $300M).
- Định giá Modal: $1.1B (Series B, 2025).
- Theo phút vượt theo token trên mức sử dụng duy trì ~30%.

```figure
cost-per-token
```

## Use It

`code/main.py` so sánh sáu nhà cung cấp trên một khối lượng công việc tổng hợp qua các mô hình giá. Báo cáo $/ngày và $/M token hiệu dụng. Chạy nó để tìm điểm hòa vốn giữa theo token và theo phút.

## Ship It

Bài này tạo ra `outputs/skill-inference-platform-picker.md`. Với hồ sơ khối lượng công việc, SLA, và ngân sách, chọn nền tảng suy luận chính và nêu bên về nhì.

## Exercises

1. Chạy `code/main.py`. Ở mức sử dụng duy trì nào Baseten (theo phút) vượt Fireworks (theo token) cho một mô hình 70B trên một H100? Tự suy ra điểm giao và so sánh với quy tắc kinh nghiệm.
2. Sản phẩm của bạn phục vụ sinh hình ảnh cộng trò chuyện cộng giọng nói thành văn bản. Chọn các nền tảng cho mỗi phương thức và nêu mẫu gateway thống nhất chúng.
3. Fireworks tăng giá $1/giờ trên mô hình chính của bạn. Mô hình hóa tác động chi phí pha trộn nếu 40% lưu lượng chuyển sang tầng xử lý lô (giảm 50%).
4. Một khách hàng được quản lý yêu cầu SOC 2 Type II + HIPAA + các GPU chuyên dụng. Ba nền tảng nào khả thi và bên nào thắng về FinOps?
5. So sánh chi phí mỗi 1,000 dự đoán cho Llama 3.1 70B trên Fireworks serverless, Together theo nhu cầu, Baseten chuyên dụng, và API Replicate. Bên nào rẻ nhất ở 10 dự đoán/ngày? Ở 10,000?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| Custom silicon (Chip tùy chỉnh) | “các chip không phải GPU” | Groq LPU, Cerebras WSE, SambaNova RDU — tối ưu cho giải mã |
| FireAttention | “Engine Fireworks” | Kernel attention tùy chỉnh; được tiếp thị là độ trễ thấp hơn 4x so với vLLM |
| Truss | “Định dạng của Baseten” | Manifest đóng gói mô hình; các phụ thuộc + bí mật + cấu hình phục vụ |
| Per-token (Theo token) | “Giá API” | Tính phí theo token tiêu thụ; không trả cho nhàn rỗi |
| Per-minute (Theo phút) | “giá chuyên dụng” | Tính phí theo thời gian GPU thực; thắng ở mức sử dụng cao |
| Per-prediction (Theo dự đoán) | “Giá Replicate” | Tính phí theo mỗi lần gọi mô hình; phổ biến cho hình ảnh/video |
| RayTurbo | “Engine Anyscale” | Suy luận độc quyền trên Ray; cạnh tranh với vLLM trên các cụm Ray |
| Batch tier (Tầng xử lý lô) | “giảm 50%” | Hàng đợi không tương tác ở giá giảm; phổ biến trên Fireworks, OpenAI |
| Fine-tuned at base rate (Tinh chỉnh ở giá cơ sở) | “LoRA Fireworks” | Tính phí các yêu cầu phục vụ LoRA ở giá mô hình cơ sở (điểm khác biệt) |

## Further Reading

- [Fireworks Pricing](https://fireworks.ai/pricing) — các giá theo token, tầng xử lý lô, thuê GPU.
- [Baseten Pricing](https://www.baseten.co/pricing/) — các giá theo phút, dung lượng cam kết, các tầng doanh nghiệp.
- [Modal Pricing](https://modal.com/pricing) — các giá GPU theo giây và tầng miễn phí.
- [Together AI Pricing](https://www.together.ai/pricing) — danh mục mô hình và các giá theo token.
- [Anyscale Pricing](https://www.anyscale.com/pricing) — giá RayTurbo và Ray được quản lý.
- [Northflank — Fireworks AI Alternatives](https://northflank.com/blog/7-best-fireworks-ai-alternatives-for-inference) — đánh giá so sánh.
- [Infrabase — AI Inference API Providers 2026](https://infrabase.ai/blog/ai-inference-api-providers-compared) — bối cảnh nhà cung cấp.
