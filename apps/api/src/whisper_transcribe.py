import sys
import json
import warnings
import os
from io import StringIO

warnings.filterwarnings('ignore')

INITIAL_PROMPT_ID = "Halo teman-teman, jadi gini guys, oke jadi, kita lanjut ya, jadi intinya gitu loh, makasih banget, oke deh"

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No audio path provided'}))
        sys.exit(1)

    audio_path = sys.argv[1]
    language = sys.argv[2] if len(sys.argv) >= 3 else None

    if not os.path.exists(audio_path):
        print(json.dumps({'error': f'Audio file not found: {audio_path}'}))
        sys.exit(1)

    file_size = os.path.getsize(audio_path)
    if file_size < 100:
        print(json.dumps({'error': f'Audio file too small ({file_size} bytes), likely corrupted'}))
        sys.exit(1)

    try:
        import whisper

        # Redirect stdout to suppress whisper's language detection message
        old_stdout = sys.stdout
        sys.stdout = StringIO()

        model = whisper.load_model('small')

        transcribe_kwargs = {
            'word_timestamps': True,
            'fp16': False,
            'verbose': False,
        }

        if language:
            transcribe_kwargs['language'] = language
        else:
            transcribe_kwargs['initial_prompt'] = INITIAL_PROMPT_ID

        result = model.transcribe(audio_path, **transcribe_kwargs)

        # Restore stdout
        sys.stdout = old_stdout

        detected_lang = result.get('language', language or 'unknown')

        words = []
        for seg in result.get('segments', []):
            for w in seg.get('words', []):
                text = w.get('word', '').strip()
                if text:
                    words.append({
                        'text': text,
                        'start': round(w.get('start', 0), 3),
                        'end': round(w.get('end', 0), 3)
                    })

        print(json.dumps({
            'text': result.get('text', '').strip(),
            'words': words,
            'language': detected_lang
        }))
    except Exception as e:
        try:
            sys.stdout = old_stdout
        except:
            pass
        print(json.dumps({'error': str(e)}))
        sys.exit(1)

if __name__ == '__main__':
    main()
