# Scripts Hỗ Trợ

Thư mục này chứa các script hỗ trợ cho việc quản lý dữ liệu của ứng dụng CISV Review System.

## Reset Dữ Liệu

Script `resetData.js` dùng để xóa toàn bộ dữ liệu hiện có và tạo lại dữ liệu mẫu mới.

### Cách Sử Dụng

1. Đảm bảo bạn đã cài đặt tất cả các dependencies:
   ```
   npm install
   ```

2. Đảm bảo file `.env` đã được cấu hình đúng với các thông tin:
   - `MONGODB_URI`: URL kết nối đến MongoDB
   - `CLOUDINARY_CLOUD_NAME`: Tên cloud Cloudinary
   - `CLOUDINARY_API_KEY`: API key của Cloudinary
   - `CLOUDINARY_API_SECRET`: API secret của Cloudinary

3. Chạy script reset dữ liệu:
   ```
   node scripts/resetData.js
   ```

4. Nhập `XÓA HẾT` khi được yêu cầu xác nhận để tiến hành xóa và tạo lại dữ liệu.

### Lưu Ý Quan Trọng

- Script này sẽ **XÓA TẤT CẢ** dữ liệu hiện có trong các collection User và Participant.
- Tất cả ảnh đã upload lên Cloudinary trong thư mục `checkin-app` cũng sẽ bị xóa.
- Hành động này **KHÔNG THỂ HOÀN TÁC**, vì vậy hãy đảm bảo bạn đã sao lưu dữ liệu quan trọng trước khi thực hiện.

## Tùy Chỉnh Dữ Liệu Mẫu

Bạn có thể tùy chỉnh dữ liệu mẫu bằng cách chỉnh sửa file `sampleData.js`. File này chứa:

- `sampleUsers`: Danh sách các admin
- `sampleParticipants`: Danh sách người tham gia (bao gồm cả leaders và supporters)

Sau khi chỉnh sửa dữ liệu mẫu, bạn có thể chạy lại script `resetData.js` để áp dụng các thay đổi.
