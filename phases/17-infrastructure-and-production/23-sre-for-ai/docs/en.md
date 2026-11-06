# SRE for AI — Multi-Agent Incident Response, Runbooks, Predictive Detection

> SRE AI dùng LLM được đặt nền trên dữ liệu hạ tầng (log, cẩm nang vận hành, cấu trúc liên kết dịch vụ) qua RAG để tự động hóa các giai đoạn điều tra, lập tài liệu và phối hợp. Mẫu kiến trúc năm 2026 là điều phối đa agent — các agent chuyên biệt (log, chỉ số, cẩm nang vận hành) được một giám sát viên điều phối; AI đề xuất giả thuyết và truy vấn, con người phê duyệt các quyết định cần phán đoán. Datadog Bits AI và Azure SRE Agent cung cấp điều này dưới dạng sản phẩm được quản lý. Cẩm nang vận hành đang tiến hóa: NeuBird Hawkeye dùng đánh giá đối kháng (hai mô hình phân tích cùng sự cố; đồng ý = tin cậy, bất đồng = không chắc chắn); bộ nhớ vận hành tồn tại qua các thay đổi nhóm. Tự khắc phục vẫn thận trọng: AI đề xuất, con người phê duyệt. Hành động hoàn toàn tự chủ có phạm vi hẹp (khởi động lại pod, hoàn tác một triển khai cụ thể) với chốt bảo vệ chặt — bất kỳ ai bán "thiết lập rồi quên đi" đều đang quảng cáo quá mức. Hướng tiên tiến đang nổi lên: dự đoán trước sự cố. Nghiên cứu MIT báo cáo một LLM được huấn luyện trên log lịch sử + nhiệt độ GPU + mẫu lỗi API dự đoán được 89% sự cố ngừng hoạt động sớm 10-15 phút. Dự đoán: 95% LLM doanh nghiệp có chuyển đổi dự phòng tự động trước cuối năm 2026.

**Type:** Learn
**Languages:** Python (stdlib, toy multi-agent incident triage simulator)
**Prerequisites:** Phase 17 · 13 (Observability), Phase 17 · 24 (Chaos Engineering)
**Time:** ~60 minutes

## Learning Objectives

- Vẽ sơ đồ kiến trúc SRE AI đa agent: giám sát viên + các agent chuyên biệt (log, chỉ số, cẩm nang vận hành) + cổng phê duyệt của con người.
- Giải thích tại sao tự khắc phục có phạm vi hẹp (khởi động lại pod, hoàn nguyên triển khai) thay vì rộng (thiết kế lại kiến trúc dịch vụ).
- Nêu mẫu đánh giá đối kháng (NeuBird Hawkeye): hai mô hình đồng ý = tin cậy; bất đồng = chuyển cấp.
- Trích dẫn kết quả phát hiện sớm 89% của MIT và ràng buộc vận hành: dự đoán không có hành động chỉ là bảng điều khiển.

## The Problem

Một kỹ sư trực nhận cảnh báo lúc 3 giờ sáng. "Tỷ lệ lỗi cao ở thanh toán." Họ kiểm tra Datadog, Loki, ba cẩm nang vận hành, log triển khai. 30 phút sau họ nhận ra nguyên nhân gốc là OOM vLLM do đột biến bộ nhớ đệm KV. Họ khởi động lại pod; lỗi hết.

Năm 2026, 20 phút đầu của cuộc điều tra đó có thể tự động hóa. Nhóm log theo dịch vụ, tương quan với triển khai gần đây, đối chiếu với cẩm nang vận hành — tất cả là RAG + dùng công cụ. Một agent có giám sát có thể phân loại sơ bộ và trình bày một giả thuyết trước khi con người mở Datadog.

Khắc phục hoàn toàn tự chủ là vấn đề khác. Khởi động lại pod: an toàn. Mở rộng bể GPU: an toàn nếu chính sách cho phép. Thiết kế lại kiến trúc dịch vụ: tuyệt đối không. Kỷ luật là vạch ranh giới hẹp.

## The Concept

### Multi-agent architecture

```
          Incident
             │
             ▼
        Supervisor
        /    |    \
       ▼     ▼     ▼
  Log agent  Metric agent  Runbook agent
       │     │     │
       └─────┴─────┘
             │
             ▼
        Hypothesis + evidence
             │
             ▼
        Human approval
             │
             ▼
        Action (narrow set)
```

Giám sát viên chia sự cố thành truy vấn con. Các agent chuyên biệt có quyền truy cập công cụ (tìm kiếm log, PromQL, truy xuất tài liệu). Giám sát viên tổng hợp, trình bày giả thuyết + bằng chứng cho con người. Con người phê duyệt hoặc đổi hướng.

### Auto-remediation scope

**An toàn (hẹp)**: khởi động lại pod, hoàn nguyên triển khai cụ thể, mở rộng bể trong giới hạn phê duyệt trước, bật cờ tính năng phê duyệt trước.

**Không an toàn (rộng)**: thay đổi cấu trúc liên kết dịch vụ, sửa giới hạn tài nguyên, triển khai mã mới, thay đổi IAM, thay đổi cơ sở dữ liệu.

Bất kỳ ai bán "thiết lập rồi quên đi" đều đang quảng cáo quá mức. Tập an toàn tăng khi SRE AI trưởng thành, nhưng ranh giới là có thật.

### Adversarial evaluation (NeuBird Hawkeye)

Hai mô hình độc lập phân tích cùng sự cố. Nếu chúng đồng ý về nguyên nhân gốc, độ tin cậy cao. Nếu chúng bất đồng, chuyển lên con người với cả hai giả thuyết được hiển thị. Mẫu đơn giản, bộ lọc hiệu quả chống nguyên nhân gốc ảo giác.

### Operational memory

Biến động nhân sự nhóm là sát thủ âm thầm của SRE truyền thống — kiến thức truyền miệng rời đi. SRE AI lưu cẩm nang vận hành + báo cáo hậu kiểm trong DB vector; agent truy xuất trên mỗi sự cố mới. Khi kỹ sư mới tham gia, AI có toàn bộ lịch sử.

### Pre-incident prediction

Nghiên cứu MIT năm 2025: LLM được huấn luyện trên log lịch sử, nhiệt độ GPU, mẫu lỗi API dự đoán được 89% sự cố ngừng hoạt động 10-15 phút trước khi xảy ra trên tập kiểm thử.

Kiểm tra thực tế: dự đoán không có hành động là bảng điều khiển. Câu hỏi vận hành là "khi dự đoán, chúng ta làm gì?" Rút công việc trước? Gọi trực? Tự mở rộng quy mô? Câu trả lời phụ thuộc chính sách.

### Products in 2026

- **Datadog Bits AI** — copilot SRE được quản lý bên trong Datadog.
- **Azure SRE Agent** — nguyên bản Azure.
- **NeuBird Hawkeye** — đánh giá đối kháng + bộ nhớ vận hành.
- **PagerDuty AIOps** — phân loại + khử trùng lặp.
- **Incident.io Autopilot** — chỉ huy sự cố + phối hợp.

### Runbooks as code

Cẩm nang vận hành tiến hóa từ trang Confluence sang markdown có phiên bản với các phần có cấu trúc (triệu chứng, giả thuyết, xác minh, hành động). Cẩm nang vận hành có cấu trúc cung cấp đầu vào truy xuất RAG tốt hơn. Bắt đầu mọi đợt triển khai SRE AI bằng việc chuyển cẩm nang vận hành phi cấu trúc thành có cấu trúc.

### Numbers you should remember

- Phát hiện sớm MIT: 89% sự cố ngừng hoạt động, thời gian báo trước 10-15 phút.
- Phân loại đa agent: giám sát viên + (log, chỉ số, cẩm nang vận hành) + con người.
- Tập tự khắc phục an toàn: khởi động lại pod, hoàn nguyên triển khai, mở rộng trong giới hạn.
- Đánh giá đối kháng: hai mô hình độc lập; đồng ý = tin cậy.

```figure
i4-incident-agents
```

## Use It

`code/main.py` mô phỏng phân loại đa agent: agent log tìm lỗi, agent chỉ số tìm đột biến CPU, agent cẩm nang vận hành khớp với vấn đề đã biết. Giám sát viên xếp hạng giả thuyết.

## Ship It

Bài học này tạo ra `outputs/skill-ai-sre-plan.md`. Với tình hình trực hiện tại, lượng sự cố, mức trưởng thành nhóm, thiết kế đợt triển khai SRE AI.

## Exercises

1. Chạy `code/main.py`. Nếu agent log và chỉ số bất đồng thì sao? Giám sát viên giải quyết thế nào?
2. Xác định ba hành động tự khắc phục "an toàn" cho dịch vụ của bạn. Giải thích từng hành động.
3. Viết mẫu cẩm nang vận hành có cấu trúc: các phần, trường bắt buộc, lệnh xác minh.
4. Phát hiện dự đoán kích hoạt với thời gian báo trước 12 phút. Chính sách của bạn là gì — gọi trực, rút công việc trước, hay cả hai?
5. Lập luận liệu nhóm 3 người nên áp dụng SRE AI năm 2026 hay chờ. Cân nhắc mức trưởng thành, khối lượng, rủi ro.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|----------------|------------------------|
| AI SRE (SRE AI) | "agent cho trực" | Điều tra sự cố + phối hợp dựa trên LLM |
| Supervisor agent (Agent giám sát) | "bộ điều phối" | Agent cấp cao chia sự cố thành truy vấn con |
| Specialized agent (Agent chuyên biệt) | "agent miền" | Agent phụ có quyền truy cập công cụ (log, chỉ số, cẩm nang vận hành) |
| Auto-remediation (Tự khắc phục) | "AI sửa nó" | Hành động hẹp phê duyệt trước; KHÔNG phải thiết kế lại kiến trúc rộng |
| Operational memory (Bộ nhớ vận hành) | "cẩm nang vận hành vector" | Báo cáo hậu kiểm + cẩm nang vận hành trong DB vector cho RAG |
| Adversarial eval (Đánh giá đối kháng) | "kiểm tra hai mô hình" | Phân tích độc lập; đồng ý = tin cậy |
| NeuBird Hawkeye | "công cụ đối kháng" | Sản phẩm có mẫu đánh giá đối kháng + bộ nhớ |
| Bits AI | "agent SRE của Datadog" | SRE AI do Datadog quản lý |
| Pre-incident prediction (Dự đoán trước sự cố) | "phát hiện sớm" | Thời gian báo trước 10-15 phút khi dự đoán ngừng hoạt động |

## Further Reading

- [incident.io — AI SRE Complete Guide 2026](https://incident.io/blog/what-is-ai-sre-complete-guide-2026)
- [InfoQ — Human-Centred AI for SRE](https://www.infoq.com/news/2026/01/opsworker-ai-sre/)
- [DZone — AI in SRE 2026](https://dzone.com/articles/ai-in-sre-whats-actually-coming-in-2026)
- [Datadog Bits AI](https://www.datadoghq.com/product/bits-ai/)
- [NeuBird Hawkeye](https://www.neubird.ai/)
- [awesome-ai-sre](https://github.com/agamm/awesome-ai-sre)
