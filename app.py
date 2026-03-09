from flask import Flask, render_template

app = Flask(__name__)

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

@app.route('/limitations')
def limitations():
    return render_template('limitations.html', active_page='limitations')

@app.route('/about')
def about():
    return render_template('about.html', active_page='about')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
