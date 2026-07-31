import json
import re

with open(r'C:\Users\Nuel\.gemini\antigravity\brain\1f0bf787-b130-4776-aaa6-82e9f23429b0\.system_generated\steps\967\content.md', 'r', encoding='utf-8') as f:
    text = f.read()

matches = re.findall(r'self\.__next_f\.push\(\[1,\"(.*?)\"\]\)', text)
result = []
for m in matches:
    try:
        decoded = json.loads(f'"{m}"')
        if 'Find Moments' in decoded:
            result.append(decoded)
    except Exception as e:
        pass

with open('moments_docs.md', 'w', encoding='utf-8') as out:
    out.write('\n\n---\n\n'.join(result))
