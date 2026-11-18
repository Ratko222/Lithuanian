import base64, mimetypes, os, re

def read(path):
    with open(path, encoding='utf-8') as f:
        return f.read()

def data_uri(path):
    mime = {'.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.svg': 'image/svg+xml'}.get(os.path.splitext(path)[1].lower()) or mimetypes.guess_type(path)[0] or 'application/octet-stream'
    with open(path, 'rb') as fh:
        return 'data:%s;base64,%s' % (mime, base64.b64encode(fh.read()).decode())

html = read('index.html')
css = read('style.css')
js = read('app.js')
cats = read('data.json')
for name in sorted(os.listdir('images')):
    if name.startswith('icon-'):
        continue
    cats = cats.replace('images/' + name, data_uri(os.path.join('images', name)))
# fonts referenced from the stylesheet are embedded so the single file works offline
css = re.sub(r"url\((['\"]?)(fonts/[^)'\"]+)\1\)", lambda m: "url(%s)" % data_uri(m.group(2)), css)
grammar = read('grammar.json')
forms = read('forms.json')

boot = js[js.index("Promise.all(['data.json'"):]
js = js.replace(boot, "startApp(%s, %s, %s);\n" % (cats, grammar, forms))
# remove everything that only makes sense when served over HTTP
html = re.sub(r'<link rel="(preconnect|manifest|apple-touch-icon)"[^>]*>\n?', '', html)
html = re.sub(r'<link href="https://fonts\.googleapis\.com[^>]*>\n?', '', html)
html = re.sub(r'<meta name="theme-color"[^>]*>\n?', '', html)
html = re.sub(r'<script>if\("serviceWorker".*?</script>\n?', '', html, flags=re.S)
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>\n' + css + '</style>')
html = html.replace('<script src="exam.js"></script>', '<script>\n' + read('exam.js') + '</script>')
html = html.replace('<script src="app.js"></script>', '<script>\n' + js + '</script>')
with open('lithuanian-flashcards.html', 'w', encoding='utf-8') as f:
    f.write(html)
