import os
import json
import urllib.request
import urllib.error
from html.parser import HTMLParser
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)


# ════════════════════════════════════════════════════════
#  HTML → Plain text extractor (no external dependencies)
# ════════════════════════════════════════════════════════
class _TextExtractor(HTMLParser):
    """Strip all HTML tags; skip script/style blocks entirely."""
    SKIP_TAGS = {'script', 'style', 'nav', 'footer', 'head'}

    def __init__(self):
        super().__init__()
        self._skip  = 0
        self.chunks = []

    def handle_starttag(self, tag, attrs):
        if tag in self.SKIP_TAGS:
            self._skip += 1

    def handle_endtag(self, tag):
        if tag in self.SKIP_TAGS and self._skip > 0:
            self._skip -= 1

    def handle_data(self, data):
        if self._skip == 0:
            text = data.strip()
            if text:
                self.chunks.append(text)


def _html_to_text(html: str) -> str:
    p = _TextExtractor()
    p.feed(html)
    # Join chunks, collapse excess whitespace
    raw = ' '.join(p.chunks)
    import re
    return re.sub(r'\s{3,}', '  ', raw).strip()


# ════════════════════════════════════════════════════════
#  Page routes
# ════════════════════════════════════════════════════════
@app.route('/')
def home():
    return render_template('index.html', active_page='home')

@app.route('/research')
def research():
    return render_template('research.html', active_page='research')

@app.route('/methodology')
def methodology():
    return render_template('methodology.html', active_page='methodology')

@app.route('/customer_profile')
def customer_profile():
    return render_template('customer_profile.html', active_page='customer_profile')

@app.route('/result')
def result():
    return render_template('result.html', active_page='result')

@app.route('/community')
def community():
    return render_template('community.html', active_page='community')

@app.route('/recommendations')
def recommendations():
    return render_template('recommendations.html', active_page='recommendations')

@app.route('/limitations')
def limitations():
    return render_template('limitations.html', active_page='limitations')

@app.route('/about')
def about():
    return render_template('about.html', active_page='about')


# ════════════════════════════════════════════════════════
#  Build full-site knowledge base at startup
#  Uses Flask test client to render each page internally —
#  no HTTP requests needed, works before the server starts.
# ════════════════════════════════════════════════════════
PAGES = [
    ('Home',                    '/'),
    ('Research Background',     '/research'),
    ('Methodology',             '/methodology'),
    ('Customer Profile',        '/customer_profile'),
    ('Results',                 '/result'),
    ('Community Analysis',      '/community'),
    ('Business Recommendations','/recommendations'),
    ('Limitations & Future Work','/limitations'),
    ('About',                   '/about'),
]

def _build_site_knowledge() -> str:
    """Render every page with the test client and extract its text."""
    client   = app.test_client()
    sections = []

    for page_name, route in PAGES:
        try:
            resp = client.get(route)
            html = resp.data.decode('utf-8', errors='ignore')
            text = _html_to_text(html)
            # Limit each page to ~1800 chars to keep total token count reasonable
            if len(text) > 1800:
                text = text[:1800] + '…'
            sections.append(f'=== {page_name.upper()} ({route}) ===\n{text}')
        except Exception as e:
            sections.append(f'=== {page_name.upper()} ===\n[Could not extract: {e}]')

    return '\n\n'.join(sections)


# ════════════════════════════════════════════════════════
#  DeepSeek Chat API endpoint
# ════════════════════════════════════════════════════════
_SYSTEM_PROMPT_TEMPLATE = """You are an AI research assistant for Kelvin Kee Kwong Yew's Final Year Project (FYP):
"Understanding Player Behaviour and Predicting Churn in Genshin Impact"
Submitted to UTS, supervised by Dr. Tanalachimi A/P Ganapathy. Student ID: BCS23090011.

== FULL WEBSITE CONTENT (all pages) ==
{site_knowledge}

== CURRENT PAGE THE USER IS VIEWING ==
Page: {current_page}
---
{page_context}
---

INSTRUCTIONS:
- You have full knowledge of every page on this website (see above).
- Prioritise the current page context for specific questions about what the user sees.
- For broader questions, draw from the full site knowledge.
- Answer accurately — if something is not in the study, say so honestly.
- Be concise but thorough: 2–4 sentences for simple questions, more detail for complex ones.
- Respond in the same language the user writes in (English or Chinese).
- Be friendly and helpful, like a knowledgeable research assistant who built this study.
"""


@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data         = request.get_json()
        user_message = data.get('message', '').strip()
        page_context = data.get('pageContext', '').strip()
        current_page = data.get('currentPage', 'Unknown page')
        history      = data.get('history', [])

        if not user_message:
            return jsonify({'error': 'Empty message'}), 400

        api_key = os.environ.get('DEEPSEEK_API_KEY', '')
        if not api_key:
            return jsonify({'error': 'API key not configured on server'}), 500

        system_prompt = _SYSTEM_PROMPT_TEMPLATE.format(
            site_knowledge = _SITE_KNOWLEDGE,
            current_page   = current_page,
            page_context   = page_context[:2000] if page_context else 'No specific context.',
        )

        # Build message list
        messages = [{"role": "system", "content": system_prompt}]
        for h in history[-8:]:
            if h.get('role') in ('user', 'assistant') and h.get('content'):
                messages.append({"role": h['role'], "content": h['content']})
        messages.append({"role": "user", "content": user_message})

        # Call DeepSeek
        payload = json.dumps({
            "model":       "deepseek-chat",
            "messages":    messages,
            "max_tokens":  700,
            "temperature": 0.6,
        }).encode('utf-8')

        req = urllib.request.Request(
            'https://api.deepseek.com/chat/completions',
            data    = payload,
            headers = {
                'Content-Type':  'application/json',
                'Authorization': f'Bearer {api_key}',
            }
        )

        with urllib.request.urlopen(req, timeout=30) as resp:
            result_data = json.loads(resp.read().decode('utf-8'))

        reply = result_data['choices'][0]['message']['content']
        return jsonify({'reply': reply})

    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8') if e.fp else str(e)
        return jsonify({'error': f'DeepSeek API error {e.code}', 'detail': err_body}), 502
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ════════════════════════════════════════════════════════
#  Build full-site knowledge base AFTER all routes registered
# ════════════════════════════════════════════════════════
print('[Chatbot] Building full-site knowledge base…')
_SITE_KNOWLEDGE = _build_site_knowledge()
print(f'[Chatbot] Done — {len(_SITE_KNOWLEDGE):,} characters extracted across {len(PAGES)} pages.')


# ════════════════════════════════════════════════════════
#  Run
# ════════════════════════════════════════════════════════
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
