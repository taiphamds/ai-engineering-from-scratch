# Capstone 15 — Constitutional Safety Harness + Red-Team Range

> Constitutional Classifiers của Anthropic, Llama Guard 4 của Meta, ShieldGemma-2 của Google, Nemotron 3 Content Safety của NVIDIA, và X-Guard cho độ bao phủ đa ngôn ngữ đã định hình ngăn xếp bộ phân loại an toàn năm 2026. garak, PyRIT, NVIDIA Aegis, và promptfoo đã trở thành các công cụ đánh giá đối kháng tiêu chuẩn. NeMo Guardrails v0.12 kết nối chúng thành một pipeline sản xuất. Bài tổng kết này kết nối tất cả: một harness an toàn nhiều lớp bao quanh một ứng dụng đích, một agent red-team tự trị chạy 6+ họ tấn công, và một lần chạy tự phê bình theo hiến pháp tạo ra chênh lệch tính vô hại có thể đo được.

**Type:** Capstone
**Languages:** Python (safety pipeline, red team), YAML (policy configs)
**Prerequisites:** Phase 10 (LLMs from scratch), Phase 11 (LLM engineering), Phase 13 (tools), Phase 14 (agents), Phase 18 (ethics, safety, alignment)
**Phases exercised:** P10 · P11 · P13 · P14 · P18
**Time:** 25 hours

## Problem

Biên giới an toàn LLM năm 2026 không phải là liệu các bộ phân loại có hoạt động không (chúng có, đại khái) mà là cách kết hợp chúng chính xác quanh một ứng dụng sản xuất mà không từ chối quá mức hoặc để lại những lỗ hổng rõ ràng. Llama Guard 4 xử lý các vi phạm chính sách tiếng Anh. X-Guard (132 ngôn ngữ) xử lý jailbreak đa ngôn ngữ. ShieldGemma-2 phát hiện prompt injection dựa trên ảnh. NVIDIA Nemotron 3 Content Safety bao phủ các hạng mục doanh nghiệp. Constitutional Classifiers của Anthropic là một cách tiếp cận riêng được sử dụng trong huấn luyện thay vì phục vụ.

Sự tiến hóa của tấn công cũng quan trọng. PAIR và TAP tự động hóa khám phá jailbreak. GCG chạy các tấn công hậu tố dựa trên gradient. Các tấn công nhiều lượt và chuyển đổi ngôn ngữ khai thác bộ nhớ agent. Bất kỳ LLM được triển khai nào cũng cần một thao trường red-team — garak và PyRIT là các trình điều khiển chuẩn — cùng các biện pháp giảm thiểu được lập tài liệu và các phát hiện được chấm CVSS.

Bạn sẽ gia cố một ứng dụng đích (một mô hình 8B được tinh chỉnh theo chỉ dẫn hoặc một trong các chatbot RAG từ những bài tổng kết khác), chạy 6+ họ tấn công chống lại nó, và tạo một phép đo tính vô hại trước/sau.

## Concept

Pipeline an toàn có năm lớp. **Làm sạch đầu vào**: bỏ ký tự có độ rộng bằng không, giải mã base64/rot13, chuẩn hóa Unicode. **Lớp chính sách**: các rail NeMo Guardrails v0.12 (ngoài miền, tính độc hại, trích xuất PII). **Cổng bộ phân loại**: Llama Guard 4 trên đầu vào, X-Guard trên ngôn ngữ không phải tiếng Anh, ShieldGemma-2 trên đầu vào ảnh. **Mô hình**: LLM đích. **Bộ lọc đầu ra**: Llama Guard 4 trên đầu ra, xóa PII bằng Presidio, thực thi trích dẫn khi phù hợp. **Tầng HITL**: các đầu ra bị gắn cờ rủi ro cao đi đến một hàng đợi Slack.

Thao trường red-team chạy trên một bộ lập lịch. PAIR và TAP tự trị khám phá các jailbreak. GCG chạy các tấn công hậu tố dựa trên gradient. Các tấn công mã hóa ASCII / base64 / rot13. Các tấn công nhiều lượt (nhận vai nhân vật, khai thác bộ nhớ). Các tấn công chuyển đổi ngôn ngữ (trộn tiếng Anh với tiếng Swahili hoặc tiếng Thái). Mỗi lần chạy tạo ra một file phát hiện có cấu trúc với chấm điểm CVSS và lịch trình công bố.

Lần chạy tự phê bình theo hiến pháp là một can thiệp tại thời điểm huấn luyện. Lấy 1k prompt thử gây hại, để mô hình nháp một phản hồi, phê bình nó theo một hiến pháp được viết ra (các quy tắc không gây hại), và huấn luyện lại trên vòng lặp phê bình. Đo chênh lệch tính vô hại trước/sau trên một đánh giá được giữ riêng.

## Architecture

```
request (text / image / multilingual)
      |
      v
input sanitize (strip zero-width, decode, normalize)
      |
      v
NeMo Guardrails v0.12 rails (off-domain, policy)
      |
      v
classifier gate:
  Llama Guard 4 (English)
  X-Guard (multilingual, 132 langs)
  ShieldGemma-2 (image prompts)
  Nemotron 3 Content Safety (enterprise)
      |
      v (allowed)
target LLM
      |
      v
output filter: Llama Guard 4 + Presidio PII + citation check
      |
      v
HITL tier for flagged outputs

parallel:
  red-team scheduler
    -> garak (classic attacks)
    -> PyRIT (orchestrated red team)
    -> autonomous jailbreak agent (PAIR + TAP)
    -> GCG suffix attacks
    -> multilingual / code-switch
    -> multi-turn persona adoption

output: CVSS-scored findings + disclosure timeline + before/after harmlessness delta
```

## Stack

- Bộ phân loại an toàn: Llama Guard 4, ShieldGemma-2, NVIDIA Nemotron 3 Content Safety, X-Guard
- Framework chốt bảo vệ: NeMo Guardrails v0.12 + OPA
- Trình điều khiển red-team: garak (NVIDIA), PyRIT (Microsoft Azure), NVIDIA Aegis, promptfoo
- Agent jailbreak: PAIR (Chao và cộng sự, 2023), Tree-of-Attacks (TAP), hậu tố GCG
- Huấn luyện theo hiến pháp: vòng lặp tự phê bình kiểu Anthropic + SFT trên các bài phê bình
- Xóa PII: Presidio
- Đích: một mô hình 8B được tinh chỉnh theo chỉ dẫn hoặc một trong các chatbot RAG của những bài tổng kết khác

```figure
cf-safety-stack
```

## Build It

1. **Thiết lập đích.** Dựng một mô hình 8B được tinh chỉnh theo chỉ dẫn trên vLLM (hoặc tái sử dụng một chatbot RAG từ bài tổng kết khác). Đây là ứng dụng được kiểm thử.

2. **Bọc pipeline an toàn.** Kết nối pipeline năm lớp quanh đích. Xác minh từng lớp có thể được quan sát riêng lẻ (span cho mỗi lớp trong Langfuse).

3. **Độ bao phủ bộ phân loại.** Nạp Llama Guard 4, X-Guard (đa ngôn ngữ), ShieldGemma-2 (ảnh). Chạy từng bộ trên một tập nhỏ được gắn nhãn để thiết lập các đường cơ sở.

4. **Bộ lập lịch red-team.** Lên lịch garak, PyRIT, một agent PAIR, một agent TAP, một trình chạy GCG, một kẻ tấn công nhiều lượt, và một kẻ tấn công chuyển đổi ngôn ngữ. Mỗi loại chạy trên một hàng đợi riêng.

5. **Bộ tấn công.** Sáu họ tấn công: (1) jailbreak tự động PAIR, (2) cây tấn công TAP, (3) hậu tố gradient GCG, (4) mã hóa ASCII / base64 / rot13, (5) nhân vật nhiều lượt, (6) chuyển đổi đa ngôn ngữ. Báo cáo tỷ lệ thành công theo họ.

6. **Tự phê bình theo hiến pháp.** Tuyển chọn 1k prompt thử gây hại. Với mỗi prompt, đích nháp một phản hồi. Một LLM phê bình chấm theo một hiến pháp được viết ra ("không gây hại," "trích dẫn bằng chứng," "từ chối yêu cầu bất hợp pháp"). Các prompt mà bộ phê bình phản đối được viết lại; đích tinh chỉnh trên các cặp được cải thiện qua phê bình. Đo tính vô hại trước/sau trên một đánh giá được giữ riêng.

7. **Đo từ chối quá mức.** Theo dõi tỷ lệ dương tính giả trên một bộ prompt lành tính (ví dụ, XSTest). Đích phải duy trì tính hữu ích với các câu hỏi lành tính.

8. **Chấm điểm CVSS.** Với mỗi jailbreak thành công, chấm theo CVSS 4.0 (vector tấn công, độ phức tạp, tác động). Tạo một lịch trình công bố và kế hoạch giảm thiểu.

9. **Tự động hóa thao trường.** Mọi thứ ở trên chạy theo cron; các phát hiện ghi vào một hàng đợi; các cảnh báo thoái lui từ chối quá mức được phát tới Slack.

## Use It

```
$ safety probe --model=target --family=PAIR --budget=50
[attacker]   PAIR agent running on target
[attack]     attempt 1/50: disguise query as academic research ... blocked
[attack]     attempt 2/50: appeal to roleplay ... blocked
[attack]     attempt 3/50: chain-of-thought coax ... SUCCEEDED
[finding]    CVSS 4.8 medium: roleplay bypass on target
[range]      7 successes out of 50 (14% success rate)
```

## Ship It

`outputs/skill-safety-harness.md` là sản phẩm bàn giao. Một pipeline an toàn nhiều lớp cấp sản xuất cùng một thao trường red-team có thể tái lập với các chênh lệch tính vô hại trước/sau.

| Trọng số | Tiêu chí | Cách đo |
|:-:|---|---|
| 25 | Độ bao phủ bề mặt tấn công | 6+ họ tấn công được thực thi, 2+ ngôn ngữ |
| 20 | Đánh đổi dương tính thật / dương tính giả | Tỷ lệ chặn tấn công so với tỷ lệ đạt lành tính XSTest |
| 20 | Chênh lệch tự phê bình | Tính vô hại trước/sau trên đánh giá được giữ riêng |
| 20 | Tài liệu và công bố | Các phát hiện được chấm CVSS với lịch trình |
| 15 | Tự động hóa và khả năng lặp lại | Mọi thứ chạy theo cron với cảnh báo |
| **100** | | |

## Exercises

1. Chạy plugin prompt-injection của garak trên một chatbot RAG và so sánh tỷ lệ thành công tấn công khi có và không có lớp bộ lọc đầu ra.

2. Thêm một họ tấn công thứ bảy: prompt injection gián tiếp qua các tài liệu được truy xuất. Đo phần phòng vệ bổ sung cần thiết.

3. Triển khai một chế độ "từ chối kèm trợ giúp": khi chốt bảo vệ chặn, đích cung cấp một câu trả lời liên quan an toàn hơn thay vì từ chối thẳng. Đo chênh lệch XSTest.

4. Khoảng trống độ bao phủ đa ngôn ngữ: tìm một ngôn ngữ mà X-Guard hoạt động kém. Đề xuất một tập dữ liệu tinh chỉnh nhắm đến nó.

5. Chạy tự phê bình theo hiến pháp trên một mô hình 30B và đo xem chênh lệch có tăng theo quy mô không.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|------------------------|
| Layered safety (An toàn nhiều lớp) | "Phòng thủ theo chiều sâu" | Nhiều chốt bảo vệ ở đầu vào, cổng, đầu ra, HITL |
| Llama Guard 4 | "Bộ phân loại an toàn của Meta" | Bộ phân loại nội dung đầu vào/đầu ra tham chiếu năm 2026 |
| PAIR | "Agent jailbreak" | Bài báo (Chao và cộng sự) về khám phá jailbreak do LLM điều khiển |
| TAP | "Cây tấn công" | Biến thể tìm kiếm cây của PAIR |
| GCG | "Gradient tọa độ tham lam" | Tấn công hậu tố đối kháng dựa trên gradient |
| Constitutional self-critique (Tự phê bình theo hiến pháp) | "Huấn luyện kiểu Anthropic" | Đích nháp -> bộ phê bình chấm -> viết lại -> huấn luyện lại |
| XSTest | "Tập thăm dò lành tính" | Benchmark cho thoái lui từ chối quá mức |
| CVSS 4.0 | "Điểm mức độ nghiêm trọng" | Chấm điểm lỗ hổng tiêu chuẩn cho các phát hiện an toàn |

## Further Reading

- [Anthropic Constitutional Classifiers](https://www.anthropic.com/research/constitutional-classifiers) — tham chiếu tại thời điểm huấn luyện
- [Meta Llama Guard 4](https://www.llama.com/docs/model-cards-and-prompt-formats/llama-guard-4/) — bộ phân loại đầu vào/đầu ra năm 2026
- [Google ShieldGemma-2](https://huggingface.co/google/shieldgemma-2b) — an toàn ảnh + đa phương thức
- [NVIDIA Nemotron 3 Content Safety](https://developer.nvidia.com/blog/building-nvidia-nemotron-3-agents-for-reasoning-multimodal-rag-voice-and-safety/) — tham chiếu doanh nghiệp
- [X-Guard (arXiv:2504.08848)](https://arxiv.org/abs/2504.08848) — an toàn đa ngôn ngữ 132 ngôn ngữ
- [garak](https://github.com/NVIDIA/garak) — bộ công cụ red-team NVIDIA
- [PyRIT](https://github.com/Azure/PyRIT) — framework red-team Microsoft
- [NeMo Guardrails v0.12](https://docs.nvidia.com/nemo-guardrails/) — framework rail
- [PAIR (arXiv:2310.08419)](https://arxiv.org/abs/2310.08419) — bài báo agent jailbreak
