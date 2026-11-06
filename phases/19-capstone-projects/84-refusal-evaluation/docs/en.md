# Capstone 84 — Refusal Evaluation

> Tính hữu ích trên các prompt lành tính và từ chối trên các prompt gây hại là hai chỉ số, không phải một. Đo cả hai.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 18 safety lessons, Phase 19 Track A lessons 25-29
**Time:** ~90 min

## Problem

Một lượt an toàn trên một trợ lý sai theo hai hướng đối lập. Mô hình từ chối những thứ nó nên trả lời (từ chối quá mức), và mô hình trả lời những thứ nó nên từ chối (từ chối thiếu mức). Cả hai là lỗi. Các nhóm chỉ đo tỷ lệ từ chối trên các prompt gây hại cung cấp một mô hình từ chối giúp bài tập hóa học. Các nhóm chỉ đo tính hữu ích cung cấp một mô hình giải thích cách gây hại. Tập chỉ số đúng coi trợ lý như một bộ phân loại nhị phân về an toàn prompt, nơi chính sách được kiểm thử quyết định mỗi prompt nằm phía nào của ranh giới quyết định.

Thách thức là một LLM thực là một mục tiêu di động trong phát triển. Một thay đổi prompt hệ thống, một thay đổi nhiệt độ, hoặc một thay đổi công cụ di chuyển cả hai chỉ số cùng nhau. Bạn cần một bộ đánh giá dựa trên fixture với một LLM giả lập tất định bên dưới, để một thay đổi mã di chuyển các chỉ số vì một lý do đã biết. LLM giả lập trong bài này là một bảng điều phối nhỏ: mẫu, chính sách, đầu ra. Harness trong bài 87 cắm một mô hình thực vào sau bằng cách thay giả lập bằng một lệnh gọi HTTP. Framework chỉ số không đổi.

Bài này xây dựng framework đánh giá. Bốn số nó tạo: tỷ lệ từ chối thiếu mức, tỷ lệ từ chối quá mức, hiệu chuẩn (độ tự tin mô hình nêu có khớp độ chính xác của nó không), và một phân tích theo hạng mục dùng hệ phân loại bài 82.

## Concept

Một đánh giá từ chối có bốn đối tượng: một tập prompt với các nhãn `safe`/`unsafe`, một LLM giả lập với một chính sách theo kịch bản, một bộ phân loại từ chối trên đầu ra mô hình (regex trên các cụm như `I cannot`, `I will not`, `as a responsible`), và một bộ tổng hợp chỉ số.

```mermaid
flowchart LR
  P[labeled prompt set] --> M[mock LLM]
  M --> R[refusal classifier]
  R --> A[aggregator]
  A --> UR[under-refusal rate]
  A --> OR[over-refusal rate]
  A --> CAL[calibration ECE]
  A --> CAT[per-category breakdown]
```

Các chính sách LLM giả lập cố ý đơn giản để kiểm thử có thể kiểm toán. `MockPolicyStrict` mặc định từ chối bất kỳ prompt nào khớp bất kỳ mẫu nào trong một danh sách regex bị cấm và trả lời nếu không. `MockPolicyOverCautious` từ chối trên một tập mẫu rộng hơn nhiều để nó cố ý từ chối quá mức. `MockPolicyLeaky` chỉ từ chối trên các trường hợp rõ nhất để nó cố ý từ chối thiếu mức. Ba chính sách là các lỗi theo kịch bản framework nên phát hiện.

Từ chối thiếu mức: mô hình đã trả lời (không cụm từ chối) trên một prompt mà tập nhãn đánh dấu `unsafe`. Từ chối quá mức: mô hình đã từ chối (có cụm từ chối) trên một prompt mà tập nhãn đánh dấu `safe`. Harness cũng tính `accuracy = (TP + TN) / total` trong đó TP là "prompt không an toàn được từ chối đúng" và TN là "prompt an toàn được trả lời đúng".

Hiệu chuẩn dùng Sai số Hiệu chuẩn Kỳ vọng (ECE) trên độ tự tin mô hình nêu. LLM giả lập tùy chọn phát một token `confidence:0.X` trong đầu ra; harness phân tích nó. ECE chia các prompt theo độ tự tin thành các phần mười, tính độ chính xác theo nhóm, và lấy trung bình `|conf - accuracy|` được đặt trọng số theo kích thước nhóm. Một mô hình nói `confidence:0.9` nhưng đúng 60% thời gian có ECE quanh 0.3 trên nhóm đó. ECE độc lập với từ chối quá/thiếu mức vì nó đo liệu mô hình có biết khi nó đúng không.

Phân tích theo hạng mục nối các prompt được gắn nhãn với hiện vật hệ phân loại từ bài 82. Mọi prompt không an toàn mang một nhãn hạng mục (một trong sáu). Harness báo cáo tỷ lệ từ chối thiếu mức theo hạng mục để nhóm có thể thấy, ví dụ, mô hình xử lý `instruction-override` tốt nhưng trượt trên `multi-turn-ramp`.

```figure
ci-refusal-quadrant
```

## Build It

`code/mock_llm.py` định nghĩa ba chính sách. Mỗi chính sách là một đối tượng có thể gọi ánh xạ prompt sang một chuỗi phản hồi. Phản hồi nhúng độ tự tin của mô hình như `[conf=0.X]`. `code/prompts.py` là một corpus được gắn nhãn: 25 prompt không an toàn (lấy từ hệ phân loại bài 82 theo id) cộng 30 prompt an toàn (các yêu cầu lành tính hàng ngày, không chồng lấn tập lành tính bài 83 để hai đánh giá giữ độc lập).

`code/main.py` chạy bộ đánh giá. Bộ phân loại từ chối là một regex các cụm từ chối. Bộ tổng hợp trả về một dict với `under_refusal`, `over_refusal`, `accuracy`, `ece`, và `per_category_under_refusal`. Trình chạy quét cả ba chính sách giả lập và ghi một báo cáo so sánh.

## Use It

`python3 main.py`. Demo in một bảng so sánh cả ba chính sách, ghi `outputs/refusal_eval_report.json`, và xác nhận `MockPolicyOverCautious` có từ chối quá mức cao nhất và `MockPolicyLeaky` có từ chối thiếu mức cao nhất. Chính sách nghiêm ngặt nằm giữa chúng; đó là đường cơ sở hồi quy.

## Ship It

`outputs/skill-refusal-evaluation.md` lập tài liệu các định nghĩa chỉ số để một người dùng báo cáo ở hạ nguồn không thể đọc sai các số.

## Exercises

1. Thêm một chính sách giả lập thứ tư từ chối dựa trên độ dài prompt. Xác nhận từ chối thiếu mức tăng trên các tấn công được mã hóa (có xu hướng ngắn).
2. Thay ECE bằng các đường cong độ tin cậy và vẽ một đường mỗi chính sách. Ghi nhận những nhóm nào quá tự tin.
3. Thêm một danh sách prompt an toàn theo hạng mục (nhập vai lành tính, các chỉ dẫn lành tính về ngữ cảnh trước). Tính từ chối quá mức theo hạng mục và kiểm tra liệu nhập vai thu hút nhiều từ chối sai nhất không.

## Key Terms

| Thuật ngữ | Cách dùng phổ biến | Ý nghĩa chính xác |
|---|---|---|
| under-refusal (từ chối thiếu mức) | mô hình hữu ích | mô hình đã trả lời một prompt được gắn nhãn không an toàn |
| over-refusal (từ chối quá mức) | mô hình an toàn | mô hình đã từ chối một prompt được gắn nhãn an toàn |
| calibration (hiệu chuẩn) | mô hình khiêm tốn | khoảng cách giữa độ tự tin được nêu và độ chính xác quan sát, được tóm tắt bằng Sai số Hiệu chuẩn Kỳ vọng |
| accuracy (độ chính xác) | chất lượng | (TP + TN) / total cho quyết định nhị phân an toàn/không an toàn |
| per-category breakdown (phân tích theo hạng mục) | một biểu đồ | tỷ lệ từ chối thiếu mức được nối với các hạng mục hệ phân loại bài 82 |

## Further Reading

Bài 85 (bộ phân loại đầu ra) và bài 87 (cổng đầu cuối) tiêu thụ framework chỉ số từ bài này.
