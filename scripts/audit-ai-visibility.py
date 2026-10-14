"""Read-only HTTP audit. Run with --base-url for a local production server.

Writes an evidence report only; never edits CMS content or invokes AI engines.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from html.parser import HTMLParser
import json
from pathlib import Path
import subprocess
import tempfile
import xml.etree.ElementTree as ET


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.skip = 0
        self.text = []
        self.canonical = None
        self.robots = []
        self.schemas = []
        self.schema_errors = []
        self.schema = None
        self.headings = []
        self.heading = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in ('script', 'style', 'noscript'):
            self.skip += 1
        if tag == 'script' and attrs.get('type') == 'application/ld+json':
            self.schema = ''
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonical = attrs.get('href')
        if tag == 'meta' and attrs.get('name') in ('robots', 'googlebot'):
            self.robots.append(attrs.get('content'))
        if tag == 'h1' and not self.skip:
            self.heading = ''

    def handle_endtag(self, tag):
        if tag == 'script' and self.schema is not None:
            try:
                self.schemas.append(json.loads(self.schema))
            except ValueError as error:
                self.schema_errors.append(str(error))
            self.schema = None
        if tag in ('script', 'style', 'noscript'):
            self.skip = max(0, self.skip - 1)
        if tag == 'h1' and self.heading is not None:
            self.headings.append(self.heading.strip())
            self.heading = None

    def handle_data(self, data):
        if self.schema is not None:
            self.schema += data
        if not self.skip:
            self.text.append(data)
            if self.heading is not None:
                self.heading += data


def fetch(url):
    with tempfile.NamedTemporaryFile() as header_file:
        result = subprocess.run(['curl', '-sS', '-L', '--max-time', '40',
                                 '-D', header_file.name,
                                 '-w', '\n%{http_code}\n%{url_effective}', url],
                                capture_output=True, text=True)
        headers = Path(header_file.name).read_text()
    if result.returncode:
        return {'url': url, 'error': result.stderr.strip()}
    body, status, final = result.stdout.rsplit('\n', 2)
    # Keep only audit-relevant headers, never response cookies.
    chain = []
    for line in headers.splitlines():
        if line.startswith('HTTP/'):
            chain.append({'status_line': line, 'headers': {}})
        elif ':' in line and chain:
            key, value = line.split(':', 1)
            if key.lower() in ('x-robots-tag', 'location', 'content-type'):
                chain[-1]['headers'][key.lower()] = value.strip()
    return {'url': url, 'status': int(status), 'final_url': final,
            'response_chain': chain, 'body': body}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--base-url', default='https://www.thetouchlinedribble.in')
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    base = args.base_url.rstrip('/')
    paths = ['/', '/about', '/learn', '/subscribe',
             '/post/why-do-football-websites-show-different-stats-for-the-same-player',
             '/post/why-do-teams-keep-passing-back-to-the-goalkeeper',
             '/stories/calciopoli-the-game-behind-the-game', '/post/1791229918420']
    sitemap, robots = list(ThreadPoolExecutor(2).map(fetch, [base + '/sitemap.xml', base + '/robots.txt']))
    try:
        urls = [node.text for node in ET.fromstring(sitemap.get('body', '')).iter()
                if node.tag.endswith('}loc')]
    except ET.ParseError:
        urls = []
    pages = []
    for response in ThreadPoolExecutor(4).map(fetch, [base + p for p in paths]):
        body = response.pop('body', '')
        page = Page()
        page.feed(body)
        response.update(canonical=page.canonical, robots=page.robots,
                        h1=page.headings, text_words=len(' '.join(page.text).split()),
                        text_sample=' '.join(' '.join(page.text).split())[:350],
                        schemas=page.schemas, schema_errors=page.schema_errors,
                        in_sitemap=page.canonical in urls if page.canonical else False,
                        client_render_bailouts=body.count('BAILOUT_TO_CLIENT_SIDE_RENDERING'))
        pages.append(response)
    sitemap.pop('body', None)
    report = {'checked_at': datetime.now(timezone.utc).isoformat(), 'base_url': base,
              'method': 'Raw HTTP HTML; scripts/styles/noscript excluded from text. Streaming hidden content may be included. Not a Search Console indexing test.',
              'sitemap': sitemap, 'sitemap_url_count': len(urls), 'robots': robots,
              'pages': pages}
    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    Path(args.output).write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps([{k: p[k] for k in ('url', 'status', 'text_words', 'h1', 'client_render_bailouts') if k in p} for p in pages], indent=2))


if __name__ == '__main__':
    main()
