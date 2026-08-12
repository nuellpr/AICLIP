#!/usr/bin/env python3
"""MediaPipe-based active speaker tracking for dynamic 9:16 cropping.

Usage: python mediapipe_tracker.py <video_path> <output_cmds_path> <crop_width> <crop_height> <smoothing>

Uses MediaPipe Face Detection + Face Mesh to track lip movement
and identify the active speaker in multi-person videos.
"""

import sys
import os
import json

def main():
    if len(sys.argv) < 4:
        print("Usage: mediapipe_tracker.py <video_path> <output_cmds_path> <crop_width> <crop_height> [smoothing]")
        sys.exit(1)

    video_path = sys.argv[1]
    output_path = sys.argv[2]
    crop_w = int(sys.argv[3]) if len(sys.argv) > 3 else 608
    crop_h = int(sys.argv[4]) if len(sys.argv) > 4 else 1080
    smoothing = float(sys.argv[5]) if len(sys.argv) > 5 else 0.15

    try:
        import cv2
        import numpy as np
        
        # Robust MediaPipe solutions import
        mp_face_mesh = None
        try:
            import mediapipe as mp
            if hasattr(mp, 'solutions') and hasattr(mp.solutions, 'face_mesh'):
                mp_face_mesh = mp.solutions.face_mesh
            else:
                from mediapipe.python.solutions import face_mesh as mp_fm
                mp_face_mesh = mp_fm
        except Exception:
            pass
            
        if not mp_face_mesh:
            # Fallback: Use OpenCV face tracker if MediaPipe solutions is unavailable
            print("MediaPipe face_mesh unavailable, falling back to OpenCV face tracker...")
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            face_cascade = cv2.CascadeClassifier(cascade_path)
            
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened(): sys.exit(1)
            fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            
            commands = []
            frame_idx = 0
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret: break
                if frame_idx % 3 == 0:
                    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(30, 30))
                    center_x = width / 2
                    if len(faces) > 0:
                        largest = max(faces, key=lambda f: f[2] * f[3])
                        center_x = largest[0] + largest[2] / 2.0
                    crop_x = max(0, min(width - crop_w, center_x - crop_w / 2.0))
                    timestamp = frame_idx / fps
                    commands.append(f"{timestamp:.3f} crop x {int(crop_x)};")
                frame_idx += 1
            cap.release()
            
            with open(output_path, 'w') as f:
                for cmd in commands: f.write(cmd + "\n")
            print(f"OpenCV fallback face tracking complete: {len(commands)} keyframes")
            sys.exit(0)
    except Exception as e:
        print(f"Tracking error: {e}")
        sys.exit(0)
    face_mesh = mp_face_mesh.FaceMesh(
        max_num_faces=4,
        refine_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Cannot open video: {video_path}")
        sys.exit(1)

    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    # Lip landmarks indices (inner lips)
    UPPER_LIP = [13, 14, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95]
    LOWER_LIP = [13, 14, 87, 178, 88, 95, 78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14]
    # Simplified: top lip center = 13, bottom lip center = 14
    TOP_LIP_IDX = 13
    BOTTOM_LIP_IDX = 14

    prev_lip_gaps = {}  # face_id -> list of recent lip gaps
    smooth_x = width / 2  # Smoothed crop center X
    commands = []
    sample_interval = max(1, int(fps / 10))  # Sample every ~100ms

    frame_idx = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        if frame_idx % sample_interval == 0:
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(rgb)

            best_face_x = width / 2
            max_lip_movement = 0

            if results.multi_face_landmarks:
                for face_id, face_landmarks in enumerate(results.multi_face_landmarks):
                    # Get lip gap (mouth openness)
                    top_lip = face_landmarks.landmark[TOP_LIP_IDX]
                    bottom_lip = face_landmarks.landmark[BOTTOM_LIP_IDX]
                    lip_gap = abs(bottom_lip.y - top_lip.y) * height

                    # Track lip movement over time
                    if face_id not in prev_lip_gaps:
                        prev_lip_gaps[face_id] = []
                    prev_lip_gaps[face_id].append(lip_gap)
                    if len(prev_lip_gaps[face_id]) > 10:
                        prev_lip_gaps[face_id].pop(0)

                    # Calculate lip movement variance (speaker detection)
                    if len(prev_lip_gaps[face_id]) >= 3:
                        movement = np.std(prev_lip_gaps[face_id])
                        if movement > max_lip_movement:
                            max_lip_movement = movement
                            # Get face center X
                            nose = face_landmarks.landmark[1]  # Nose tip
                            best_face_x = nose.x * width

            # Smooth the crop position
            smooth_x = smooth_x + smoothing * (best_face_x - smooth_x)

            # Clamp to valid range
            half_crop = crop_w / 2
            crop_x = max(0, min(width - crop_w, smooth_x - half_crop))

            timestamp = frame_idx / fps
            commands.append(f"{timestamp:.3f} crop x {int(crop_x)};")

        frame_idx += 1

    cap.release()
    face_mesh.close()

    # Write sendcmd commands
    with open(output_path, 'w') as f:
        for cmd in commands:
            f.write(cmd + "\n")

    print(f"MediaPipe tracking complete: {len(commands)} keyframes from {frame_idx} frames")

if __name__ == '__main__':
    main()
