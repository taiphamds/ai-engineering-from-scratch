---
id: gini-for-a-mixed-node
title: Score a tree node with Gini and with entropy
card: math-classical-ml
kind: estimate
level: 2
roles: [ai-data-engineer, ai-evaluation-reliability-engineer]
rounds: [screen, ml-breadth]
tags: [decision-trees, gini, entropy, information-gain]
minutes: 8
lessons: [phases/02-ml-fundamentals/04-decision-trees, phases/01-math-foundations/09-information-theory]
manuals: []
practice: [gini-best-split]
cheatsheet: [classical-ml]
related: [math-classical-ml/mdi-ranks-noise-feature, math-classical-ml/bag-or-boost-the-base-model]
updated: 2026-11-03
---

Một node trong một cây phân loại chứa 6 mèo và 4 chó. Cho độ không thuần Gini và entropy tính bằng bit của nó, và giải thích cách một cây dùng một trong hai con số để chọn một phép chia.

## Short answer

Các tỷ phần lớp là 0.6 và 0.4. Gini là 1 trừ tổng các tỷ phần bình phương, nên 1 trừ 0.36 trừ 0.16, bằng 0.48. Entropy là âm tổng của tỷ phần nhân log cơ số 2 của tỷ phần, bằng 0.971 bit. Cây thử mọi đặc trưng và ngưỡng và giữ phép chia có mức giảm lớn nhất từ độ không thuần của cha đến độ không thuần có trọng số của hai con.

## Full answer

### The two numbers

```text
Gini    = 1 - (0.6^2 + 0.4^2) = 1 - (0.36 + 0.16) = 0.48
Entropy = -(0.6 * log2(0.6) + 0.4 * log2(0.4))
        = -(0.6 * -0.737 + 0.4 * -1.322)
        = 0.442 + 0.529 = 0.971 bits
```

Gini là xác suất một mẫu ngẫu nhiên tại node bị gắn nhãn sai khi bạn gắn nhãn nó theo phân phối lớp của node. Entropy là độ ngạc nhiên trung bình của các nhãn tại node. Cả hai bằng 0 cho một node thuần. Với một node hai lớp có tỷ phần bằng nhau, Gini là 0.5 và entropy là 1.0 bit.

### How the tree uses them

Information gain của một phép chia là độ không thuần của cha trừ trung bình có trọng số độ không thuần của các con, trong đó mỗi con được đặt trọng số bằng tỷ phần mẫu của nó. Thuật toán là tham lam: ở mỗi node nó sắp xếp từng đặc trưng, thử mọi trung điểm giữa các giá trị khác nhau làm ngưỡng, và giữ cặp có gain cao nhất. Sau đó nó đệ quy vào cả hai con. Chia tham lam không tìm cây tốt nhất, vì bài toán đó là NP-hard, nhưng nó hoạt động tốt trong thực tế.

### Gini or entropy

Trên phần lớn dữ liệu, hai tiêu chí chọn cùng các phép chia và cho các cây có độ sâu gần bằng nhau. Gini không có logarit, nên tính ít tốn kém hơn một chút. Entropy kết nối phép chia với lý thuyết thông tin: phép chia tối thiểu hóa entropy có điều kiện của nhãn khi biết đặc trưng là phép chia loại bỏ nhiều bất định nhất.

## Follow-ups

- **Level 2:** Gain của một phép chia đặt tất cả mèo ở một phía và tất cả chó ở phía kia là gì? Expected: các con thuần, nên độ không thuần của chúng bằng 0 và gain bằng độ không thuần của cha, 0.48 cho Gini.
- **Level 2:** Tại sao đặt trọng số các con bằng tỷ phần mẫu của chúng? Expected: một con thuần với một mẫu không nên được tính ngang một con hỗn hợp với phần dữ liệu còn lại.
- **Level 3:** Cây biến một đặc trưng liên tục thành các ngưỡng ứng viên như thế nào? Expected: sắp xếp các giá trị và thử trung điểm giữa mỗi cặp lân cận khác nhau.
- **Level 3:** Điều gì dừng đệ quy trước khi mỗi lá chứa một mẫu? Expected: các giới hạn tiền cắt tỉa như độ sâu tối đa, số mẫu tối thiểu mỗi lá, hoặc gain tối thiểu, hoặc hậu cắt tỉa sau khi toàn bộ cây được phát triển.

## Wrong answers

- "Gini là 0.6 nhân 0.4." Tích đó bằng một nửa Gini hai lớp. Công thức là 1 trừ tổng các tỷ phần bình phương, cho 0.48 ở đây.
- "Entropy của một node 6 trên 4 là 1 bit vì có hai lớp." Một bit là tối đa, chỉ đạt ở các tỷ phần bằng nhau. Các tỷ phần không bằng nhau cho ít hơn, 0.971 bit ở đây.
- "Chọn phép chia có độ không thuần con thấp nhất, và cha không quan trọng." Độ không thuần của cha giống nhau cho mọi phép chia ứng viên tại node đó, nên thứ hạng giống nhau, nhưng gain là thứ cây lưu và báo cáo như độ quan trọng đặc trưng.

## Taught in

[Bài học cây quyết định](../../../phases/02-ml-fundamentals/04-decision-trees/) tính cả hai tiêu chí cho node này, và [bài học lý thuyết thông tin](../../../phases/01-math-foundations/09-information-theory/) định nghĩa entropy và entropy có điều kiện.
