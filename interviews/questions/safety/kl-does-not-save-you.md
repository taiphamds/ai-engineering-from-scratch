---
id: kl-does-not-save-you
title: The KL penalty bounds the drift, not the hack
card: safety
kind: concept
level: 3
roles: [ai-evaluation-reliability-engineer, applied-ai-engineer]
rounds: [ml-depth]
tags: [reward-hacking, kl-penalty, catastrophic-goodhart, heavy-tails]
minutes: 9
lessons: [phases/18-ethics-safety-alignment/02-reward-hacking-goodhart]
manuals: []
practice: []
cheatsheet: [ai-safety, rlhf-dpo]
related: [safety/goodhart-over-optimization-curve, safety/four-costumes-one-mechanism]
updated: 2026-11-03
---

Một đồng nghiệp lập luận rằng reward hacking bị chặn trong pipeline của họ vì policy huấn luyện với một hình phạt KL so với mô hình tham chiếu, nên nó không thể trôi xa. Tại sao lập luận đó chưa đầy đủ, và dưới điều kiện nào nó thất bại hoàn toàn?

## Short answer

Hình phạt KL ràng buộc phân phối của policy di chuyển bao xa, không ràng buộc nó di chuyển về các mode nào. Đường cong tối ưu hóa quá mức đã cho thấy một hình phạt KL làm dịu sự sụp đổ của phần thưởng chuẩn mà không ngăn nó. Khi sai số của proxy có đuôi nặng, tồn tại các đầu vào hiếm nhưng tiếp cận được nơi proxy trừ chuẩn không bị chặn, và một policy tối ưu bị ràng buộc KL có thể đặt khối xác suất vào chúng: phần thưởng proxy cao tùy ý, phần thưởng chuẩn ở baseline.

## Full answer

### What the penalty buys

Với một hạng KL, đường cong chuẩn vẫn tăng, đạt đỉnh và giảm khi policy rời tham chiếu. Hình phạt làm độ dốc dịu hơn và một proxy tốt hơn đẩy đỉnh ra xa. Không điều nào thay đổi hình dạng.

### Catastrophic Goodhart

Giả sử sai số của proxy có đuôi nặng: ở đâu đó dưới mô hình tham chiếu có các đầu vào mà proxy yêu thích nhiều hơn phần thưởng chuẩn. Ràng buộc KL giới hạn tổng khoảng cách giữa policy và tham chiếu. Nó không ngăn policy tập trung khoảng cách được cho phép đó vào đúng các đầu vào ấy, vì chúng đã có support dưới tham chiếu. Kết quả là một policy có điểm cao tùy ý trên proxy và không tốt hơn baseline trên chuẩn.

### Why the condition is plausible

Một mô hình phần thưởng là một phép đo bị chặn của một thế giới không bị chặn. Bài học lập luận rằng một phép đo như vậy có sai số đuôi nặng ở các đuôi, nên giả định không lạ. Nó vẫn là một giả định: với mỗi proxy, đo đuôi của khoảng cách proxy tới chuẩn trên các nhãn giữ lại trước khi dựa vào một ngân sách KL.

### What helps, partially

- Một ensemble mô hình phần thưởng với tổng hợp trường hợp xấu nhất: bộ tối ưu có thể tìm sai số đuôi của một mô hình, nhưng mức tối thiểu trên nhiều mô hình chỉ trả tiền ở nơi tất cả cùng sai.
- Các mô hình phần thưởng được huấn luyện để vững trước dịch chuyển trong phân phối đầu ra.
- Các lịch KL thận trọng và dừng sớm tại khoảng cách proxy tới chuẩn đã đo.
- Không thứ gì từ họ sở thích trực tiếp được miễn; các loss đó có định luật tỷ lệ riêng cho tối ưu hóa quá mức.

## Follow-ups

- **Level 3:** Một hình phạt KL ràng buộc gì, và để tự do điều gì? Expected: khoảng cách của phân phối policy so với tham chiếu; các mode phần thưởng cao nào dưới tham chiếu mà policy tập trung vào.
- **Level 3:** Nhiều mô hình phần thưởng có thể làm điều một mô hình với hình phạt không thể bằng cách nào? Expected: bộ tối ưu có thể tìm sai số đuôi của một mô hình phần thưởng, nhưng mức tối thiểu trên nhiều mô hình chỉ trả tiền ở nơi tất cả cùng sai.
- **Level 4:** Chuyển sang một loss sở thích trực tiếp có loại bỏ vấn đề không? Expected: không; họ alignment trực tiếp có định luật tỷ lệ riêng cho tối ưu hóa quá mức, nên cùng việc giám sát được áp dụng.
- **Level 4:** Biến điều này thành một quy tắc vận hành cho một lần huấn luyện. Expected: vẽ phần thưởng chuẩn theo khoảng cách KL với các nhãn giữ lại, dừng tại đỉnh thực nghiệm, và xem proxy tăng với chuẩn phẳng là báo động bất kể hệ số KL.

## Wrong answers

- "KL nhỏ nghĩa là reward hacking nhỏ." KL chặn sự trôi dạt, không chặn hướng của nó; policy có thể tiêu ngân sách vào các sai số đuôi của proxy.
- "Đuôi nặng là một giả định lạ." Bài học lập luận chúng là bình thường đối với một mô hình phần thưởng bị chặn; đo khoảng cách proxy tới chuẩn thay vì giả định đuôi nhẹ.
- "Dùng loss sở thích trực tiếp, nó không có mô hình phần thưởng." Nó có một mô hình ngầm định và đường cong tối ưu hóa quá mức riêng.

## Taught in

[Bài học về reward hacking và định luật Goodhart](../../../phases/18-ethics-safety-alignment/02-reward-hacking-goodhart/) giải thích Catastrophic Goodhart và tại sao chỉ regularization KL thất bại.
