---
name: skill-clustering-guide
description: Choose the right clustering algorithm based on data shape, noise, and constraints
version: 1.0.0
phase: 2
lesson: 7
tags: [clustering, k-means, dbscan, hierarchical, gmm, unsupervised]
---

# Clustering Algorithm Selection Guide

Phân cụm không có một thuật toán tốt nhất duy nhất. Lựa chọn phù hợp phụ thuộc vào hình dạng cụm, liệu bạn biết số cụm hay không, có bao nhiêu nhiễu trong dữ liệu và tập dữ liệu lớn đến mức nào.

## Decision Checklist

1. Bạn có biết số cụm không?
   - Có: K-Means hoặc GMM
   - Không: DBSCAN (tự động tìm cụm), hoặc phân cấp (cắt dendrogram ở các mức khác nhau)

2. Các cụm có hình dạng gì?
   - Xấp xỉ hình cầu (dạng khối): K-Means
   - Ellipse với các kích thước khác nhau: GMM
   - Các hình dạng tùy ý (lưỡi liềm, vòng, chuỗi): DBSCAN
   - Lồng nhau hoặc phân cấp: phân cụm phân cấp

3. Dữ liệu có chứa nhiễu hoặc ngoại lệ không?
   - Có: DBSCAN (gắn nhãn tường minh các điểm nhiễu) hoặc GMM (các điểm xác suất thấp là ngoại lệ)
   - Không: K-Means ổn

4. Bạn có cần các phép gán mềm (xác suất) không?
   - Có: GMM cho P(cluster | data point) với mỗi cụm
   - Không: K-Means hoặc DBSCAN cho các phép gán cứng

5. Tập dữ liệu lớn đến mức nào?
   - Dưới 10,000: bất kỳ thuật toán nào cũng hoạt động
   - 10,000 đến 1,000,000: K-Means (nhanh), Mini-Batch K-Means (nhanh hơn)
   - Trên 1,000,000: Mini-Batch K-Means hoặc BIRCH. Phân cấp quá chậm.

## When to use each approach

**K-Means**: điểm bắt đầu mặc định. Nhanh (O(n * k * iterations)), đơn giản và đủ tốt cho nhiều bài toán. Sử dụng phương pháp khuỷu tay hoặc điểm silhouette để chọn K. Hạn chế: giả định các cụm hình cầu, nhạy với khởi tạo (sử dụng K-Means++ hoặc chạy nhiều lần), không xử lý tốt kích thước cụm thay đổi.

**DBSCAN**: tốt nhất để khám phá các cụm có hình dạng tùy ý và tự động phát hiện ngoại lệ. Hai tham số: eps (bán kính lân cận) và min_samples (mật độ tối thiểu). Không yêu cầu chỉ định K. Hạn chế: gặp khó khi các cụm có mật độ rất khác nhau, và điều chỉnh eps có thể khó. Sử dụng đồ thị k-distance để ước lượng eps: tính khoảng cách đến láng giềng gần thứ k của mỗi điểm, sắp xếp và tìm một khuỷu tay.

**Phân cấp (Tích tụ)**: xây dựng một cây các phép hợp nhất. Hữu ích khi bạn muốn khám phá cấu trúc cụm ở nhiều mức chi tiết (cắt dendrogram ở các độ cao khác nhau). Liên kết Ward hoạt động tốt nhất cho các cụm gọn. Liên kết đơn tìm các cụm kéo dài nhưng nhạy với nhiễu. Hạn chế: bộ nhớ O(n^2) và thời gian O(n^3), nên không thực tế cho các tập dữ liệu lớn.

**GMM (Mô hình Hỗn hợp Gaussian)**: phân cụm mềm với các phép gán xác suất. Mô hình hóa mỗi cụm thành một phân phối Gaussian với trung bình và hiệp phương sai riêng. Tốt hơn K-Means khi các cụm ellipse hoặc chồng lấp. Sử dụng BIC (Tiêu chí Thông tin Bayes) để chọn số thành phần. Hạn chế: giả định các phân phối Gaussian, có thể thất bại trên các hình dạng không lồi, nhạy với khởi tạo.

## Evaluating cluster quality (no labels)

| Chỉ số | Nó đo gì | Phạm vi | Sử dụng khi |
|--------|-----------------|-------|----------|
| Điểm silhouette | Độ gắn kết so với phân tách | -1 đến 1 (cao hơn là tốt hơn) | So sánh các giá trị K hoặc thuật toán |
| Inertia (SS nội cụm) | Độ chặt của các cụm | 0 đến inf (thấp hơn là tốt hơn) | Phương pháp khuỷu tay cho K-Means |
| BIC / AIC | Độ khớp mô hình với hình phạt độ phức tạp | Thấp hơn là tốt hơn | Chọn số thành phần GMM |
| Chỉ số Calinski-Harabasz | Tỉ số phương sai giữa cụm với trong cụm | Cao hơn là tốt hơn | So sánh nhanh |
| Chỉ số Davies-Bouldin | Độ tương đồng trung bình giữa các cụm | Thấp hơn là tốt hơn | Phạt các cụm chồng lấp |

## Common mistakes

- Chạy K-Means mà không co giãn đặc trưng (các đặc trưng có thang đo lớn hơn chi phối phép tính khoảng cách)
- Chọn K bằng cách nhìn dữ liệu trong 2D khi dữ liệu thực nhiều chiều (sử dụng điểm silhouette)
- Sử dụng K-Means trên các cụm không hình cầu (dữ liệu hình lưỡi liềm hoặc vòng cần DBSCAN)
- Đặt eps DBSCAN quá lớn (mọi thứ trong một cụm) hoặc quá nhỏ (mọi thứ là nhiễu)
- Xem nhãn cụm là sự thật nền (phân cụm mang tính khám phá; xác thực bằng kiến thức chuyên môn)
- Chạy phân cụm phân cấp trên các tập dữ liệu có hơn 20,000 điểm (bộ nhớ và thời gian bùng nổ)

## Quick reference

| Thuật toán | Hình dạng cụm | Tìm K | Xử lý nhiễu | Phép gán mềm | Khả năng mở rộng |
|-----------|--------------|---------|---------------|-----------------|-------------|
| K-Means | Hình cầu | Không (bạn đặt K) | Không | Không | Hàng triệu |
| Mini-Batch K-Means | Hình cầu | Không | Không | Không | Hàng chục triệu |
| DBSCAN | Tùy ý | Có | Có | Không | Hàng trăm nghìn |
| Phân cấp | Bất kỳ (phụ thuộc liên kết) | Linh hoạt (cắt dendrogram) | Phụ thuộc liên kết | Không | Dưới 20k |
| GMM | Ellipse | Không (bạn đặt K) | Một phần (xác suất thấp) | Có | Dưới 100k |
| HDBSCAN | Tùy ý | Có | Có | Một phần | Hàng trăm nghìn |
