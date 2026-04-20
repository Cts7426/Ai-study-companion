# 🧠 AI Study Companion

chào mừng đến với **AI Study Companion**, Một nền tảng Tạo lập Tăng cường Truy xuất (RAG) thông minh được thiết kế để cách mạng hóa cách sinh viên tương tác với tài liệu học tập của họ. Bằng cách tận dụng sức mạnh của các hệ thống quản lý học tập cục bộ hoặc trên đám mây (LLM), nền tảng này biến các tài liệu PDF tĩnh của bạn thành các mô-đun học tập năng động, có tính đối thoại và tương tác.

## ✨ Tính năng

1. **📄 Phân tích tài liệu thông minh**: Tải lên bất kỳ tài liệu PDF nào. Hệ thống sẽ xử lý, chia nhỏ và nhúng nội dung vào cơ sở dữ liệu vector để truy xuất tìm kiếm ngữ nghĩa tức thì.
2. **💬 Hỏi đáp theo ngữ cảnh (RAG)**: Đặt câu hỏi về tài liệu đã tải lên và nhận được câu trả lời chính xác, đầy đủ, được **lấy nguồn trực tiếp** từ văn bản — giảm thiểu tối đa các suy luận của AI.
3. **📊 Tóm tắt chỉ với một cú nhấp chuột**: Tự động trích xuất các khái niệm cốt lõi, gạch đầu dòng và thuật ngữ thiết yếu để tiết kiệm hàng giờ đọc.
4. **🎯 Bài kiểm tra tự động**: Kiểm tra kiến ​​thức của bạn! AI ngay lập tức hoạt động như một người chấm thi, tạo ra bài kiểm tra trắc nghiệm trực tiếp từ tài liệu đọc, hoàn chỉnh với điểm số và giải thích logic chặt chẽ.
5. **🎛️ Chế độ dự phòng nhà cung cấp động (Dual-LLM)**: Dữ liệu riêng tư được bản địa hóa hoàn toàn bằng **Ollama (Llama-3)** hoặc chuyển đổi liền mạch sang trí tuệ đám mây siêu tốc với **Google Gemini**.

---

## 🛠️ Công nghệ & Kiến trúc

- **Giao diện người dùng**: React, Vite, React Router, Lucide Icons. Được thiết kế với giao diện Glassmorphism chế độ tối đẹp mắt cho trải nghiệm người dùng cao cấp.

- **Máy chủ (API)**: Python FastAPI cho các thao tác bất đồng bộ cực nhanh.

- **Công cụ RAG**: Sentence Transformers (`all-MiniLM-L6-v2`) + PyMuPDF để phân tích tài liệu.

- **Cơ sở dữ liệu**: ChromaDB được cấu hình cục bộ.

- **Mô hình AI**: Ollama / Google Gemini API.

---

## 🚀 Bắt đầu

Hãy làm theo các bước sau để cài đặt ứng dụng trên máy tính của bạn:

### 1. Thiết lập Backend

Mở cửa sổ dòng lệnh và điều hướng đến thư mục `backend`:

```bash
cd backend
python -m venv venv
# Kích hoạt môi trường (Windows)
.\venv\Scripts\Activate
# Cài đặt các yêu cầu
pip install -r requirements.txt
```

**Biến môi trường**
Đảm bảo bạn đã cấu hình tệp `.env` trong thư mục gốc `backend`:
```ini
LLM_PROVIDER=gemini # Hoặc 'ollama'
GEMINI_API_KEY=your_gemini_api_key_here
```

**Chạy máy chủ**
```bash
uvicorn app.main:app --reload
```
Máy chủ API sẽ chạy tại `http://localhost:8000`.

### 2. Thiết lập giao diện người dùng

Mở một cửa sổ terminal **riêng biệt** và chạy:

```bash
cd frontend
npm install
npm run dev
```

Ứng dụng hiện đang chạy! Nhấp vào URL Localhost được cung cấp trên dấu nhắc, tải lên một tài liệu PDF thú vị và bắt đầu khám phá.

---
## 💡 Tại sao nên chọn AI Study Companion?

Thời đại thông tin văn bản kỹ thuật số khổng lồ đòi hỏi các quy tắc phân tích chuyên biệt. Không giống như các mô hình ngôn ngữ thô sơ như ChatGPT—thường bị "ảo tưởng" khi gặp phải những sắc thái thực tế chưa từng thấy trong dữ liệu huấn luyện—bot này hoạt động theo các ràng buộc _Tăng cường truy xuất_ nghiêm ngặt. Nó buộc AI phải hoạt động ở chế độ "Đọc và Trả lời", đảm bảo bản dịch tiếng Việt chính xác cao ngay cả khi xử lý tài liệu tiếng Anh phức tạp.

Chúc bạn xây dựng bộ nhớ kỹ thuật số hiệu quả!
