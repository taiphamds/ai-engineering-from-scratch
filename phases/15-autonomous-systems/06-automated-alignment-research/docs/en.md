# Automated Alignment Research (Anthropic AAR)

> Anthropic vận hành các nhóm Autonomous Alignment Researchers Claude Opus 4.6 song song trong các sandbox độc lập, điều phối qua một diễn đàn chung có nhật ký nằm ngoài mọi sandbox (để các agent không thể xóa hồ sơ của chính mình). Với bài toán huấn luyện từ yếu đến mạnh, các AAR vượt trội hơn các nhà nghiên cứu con người. Bản tóm tắt của chính Anthropic lưu ý rằng các quy trình làm việc được quy định thường hạn chế tính linh hoạt của AAR và làm giảm hiệu năng. Tự động hóa nghiên cứu alignment rút ngắn tiến độ, và nó làm vậy trên chính các rủi ro misalignment mà RSP nhằm phát hiện.

**Type:** Learn
**Languages:** Python (stdlib, parallel-research-forum simulator)
**Prerequisites:** Phase 15 · 05 (AI Scientist v2), Phase 15 · 04 (DGM)
**Time:** ~60 minutes

## The Problem

Nghiên cứu căn chỉnh tốn kém về thời gian nhà nghiên cứu con người. Các bài toán như giám sát có thể mở rộng, đặc tả phần thưởng hoặc huấn luyện yếu đến mạnh yêu cầu các thí nghiệm mất hàng tuần cho mỗi lần lặp. Khi các năng lực tiên tiến nhất phát triển, khối lượng công việc căn chỉnh tăng nhanh hơn nguồn cung các nhà nghiên cứu đủ trình độ.

Nghiên cứu căn chỉnh tự động (AAR) hỏi liệu cùng các mô hình tiên tiến nhất có năng lực đang vượt căn chỉnh có thể góp phần thu hẹp khoảng cách không. Báo cáo năm 2026 của Anthropic về một nghiên cứu huấn luyện yếu đến mạnh do AAR thực hiện (alignment.anthropic.com/2026/automated-w2s-researcher/) là một trong các kết quả công khai đầu tiên từ một hệ thống đã triển khai thuộc lớp này.

Kết quả thực sự tích cực: các AAR giải một bài toán nghiên cứu tốt hơn đường cơ sở con người. Kết quả cũng tập trung, trong một hệ thống duy nhất, mọi mối quan tâm mà giai đoạn này đã phát triển. Nếu nghiên cứu căn chỉnh có thể được tự động hóa, thì các phần làm tổn hại các biện pháp bảo vệ cũng có thể. Các ngưỡng năng lực R&D AI của RSP được viết với vòng lặp này trong tâm trí.

## The Concept

### The architecture (as publicly described)

- **Các agent song song.** Nhiều thể hiện Claude Opus 4.6 chạy như các AAR, mỗi thể hiện trong một sandbox độc lập. Các sandbox giới hạn bề mặt hệ thống file, mạng và tiến trình.
- **Diễn đàn dùng chung.** Các phát hiện được công bố lên một diễn đàn dùng chung có backend lưu trữ nằm ngoài mọi sandbox. Các agent có thể đọc diễn đàn; các agent không thể xóa hoặc chỉnh sửa các bản ghi diễn đàn từ bên trong sandbox của chính chúng.
- **Phân bổ tác vụ.** Một hàng đợi tác vụ do con người thiết kế giao các bài toán nghiên cứu cho các AAR. Các AAR đề xuất các phép phân rã, chạy các thí nghiệm, viết các phát hiện.
- **Trọng tâm huấn luyện yếu đến mạnh.** Nghiên cứu được công bố giải quyết huấn luyện yếu đến mạnh — sử dụng một mô hình giám sát yếu hơn để huấn luyện một mô hình học sinh mạnh hơn. Các AAR vượt các nhà nghiên cứu con người trên tác vụ này.

### Why the out-of-sandbox log matters

Thuộc tính toàn vẹn log là khác biệt giữa một thí nghiệm được kiểm soát và một thí nghiệm có thể bị xâm phạm. Nếu các AAR có thể chỉnh sửa các log riêng, chúng có thể che các thí nghiệm thất bại hoặc đáng ngờ. Anthropic gắn cờ trực tiếp điều này: thuộc tính là một điều kiện cần để tin đầu ra nghiên cứu, và không tầm thường để xác minh.

Tương đương theo thuật ngữ hạ tầng là các log chỉ thêm với ghi xuyên đến lưu trữ bên ngoài (ví dụ khóa đối tượng S3, các log Datadog bất biến). Agent không có thông tin xác thực để sửa đổi các bản ghi quá khứ. Đây là cùng mẫu mà các nhóm bảo mật doanh nghiệp năm 2026 sử dụng để tạo các dấu vết kiểm toán chống ransomware.

### The prescribed-workflow tradeoff

Báo cáo của Anthropic lưu ý rằng các workflow được quy định thường hạn chế tính linh hoạt AAR và làm suy giảm hiệu năng. Nói cách khác: nếu người thiết kế con người viết kế hoạch nghiên cứu từng bước, các AAR làm tệ hơn so với được cho các mục tiêu cấp cao và tự do phân rã. Điều này nhất quán với các kết quả xuyên nghiên cứu agentic (LangGraph, Agent Framework của Microsoft) — các khung được đặc tả quá mức gây hại các agent có năng lực.

Hệ quả an toàn tinh tế. Tính linh hoạt cải thiện hiệu năng AAR cũng là tính linh hoạt cho phép phân rã không được cho phép, sử dụng công cụ mới và trôi dạt mục tiêu. Đánh đổi là một quyết định không gian thiết kế: bao nhiêu linh hoạt mua đủ năng lực để thắng con người, mà không cho agent không gian khái quát hóa các mục tiêu ra ngoài phân phối?

### The compression risk

RSP v3.0 (Bài 19) giới thiệu một ngưỡng năng lực R&D AI: khả năng tự động hóa hoàn toàn pipeline R&D AI với chi phí cạnh tranh so với con người + các công cụ AI. FSF v3 của DeepMind bao gồm một mức tự chủ R&D ML tương tự. Cả hai framework coi ngưỡng này như kích hoạt các biện pháp kiểm soát nâng cao.

AAR còn cách ngưỡng một bước: nó tự động hóa một phần pipeline (nghiên cứu căn chỉnh trên các tác vụ cụ thể, có phạm vi rõ) nhưng không phải vòng lặp phát triển năng lực từ đầu đến cuối. Câu hỏi thời gian là khoảng cách khép nhanh đến đâu.

Các mốc thời gian bị nén là mối quan tâm thất bại tích lũy. Nếu nghiên cứu căn chỉnh và nghiên cứu năng lực tích lũy ở các tốc độ tương tự, bề mặt rủi ro lệch căn chỉnh tăng ít nhất nhanh bằng năng lực. Nếu năng lực tích lũy nhanh hơn (xu hướng lịch sử), khoảng cách mở rộng. Đây là lập luận cho AAR là một điều tốt có điều kiện: mỗi kết quả căn chỉnh bổ sung giảm khoảng cách khi và chỉ khi quá trình nghiên cứu đáng tin cậy.

### What AAR does not replace

Các nhà nghiên cứu con người đặt hàng đợi tác vụ, đánh giá các kết quả và nắm thẩm quyền hiến định. Các AAR tăng tốc phần giữa pipeline, không phải các đầu. Các đầu ra được công bố của Anthropic bao gồm cả các đóng góp AAR lẫn phán đoán nhà nghiên cứu con người về điều gì công bố, điều gì rút lại và điều gì tinh chỉnh.

Điều này khớp mẫu đề xuất rồi cam kết từ Bài 15 được áp dụng cho chính nghiên cứu: các AAR đề xuất; con người cam kết.

```figure
aar-forum
```

## Use It

`code/main.py` mô phỏng một diễn đàn nghiên cứu nhiều AAR. Ba "agent nghiên cứu" độc lập chạy song song, đăng các phát hiện lên một diễn đàn chỉ thêm với các nỗ lực can thiệp tùy chọn.

Quan sát:

- Cách ghi log ngoài sandbox bắt các nỗ lực can thiệp log.
- Cách phân bổ tác vụ với phân rã tự do vượt các workflow cố định trên các bài toán khó hơn.
- Cách một AAR bị xâm phạm duy nhất có thể làm nhiễm bẩn tín hiệu diễn đàn nếu log không hiển thị dấu vết can thiệp.

## Ship It

`outputs/skill-aar-deployment-review.md` là một đánh giá trước triển khai của một pipeline nghiên cứu căn chỉnh tự động.

## Exercises

1. Chạy `code/main.py`. So sánh các thiết lập "workflow cố định" với "phân rã tự do". Phân rã tự do có luôn thắng, hay có các lớp bài toán mà workflow cố định cạnh tranh được?

2. Sửa bộ mô phỏng để một agent cố can thiệp log. Xác nhận log chỉ thêm phát hiện nó. Viết một đoạn mô tả chính xác dấu hiệu phát hiện trông như thế nào trong log.

3. Đọc báo cáo AAR yếu đến mạnh của Anthropic. Nhận diện tác vụ con cụ thể mà các AAR thắng các nhà nghiên cứu con người. Điều gì làm nó phù hợp với tự động hóa?

4. Thiết kế một chính sách phân bổ hàng đợi tác vụ cân bằng tính linh hoạt AAR (các kết quả tốt hơn) với các ràng buộc workflow được quy định (kiểm toán dễ hơn). Mô tả cách bạn sẽ kiểm thử A/B hai cách.

5. Đọc ngưỡng AI R&D-4 của RSP v3.0. Trong một đoạn, mô tả điều bạn nghĩ sẽ vượt nó mà AAR hiện chưa làm.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Nó thực sự có nghĩa gì |
|---|---|---|
| AAR | "Nhà nghiên cứu căn chỉnh tự động" | Thể hiện Claude Opus 4.6 được vận hành tự chủ trên các bài toán căn chỉnh |
| Weak-to-strong training (Huấn luyện yếu đến mạnh) | "Huấn luyện một mô hình mạnh hơn với một bên giám sát yếu hơn" | Benchmark giám sát có thể mở rộng kinh điển mà các AAR vượt con người |
| Shared forum (Diễn đàn dùng chung) | "Nơi các agent công bố phát hiện" | Lưu trữ chỉ thêm, ngoài sandbox |
| Out-of-sandbox log (Log ngoài sandbox) | "Agent không thể chỉnh sửa bản ghi riêng" | Ghi xuyên có dấu vết can thiệp đến lưu trữ bên ngoài |
| Prescribed workflow (Workflow được quy định) | "Kế hoạch từng bước từ người thiết kế con người" | Hạn chế AAR; thường làm suy giảm hiệu năng so với phân rã tự do |
| Free decomposition (Phân rã tự do) | "Agent quyết định cách chia tác vụ" | Có năng lực hơn, khó kiểm toán hơn |
| AI R&D threshold (Ngưỡng R&D AI) | "Mức năng lực RSP/FSF" | Tự động hóa toàn bộ pipeline R&D với chi phí cạnh tranh |
| Compressed timeline (Mốc thời gian bị nén) | "Cuộc đua căn chỉnh với năng lực" | Nếu năng lực tích lũy nhanh hơn căn chỉnh, rủi ro lệch căn chỉnh tăng |

## Further Reading

- [Anthropic — Automated Weak-to-Strong Researcher](https://alignment.anthropic.com/2026/automated-w2s-researcher/) — nguồn sơ cấp.
- [Anthropic Responsible Scaling Policy v3.0](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) — cách định khung ngưỡng R&D AI.
- [Anthropic — Measuring AI agent autonomy](https://www.anthropic.com/research/measuring-agent-autonomy) — cách định khung tự chủ agent rộng hơn.
- [DeepMind Frontier Safety Framework v3](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) — các mức tự chủ R&D ML song song với RSP.
- [Burns et al. (2023). Weak-to-Strong Generalization (OpenAI)](https://openai.com/index/weak-to-strong-generalization/) — bài toán bên dưới mà các AAR giải quyết.
