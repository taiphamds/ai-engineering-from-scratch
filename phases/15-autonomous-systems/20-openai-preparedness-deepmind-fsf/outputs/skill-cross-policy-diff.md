---
name: cross-policy-diff
description: Produce a cross-policy comparison for a specific capability using the OpenAI Preparedness Framework v2, Anthropic RSP v3.0, and DeepMind FSF v3 as reference.
version: 1.0.0
phase: 15
lesson: 20
tags: [preparedness-framework, fsf, rsp, cross-policy, scaling-policy]
---

Với một năng lực tiên tiến nhất cụ thể (ví dụ: “tự chủ tầm xa”, “tự sao chép và thích nghi”, “tự động hóa R&D”), tạo một bản so sánh khác biệt xuyên chính sách cho thấy cách mỗi khung trong ba khung phân loại năng lực và các biện pháp giảm thiểu nào kích hoạt.

Tạo ra:

1. **Phân loại OpenAI PF v2.** Được theo dõi hoặc Nghiên cứu. Nếu Được theo dõi, nêu các tác nhân kích hoạt Báo cáo năng lực + biện pháp bảo vệ. Nếu Nghiên cứu, lưu ý ngôn ngữ chính sách là các biện pháp giảm thiểu “tiềm năng”.
2. **Phân loại Anthropic RSP v3.0.** Ngưỡng nào (ASL-3, AI R&D-4, điều cấm mã hóa cứng)? Biện pháp giảm thiểu nào (lập luận khẳng định, bảo mật + triển khai)? Xác nhận liệu cam kết nằm trong tầng đơn phương của Anthropic hay tầng khuyến nghị cho ngành.
3. **Phân loại DeepMind FSF v3.** Lĩnh vực nào (CBRN, Cyber, Harmful Manipulation, ML R&D)? CCL hoặc Tracked Capability Level nào? Giám sát deceptive alignment có được kích hoạt không?
4. **Tóm tắt hội tụ.** Ba chính sách có đồng ý về mức độ nghiêm trọng của năng lực hay có bất đồng đáng kể? Phân loại nào nghiêm ngặt nhất, phân loại nào ít nhất?
5. **Sự phụ thuộc vào phép đo.** Mọi phân loại phụ thuộc vào phép đo năng lực. Nêu cách năng lực được đo và nhà cung cấp đánh giá nào (METR, Apollo, nội bộ, bên thứ ba) sở hữu phép đo đó.

Các trường hợp loại bỏ dứt khoát:
- Các tuyên bố căn chỉnh xuyên chính sách dựa trên sự giống nhau về ngôn ngữ thông báo mà không có bằng chứng ở cấp tài liệu.
- Bất kỳ phân loại nào không thể chỉ tới một điều khoản cụ thể trong tài liệu nguồn.
- Coi “Danh mục nghiên cứu” (OpenAI) tương đương với “Danh mục được theo dõi” — chúng có các hệ quả vận hành khác nhau.

Các quy tắc từ chối:
- Nếu người dùng không thể cung cấp các đoạn tài liệu nguồn cho mỗi phân loại, hãy từ chối và yêu cầu trích dẫn trước.
- Nếu người dùng coi sự tồn tại chính sách là bằng chứng về giảm thiểu trong thực tế, hãy từ chối và yêu cầu bằng chứng các biện pháp giảm thiểu cụ thể đang kích hoạt.
- Nếu năng lực được tuyên bố là “được bao phủ” bởi một khung nhưng từ đó không xuất hiện trong tài liệu, hãy từ chối và yêu cầu một tham chiếu điều khoản cụ thể.

Định dạng đầu ra:

Trả về một tài liệu so sánh khác biệt với:
- **Định nghĩa năng lực** (một câu)
- **Hàng OpenAI PF v2** (phân loại, tác nhân kích hoạt, điều khoản nguồn)
- **Hàng Anthropic RSP v3.0** (phân loại, tác nhân kích hoạt, đơn phương so với khuyến nghị)
- **Hàng DeepMind FSF v3** (lĩnh vực, CCL / TCL, sự tham gia của căn chỉnh lừa dối)
- **Tóm tắt hội tụ** (đồng ý + bất đồng đáng kể)
- **Quyền sở hữu phép đo** (nhà cung cấp đánh giá, nhịp đánh giá)
- **Khuyến nghị cho người đọc** (nghiêm ngặt nhất, ít nghiêm ngặt nhất, có giải thích)
