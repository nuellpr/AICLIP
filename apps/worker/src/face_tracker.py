import cv2
import sys
import os
import math
import mediapipe as mp

def smooth_array(arr, window_size):
    if len(arr) == 0: return arr
    smoothed = []
    for i in range(len(arr)):
        start = max(0, i - window_size)
        end = min(len(arr), i + window_size + 1)
        window = arr[start:end]
        smoothed.append(sum(window) / len(window))
    return smoothed

def track_faces(video_path, output_cmd_path, target_w=1080, target_h=1920):
    if not os.path.exists(video_path):
        print(f"Error: File not found {video_path}")
        sys.exit(1)

    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    if not fps or math.isnan(fps) or fps == 0:
        fps = 30.0

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    mp_face_detection = mp.solutions.face_detection
    face_detection = mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5)

    scale_factor = 480.0 / float(width) if width > 480 else 1.0

    raw_centers = []

    # Pass 1: Detect Faces with MediaPipe
    while True:
        ret, frame = cap.read()
        if not ret: break
            
        small = cv2.resize(frame, (0, 0), fx=scale_factor, fy=scale_factor) if scale_factor < 1.0 else frame
        
        # MediaPipe requires RGB images
        rgb_frame = cv2.cvtColor(small, cv2.COLOR_BGR2RGB)
        results = face_detection.process(rgb_frame)
        
        if results.detections:
            # Find largest face by bounding box area
            largest_det = None
            max_area = 0
            for det in results.detections:
                bbox = det.location_data.relative_bounding_box
                area = bbox.width * bbox.height
                if area > max_area:
                    max_area = area
                    largest_det = det
                    
            if largest_det:
                bbox = largest_det.location_data.relative_bounding_box
                # bbox properties are relative [0.0, 1.0]
                center_x_relative = bbox.xmin + (bbox.width / 2)
                # Convert back to absolute original width
                center_x = center_x_relative * width
                raw_centers.append(center_x)
            else:
                raw_centers.append(None)
        else:
            raw_centers.append(None)
            
    cap.release()
    face_detection.close()

    if len(raw_centers) == 0:
        sys.exit(0)

    # Pass 2: Fill gaps (interpolation)
    filled_centers = []
    last_valid = width / 2
    
    for c in raw_centers:
        if c is not None:
            last_valid = c
            break

    for i in range(len(raw_centers)):
        if raw_centers[i] is not None:
            filled_centers.append(raw_centers[i])
            last_valid = raw_centers[i]
        else:
            next_valid = last_valid
            dist = 1
            for j in range(i + 1, len(raw_centers)):
                if raw_centers[j] is not None:
                    next_valid = raw_centers[j]
                    dist = j - i + 1
                    break
            
            step = (next_valid - last_valid) / dist
            new_val = filled_centers[-1] + step if len(filled_centers) > 0 else last_valid
            filled_centers.append(new_val)
            last_valid = new_val

    # Pass 3: Heavy Smoothing (Moving Average Window)
    smoothed_centers = smooth_array(filled_centers, window_size=int(fps / 1.5))

    # Pass 4: Generate FFmpeg Commands
    commands = []
    for i, best_x in enumerate(smoothed_centers):
        crop_x = int(best_x - (target_w / 2))
        
        if crop_x < 0: crop_x = 0
        elif crop_x > width - target_w: crop_x = max(0, width - target_w)
            
        timestamp = i / fps
        commands.append(f"{timestamp:.3f} crop x '{crop_x}';")
        
    with open(output_cmd_path, 'w') as f:
        f.write("\n".join(commands))
        
    print(f"MediaPipe Face tracking complete. Analyzed {len(raw_centers)} frames.")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(1)
        
    track_faces(
        sys.argv[1], 
        sys.argv[2], 
        int(sys.argv[3]) if len(sys.argv) > 3 else 1080, 
        int(sys.argv[4]) if len(sys.argv) > 4 else 1920
    )
