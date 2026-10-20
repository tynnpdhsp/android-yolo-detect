# YOLO Detect

App React Native (Expo) demo chạy model **YOLO26n ngay trên điện thoại**: chụp hoặc chọn ảnh, model nhận diện vật thể và vẽ khung. Không cần server, không cần mạng.

## Cấu trúc

| Đường dẫn | Vai trò |
|---|---|
| `App.tsx` | Màn hình: chụp/chọn ảnh, gọi model, vẽ khung |
| `src/yolo.ts` | Tiền xử lý ảnh, chạy model, giải mã kết quả |
| `assets/model/` | Model `yolo.tflite` và danh sách nhãn `labels.json` |
| `scripts/export_model.py` | Export model YOLO sang TFLite (LiteRT) |
| `app.config.ts` | Cấu hình app, biến thể dev/release, số phiên bản |
| `.github/workflows/` | Build APK tự động |

## Luồng xử lý

```
ảnh vuông (crop khi chọn ảnh)
  → resize 320×320 → tensor [1, 3, 320, 320], RGB chia 255
  → model YOLO26n (chạy bằng react-native-fast-tflite)
  → output [1, 300, 6] = x1, y1, x2, y2, score, class (toạ độ pixel trên ảnh 320)
  → giữ box có score ≥ 0.4 → vẽ khung lên ảnh
```

## Chạy khi phát triển

App dùng native module (TFLite) nên **không chạy được trên Expo Go**. Thay vào đó cài một APK dev (development build) một lần:

1. Trên GitHub: tab **Actions** → **Dev APK** → **Run workflow**. Chạy xong, tải APK tại
   `https://github.com/<user>/<repo>/releases/download/dev/yolo-detect-dev.apk` và cài lên điện thoại.
2. Trên máy tính: `npm install` rồi `npx expo start`.
3. Điện thoại và máy tính cùng WiFi: mở app **YOLO Detect (Dev)**, quét QR hoặc chọn server đang chạy.

Sửa code JS rồi lưu, app trên điện thoại cập nhật ngay. Chỉ cần chạy lại **Dev APK** khi thêm/bỏ thư viện có native code hoặc sửa `app.config.ts`.

## Phát hành APK

```bash
git tag v1.0.0
git push origin v1.0.0
```

Workflow **Release APK** sẽ build và tạo Release `v1.0.0` kèm file APK. Mở trang Releases trên điện thoại, tải về và cài (cho phép cài ứng dụng từ nguồn này).

- Tên phiên bản lấy từ tag, `versionCode` là số lần chạy workflow nên bản sau luôn cài đè được bản trước.
- APK được ký bằng debug keystore có sẵn trong template Expo: đủ cho demo, không dùng để đưa lên Play Store.
- Chỉ build cho `arm64-v8a` (gần như mọi điện thoại hiện nay) để build nhanh và APK nhẹ.
- Bản dev và bản release có package khác nhau nên cài song song được.

## Đổi model

```bash
pip install ultralytics litert-torch ai-edge-litert
python scripts/export_model.py            # mặc định yolo26n.pt
python scripts/export_model.py best.pt    # model YOLO26 tự train
```

Script ghi đè `assets/model/yolo.tflite` và `labels.json`. App giả định model họ **YOLO26** (output end-to-end `[1, 300, 6]`) với input 320×320.

Model YOLO của Ultralytics theo giấy phép AGPL-3.0: dùng cho demo, khoá luận thì ổn, làm sản phẩm thương mại cần xem lại giấy phép.
