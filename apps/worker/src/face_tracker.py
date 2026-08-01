import cv2
import sys
import os
import math

def track_faces(video_path, output_cmd_path, target_w=1080, target_h=1920, interval_sec=0.2):
    if not os.path.exists(video_path):
        print(f"Error: File not found {video_path}")
        sys.exit(1)

    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    if not fps or math.isnan(fps) or fps == 0:
        fps = 30.0

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    # Load Haar cascade
    cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    face_cascade = cv2.CascadeClassifier(cascade_path)

    frame_interval = int(fps * interval_sec)
    if frame_interval < 1:
        frame_interval = 1

    current_frame = 0
    commands = []
    
    # Initialize last_x_center to middle
    last_x_center = width / 2
    
    while True:
        cap.set(cv2.CAP_PROP_POS_FRAMES, current_frame)
        ret, frame = cap.read()
        
        if not ret:
            break
            
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(60, 60))
        
        best_x_center = last_x_center
        if len(faces) > 0:
            largest_face = max(faces, key=lambda rect: rect[2] * rect[3])
            fx, fy, fw, fh = largest_face
            best_x_center = fx + fw / 2
            
            # Smooth movement
            best_x_center = (last_x_center * 0.7) + (best_x_center * 0.3)
        else:
            # Drift towards center
            best_x_center = (last_x_center * 0.9) + ((width / 2) * 0.1)

        crop_x = int(best_x_center - (target_w / 2))
        
        # Clamp
        if crop_x < 0:
            crop_x = 0
        elif crop_x > width - target_w:
            crop_x = max(0, width - target_w)
            
        timestamp = current_frame / fps
        commands.append(f"{timestamp:.2f} crop x '{crop_x}';")
        
        last_x_center = best_x_center
        current_frame += frame_interval

    cap.release()
    
    with open(output_cmd_path, 'w') as f:
        f.write("\n".join(commands))
        
    print(f"Face tracking complete. Commands written to {output_cmd_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python face_tracker.py <input_video> <output_cmd_txt> [target_w] [target_h] [interval_sec]")
        sys.exit(1)
        
    video_path = sys.argv[1]
    output_cmd_path = sys.argv[2]
    
    target_w = int(sys.argv[3]) if len(sys.argv) > 3 else 1080
    target_h = int(sys.argv[4]) if len(sys.argv) > 4 else 1920
    interval_sec = float(sys.argv[5]) if len(sys.argv) > 5 else 0.2
    
    track_faces(video_path, output_cmd_path, target_w, target_h, interval_sec)
