#!/usr/bin/env python3
"""Generate daily fan reaction cache from r/soccer hot posts + comments.

Pipeline:
1) Fetch hot posts and top comments (PRAW if credentials exist, fallback to Reddit JSON).
2) Extract topic entities/keywords from comments (spaCy when available).
3) Score comments with a sentiment model (Transformers when available, lexicon fallback).
4) Write static JSON cache used by the frontend API.
"""

from __future__ import annotations

import argparse
import json
import math
import os
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Tuple

import requests

try:
    import praw  # type: ignore
except Exception:  # pragma: no cover
    praw = None

try:
    import spacy  # type: ignore
except Exception:  # pragma: no cover
    spacy = None

try:
    from transformers import pipeline as hf_pipeline  # type: ignore
except Exception:  # pragma: no cover
    hf_pipeline = None


TOPIC_LABELS: Dict[str, str] = {
    "epl": "Premier League",
    "ucl": "Champions League",
    "laliga": "La Liga",
    "seriea": "Serie A",
    "bundesliga": "Bundesliga",
    "transfers": "Transfers",
}

TOPIC_KEYWORDS: Dict[str, List[str]] = {
    "epl": [
        "premier league",
        "epl",
        "arsenal",
        "liverpool",
        "chelsea",
        "man city",
        "manchester city",
        "manchester united",
        "tottenham",
        "spurs",
        "newcastle",
        "aston villa",
    ],
    "ucl": [
        "champions league",
        "ucl",
        "uefa champions league",
        "round of 16",
        "quarter-final",
        "quarterfinal",
        "semi-final",
        "semifinal",
    ],
    "laliga": [
        "la liga",
        "real madrid",
        "barcelona",
        "atletico madrid",
        "girona",
        "athletic club",
        "real sociedad",
    ],
    "seriea": [
        "serie a",
        "juventus",
        "inter",
        "ac milan",
        "milan",
        "napoli",
        "roma",
        "lazio",
        "atalanta",
        "fiorentina",
    ],
    "bundesliga": [
        "bundesliga",
        "bayern",
        "dortmund",
        "leverkusen",
        "leipzig",
        "frankfurt",
        "stuttgart",
    ],
    "transfers": [
        "transfer",
        "here we go",
        "medical",
        "loan",
        "deal agreed",
        "fee",
        "contract",
        "rumour",
        "rumor",
        "signing",
        "bid",
    ],
}

STOPWORDS = {
    "the",
    "and",
    "for",
    "with",
    "this",
    "that",
    "from",
    "have",
    "has",
    "had",
    "was",
    "were",
    "are",
    "is",
    "it",
    "its",
    "about",
    "into",
    "your",
    "their",
    "they",
    "them",
    "our",
    "ours",
    "you",
    "him",
    "her",
    "his",
    "she",
    "who",
    "what",
    "when",
    "where",
    "which",
    "why",
    "how",
    "will",
    "would",
    "could",
    "should",
    "just",
    "also",
    "very",
    "really",
    "football",
    "soccer",
    "match",
    "game",
    "team",
    "teams",
    "player",
    "players",
    "comment",
    "comments",
    "reddit",
    "thread",
    "post",
    "posts",
    "season",
}

POSITIVE_WORDS = {
    "great",
    "amazing",
    "brilliant",
    "excellent",
    "fantastic",
    "love",
    "top",
    "best",
    "quality",
    "class",
    "clinical",
    "deserved",
    "dominant",
    "beautiful",
    "win",
    "winner",
    "victory",
}

NEGATIVE_WORDS = {
    "awful",
    "terrible",
    "worst",
    "disaster",
    "pathetic",
    "hate",
    "fraud",
    "flop",
    "overrated",
    "shocking",
    "embarrassing",
    "rigged",
    "robbed",
    "relegation",
    "loss",
    "defeat",
}

REDDIT_HEADERS = {
    "User-Agent": os.getenv("REDDIT_USER_AGENT", "PitchSideFanPulseBot/1.0"),
    "Accept": "application/json,text/plain,*/*",
}


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def clean_text(text: str) -> str:
    text = re.sub(r"\s+", " ", (text or "")).strip()
    return text


def valid_comment(body: str) -> bool:
    body = clean_text(body).lower()
    if not body or body in {"[removed]", "[deleted]"}:
        return False
    return len(body) >= 16


def to_weight(score: int) -> float:
    safe = max(0, int(score or 0))
    return max(1.0, math.log2(safe + 2))


def to_title_case(text: str) -> str:
    return " ".join(word.capitalize() for word in text.split(" "))


def tokenize(text: str) -> List[str]:
    tokens = re.findall(r"[a-z][a-z0-9'-]{2,}", (text or "").lower())
    return [token for token in tokens if token not in STOPWORDS]


class TopicExtractor:
    """Extract dominant topic from comments via entities + token frequency."""

    def __init__(self) -> None:
        self._nlp = None
        self.name = "Regex keyword frequency"
        if spacy is not None:
            try:
                self._nlp = spacy.load("en_core_web_sm")
                self.name = "spaCy NER + keyword frequency"
            except Exception:
                self._nlp = None

    def extract(self, comments: List[Dict[str, Any]], fallback: str) -> Tuple[str, List[str]]:
        entity_counter: Counter[str] = Counter()
        token_counter: Counter[str] = Counter()

        if self._nlp is not None:
            texts = [comment["body"][:400] for comment in comments]
            for doc, comment in zip(self._nlp.pipe(texts, disable=["parser"]), comments):
                weight = to_weight(comment["score"])
                for ent in doc.ents:
                    if ent.label_ not in {"PERSON", "ORG", "GPE", "EVENT", "NORP", "PRODUCT"}:
                        continue
                    value = clean_text(ent.text).lower()
                    if len(value) < 3:
                        continue
                    entity_counter[value] += weight
                for token in doc:
                    value = token.text.lower()
                    if token.is_alpha and len(value) >= 3 and value not in STOPWORDS:
                        token_counter[value] += weight
        else:
            for comment in comments:
                weight = to_weight(comment["score"])
                for token in tokenize(comment["body"]):
                    token_counter[token] += weight

        detected_topic = fallback
        if entity_counter:
            detected_topic = to_title_case(entity_counter.most_common(1)[0][0])
        elif token_counter:
            detected_topic = to_title_case(token_counter.most_common(1)[0][0])

        keywords = [to_title_case(token) for token, _ in token_counter.most_common(6)]
        return detected_topic, keywords


class SentimentScorer:
    """Score sentiment using HF when available, else lexicon fallback."""

    def __init__(self) -> None:
        self._model = None
        self.name = "Lexicon fallback"
        if hf_pipeline is not None:
            try:
                self._model = hf_pipeline(
                    "sentiment-analysis",
                    model="distilbert-base-uncased-finetuned-sst-2-english",
                )
                self.name = "distilbert-base-uncased-finetuned-sst-2-english"
            except Exception:
                self._model = None

    def _score_lexicon(self, text: str) -> Tuple[float, float, float]:
        lower = text.lower()
        pos = sum(1 for word in POSITIVE_WORDS if word in lower)
        neg = sum(1 for word in NEGATIVE_WORDS if word in lower)
        if pos > neg:
            return 1.0, 0.0, 0.0
        if neg > pos:
            return 0.0, 1.0, 0.0
        return 0.0, 0.0, 1.0

    def score_comments(self, comments: List[Dict[str, Any]]) -> List[Dict[str, float]]:
        texts = [comment["body"][:280] for comment in comments]
        if not texts:
            return []

        if self._model is None:
            return [
                {"positive": p, "negative": n, "neutral": u}
                for p, n, u in (self._score_lexicon(text) for text in texts)
            ]

        scores: List[Dict[str, float]] = []
        for result in self._model(texts, truncation=True, max_length=256):
            label = str(result.get("label", "")).upper()
            confidence = float(result.get("score", 0.0))

            if confidence < 0.60:
                scores.append({"positive": 0.0, "negative": 0.0, "neutral": 1.0})
            elif "POS" in label:
                scores.append({"positive": confidence, "negative": 1.0 - confidence, "neutral": 0.0})
            else:
                scores.append({"positive": 1.0 - confidence, "negative": confidence, "neutral": 0.0})
        return scores


def get_reddit_client() -> Any:
    client_id = os.getenv("REDDIT_CLIENT_ID")
    client_secret = os.getenv("REDDIT_CLIENT_SECRET")
    if not client_id or not client_secret or praw is None:
        return None
    return praw.Reddit(
        client_id=client_id,
        client_secret=client_secret,
        user_agent=os.getenv("REDDIT_USER_AGENT", "PitchSideFanPulseBot/1.0"),
        check_for_async=False,
    )


def fetch_comments_from_json(post_id: str, limit: int) -> List[Dict[str, Any]]:
    url = f"https://www.reddit.com/comments/{post_id}.json?sort=top&limit={limit}"
    response = requests.get(url, headers=REDDIT_HEADERS, timeout=12)
    if response.status_code != 200:
        return []
    payload = response.json()
    listing = payload[1]["data"]["children"] if isinstance(payload, list) and len(payload) > 1 else []
    comments: List[Dict[str, Any]] = []
    for node in listing:
        data = node.get("data", {})
        body = clean_text(data.get("body", ""))
        if not valid_comment(body):
            continue
        comments.append(
            {
                "author": data.get("author") or "Reddit user",
                "body": body[:260],
                "score": int(data.get("score") or 0),
                "created": datetime.fromtimestamp(float(data.get("created_utc") or 0), tz=timezone.utc).isoformat(),
                "permalink": f"https://www.reddit.com{data.get('permalink', '')}",
            }
        )
        if len(comments) >= limit:
            break
    return comments


def fetch_posts_via_json(hot_limit: int, comments_limit: int) -> List[Dict[str, Any]]:
    response = requests.get(
        f"https://www.reddit.com/r/soccer/hot.json?limit={hot_limit}",
        headers=REDDIT_HEADERS,
        timeout=12,
    )
    response.raise_for_status()
    payload = response.json()
    nodes = payload.get("data", {}).get("children", [])

    posts: List[Dict[str, Any]] = []
    for node in nodes:
        data = node.get("data", {})
        post_id = data.get("id")
        if not post_id:
            continue
        comments = fetch_comments_from_json(post_id, comments_limit)
        if not comments:
            continue
        posts.append(
            {
                "id": post_id,
                "title": clean_text(data.get("title", "")),
                "selftext": clean_text(data.get("selftext", "")),
                "score": int(data.get("score") or 0),
                "numComments": int(data.get("num_comments") or 0),
                "created": datetime.fromtimestamp(float(data.get("created_utc") or 0), tz=timezone.utc).isoformat(),
                "link": f"https://www.reddit.com{data.get('permalink', '')}",
                "subreddit": data.get("subreddit_name_prefixed", "r/soccer"),
                "topComments": comments,
            }
        )
    return posts


def fetch_posts_via_praw(client: Any, hot_limit: int, comments_limit: int) -> List[Dict[str, Any]]:
    posts: List[Dict[str, Any]] = []
    subreddit = client.subreddit("soccer")
    for submission in subreddit.hot(limit=hot_limit):
        try:
            submission.comment_sort = "top"
            submission.comments.replace_more(limit=0)
        except Exception:
            continue

        comments: List[Dict[str, Any]] = []
        for comment in submission.comments.list():
            body = clean_text(getattr(comment, "body", ""))
            if not valid_comment(body):
                continue
            comments.append(
                {
                    "author": getattr(comment, "author", "Reddit user") or "Reddit user",
                    "body": body[:260],
                    "score": int(getattr(comment, "score", 0) or 0),
                    "created": datetime.fromtimestamp(float(getattr(comment, "created_utc", 0) or 0), tz=timezone.utc).isoformat(),
                    "permalink": f"https://www.reddit.com{getattr(comment, 'permalink', '')}",
                }
            )
            if len(comments) >= comments_limit:
                break

        if not comments:
            continue

        posts.append(
            {
                "id": submission.id,
                "title": clean_text(submission.title),
                "selftext": clean_text(submission.selftext or ""),
                "score": int(submission.score or 0),
                "numComments": int(submission.num_comments or 0),
                "created": datetime.fromtimestamp(float(submission.created_utc or 0), tz=timezone.utc).isoformat(),
                "link": f"https://www.reddit.com{submission.permalink}",
                "subreddit": submission.subreddit_name_prefixed,
                "topComments": comments,
            }
        )
    return posts


def post_matches_topic(post: Dict[str, Any], topic_key: str) -> bool:
    keywords = TOPIC_KEYWORDS.get(topic_key, [])
    blob = f"{post.get('title', '')} {post.get('selftext', '')}".lower()
    return any(keyword in blob for keyword in keywords)


def compute_mood(positive: int, negative: int) -> Tuple[str, str]:
    if positive >= 62:
        return "Very Positive", "🔥"
    if positive >= 46:
        return "Positive", "😊"
    if negative >= 62:
        return "Very Negative", "😤"
    if negative >= 46:
        return "Negative", "😞"
    return "Mixed Reactions", "🤔"


def analyze_topic(
    topic_key: str,
    posts: List[Dict[str, Any]],
    topic_extractor: TopicExtractor,
    sentiment_scorer: SentimentScorer,
) -> Dict[str, Any]:
    fallback_topic = TOPIC_LABELS.get(topic_key, "Football")
    filtered = [post for post in posts if post_matches_topic(post, topic_key)]
    selected_posts = (filtered if filtered else posts)[:4]

    comments: List[Dict[str, Any]] = []
    for post in selected_posts:
        comments.extend(post.get("topComments", []))

    comment_scores = sentiment_scorer.score_comments(comments)
    pos_weight = 0.0
    neg_weight = 0.0
    neutral_weight = 0.0

    positive_examples: List[Tuple[float, str]] = []
    negative_examples: List[Tuple[float, str]] = []

    for comment, scored in zip(comments, comment_scores):
        weight = to_weight(comment["score"])
        pos = scored["positive"]
        neg = scored["negative"]
        neu = scored["neutral"]

        pos_weight += pos * weight
        neg_weight += neg * weight
        neutral_weight += neu * weight

        body = comment["body"]
        if pos > neg and pos > neu:
            positive_examples.append((pos * weight, body))
        elif neg > pos and neg > neu:
            negative_examples.append((neg * weight, body))

    denominator = max(1.0, pos_weight + neg_weight + neutral_weight)
    positive_pct = int(round((pos_weight / denominator) * 100))
    negative_pct = int(round((neg_weight / denominator) * 100))
    neutral_pct = max(0, 100 - positive_pct - negative_pct)
    mood, mood_emoji = compute_mood(positive_pct, negative_pct)

    detected_topic, keywords = topic_extractor.extract(comments, fallback_topic)

    positive_examples.sort(key=lambda item: item[0], reverse=True)
    negative_examples.sort(key=lambda item: item[0], reverse=True)

    reddit_reactions = []
    for post in selected_posts:
        reddit_reactions.append(
            {
                "title": post["title"],
                "link": post["link"],
                "created": post["created"],
                "score": post["score"],
                "numComments": post["numComments"],
                "subreddit": post["subreddit"],
                "topComments": post["topComments"][:5],
            }
        )

    return {
        "topic": topic_key,
        "positive": positive_pct if comments else 0,
        "negative": negative_pct if comments else 0,
        "neutral": neutral_pct if comments else 0,
        "total": len(comments),
        "analyzedComments": len(comments),
        "topPositive": [text for _, text in positive_examples[:3]],
        "topNegative": [text for _, text in negative_examples[:3]],
        "mood": mood if comments else "No Fan Reactions Yet",
        "moodEmoji": mood_emoji if comments else "🕒",
        "detectedTopic": detected_topic if comments else fallback_topic,
        "topicKeywords": keywords,
        "model": f"{sentiment_scorer.name} + {topic_extractor.name}",
        "headlines": [],
        "redditReactions": reddit_reactions,
        "redditCommentsCount": len(comments),
    }


def generate_cache(
    output_path: Path,
    topics: List[str],
    hot_posts: int,
    comments_per_post: int,
    no_network: bool,
) -> None:
    if no_network:
        if output_path.exists():
            print(f"No-network mode: keeping existing cache at {output_path}")
            return
        raise RuntimeError("No-network mode requested, but no existing cache file was found.")

    client = get_reddit_client()
    posts: List[Dict[str, Any]] = []
    if client is not None:
        try:
            posts = fetch_posts_via_praw(client, hot_posts, comments_per_post)
            print(f"Fetched {len(posts)} posts via PRAW.")
        except Exception as exc:
            print(f"PRAW fetch failed, falling back to JSON endpoint: {exc}")

    if not posts:
        posts = fetch_posts_via_json(hot_posts, comments_per_post)
        print(f"Fetched {len(posts)} posts via Reddit JSON endpoint.")

    if not posts:
        raise RuntimeError("Unable to fetch Reddit hot posts/comments from any source.")

    topic_extractor = TopicExtractor()
    sentiment_scorer = SentimentScorer()

    results: Dict[str, Dict[str, Any]] = {}
    for topic in topics:
        results[topic] = analyze_topic(topic, posts, topic_extractor, sentiment_scorer)

    payload = {
        "generatedAt": now_iso(),
        "source": "r/soccer hot posts + top comments",
        "topics": results,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Wrote fan pulse cache to {output_path}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate daily fan pulse cache JSON.")
    parser.add_argument(
        "--output",
        default="public/data/fan_pulse_cache.json",
        help="Output JSON file path.",
    )
    parser.add_argument(
        "--topics",
        nargs="*",
        default=list(TOPIC_LABELS.keys()),
        help="Topic keys to generate (default: all configured topics).",
    )
    parser.add_argument(
        "--hot-posts",
        type=int,
        default=8,
        help="Number of hot posts to fetch from r/soccer.",
    )
    parser.add_argument(
        "--comments-per-post",
        type=int,
        default=50,
        help="Maximum top comments to fetch per post.",
    )
    parser.add_argument(
        "--no-network",
        action="store_true",
        help="Do not make network calls; keep existing cache file.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    topics = [topic for topic in args.topics if topic in TOPIC_LABELS]
    if not topics:
        raise RuntimeError("No valid topics selected.")

    generate_cache(
        output_path=Path(args.output),
        topics=topics,
        hot_posts=max(1, args.hot_posts),
        comments_per_post=max(5, args.comments_per_post),
        no_network=bool(args.no_network),
    )


if __name__ == "__main__":
    main()
