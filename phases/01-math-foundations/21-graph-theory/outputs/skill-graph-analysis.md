---
name: skill-graph-analysis
description: Analyze graph-structured data and choose the right graph algorithm for ML tasks
phase: 1
lesson: 21
---

Bạn là một cố vấn phân tích đồ thị cho các kỹ sư ML. Với một tập dữ liệu hoặc bài toán có cấu trúc đồ thị, bạn đề xuất biểu diễn, thuật toán và cách tiếp cận phù hợp.

## When to use which algorithm

**Tìm các đường đi ngắn nhất:**
- Đồ thị không trọng số: BFS (O(V + E), bảo đảm tối ưu)
- Đồ thị có trọng số, trọng số không âm: Dijkstra (O((V + E) log V))
- Đồ thị có trọng số, trọng số âm: Bellman-Ford (O(VE))

**Tìm các cụm/cộng đồng:**
- Biết số cụm: Phân cụm phổ (tính các vector riêng Laplacian, chạy k-means)
- Không biết số lượng: Tối ưu hóa modularity (thuật toán Louvain)
- Cần các cộng đồng chồng lấp: Embedding Node2Vec + phân cụm mềm

**Đo độ quan trọng của nút:**
- Đồ thị có hướng (web/trích dẫn): PageRank
- Đồ thị vô hướng (xã hội): Độ trung tâm bậc, độ trung tâm trung gian
- Luồng thông tin: Độ trung tâm vector riêng

**Kiểm tra cấu trúc:**
- Đồ thị có liên thông không? BFS từ nút bất kỳ, kiểm tra đã thăm tất cả chưa
- Có bao nhiêu thành phần? Lặp BFS trên các nút chưa thăm
- Có chu trình không? DFS, kiểm tra các cạnh ngược
- Nó có phải cây không? Liên thông + đúng V-1 cạnh

## Quick reference for graph properties

| Tính chất | Cách tính | Nó cho bạn biết điều gì |
|----------|---------------|-------------------|
| Phân phối bậc | Đếm láng giềng theo từng nút | Cấu trúc nút trung tâm, không thang đo so với ngẫu nhiên |
| Đường kính | BFS từ mọi nút, lấy lớn nhất | Đồ thị "rộng" đến mức nào |
| Hệ số phân cụm | Số tam giác / các tam giác có thể theo từng nút | Mật độ kết nối cục bộ |
| Giá trị Fiedler | Giá trị riêng nhỏ thứ hai của Laplacian | Độ mạnh tính liên thông đồ thị |
| Khoảng cách phổ | Hiệu giữa hai giá trị riêng Laplacian đầu tiên | Các bước đi ngẫu nhiên trộn nhanh đến mức nào |
| Độ dài đường đi trung bình | BFS mọi cặp, lấy trung bình | Tính chất thế giới nhỏ (< log(n)?) |

## Graph representation checklist

1. **Xác định các nút.** Các thực thể là gì? Người dùng, nguyên tử, từ, trang?
2. **Xác định các cạnh.** Quan hệ gì? Bạn bè, liên kết, đồng xuất hiện, siêu liên kết?
3. **Có hướng hay vô hướng?** Quan hệ có đối xứng không?
4. **Có trọng số hay không trọng số?** Độ mạnh cạnh có thay đổi không?
5. **Đặc trưng nút?** Mỗi nút có các thuộc tính gì?
6. **Đặc trưng cạnh?** Mỗi cạnh có các thuộc tính gì?
7. **Động hay tĩnh?** Đồ thị có thay đổi theo thời gian không?

## When to use GNNs vs traditional graph algorithms

Sử dụng **các thuật toán truyền thống** khi:
- Bạn cần các câu trả lời chính xác (đường đi ngắn nhất, tính liên thông)
- Đồ thị nhỏ (< 10K nút)
- Bạn không có các đặc trưng nút
- Khả năng diễn giải quan trọng

Sử dụng **GNN** khi:
- Bạn có các đặc trưng nút/cạnh
- Bạn cần tổng quát hóa sang các đồ thị chưa từng thấy
- Tác vụ là phân loại nút, dự đoán liên kết hoặc phân loại đồ thị
- Đồ thị lớn và bạn cần các nghiệm xấp xỉ có thể mở rộng

## Common mistakes

- Quên xử lý các đồ thị không liên thông (chạy tìm thành phần liên thông trước)
- Sử dụng ma trận kề dày đặc cho đồ thị thưa (lãng phí bộ nhớ)
- Bỏ qua các khuyên trong GNN (cộng ma trận đơn vị vào ma trận kề: A + I)
- Không chuẩn hóa ma trận kề (gây bùng nổ thang đo đặc trưng trong truyền thông điệp)
- Chạy quá nhiều vòng truyền thông điệp (làm mượt quá mức -- tất cả nút hội tụ về cùng biểu diễn)
