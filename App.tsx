import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import type { TfliteModel } from 'react-native-fast-tflite';
import labels from './assets/model/labels.json';
import { detectObjects, loadModel, type Detection } from './src/yolo';

const PICK_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
};

export default function App() {
  const [model, setModel] = useState<TfliteModel>();
  const [modelError, setModelError] = useState<string>();
  const [imageUri, setImageUri] = useState<string>();
  const [detections, setDetections] = useState<Detection[]>([]);
  const [message, setMessage] = useState('Chụp hoặc chọn một ảnh để nhận diện.');
  const [busy, setBusy] = useState(false);
  const size = useWindowDimensions().width - 32;

  useEffect(() => {
    loadModel().then(setModel, (error: Error) => setModelError(error.message));
  }, []);

  async function pickAndDetect(fromCamera: boolean) {
    if (!model) return;
    if (fromCamera && !(await ImagePicker.requestCameraPermissionsAsync()).granted) {
      setMessage('Chưa được cấp quyền camera.');
      return;
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync(PICK_OPTIONS)
      : await ImagePicker.launchImageLibraryAsync(PICK_OPTIONS);
    if (result.canceled) return;

    const uri = result.assets[0].uri;
    setImageUri(uri);
    setDetections([]);
    setBusy(true);
    try {
      const { detections, inferenceMs } = await detectObjects(model, uri);
      setDetections(detections);
      setMessage(`${detections.length} vật thể · model chạy ${inferenceMs} ms`);
    } catch (error) {
      setMessage(`Lỗi: ${(error as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  const status = modelError
    ? `Không tải được model: ${modelError}`
    : !model
      ? 'Đang tải model...'
      : message;
  const disabled = !model || busy;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>YOLO26n chạy trên máy</Text>

      <View style={[styles.preview, { width: size, height: size }]}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} resizeMode="stretch" />
        ) : (
          <Text style={styles.hint}>Chưa có ảnh</Text>
        )}
        {detections.map((d, i) => (
          <DetectionBox key={i} detection={d} size={size} />
        ))}
        {busy && <ActivityIndicator style={StyleSheet.absoluteFill} size="large" color="#fff" />}
      </View>

      <Text style={styles.status}>{status}</Text>

      <View style={styles.actions}>
        <ActionButton title="Chụp ảnh" disabled={disabled} onPress={() => pickAndDetect(true)} />
        <ActionButton title="Chọn ảnh" disabled={disabled} onPress={() => pickAndDetect(false)} />
      </View>
    </View>
  );
}

function DetectionBox({ detection: d, size }: { detection: Detection; size: number }) {
  const color = `hsl(${(d.classId * 47) % 360}, 90%, 55%)`;
  return (
    <View
      style={[
        styles.box,
        { left: d.x * size, top: d.y * size, width: d.width * size, height: d.height * size, borderColor: color },
      ]}
    >
      <Text style={[styles.label, { backgroundColor: color }]}>
        {labels[d.classId]} {Math.round(d.score * 100)}%
      </Text>
    </View>
  );
}

function ActionButton({ title, disabled, onPress }: { title: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.button, disabled && styles.buttonDisabled]} disabled={disabled} onPress={onPress}>
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  preview: {
    backgroundColor: '#222',
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    color: '#888',
  },
  box: {
    position: 'absolute',
    borderWidth: 2,
  },
  label: {
    alignSelf: 'flex-start',
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 4,
  },
  status: {
    color: '#ddd',
    paddingHorizontal: 16,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    backgroundColor: '#2f6fed',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
