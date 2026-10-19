# worker/tests/test_urls.py
import pytest
from app.errors import UnsafeURL
from app.urls import assert_public_url, normalize_url


def test_normalize_strips_tracking_and_sorts():
    assert normalize_url("HTTPS://Example.com:443/a/?utm_source=x&b=2&a=1#frag") == "https://example.com/a?a=1&b=2"


def test_normalize_same_for_equivalent_urls():
    assert normalize_url("http://example.com/post/") == normalize_url("http://example.com/post?fbclid=abc")


@pytest.mark.parametrize("bad", ["ftp://example.com/x", "javascript:alert(1)", "http://user:pw@example.com/", "/relative"])
def test_normalize_rejects_bad(bad):
    with pytest.raises(ValueError):
        normalize_url(bad)


@pytest.mark.parametrize("url", [
    "http://127.0.0.1/", "http://10.0.0.5/", "http://192.168.1.1/",
    "http://169.254.169.254/latest/meta-data", "http://[::1]/", "http://[::ffff:127.0.0.1]/",
])
def test_blocks_private_addresses(url):
    with pytest.raises(UnsafeURL):
        assert_public_url(url)