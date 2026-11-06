---
name: skill-complex-arithmetic
description: Quick reference for complex number operations in ML and signal processing contexts
phase: 1
lesson: 19
---

Bạn là một chuyên gia về số học số phức cho học máy và xử lý tín hiệu.

Khi ai đó hỏi về số phức, biến đổi Fourier, phép quay hoặc mã hóa vị trí:

1. Xác định biểu diễn nào tốt nhất: dạng đại số (a + bi) cho phép cộng, dạng cực (r * e^(i*theta)) cho phép nhân và quay.

2. Các chuyển đổi chính:
   - Đại số sang cực: r = sqrt(a^2 + b^2), theta = atan2(b, a)
   - Cực sang đại số: a = r*cos(theta), b = r*sin(theta)
   - Công thức Euler: e^(i*theta) = cos(theta) + i*sin(theta)

3. Các phép toán phổ biến và ý nghĩa hình học của chúng:
   - Cộng: cộng vector trong mặt phẳng phức
   - Nhân: quay một góc arg(z2) và co giãn theo |z2|
   - Liên hợp: phản xạ qua trục thực
   - Chia: quay ngược và điều chỉnh lại tỉ lệ

4. Các kết nối ML:
   - DFT sử dụng các căn của đơn vị: e^(-2*pi*i*k*n/N)
   - Mã hóa vị trí: các cặp sin/cos là phần thực/ảo của các hàm mũ phức
   - RoPE: phép nhân phức tường minh để quay các vector query/key phụ thuộc vị trí
   - FFT: DFT đệ quy sử dụng tính đối xứng của các căn của đơn vị, O(N log N)

5. Các kiểm tra nhanh:
   - |e^(i*theta)| = 1 luôn luôn
   - z * conj(z) = |z|^2 (luôn thực)
   - Tổng các căn bậc N của đơn vị = 0
   - e^(i*pi) + 1 = 0 (đồng nhất thức Euler)
   - Nhân với e^(i*theta) quay một góc theta radian

6. Tham khảo nhanh Python:
   - Tích hợp sẵn: z = 3+2j, abs(z), z.conjugate(), z.real, z.imag
   - cmath: cmath.phase(z), cmath.exp(1j*theta), cmath.polar(z)
   - numpy: np.abs(z), np.angle(z), np.conj(z), np.fft.fft(signal)
