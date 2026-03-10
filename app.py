import os
import json
import urllib.request
import urllib.error
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# ── Page routes ──────────────────────────────────────────
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

# ── DeepSeek Chat API route ───────────────────────────────
@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        user_message  = data.get('message', '').strip()
        page_context  = data.get('pageContext', '').strip()
        history       = data.get('history', [])   # list of {role, content}

        if not user_message:
            return jsonify({'error': 'Empty message'}), 400

        api_key = os.environ.get('DEEPSEEK_API_KEY', '')
        if not api_key:
            return jsonify({'error': 'API key not configured'}), 500

        # ── System prompt ────────────────────────────────
        system_prompt = """You are an AI assistant for Kelvin Kee Kwong Yew's Final Year Project (FYP) titled:
"Understanding Player Behaviour and Predicting Churn in Genshin Impact".

This is a data science / machine learning FYP submitted to UTS under supervisor Dr. Tanalachimi A/P Ganapathy.

== STUDY OVERVIEW ==
- Survey: 126 active players (171 features), 44 churned players (83 features)
- Models used: Logistic Regression, Random Forest, K-Means clustering, SOM
- Retention model accuracy: 0.97 (weighted F1=0.96)
- 11 at-risk active players identified (Continue_Score ≤ 2)

== KEY FINDINGS ==
- Top retention driver: Event participation (SHAP #1) + Character design (survey: 41 mentions)
- Top churn reason: No time to play (22) > Exploration fatigue (16) > Story not attractive (13)
- Top return condition: Generous rewards (18), Free pulls, Anniversary improvements
- Churn archetypes (K-Means): Watching & Waiting ~36%, Passively Churned ~41%, Permanently Lost ~23%
- LR AUC (churn): 0.708 | RF AUC (churn): 0.648
- SOM QE: 1.6229 (above ideal <1.0), TE: 0.4206

== COMMUNITY DATA ==
- 3 platforms: Google Play Store (EN + ZH reviews), YouTube (official + UGC), Bilibili (ZH) + HoYolab (EN)
- Method: TF-IDF vectorisation + K-Means topic modelling + LLM post-hoc labelling
- Key signal: Engagement drops at every patch-end cycle; Wuthering Waves competitor cluster emerged in Luna Arc

== BUSINESS RECOMMENDATIONS ==
1. Reduce daily resin: 160 → 120/90
2. Free 10-pull per version
3. Upgrade anniversary rewards (free limited 5★ / monthly card)
4. Replace patch-end filler events with innovative replayable content
5. Invest in combat design diversity (not just higher numbers)
6. Expand co-op with non-combat fun multiplayer activities
7. Systematic QoL improvements every other version — starting now
8. Story skip button + manga/CG alternative formats for skipped content

== CURRENT PAGE CONTEXT ==
The user is currently viewing this page content:
---
{page_context}
---

INSTRUCTIONS:
- Answer questions about this FYP study accurately using the knowledge above
- Use the current page context to give more specific and relevant answers
- If asked about something not in this study, say so honestly
- Be concise but informative — 2-4 sentences for simple questions, more for complex ones
- You can respond in English or Chinese depending on what language the user writes in
- Be friendly and helpful, like a knowledgeable research assistant
""".format(page_context=page_context[:3000] if page_context else "No specific page context provided.")

        # ── Build messages ────────────────────────────────
        messages = [{"role": "system", "content": system_prompt}]

        # Include last 6 history messages for context
        for h in history[-6:]:
            if h.get('role') in ('user', 'assistant') and h.get('content'):
                messages.append({"role": h['role'], "content": h['content']})

        messages.append({"role": "user", "content": user_message})

        # ── Call DeepSeek API ─────────────────────────────
        payload = json.dumps({
            "model": "deepseek-chat",
            "messages": messages,
            "max_tokens": 600,
            "temperature": 0.6,
        }).encode('utf-8')

        req = urllib.request.Request(
            'https://api.deepseek.com/chat/completions',
            data=payload,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {api_key}'
            }
        )

        with urllib.request.urlopen(req, timeout=30) as resp:
            result_data = json.loads(resp.read().decode('utf-8'))

        reply = result_data['choices'][0]['message']['content']
        return jsonify({'reply': reply})

    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8') if e.fp else str(e)
        return jsonify({'error': f'DeepSeek API error: {e.code}', 'detail': err_body}), 502
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ── Run ──────────────────────────────────────────────────
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
