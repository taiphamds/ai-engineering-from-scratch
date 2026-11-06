# Managed LLM Platforms — Bedrock, Vertex AI, Azure OpenAI

> Ba nhà cung cấp đám mây siêu quy mô, ba chiến lược riêng biệt. AWS Bedrock là một chợ mô hình — Claude, Llama, Titan, Stability, Cohere sau một API. Azure OpenAI là một quan hệ đối tác OpenAI độc quyền cộng với các Đơn vị thông lượng được cấp sẵn (PTU) cho dung lượng chuyên dụng. Vertex AI ưu tiên Gemini với câu chuyện ngữ cảnh dài và đa phương thức tốt nhất. Năm 2026 Artificial Analysis đo Azure OpenAI ở trung vị ~50 ms và Bedrock ở ~75 ms trên các dạng tương đương Llama 3.1 405B — các PTU giải thích khoảng cách vì dung lượng chuyên dụng vượt dung lượng theo nhu cầu dùng chung. Quy tắc quyết định không phải “bên nào nhanh nhất” mà là “danh mục mô hình và bề mặt FinOps nào khớp sản phẩm của tôi.” Bài này dạy bạn chọn với các đánh đổi được viết xuống, không phải cảm giác.

**Type:** Learn
**Languages:** Python (stdlib, toy cost-and-latency comparator)
**Prerequisites:** Phase 11 (LLM Engineering), Phase 13 (Tools & Protocols)
**Time:** ~60 minutes

## Learning Objectives

- Nêu ba chiến lược nền tảng (chợ so với độc quyền so với ưu tiên Gemini) và ghép mỗi chiến lược với một trường hợp sử dụng sản phẩm.
- Giải thích các Đơn vị thông lượng được cấp sẵn (PTU) mua cho bạn điều gì trong Azure OpenAI và vì sao Bedrock theo nhu cầu thường cho thấy chậm hơn ~25 ms ở quy mô 405B.
- Vẽ sơ đồ bề mặt quy chi phí FinOps cho mỗi nền tảng (Bedrock Application Inference Profiles so với Vertex dự án theo từng nhóm so với các phạm vi Azure + đặt trước PTU).
- Viết xuống một chính sách “tối thiểu hai nhà cung cấp” và giải thích vì sao khóa chặt vào một nhà cung cấp là sai lầm tốn kém năm 2026.

## The Problem

Bạn chọn Claude 3.7 Sonnet cho sản phẩm. Giờ bạn cần phục vụ nó. Bạn có thể gọi API Anthropic trực tiếp, hoặc gọi nó qua AWS Bedrock, hoặc đi qua một gateway. API trực tiếp đơn giản nhất; Bedrock thêm các BAA, endpoint VPC, IAM, và quy chi phí CloudWatch. Gateway thêm chuyển đổi dự phòng, tính phí thống nhất, và các giới hạn tốc độ xuyên nhà cung cấp.

Câu hỏi sâu hơn là danh mục. Nếu bạn cần Claude và Llama và Gemini trong cùng sản phẩm, bạn không thể mua tất cả từ một nơi trừ khi nơi đó đồng thời là Bedrock cộng Vertex cộng Azure OpenAI. Các nhà cung cấp đám mây siêu quy mô không thể thay thế cho nhau — mỗi bên đặt cược khác nhau về ai sở hữu lớp mô hình.

Bài này lập bản đồ ba đặt cược, khoảng cách độ trễ, khoảng cách FinOps, và rủi ro khóa chặt.

## The Concept

### Three strategies

**AWS Bedrock** — chợ. Claude (Anthropic), Llama (Meta), Titan (bên thứ nhất AWS), Stability (hình ảnh), Cohere (embedding), Mistral, cộng các danh mục con hình ảnh và embedding. Một API, một bề mặt IAM, một bản xuất CloudWatch. Đặt cược của Bedrock là khách hàng muốn khả năng lựa chọn hơn là muốn một mô hình đơn lẻ.

**Azure OpenAI** — quan hệ đối tác độc quyền. Bạn nhận GPT-4 / 4o / 5 / o-series, DALL·E, Whisper, và tinh chỉnh các mô hình OpenAI trong các trung tâm dữ liệu Azure. Không có mô hình không phải OpenAI trong danh mục “Azure OpenAI Service” — chúng tới Azure AI Foundry (sản phẩm riêng). Đặt cược của Azure là OpenAI vẫn ở tuyến đầu và khách hàng muốn các kiểm soát doanh nghiệp trên mối quan hệ cụ thể đó.

**Vertex AI** — Gemini trước, mọi thứ khác sau. Gemini 1.5 / 2.0 / 2.5 Flash và Pro, cộng Model Garden (bên thứ ba). Đặt cược của Vertex là ngữ cảnh dài đa phương thức — ngữ cảnh Gemini 1M token là điểm khác biệt.

### Latency gap at scale

Artificial Analysis chạy các benchmark liên tục. Trên các triển khai Llama 3.1 405B tương đương, độ trễ token đầu tiên trung vị của Azure khoảng 50 ms với PTU; Bedrock trên on-demand dùng chung khoảng 75 ms. Khoảng cách này không phải thất bại của AWS — đó là khác biệt về mô hình năng lực. Azure bán PTU (Provisioned Throughput Units), dành riêng năng lực GPU cho tenant của bạn. Phương án tương đương của Bedrock (Provisioned Throughput) tồn tại nhưng bắt đầu khoảng $21/giờ mỗi đơn vị, và hầu hết khách hàng vẫn ở on-demand dùng chung.

Dung lượng theo nhu cầu dùng chung cạnh tranh với lưu lượng của mọi khách hàng khác. Dung lượng chuyên dụng không như vậy. Nếu SLA sản phẩm của bạn là TTFT < 100 ms ở P99, bạn hoặc mua PTU trên Azure, mua Bedrock Provisioned Throughput, hoặc chấp nhận phương sai mặc định.

### Provisioned Throughput economics

Azure PTU: một khối tính toán suy luận được đặt trước. Tiết kiệm tới ~70% so với theo nhu cầu cho các khối lượng công việc có thể dự đoán. Chi phí cố định mỗi giờ bất kể lưu lượng — bạn trả cho đặt trước ngay cả khi nhàn rỗi. Điểm hòa vốn thường khoảng mức sử dụng duy trì 40-60%.

Bedrock Provisioned Throughput: $21-$50 mỗi giờ tùy mô hình và vùng. Phép tính tương tự — điểm hòa vốn khoảng nửa mức sử dụng đỉnh. Yêu cầu cam kết hằng tháng.

Dung lượng được cấp sẵn Vertex được bán theo từng SKU Gemini; giá thay đổi theo mô hình và vùng và ít được quảng bá công khai hơn.

### FinOps surface — the real differentiator

**Bedrock Application Inference Profiles** là cách quy chi phí sạch nhất trong chợ. Gắn thẻ một hồ sơ bằng `team`, `product`, `feature`; định tuyến mọi lần gọi mô hình qua nó; CloudWatch tách chi phí theo từng hồ sơ không cần hậu xử lý. Được thêm năm 2025, vẫn là cách gốc của nhà cung cấp siêu quy mô chi tiết nhất.

Quy chi phí **Vertex** là dự án theo từng nhóm cộng với nhãn ở mọi nơi. Bạn mô hình hóa mỗi nhóm thành một dự án GCP, đặt nhãn trên mọi tài nguyên, và sử dụng BigQuery Billing Export + DataStudio cho các tổng hợp. Nhiều công việc hơn, nhưng BigQuery cho bạn SQL tùy ý trên dữ liệu chi phí.

**Azure** dựa vào các phạm vi đăng ký/nhóm tài nguyên cộng với các thẻ, với các đặt trước PTU như một đối tượng chi phí hạng nhất. Các thẻ được kế thừa từ các nhóm tài nguyên, không phải các yêu cầu, nên quy chi phí theo từng yêu cầu cần các chỉ số tùy chỉnh Application Insights hoặc một gateway đóng dấu các header.

Mẫu: Bedrock sạch nhất theo cách gốc, Vertex linh hoạt nhất qua BigQuery, Azure không trong suốt nhất trừ khi bạn gắn đo lường.

### Lock-in is the 2026 risk

Cam kết với một nhà cung cấp siêu quy mô đơn lẻ là ổn khi một mô hình thống trị. Năm 2026 tuyến đầu di chuyển hằng tháng — Claude 3.7 quý này, Gemini 2.5 quý tiếp theo, GPT-5 quý sau đó. Khóa vào một nền tảng khóa bạn khỏi hai phần ba tuyến đầu.

Mẫu các nhóm hoạt động áp dụng: tối thiểu hai nhà cung cấp cho bất kỳ lệnh gọi LLM trọng yếu với sản phẩm nào. Bedrock cộng Azure OpenAI là cặp phổ biến — Claude từ một bên, GPT từ bên kia, chuyển đổi dự phòng giữa chúng, cùng gateway. Mức tăng chi phí không đáng kể vì gateway định tuyến tối ưu; mức tăng tính sẵn sàng trong các sự cố ngừng hoạt động (như sự cố Azure OpenAI tháng 1 năm 2025, sự cố ngừng hoạt động AWS us-east-1) mang tính quyết định.

### Data residency, BAAs, and regulated industries

Bedrock: các BAA trong hầu hết vùng; các endpoint VPC; các rào chắn. Mặc định fintech phổ biến.
Azure OpenAI: HIPAA, SOC 2, ISO 27001; lưu trú dữ liệu EU; mặc định cho doanh nghiệp được quản lý.
Vertex: HIPAA, GDPR, lưu trú dữ liệu theo từng vùng; ngăn xếp tuân thủ của Google Cloud.

Cả ba đáp ứng ô kiểm cơ bản. Khác biệt nằm ở các chính sách lưu giữ dữ liệu, cách các nhật ký được xử lý, và liệu giám sát lạm dụng có đọc lưu lượng của bạn không (mặc định tham gia ở hầu hết; có thể chọn không tham gia cho doanh nghiệp).

### Numbers you should remember

- TTFT trung vị Azure OpenAI trên các dạng tương đương Llama 3.1 405B: ~50 ms (với PTU).
- TTFT trung vị Bedrock theo nhu cầu: ~75 ms.
- Bedrock Provisioned Throughput: $21-$50/giờ mỗi đơn vị.
- Điểm hòa vốn Azure PTU: mức sử dụng duy trì ~40-60%.
- Tiết kiệm PTU so với theo nhu cầu ở mức sử dụng cao: tới 70%.

```figure
i4-platform-lanes
```

## Use It

`code/main.py` so sánh ba nền tảng trên một khối lượng công việc tổng hợp — nó mô hình hóa kinh tế theo nhu cầu so với PTU, phương sai TTFT, và độ trung thực quy chi phí. Chạy nó để thấy nơi PTU có lợi và nơi bề rộng mô hình của chợ lớn hơn một khoảng cách TTFT.

## Ship It

Bài này tạo ra `outputs/skill-managed-platform-picker.md`. Với một hồ sơ khối lượng công việc (các mô hình cần, SLA TTFT, khối lượng hằng ngày, các yêu cầu tuân thủ), nó đề xuất một nền tảng chính, một dự phòng, và một kế hoạch gắn đo lường FinOps.

## Exercises

1. Chạy `code/main.py`. Ở mức sử dụng duy trì nào Azure PTU vượt theo nhu cầu cho một mô hình loại 70B? Tính điểm hòa vốn và so với dải 40-60% được quảng bá.
2. Sản phẩm của bạn cần Claude 3.7 Sonnet và GPT-4o. Thiết kế một triển khai hai nhà cung cấp — mô hình nào tới nhà cung cấp siêu quy mô nào, gateway nào nằm phía trước, chính sách chuyển đổi dự phòng là gì?
3. Một khách hàng chăm sóc sức khỏe được quản lý yêu cầu các BAA, lưu trú dữ liệu US-East, và TTFT P99 dưới 100ms. Chọn một nền tảng và giải thích bằng ba tính năng cụ thể.
4. Bạn phát hiện hóa đơn Bedrock tăng 4x tháng này không có thay đổi lưu lượng. Không có Application Inference Profiles, bạn sẽ tìm thủ phạm như thế nào? Có các hồ sơ, mất bao lâu?
5. Đọc các trang giá Anthropic API và Bedrock. Với khối lượng công việc Claude 100M token/tháng, phương án nào rẻ hơn — Anthropic API trực tiếp, Bedrock on-demand hay Bedrock Provisioned Throughput?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| Bedrock | “Dịch vụ LLM AWS” | Chợ mô hình trên Claude, Llama, Titan, Mistral, Cohere |
| Azure OpenAI | “ChatGPT của Azure” | Các mô hình OpenAI độc quyền trong các trung tâm dữ liệu Azure với các kiểm soát doanh nghiệp |
| Vertex AI | “LLM của Google” | Nền tảng ưu tiên Gemini với Model Garden cho các mô hình bên thứ ba |
| PTU | “dung lượng chuyên dụng” | Đơn vị thông lượng được cấp sẵn — các GPU suy luận được đặt trước, định giá theo giờ |
| Application Inference Profile (Hồ sơ suy luận ứng dụng) | “Gắn thẻ Bedrock” | Hồ sơ chi phí/sử dụng theo từng sản phẩm với các thẻ, thuần CloudWatch |
| Model Garden | “Danh mục Vertex” | Phần mô hình bên thứ ba của Vertex AI, tách khỏi Gemini |
| Two-provider minimum (Tối thiểu hai nhà cung cấp) | “Dự phòng LLM” | Chính sách chạy mọi đường LLM quan trọng trên ≥2 nhà cung cấp siêu quy mô |
| BAA | “Giấy tờ HIPAA” | Thỏa thuận đối tác kinh doanh; bắt buộc cho PHI; được cả ba cung cấp |
| Abuse monitoring (Giám sát lạm dụng) | “bên theo dõi nhật ký” | Quét an toàn phía nhà cung cấp trên prompt/đầu ra; chọn không tham gia trong doanh nghiệp |

## Further Reading

- [AWS Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/) — bảng giá có thẩm quyền và giá Provisioned Throughput.
- [Azure OpenAI Service Pricing](https://azure.microsoft.com/en-us/pricing/details/azure-openai/) — kinh tế PTU và các bảng giá.
- [Vertex AI Generative AI Pricing](https://cloud.google.com/vertex-ai/generative-ai/pricing) — các tầng Gemini và các phụ phí Model Garden.
- [Artificial Analysis LLM Leaderboard](https://artificialanalysis.ai/) — các benchmark độ trễ và thông lượng liên tục trên các nhà cung cấp.
- [The AI Journal — AWS Bedrock vs Azure OpenAI CTO Guide 2026](https://theaijournal.co/2026/03/aws-bedrock-vs-azure-openai/) — khung quyết định doanh nghiệp.
- [Finout — Bedrock vs Vertex vs Azure FinOps](https://www.finout.io/blog/bedrock-vs.-vertex-vs.-azure-cognitive-a-finops-comparison-for-ai-spend) — đối chiếu các cơ chế quy chi phí.
