# Shadow Traffic, Canary Rollout, and Progressive Deployment for LLMs

> Triển khai LLM kết hợp những phần khó nhất của triển khai phần mềm: không có kiểm thử đơn vị, chế độ lỗi phân tán, tín hiệu đến muộn. Trình tự là (1) chế độ bóng — nhân đôi yêu cầu sản xuất sang mô hình ứng viên, ghi log, so sánh mà không tác động người dùng; bắt được vấn đề phân phối rõ ràng nhưng không phải bảo đảm chất lượng; (2) triển khai canary — chuyển lưu lượng tăng dần 10% → 25% → 50% → 75% → 100% với các cổng ở mỗi bước; theo dõi phân vị độ trễ, chi phí/yêu cầu, tỷ lệ lỗi/từ chối, phân phối độ dài đầu ra, tỷ lệ phản hồi người dùng; (3) thử nghiệm A/B cho các phương án khác biệt sau khi xác nhận ổn định. Tính không xác định không thể loại bỏ — biến thiên độ chính xác tới 15% giữa các lần chạy với đầu vào giống hệt do tính không kết hợp của FP GPU cộng biến thiên kích thước lô. Chi phí là biến số, không phải hằng số — mô hình tốt hơn 20% có thể đắt hơn 3x mỗi lệnh gọi. Tốc độ hoàn tác mang tính quyết định: nếu hoàn tác yêu cầu triển khai lại, bạn quá chậm. Chính sách nằm trong cấu hình/cờ; mô hình nằm trong registry với digest được ghim; hoàn tác = đổi chính sách + hoàn nguyên ngưỡng + ghim mô hình cũ trong vài giây.

**Type:** Learn
**Languages:** Python (stdlib, toy canary-progression simulator)
**Prerequisites:** Phase 17 · 13 (Observability), Phase 17 · 21 (A/B Testing)
**Time:** ~60 minutes

## Learning Objectives

- Phân biệt chế độ bóng (so sánh không tác động), canary (lưu lượng trực tiếp tăng dần) và A/B (so sánh sau khi xác nhận ổn định).
- Liệt kê năm chỉ số canary riêng cho LLM (độ trễ, chi phí/yêu cầu, lỗi/từ chối, phân phối độ dài đầu ra, phản hồi người dùng).
- Giải thích tại sao tính không xác định của LLM (tới 15%) thay đổi ý nghĩa của "ổn định" trong một đợt triển khai.
- Thiết kế đường hoàn tác mất vài giây (đổi chính sách) chứ không phải vài giờ (triển khai lại).

## The Problem

Bạn triển khai mô hình mới. Đánh giá ngoại tuyến cho thấy độ chính xác tăng 3%. Bạn bật nó trong sản xuất. Trong vòng 24 giờ, chi phí tăng 40%, phản hồi không tán thành của người dùng tăng 8%, ba phiếu hỗ trợ khách hàng báo "câu trả lời kỳ lạ." Bạn hoàn tác. Triển khai lại mất 3 giờ. Cuối tuần của bạn bị phá hỏng.

Mọi phần của việc đó đều có thể tránh. Chế độ bóng đã có thể bắt đột biến chi phí 40% trước khi bất kỳ người dùng nào thấy nó. Canary đã có thể dừng ở 10% khi phản hồi không tán thành thay đổi. Hoàn tác bằng cờ chính sách đã có thể mất 30 giây. Kỷ luật là thứ lấp khoảng trống giữa "đánh giá ngoại tuyến trông tốt" và "người dùng thực hài lòng."

## The Concept

### Shadow mode

Ứng viên nhận cùng yêu cầu như sản xuất; đầu ra được ghi log, không trả cho người dùng. Không tác động người dùng. Ghi log:

- Nội dung đầu ra (so sánh khác biệt với sản xuất).
- Số lượng token (chênh lệch chi phí).
- Độ trễ.
- Từ chối và lỗi.

Bắt được: chi phí bùng nổ, suy giảm độ dài, thay đổi từ chối rõ ràng, lỗi cứng. KHÔNG bắt được: chênh lệch chất lượng người dùng sẽ cảm nhận. Chạy bóng là kiểm thử khói, không phải kiểm thử chất lượng.

### Canary rollout

Chuyển lưu lượng tăng dần có các cổng. Tiến trình điển hình: 1% → 10% → 25% → 50% → 75% → 100%. Kiểm soát trên 5 chỉ số ở mỗi bước:

1. **Phân vị độ trễ** — P50, P95, P99. Vi phạm: canary có P99 > 1.5x đường cơ sở.
2. **Chi phí mỗi yêu cầu** — $ pha trộn. Vi phạm: cao hơn đường cơ sở >20%.
3. **Tỷ lệ lỗi / từ chối** — 5xx cộng các từ chối tường minh. Vi phạm: 2x đường cơ sở.
4. **Phân phối độ dài đầu ra** — trung bình + P99. Vi phạm: dịch chuyển phân phối.
5. **Tỷ lệ phản hồi người dùng** — không tán thành / gửi phiếu hỗ trợ. Vi phạm: 1.5x đường cơ sở.

### Non-determinism is the new variance

Đầu vào giống hệt tạo đầu ra không giống hệt. Lý do:

- Tính không kết hợp của FP GPU (thứ tự rút gọn dấu phẩy động thay đổi theo lô).
- Biến thiên kích thước lô (cùng prompt trong lô 128 so với lô 16).
- Lấy mẫu (temperature > 0).

Đo được: biến thiên độ chính xác tới 15% giữa các lần chạy trên các bộ đánh giá giống hệt. "Ổn định" trong một đợt triển khai nghĩa là chỉ số nằm trong biến thiên dự kiến, không phải giống hệt đường cơ sở. Đặt cổng trên sàn nhiễu.

### Cost is a variable

Một mô hình tốt hơn 20% có thể đắt hơn 3x mỗi lệnh gọi. Chi phí/yêu cầu là một trong năm cổng. Triển khai một mô hình "tốt hơn" làm phá vỡ tính kinh tế đơn vị là trường hợp cần hoàn tác.

### Rollback is the weapon

- Cờ chính sách (hệ thống cờ tính năng): đổi phần trăm trong cấu hình; mất vài giây.
- Ghim mô hình (digest registry): mô hình được ghim không tự nâng cấp.
- Hoàn tác = hoàn nguyên cờ + đặt digest được ghim về trước đó. Vài giây, không phải vài giờ.

Nếu ngăn xếp của bạn yêu cầu triển khai lại để hoàn tác, sửa điều đó trước khi triển khai.

### Tooling

**Argo Rollouts** / **Flagger** — các bộ điều khiển phân phối tăng dần Kubernetes. Tích hợp với định tuyến có trọng số Istio/Linkerd.

**Định tuyến có trọng số Istio** — chia lưu lượng cấp service mesh.

**KServe / Seldon Core** — phục vụ mô hình với canary tích hợp sẵn.

**Cờ tính năng** — LaunchDarkly, Flagsmith, Unleash. Đổi ở cấp chính sách, không triển khai lại.

### Metrics cadence

Các cổng canary kiểm tra mỗi 5-15 phút tùy khối lượng lưu lượng. 1% của 1,000 yêu cầu/phút (10 yêu cầu/phút đến canary) cho 50-150 điểm dữ liệu trên mỗi cửa sổ 5-15 phút — đủ cho độ trễ nhưng nhiễu cho phản hồi người dùng. 10% cho nhiều hơn ~10x. Các bước tiến nên tạm dừng đủ lâu để tích lũy đủ mẫu ở mỗi bước.

### The A/B step is optional

Nếu mô hình mới khác biệt rõ rệt (hành vi khác, đường cong chi phí khác, giọng điệu khác), kiểm tra A/B nó ở 50% sau khi canary qua. Nếu nó chỉ là một phiên bản cải thiện của cùng hành vi, chuyển thẳng lên 100% khi các cổng canary qua. Cải thiện nghĩa là đánh giá ngoại tuyến đã cho thấy lợi ích. Các cổng canary không đo việc hoàn thành tác vụ, nên việc bỏ qua tin vào đánh giá về điều đó.

### Numbers you should remember

- Tiến trình canary: 1% → 10% → 25% → 50% → 75% → 100%.
- Trần tính không xác định: biến thiên giữa các lần chạy tới 15% trên đầu vào giống hệt.
- Năm chỉ số canary: độ trễ, chi phí, lỗi/từ chối, độ dài đầu ra, phản hồi người dùng.
- Cổng chi phí: cao hơn đường cơ sở >20% là vi phạm.
- Hoàn tác: vài giây, không phải vài giờ.

```figure
i4-canary-ramp
```

## Use It

`code/main.py` mô phỏng một đợt triển khai canary với các suy giảm được chèn vào. Báo cáo đợt triển khai dừng ở giai đoạn nào và cổng nào đã kích hoạt.

## Ship It

Bài học này tạo ra `outputs/skill-rollout-runbook.md`. Với mô hình ứng viên, đường cơ sở và mức chấp nhận rủi ro, thiết kế kế hoạch bóng→canary→100%.

## Exercises

1. Chạy `code/main.py`. Chèn suy giảm chi phí 25%. Canary dừng ở giai đoạn nào?
2. Mô hình mới của bạn tăng độ chính xác 3% ngoại tuyến nhưng chi phí/yêu cầu là +18%. Có triển khai không? Tùy chính sách — viết cả hai đường.
3. Thiết kế hoàn tác mất dưới 60 giây đầu cuối. Liệt kê hạ tầng cần thiết.
4. Tính không xác định cho thấy ±7% trên đánh giá của bạn. Đặt cổng canary để bạn không báo động giả. Bạn dùng các hệ số nào?
5. Chế độ bóng bắt được đột biến chi phí 40% trước canary. Viết quy tắc cảnh báo kích hoạt trong chế độ bóng.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|----------------|------------------------|
| Shadow mode (Chế độ bóng) | "nhân đôi sang mới" | Gửi đến ứng viên để ghi log mà không tác động |
| Canary | "lưu lượng tăng dần" | Triển khai dần tiếp xúc người dùng với các cổng |
| Gates (Cổng) | "kiểm tra triển khai" | Ngưỡng chỉ số chặn việc tiến bước |
| Non-determinism (Tính không xác định) | "biến thiên LLM" | Khác biệt giữa các lần chạy không thể loại bỏ |
| Policy flag (Cờ chính sách) | "hoàn tác bằng đổi cờ" | Hoàn tác cấp cấu hình, vài giây không phải vài giờ |
| Model pin (Ghim mô hình) | "digest registry" | Tham chiếu bất biến đến một phiên bản mô hình |
| Argo Rollouts | "K8s tăng dần" | Bộ điều khiển canary/hoàn tác nguyên bản Kubernetes |
| KServe | "K8s suy luận" | Phục vụ mô hình với các thành phần canary cơ bản |
| Istio weighted (Istio có trọng số) | "chia mesh" | Bộ chia lưu lượng service mesh |

## Further Reading

- [TianPan — Releasing AI Features Without Breaking Production](https://tianpan.co/blog/2026-04-09-llm-gradual-rollout-shadow-canary-ab-testing)
- [MarkTechPost — Safely Deploying ML Models](https://www.marktechpost.com/2026/03/21/safely-deploying-ml-models-to-production-four-controlled-strategies-a-b-canary-interleaved-shadow-testing/)
- [APXML — Advanced LLM Deployment Patterns](https://apxml.com/courses/mlops-for-large-models-llmops/chapter-4-llm-deployment-serving-optimization/advanced-llm-deployment-patterns)
- [Argo Rollouts docs](https://argo-rollouts.readthedocs.io/)
- [Flagger docs](https://docs.flagger.app/)
