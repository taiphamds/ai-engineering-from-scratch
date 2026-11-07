---
id: bag-or-boost-the-base-model
title: Bag the deep trees or boost the stumps
card: math-classical-ml
kind: tradeoff
level: 3
roles: [ai-data-engineer, ai-evaluation-reliability-engineer, applied-ai-engineer]
rounds: [ml-depth, system-design]
tags: [ensembles, bagging, boosting, bias-variance, random-forest]
minutes: 12
lessons: [phases/02-ml-fundamentals/11-ensemble-methods, phases/02-ml-fundamentals/10-bias-variance, phases/02-ml-fundamentals/04-decision-trees]
manuals: []
practice: [lab-bias-variance]
cheatsheet: [ml-model-comparison]
related: [math-classical-ml/mdi-ranks-noise-feature, math-classical-ml/past-the-interpolation-threshold]
updated: 2026-11-03
---

Bạn có một tập dữ liệu dạng bảng và hai bộ học cơ sở ứng viên: các cây quyết định sâu khớp các hàng huấn luyện gần như hoàn hảo, và các cây quyết định một tầng chỉ nhỉnh hơn một hằng số. Bạn có đủ tài nguyên cho một phương pháp ensemble cho mỗi loại. Loại nào nhận bagging và loại nào nhận boosting, và tại sao?

## Short answer

Dùng bagging cho các cây sâu và boosting cho các cây một tầng. Các cây sâu có bias thấp và variance cao, và lấy trung bình nhiều cây được huấn luyện trên các mẫu bootstrap triệt tiêu variance mà không thêm bias. Các cây một tầng có bias cao và variance thấp, và boosting xây dựng chúng tuần tự để mỗi cây mới sửa các lỗi của ensemble đến lúc đó, làm giảm bias.

## Full answer

### Match the method to the error term

Sai số kỳ vọng được chia thành bias bình phương, variance và nhiễu không thể giảm. Hai phương pháp tấn công các thành phần khác nhau.

| Phương pháp | Giảm | Bias | Variance | Cần chú ý |
|---|---|---|---|---|
| Bagging, random forest | variance | không đổi | giảm | không làm gì cho bias |
| Boosting | bias | giảm | có thể tăng | overfit khi có quá nhiều vòng |

### Why bagging fits the deep trees

Mỗi cây được huấn luyện trên một mẫu bootstrap, một lần rút có hoàn lại cùng kích thước với dữ liệu, chứa khoảng 63.2 phần trăm các hàng riêng biệt. Phần còn lại, khoảng 36.8 phần trăm, là out-of-bag và cho một tập validation miễn phí. Trung bình của N dự đoán độc lập có variance sigma bình phương có variance sigma bình phương chia N. Các cây không độc lập, vì chúng thấy dữ liệu tương tự, nên mức tăng nhỏ hơn như vậy, và một random forest thêm một tập con đặc trưng ngẫu nhiên ở mỗi lần chia, căn bậc hai của số đặc trưng cho phân loại, để các cây bất đồng nhiều hơn. Thêm cây làm giảm variance và không bao giờ thêm bias, nên độ chính xác kiểm thử đạt bình nguyên và không giảm.

### Why boosting fits the stumps

Boosting huấn luyện các bộ học tuần tự. AdaBoost tăng trọng số của những hàng mà ensemble dự đoán sai, để cây một tầng tiếp theo xử lý chúng. Gradient boosting khớp mỗi cây mới với gradient âm của loss, mà với sai số bình phương là phần dư. Mỗi vòng loại bỏ một phần sai số có hệ thống, chính là bias. Learning rate điều chỉnh mức đóng góp của mỗi cây; bài học đưa ra 0.01 đến 0.3, và một giá trị nhỏ hơn cần nhiều cây hơn và tổng quát hóa tốt hơn. Vì các vòng sau đuổi theo những hàng khó nhất, boosting có thể khớp nhiễu, nên nó cần early stopping theo validation loss.

### Why not the other way round

Boosting các cây sâu còn ít bias để loại bỏ và chồng các bộ học variance cao, nên nó overfit nhanh. Bagging các cây một tầng lấy trung bình nhiều mô hình đều bỏ lỡ cùng một mẫu, nên trung bình cũng bỏ lỡ nó. Sự đa dạng là yêu cầu trong cả hai trường hợp: bỏ phiếu đa số của bài học với 21 bộ phân loại độc lập ở độ chính xác 60 phần trăm đạt khoảng 74 phần trăm, và 101 bộ đạt khoảng 84 phần trăm, chỉ vì các lỗi của chúng khác nhau.

## Follow-ups

- **Level 3:** Tại sao bagging các cây sâu không sửa bias? Expected: trung bình của nhiều mô hình bỏ lỡ cùng một mẫu cũng bỏ lỡ nó; lấy trung bình chỉ loại bỏ sự bất đồng của chúng.
- **Level 3:** Learning rate làm gì trong gradient boosting? Expected: nó điều chỉnh mức đóng góp của mỗi cây; một rate nhỏ hơn cần nhiều cây hơn và tổng quát hóa tốt hơn.
- **Level 4:** Sai số huấn luyện của boosting tiếp tục giảm trong khi sai số validation tăng. Điều gì đã xảy ra và bạn làm gì? Expected: các vòng sau khớp các hàng nhiễu hoặc gắn nhãn sai; dừng sớm theo validation loss, hoặc giảm learning rate và độ sâu cây.
- **Level 4:** Tại sao độ chính xác kiểm thử của một forest đạt bình nguyên nhưng không giảm khi thêm cây? Expected: mỗi cây giảm variance và không cây nào thêm bias, nên nhiều cây hơn không thể overfit theo cách nhiều vòng boosting hơn có thể.

## Wrong answers

- "Boosting các cây sâu, vì boosting là phương pháp mạnh hơn." Một bộ học bias thấp, variance cao còn ít bias để loại bỏ, và boosting khuếch đại variance của nó.
- "Bagging các cây một tầng để làm chúng mạnh." Lấy trung bình các cây một tầng đều underfit vẫn underfit; bagging để bias ở nguyên chỗ.
- "Bất kỳ ensemble đủ mô hình nào cũng thắng một mô hình đơn." Mức tăng cần các lỗi đa dạng; các mô hình mắc cùng những sai lầm không triệt tiêu chúng.

## Taught in

[Bài học các phương pháp ensemble](../../../phases/02-ml-fundamentals/11-ensemble-methods/) xây dựng cả hai phương pháp, [bài học bias-variance](../../../phases/02-ml-fundamentals/10-bias-variance/) đưa ra quy tắc chọn loại để dùng, và [bài học cây quyết định](../../../phases/02-ml-fundamentals/04-decision-trees/) xây dựng forest.
