---
id: red-team-range-design
title: A red team range that runs without you
card: safety
kind: design
level: 4
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer, agentic-ai-engineer, forward-deployed-ai-engineer]
rounds: [system-design, design-review]
tags: [red-team, attack-families, over-refusal, cvss, self-critique]
minutes: 15
lessons: [phases/19-capstone-projects/15-constitutional-safety-harness, phases/19-capstone-projects/82-jailbreak-taxonomy, phases/19-capstone-projects/84-refusal-evaluation]
manuals: []
practice: []
cheatsheet: [guardrails-moderation, constitutional-classifiers]
related: [safety/safety-eval-missing-pieces, safety/six-jailbreak-categories]
updated: 2026-11-03
---

Bạn phụ trách an toàn cho một trợ lý hướng tới khách hàng được xây trên một mô hình trọng số mở phía sau một pipeline truy xuất. Thiết kế trường thử red team chạy mà không cần bạn: các họ tấn công, lịch, điều gì được tính là một phát hiện, cách bạn giữ trợ lý hữu ích trong lúc gia cố nó, và cách bạn chứng minh một can thiệp ở thời điểm huấn luyện đã giúp ích.

## Short answer

Lên lịch ít nhất sáu họ tấn công trên các hàng đợi riêng: tìm kiếm jailbreak tự động, các cuộc tấn công tìm kiếm cây, các cuộc tấn công hậu tố gradient, các cuộc tấn công mã hóa, các cuộc tấn công persona nhiều lượt và chuyển đổi mã ngôn ngữ giữa các ngôn ngữ, mỗi họ báo cáo một tỷ lệ thành công. Mọi thành công trở thành một phát hiện với một id phân loại, một điểm nghiêm trọng và một thời hạn công bố. Theo dõi từ chối quá mức trên một bộ dò lành tính cạnh tỷ lệ chặn để đánh đổi nằm trên một biểu đồ, và chứng minh một can thiệp tự phê bình bằng một chênh lệch vô hại trước và sau trên một tập giữ lại.

## Full answer

### The target and its layers

Trợ lý nằm trong một pipeline nhiều lớp: làm sạch đầu vào loại các ký tự zero width và giải mã các dạng mã hóa phổ biến, các rào chính sách, một cổng bộ phân loại, mô hình, một bộ lọc đầu ra với làm sạch dữ liệu cá nhân, và một tầng con người xem xét các đầu ra bị đánh dấu. Trường thử tấn công toàn bộ ngăn xếp, không phải mô hình trần, vì ngăn xếp là thứ người dùng tiếp cận.

### The attack families

| Họ | Nó làm gì |
|---|---|
| tìm kiếm jailbreak tự động | một mô hình tấn công viết lại các prompt cho đến khi một prompt thành công |
| các cuộc tấn công tìm kiếm cây | cùng tìm kiếm với phân nhánh và cắt tỉa |
| các cuộc tấn công hậu tố gradient | các hậu tố đối kháng được tối ưu theo một mô hình trọng số mở |
| các cuộc tấn công mã hóa | base64, rot13 và các thủ thuật ký tự chống bộ làm sạch |
| persona nhiều lượt | các lượt làm nóng, rồi một persona và một quá trình tăng dần |
| chuyển đổi mã ngôn ngữ | trộn các ngôn ngữ để lọt qua một bộ phân loại tiếng Anh |

Báo cáo một tỷ lệ thành công theo từng họ. Lần chạy ví dụ của capstone cho thấy 7 thành công trong 50 lần thử, tỷ lệ 14 phần trăm, với một lần vượt qua bằng nhập vai được chấm mức trung bình 4.8. Một pipeline truy xuất thêm một họ thứ bảy mà capstone đặt ra như một bài tập: injection gián tiếp qua các tài liệu truy xuất, với biện pháp phòng vệ thêm riêng.

### The finding record

Một bản ghi có cấu trúc với id phân loại, họ tấn công, một mức nghiêm trọng trên thang lỗ hổng tiêu chuẩn từ vector tấn công, độ phức tạp và tác động, thời hạn công bố và một kế hoạch giảm thiểu. Các phát hiện được ghi vào một hàng đợi. Một ảnh chụp màn hình không phải một phát hiện.

### Staying helpful

Chạy một bộ dò lành tính theo cùng lịch và theo dõi tỷ lệ từ chối quá mức. Cảnh báo khi suy giảm. Chấm bộ kiểm thử theo đánh đổi, tỷ lệ chặn so với tỷ lệ lành tính được cho qua, để một lợi ích ở một phía đánh đổi phía kia được hiển thị. Cân nhắc một chế độ từ chối kèm giúp đỡ và đo tác động của nó trên bộ lành tính.

### Proving the intervention

Tuyển chọn khoảng một nghìn prompt nỗ lực có hại. Mô hình soạn nháp, một bộ phê bình chấm bản nháp theo một hiến pháp viết ra, các bản nháp không đạt được viết lại, và mô hình được fine-tune trên các cặp đã cải thiện. Đo tính vô hại trước và sau trên một đánh giá giữ lại, cạnh tỷ lệ lành tính được cho qua trước và sau. Capstone đặt trọng số chênh lệch này ở 20 trên 100 điểm, với độ bao phủ sáu họ trở lên trong hai ngôn ngữ trở lên ở 25, đánh đổi ở 20, tài liệu ở 20 và tự động hóa ở 15.

## Follow-ups

- **Level 3:** Tại sao mỗi họ tấn công chạy trên hàng đợi riêng? Expected: các bộ điều khiển khác nhau về chi phí và thời gian chạy, nên một cuộc tấn công gradient chậm không được chặn lượt quét mã hóa rẻ, và các tỷ lệ theo từng họ cần các lần chạy theo từng họ.
- **Level 4:** Pipeline truy xuất thêm họ nào mà sáu họ không bao phủ? Expected: injection gián tiếp qua các tài liệu truy xuất, được đo như một họ thứ bảy với biện pháp phòng vệ thêm riêng.
- **Level 4:** Bạn cho thấy huấn luyện tự phê bình đã giúp thay vì nâng các lần từ chối bằng cách nào? Expected: chênh lệch vô hại trên một đánh giá giữ lại cạnh tỷ lệ lành tính được cho qua trước và sau; một lợi ích đi kèm sụt giảm lành tính là từ chối quá mức, không phải an toàn.

## Wrong answers

- "Chạy red team một lần trước ra mắt." Các cuộc tấn công tiến hóa; trường thử chạy theo lịch và các phát hiện đi vào sprint tiếp theo.
- "Tỷ lệ chặn là chỉ số." Tỷ lệ chặn so với tỷ lệ lành tính được cho qua là chỉ số; một mô hình chặn mọi thứ có tỷ lệ chặn hoàn hảo.
- "Một phát hiện là một ảnh chụp màn hình đầu ra xấu." Một phát hiện mang một id phân loại, một điểm nghiêm trọng, một thời hạn và một biện pháp giảm thiểu, nếu không không ai có thể hành động theo nó.

## Taught in

[Capstone bộ kiểm thử an toàn hiến pháp](../../../phases/19-capstone-projects/15-constitutional-safety-harness/) đặt ra các lớp, các họ tấn công, cách chấm và chênh lệch tự phê bình, [capstone phân loại jailbreak](../../../phases/19-capstone-projects/82-jailbreak-taxonomy/) cung cấp các id mà phát hiện tham chiếu, và [capstone đánh giá từ chối](../../../phases/19-capstone-projects/84-refusal-evaluation/) định nghĩa tỷ lệ từ chối quá mức.
