---
name: skill-cot-patterns
description: Decision framework for choosing the right reasoning technique based on task complexity, accuracy requirements, and cost constraints
version: 1.0.0
phase: 11
lesson: 02
tags: [chain-of-thought, few-shot, self-consistency, tree-of-thought, react, reasoning, prompting]
---

# Reasoning Technique Selection Guide

Khi bạn cần một LLM suy luận qua một bài toán, chọn kỹ thuật trước khi viết prompt. Kỹ thuật quyết định kiến trúc suy luận. Prompt lấp vào nó.

## Quick Decision Tree

1. Tác vụ có phải tra cứu sự kiện đơn giản hay phân loại một bước không?
   - Có: dùng **zero-shot**. CoT thêm chi phí mà không tăng độ chính xác.
   - Không: tiếp tục.

2. Tác vụ có cần suy luận nhiều bước (toán, logic, lập kế hoạch) không?
   - Có: dùng **Chain-of-Thought**. Tiếp tục đến bước 3.
   - Không: dùng **few-shot** nếu định dạng quan trọng, zero-shot nếu không.

3. Một lỗi suy luận duy nhất có chấp nhận được không?
   - Có: dùng **few-shot CoT** (một mẫu, temperature 0.0).
   - Không: dùng **self-consistency** (N=5, temperature 0.7). Tiếp tục đến bước 4.

4. Bài toán có phải bài toán tìm kiếm/lập kế hoạch với nhiều đường khả dĩ không?
   - Có: dùng **Tree-of-Thought**.
   - Không: self-consistency là đủ.

5. Tác vụ có cần thông tin hoặc tính toán bên ngoài không?
   - Có: dùng **ReAct** (suy luận + gọi công cụ).
   - Không: các kỹ thuật suy luận thuần là đủ.

## Technique Matrix

| Kỹ thuật | Mức tăng độ chính xác | Hệ số chi phí | Độ trễ | Tốt nhất cho |
|-----------|--------------|-----------------|---------|----------|
| Zero-shot | Baseline | 1x | ~1s | Tác vụ đơn giản, hỏi đáp sự kiện |
| Few-shot | +5-15% | 1.2x | ~1s | Khớp định dạng, phân loại |
| Zero-shot CoT | +10-20% | 1.3x | ~1.5s | Tăng suy luận nhanh |
| Few-shot CoT | +15-25% | 1.5x | ~2s | Toán, logic, nhiều bước |
| Self-Consistency (N=5) | +2-5% so với CoT | 5x | ~5s | Suy luận hệ trọng |
| Self-Consistency (N=10) | +1-2% so với N=5 | 10x | ~10s | Chỉ quyết định quan trọng |
| Tree-of-Thought | Phụ thuộc tác vụ | 10-40x | ~30s+ | Tìm kiếm, lập kế hoạch, giải đố |
| ReAct | Phụ thuộc tác vụ | 3-10x | ~5-15s | Tác vụ dựa trên kiến thức |
| Nối chuỗi prompt | +5-10% so với một prompt | 2-5x | ~5-10s | Tác vụ nhiều phần phức tạp |

## Model-Specific Guidance

### GPT-4o / GPT-4.1
- Suy luận baseline mạnh. Zero-shot CoT thường đủ.
- Few-shot CoT với 3 ví dụ đạt 95% trên GSM8K.
- Self-consistency đem lại lợi ích nhỏ (95% lên 97%) -- chỉ đáng dùng cho tác vụ quan trọng.
- Hỗ trợ structured outputs nguyên bản để trích xuất câu trả lời.

### Claude 3.5 Sonnet / Claude 3.7 Sonnet
- Xuất sắc trong việc làm theo định dạng prompt có cấu trúc (thẻ XML).
- Few-shot CoT với ví dụ phân cách bằng XML hoạt động tốt nhất.
- Extended thinking (Claude 3.7) là CoT nguyên bản -- không cần prompt để có nó.
- Self-consistency hiệu quả vì suy luận của Claude biến thiên tốt ở temperature 0.7.

### Llama 3.1/3.3 70B
- Hưởng lợi nhiều nhất từ few-shot CoT (khoảng cách độ chính xác lớn hơn so với zero-shot).
- Self-consistency với N=5 được khuyến nghị cho tác vụ suy luận.
- Cần chỉ dẫn định dạng rõ ràng hơn các mô hình thương mại.
- ToT tốn kém trên suy luận cục bộ -- chỉ cân nhắc cho xử lý theo batch.

### Gemini 2.5 Pro
- Mạnh ở suy luận nhiều bước ngay từ đầu.
- Chế độ Thinking cung cấp CoT tích hợp mà không cần prompt engineering.
- Ví dụ few-shot giúp tính nhất quán định dạng nhiều hơn độ chính xác.
- Cửa sổ ngữ cảnh lớn (1M) khiến few-shot nhiều ví dụ trở nên khả thi.

## Anti-Patterns

**CoT cho tác vụ đơn giản**: hỏi "2+2 là gì? Hãy suy nghĩ từng bước" lãng phí token. Mô hình tính đúng số học đơn giản mà không cần vết suy luận. CoT hữu ích khi có 3+ bước.

**Self-consistency ở temperature 0.0**: cả N mẫu sẽ giống hệt nhau. Bạn phải dùng temperature > 0 (khuyến nghị 0.5-0.8) để có các đường suy luận đa dạng.

**ToT cho mọi thứ**: ToT cần O(b^d) lệnh gọi LLM trong đó b=hệ số phân nhánh và d=độ sâu. Một cây với b=3, d=3 cần tối đa 39 lệnh gọi. Dành cho các bài toán mà kỹ thuật rẻ hơn thất bại.

**Few-shot với ví dụ kém**: các ví dụ có lỗi suy luận dạy mô hình mắc những lỗi đó. Mọi ví dụ phải được xác minh. Một ví dụ sai có thể làm giảm độ chính xác hơn không có ví dụ.

**Trích xuất câu trả lời mà không có định dạng nhất quán**: self-consistency cần so sánh câu trả lời giữa các mẫu. Nếu định dạng câu trả lời thay đổi ("$18", "18 đô la", "mười tám"), bỏ phiếu thất bại. Luôn bắt buộc: "Câu trả lời là [số]."

## Cost Optimization

Với một hệ thống sản xuất xử lý 10,000 truy vấn/ngày ở mức giá GPT-4o ($2.50/1M đầu vào, $10/1M đầu ra):

| Kỹ thuật | Token trung bình/Truy vấn | Chi phí hằng ngày | Độ chính xác |
|-----------|-----------------|------------|----------|
| Zero-shot | ~200 | ~$5 | 78% |
| Few-shot CoT | ~600 | ~$15 | 95% |
| Self-Consistency (N=5) | ~3,000 | ~$75 | 97% |
| ToT (b=3, d=2) | ~6,000 | ~$150 | Phụ thuộc tác vụ |

Chiến lược tối ưu chi phí cho hầu hết ứng dụng: bắt đầu bằng few-shot CoT. Chỉ thêm self-consistency cho các truy vấn có độ tin cậy thấp (mẫu tăng cấp từ phần Build It).

## Integration with Prompt Chaining

Các kỹ thuật suy luận kết hợp với nối chuỗi prompt:

**Bước chuỗi 1** (Trích xuất): zero-shot, temperature 0.0
**Bước chuỗi 2** (Suy luận): few-shot CoT, temperature 0.0
**Bước chuỗi 3** (Xác minh): self-consistency với N=3, temperature 0.7

Chuỗi ba bước này tốn ~3x một lệnh gọi CoT duy nhất nhưng bắt được lỗi trích xuất, lỗi suy luận và cung cấp điểm độ tin cậy từ bước xác minh.

## When to Move Beyond Prompting

Nếu bạn dành nhiều thời gian thiết kế prompt hơn viết mã ứng dụng, cân nhắc:

1. **Fine-tuning**: nếu bạn có 500+ ví dụ gán nhãn và tác vụ hẹp
2. **Biên dịch DSPy**: nếu bạn muốn tối ưu prompt tự động
3. **Framework tác tử**: nếu tác vụ cần dùng công cụ nhiều lượt (Giai đoạn 14)
4. **RAG**: nếu mô hình cần truy cập kiến thức riêng tư/hiện tại (Bài 06-07)

Các kỹ thuật prompting là nền tảng. Chúng hoạt động với mọi mô hình, mọi nhà cung cấp và không cần dữ liệu huấn luyện. Nhưng chúng có giới hạn. Biết khi nào chuyển lên cấp tiếp theo cũng quan trọng như làm chủ chính các kỹ thuật.
