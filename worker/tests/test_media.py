import pytest
from app.extract import extract_html_media
from app.ingest import extract_feed_media, is_video_url, parse_feed
from app.urls import assert_public_url
from app.errors import UnsafeURL


def test_is_video_url():
    assert is_video_url("https://example.com/video.mp4") is True
    assert is_video_url("https://example.com/clip.webm") is True
    assert is_video_url("https://www.youtube.com/watch?v=12345") is True
    assert is_video_url("https://youtu.be/12345") is True
    assert is_video_url("https://vimeo.com/12345") is True
    assert is_video_url("https://example.com/stream", mime="video/mp4") is True
    assert is_video_url("https://example.com/photo.jpg") is False
    assert is_video_url("https://example.com/image.png", mime="image/png") is False


def test_extract_feed_media_rss():
    entry = {
        "title": "New Tech Breakthrough",
        "link": "https://example.com/article",
        "media_content": [
            {"url": "https://example.com/image.jpg", "type": "image/jpeg", "medium": "image", "credit": "Reuters"}
        ],
    }
    m = extract_feed_media(entry)
    assert m["media_url"] == "https://example.com/image.jpg"
    assert m["media_type"] == "image"
    assert m["media_source_name"] == "Reuters"
    assert m["media_source_url"] == "https://example.com/article"


def test_extract_feed_media_video():
    entry = {
        "title": "Video Demo",
        "link": "https://example.com/video-story",
        "enclosures": [
            {"href": "https://example.com/video.mp4", "type": "video/mp4"}
        ],
    }
    m = extract_feed_media(entry)
    assert m["media_url"] == "https://example.com/video.mp4"
    assert m["media_type"] == "video"


def test_parse_feed_with_media():
    xml = b"""<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
      <channel>
        <title>Tech Feed</title>
        <link>https://example.com</link>
        <item>
          <title>AI Robot Announcement</title>
          <link>https://example.com/news/1</link>
          <description>Short summary of the robot.</description>
          <media:content url="https://example.com/media/robot.webp" type="image/webp" medium="image">
            <media:credit>Lab Team</media:credit>
          </media:content>
        </item>
      </channel>
    </rss>
    """
    candidates = parse_feed(xml)
    assert len(candidates) == 1
    c = candidates[0]
    assert c.title == "AI Robot Announcement"
    assert c.media_url == "https://example.com/media/robot.webp"
    assert c.media_type == "image"
    assert c.media_source_name == "Lab Team"


def test_extract_html_media_og():
    html = """
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="og:title" content="Quantum Leap" />
        <meta property="og:image" content="/images/quantum.jpg" />
        <meta property="og:image:alt" content="Quantum computer processor" />
        <meta property="og:site_name" content="Tech Digest" />
      </head>
      <body><p>Article body</p></body>
    </html>
    """
    m = extract_html_media(html, "https://example.com/stories/quantum")
    assert m["media_url"] == "https://example.com/images/quantum.jpg"
    assert m["media_type"] == "image"
    assert m["media_alt_text"] == "Quantum computer processor"
    assert m["media_source_name"] == "Tech Digest"


def test_extract_html_video_og():
    html = """
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="og:video" content="https://example.com/trailer.mp4" />
      </head>
      <body></body>
    </html>
    """
    m = extract_html_media(html, "https://example.com/preview")
    assert m["media_url"] == "https://example.com/trailer.mp4"
    assert m["media_type"] == "video"


def test_assert_public_url_blocks_private_media():
    with pytest.raises(UnsafeURL):
        assert_public_url("http://127.0.0.1/private.jpg")
    with pytest.raises(UnsafeURL):
        assert_public_url("http://169.254.169.254/latest/meta-data")
    with pytest.raises(UnsafeURL):
        assert_public_url("http://10.0.0.5/video.mp4")
