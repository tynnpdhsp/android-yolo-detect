import argparse
import json
import shutil
from pathlib import Path

from ultralytics import YOLO

OUT_DIR = Path(__file__).resolve().parent.parent / "assets" / "model"

parser = argparse.ArgumentParser(description="Export YOLO sang TFLite cho app")
parser.add_argument("weights", nargs="?", default="yolo26n.pt")
parser.add_argument("--imgsz", type=int, default=320)
args = parser.parse_args()

model = YOLO(args.weights)
# nms=False: giữ head end-to-end của YOLO26, output [1, 300, 6] không cần NMS
tflite_path = model.export(format="litert", imgsz=args.imgsz, nms=False)

OUT_DIR.mkdir(parents=True, exist_ok=True)
shutil.copy(tflite_path, OUT_DIR / "yolo.tflite")
labels = [model.names[i] for i in sorted(model.names)]
(OUT_DIR / "labels.json").write_text(json.dumps(labels, indent=2) + "\n")
print(f"Đã ghi {OUT_DIR / 'yolo.tflite'} và labels.json ({len(labels)} lớp)")
