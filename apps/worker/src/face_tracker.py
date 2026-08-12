import cv2
import sys
import os
import math

def smooth_array(arr, window_size):
    if len(arr) == 0: return arr
    smoothed = []
    for i in range(len(arr)):
        start = max(0, i - window_size)
        end = min(len(arr), i + window_size + 1)
        window = arr[start:end]
        smoothed.append(sum(window) / len(window))
    return smoothed

def track_faces(video_path, output_cmd_path):
    if not os.path.exists(video_path):
        print(f"Error: File not found {video_path}")
        sys.exit(1)

    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    if not fps or math.isnan(fps) or fps == 0:
        fps = 30.0

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    # Use OpenCV Haar Cascade classifier for zero-dependency face detection
    cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    face_cascade = cv2.CascadeClassifier(cascade_path)

    scale_factor = 480.0 / float(width) if width > 480 else 1.0
    raw_centers = []

    # Pass 1: Detect Faces with OpenCV
    while True:
        ret, frame = cap.read()
        if not ret: break

        small = cv2.resize(frame, (0, 0), fx=scale_factor, fy=scale_factor) if scale_factor < 1.0 else frame
        gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
        
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(30, 30))

        if len(faces) > 0:
            # Find largest face by area (w * h)
            largest_face = max(faces, key=lambda f: f[2] * f[3])
            fx, fy, fw, fh = largest_face
            # Convert scaled coordinates back to original frame size
            center_x = (fx + fw / 2.0) / scale_factor
            raw_centers.append(center_x)
        else:
            raw_centers.append(None)

    cap.release()

    if len(raw_centers) == 0:
        sys.exit(0)

    # Pass 2: Fill gaps (linear interpolation)
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

    # Pass 3: Smooth with moving average filter
    smoothed_centers = smooth_array(filled_centers, window_size=15)

    # Calculate 9:16 crop width for target 1080x1920
    crop_w = int(height * (9.0 / 16.0))
    if crop_w > width:
        crop_w = width

    half_crop = crop_w / 2.0

    # Write sendcmd commands file for FFmpeg
    with open(output_cmd_path, 'w') as f:
        for i, center_x in enumerate(smoothed_centers):
            crop_x = center_x - half_crop
            if crop_x < 0: crop_x = 0
            if crop_x > (width - crop_w): crop_x = width - crop_w
            
            timestamp = i / fps
            f.write(f"{timestamp:.3f} crop x {int(crop_x)};\n")

    print(f"OpenCV Face tracking completed. Generated {len(smoothed_centers)} keyframes.")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python face_tracker.py <input_video> <output_cmd_file> [crop_w] [crop_h] [smoothing]")
        sys.exit(1)
    
    video_input = sys.argv[1]
    cmd_output = sys.argv[2]
    
    track_faces(video_input, cmd_output)
