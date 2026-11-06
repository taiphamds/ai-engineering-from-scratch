---
name: prompt-reward-model-designer
description: Design reward model training pipelines for RLHF alignment
version: 1.0.0
phase: 10
lesson: 7
tags: [rlhf, reward-model, ppo, alignment, human-feedback, preference-learning]
---

# Reward Model Designer

Khi xây một pipeline RLHF để căn chỉnh mô hình ngôn ngữ về hành vi mục tiêu (hữu ích, khả năng lập trình, an toàn, trung thực), dùng khung này để thiết kế quy trình thu thập dữ liệu, huấn luyện mô hình phần thưởng và cấu hình PPO.

## Input Requirements

Cung cấp:
- **Hành vi mục tiêu** (ví dụ "trợ lý hữu ích và vô hại", "chuyên gia lập trình Python", "Hỏi đáp y tế với an toàn")
- **Mô hình cơ sở** (ví dụ Llama 3 8B sau SFT, Mistral 7B Chat)
- **Kích thước mô hình phần thưởng** (thường cùng kích thước hoặc lớn hơn mô hình chính sách)
- **Ngân sách chú giải** (giờ con người hoặc cặp so sánh sẵn có)
- **Ngân sách tính toán** (giờ GPU cho huấn luyện mô hình phần thưởng + PPO)

## Step 1: Preference Data Collection

### Annotation Protocol

1. **Chọn prompt**: Lấy mẫu từ phân phối huấn luyện SFT cộng prompt ngoài phân phối (10-20% mới)
2. **Sinh phản hồi**: Sinh 2-4 phản hồi mỗi prompt bằng mô hình SFT với temperature khác nhau (0.3, 0.7, 1.0)
3. **Định dạng so sánh**: Cho người chú giải xem đúng 2 phản hồi và hỏi "Phản hồi nào tốt hơn?"
4. **Rubric tiêu chí**: Định nghĩa "tốt hơn" nghĩa là gì cho trường hợp sử dụng

### Rubric Template

| Tiêu chí | Trọng số | Mô tả |
|-----------|--------|-------------|
| Hữu ích | 40% | Nó có trả lời câu hỏi đầy đủ và đúng không? |
| Vô hại | 25% | Nó có tránh nội dung có hại, thiên lệch hoặc gây hiểu lầm không? |
| Trung thực | 20% | Nó có thừa nhận bất định thay vì ảo giác không? |
| Súc tích | 15% | Phản hồi có độ dài phù hợp với câu hỏi không? |

Điều chỉnh trọng số cho trường hợp sử dụng. Một trợ lý lập trình có thể đặt trọng số tính đúng đắn 60% và súc tích 20%.

### Data Size Guidelines

| Quy mô | Cặp so sánh | Giờ chú giải | Độ chính xác RM kỳ vọng |
|-------|-----------------|-----------------|---------------------|
| Tối thiểu khả dụng | 5,000-10,000 | 400-800 | 60-65% |
| Sản xuất v1 | 20,000-50,000 | 1,600-4,000 | 65-72% |
| Sản xuất v2 | 100,000-500,000 | 8,000-40,000 | 72-78% |

InstructGPT dùng 33,000 so sánh từ 40 nhà thầu. Bài báo ban đầu của Anthropic dùng 22,000 từ 20 người chú giải. Độ đồng thuận giữa người chú giải thường là 70-75% -- mô hình phần thưởng không thể vượt mức đồng thuận con người.

### Quality Control

- **Lọc đồng thuận**: Bỏ cặp có dưới 70% người chú giải đồng ý
- **Hiệu chuẩn người chú giải**: Chạy các vòng hiệu chuẩn với cặp đã biết tốt trước chú giải thực
- **Phát hiện thiên lệch**: Theo dõi xem người chú giải có luôn ưa phản hồi dài hơn, ngôn ngữ trang trọng hoặc các mẫu cụ thể không
- **Ví dụ đối kháng**: Bao gồm 5-10% ví dụ thiết kế để bắt người chú giải không đọc cẩn thận

## Step 2: Reward Model Architecture

### Architecture Decisions

| Quyết định | Đề xuất | Lý do |
|----------|---------------|-----------|
| Kiến trúc cơ sở | Cùng transformer như chính sách | Khởi tạo trọng số từ checkpoint SFT cho đặc trưng khởi đầu mạnh |
| Head đầu ra | Một phép chiếu tuyến tính từ trạng thái ẩn cuối | Phần thưởng vô hướng từ biểu diễn vị trí đầy đủ nhất |
| Kích thước mô hình | >= kích thước mô hình chính sách | RM nhỏ hơn tạo tín hiệu không đáng tin làm mất ổn định PPO |
| Khởi tạo | Checkpoint SFT với head đầu ra mới | Đặc trưng được huấn luyện trước đã nắm chất lượng ngôn ngữ |

### Training Configuration

| Tham số | Phạm vi | Ghi chú |
|-----------|-------|-------|
| Tốc độ học | 1e-5 đến 5e-5 | Thấp hơn SFT vì tác vụ đơn giản hơn |
| Epoch | 1-3 | Overfit là rủi ro lớn với dữ liệu so sánh hạn chế |
| Kích thước batch | 64-256 | Mỗi "ví dụ" là một cặp, nên dữ liệu hiệu dụng là 2x |
| Hàm mất mát | Bradley-Terry: -log(sigmoid(r_preferred - r_rejected)) | Tiêu chuẩn cho so sánh theo cặp |
| Phần chia xác thực | 10-20% | Theo dõi độ chính xác trên cặp giữ lại |

### Evaluation Metrics

1. **Độ chính xác theo cặp**: RM xếp hạng đúng bao nhiêu phần cặp sở thích giữ lại? Mục tiêu: > 65%
2. **Phân phối biên**: Vẽ phân phối (r_preferred - r_rejected). Nên tập trung trên 0 với ít giá trị âm.
3. **Hiệu chuẩn**: sigmoid(r_preferred - r_rejected) có gần xác suất sở thích con người thực tế không?
4. **Khái quát hóa OOD**: Kiểm thử trên prompt từ phân phối khác huấn luyện. Độ chính xác nên giảm < 10%.

## Step 3: PPO Configuration

### Hyperparameters

| Tham số | Giá trị điển hình | Tác động khi quá cao | Tác động khi quá thấp |
|-----------|--------------|-------------------------|------------------------|
| Hệ số KL (beta) | 0.01-0.05 | Mô hình hầu như không học, ở quá gần SFT | Reward hacking, đầu ra suy biến |
| Tốc độ học | 5e-6 đến 3e-5 | Huấn luyện bất ổn, phân kỳ | Hội tụ chậm, lãng phí tính toán |
| Tỷ số cắt (epsilon) | 0.1-0.3 | Cập nhật lớn, có thể gây mất ổn định | Cập nhật rất bảo thủ, học chậm |
| Epoch PPO mỗi batch | 1-4 | Overfit batch hiện tại | Sử dụng chưa hết mỗi batch |
| Kích thước batch sinh | 128-512 | Vấn đề bộ nhớ | Ước lượng gradient nhiều nhiễu |
| Độ dài phản hồi tối đa | 256-1024 | Sinh chậm, vấn đề bộ nhớ | Cắt ngắn phản hồi hữu ích |

### Monitoring Dashboard

Theo dõi các thước đo này trong huấn luyện PPO:

1. **Phần thưởng trung bình**: Nên tăng qua huấn luyện. Chững lại là được; giảm nghĩa là bất ổn.
2. **Phân kỳ KL**: Nên giữ dưới 10-20 nat. Tăng vọt = reward hacking.
3. **Độ dài phản hồi**: Nên giữ ổn định. Tăng đơn điệu = reward hacking dài dòng.
4. **Entropy**: Entropy phân phối token nên giảm chậm. Giảm nhanh = sụp đổ mode.
5. **Đồng thuận mô hình phần thưởng**: Chấm phản hồi PPO bằng mô hình phần thưởng; đồng thuận nên cải thiện.

### Red Flags During PPO

| Triệu chứng | Nguyên nhân có thể | Cách khắc phục |
|---------|-------------|-----|
| Phần thưởng tăng nhưng đầu ra giảm chất lượng | Reward hacking | Tăng hệ số KL, huấn luyện lại RM trên ví dụ đối kháng |
| Phân kỳ KL bùng nổ | Tốc độ học quá cao hoặc hệ số KL quá thấp | Giảm lr, tăng beta |
| Độ dài phản hồi tăng đơn điệu | RM thưởng dài dòng | Thêm phạt độ dài vào phần thưởng, huấn luyện lại RM với cặp được kiểm soát độ dài |
| Mọi phản hồi thành giống hệt | Sụp đổ mode | Tăng temperature sinh, giảm epoch PPO |
| Phần thưởng dao động mạnh | PPO bất ổn | Giảm tốc độ học, tăng tỷ số cắt |

## Step 4: End-to-End Validation

Trước khi triển khai mô hình được huấn luyện RLHF:

1. **Kiểm thử A/B so với SFT**: Chạy mô hình SFT và RLHF trên 200+ prompt kiểm thử. Có 3+ người đánh giá so sánh phản hồi. Mô hình RLHF nên thắng > 60% trường hợp.
2. **Đánh giá an toàn**: Kiểm thử trên prompt đối kháng đã biết (jailbreak, yêu cầu có hại). Mô hình RLHF nên từ chối phù hợp.
3. **Kiểm tra hồi quy**: Chạy benchmark tiêu chuẩn (MMLU, HumanEval, MT-Bench) để xác nhận mô hình RLHF chưa mất năng lực cốt lõi.
4. **Kiểm tra quên**: Đo perplexity trên một corpus văn bản tổng quát. Mức tăng nên < 10% so với mô hình SFT.
5. **Phân tích độ dài**: So sánh độ dài phản hồi trung bình giữa mô hình SFT và RLHF. Nếu RLHF dài hơn > 50%, mô hình phần thưởng có thể có thiên lệch dài dòng.
