import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import jpeg from 'jpeg-js';
import type { TfliteModel } from 'react-native-fast-tflite';

const INPUT_SIZE = 320;

export type Detection = {
  x: number;
  y: number;
  width: number;
  height: number;
  score: number;
  classId: number;
};

export async function detectObjects(model: TfliteModel, uri: string, threshold = 0.4) {
  const resized = await ImageManipulator.manipulate(uri)
    .resize({ width: INPUT_SIZE, height: INPUT_SIZE })
    .renderAsync();
  const saved = await resized.saveAsync({ format: SaveFormat.JPEG, compress: 1 });
  const { data, width, height } = jpeg.decode(await new File(saved.uri).bytes(), { useTArray: true });
  if (width !== INPUT_SIZE || height !== INPUT_SIZE) {
    throw new Error(`Ảnh sau khi resize là ${width}x${height}, cần ${INPUT_SIZE}x${INPUT_SIZE}`);
  }

  const start = Date.now();
  const [output] = await model.run([toInputTensor(data).buffer]);
  const inferenceMs = Date.now() - start;
  return { detections: decodeDetections(new Float32Array(output), threshold), inferenceMs };
}

// Model nhận NCHW float32 [1, 3, 320, 320], giá trị RGB chia 255
function toInputTensor(rgba: Uint8Array): Float32Array<ArrayBuffer> {
  const area = INPUT_SIZE * INPUT_SIZE;
  const tensor = new Float32Array(3 * area);
  for (let i = 0; i < area; i++) {
    tensor[i] = rgba[i * 4] / 255;
    tensor[area + i] = rgba[i * 4 + 1] / 255;
    tensor[2 * area + i] = rgba[i * 4 + 2] / 255;
  }
  return tensor;
}

// Output YOLO26 [1, 300, 6] = x1, y1, x2, y2, score, class; toạ độ tính bằng pixel của ảnh 320x320
function decodeDetections(output: Float32Array, threshold: number): Detection[] {
  const candidates: Detection[] = [];
  for (let i = 0; i + 6 <= output.length; i += 6) {
    const score = output[i + 4];
    if (score < threshold) continue;
    const x1 = clamp01(output[i] / INPUT_SIZE);
    const y1 = clamp01(output[i + 1] / INPUT_SIZE);
    const x2 = clamp01(output[i + 2] / INPUT_SIZE);
    const y2 = clamp01(output[i + 3] / INPUT_SIZE);
    candidates.push({ x: x1, y: y1, width: x2 - x1, height: y2 - y1, score, classId: output[i + 5] });
  }

  // Head end-to-end đôi khi vẫn ra box gần trùng nhau, chỉ giữ box điểm cao nhất
  candidates.sort((a, b) => b.score - a.score);
  const kept: Detection[] = [];
  for (const d of candidates) {
    if (kept.every((k) => k.classId !== d.classId || iou(k, d) < 0.7)) kept.push(d);
  }
  return kept;
}

function iou(a: Detection, b: Detection): number {
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  if (w <= 0 || h <= 0) return 0;
  const inter = w * h;
  return inter / (a.width * a.height + b.width * b.height - inter);
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
