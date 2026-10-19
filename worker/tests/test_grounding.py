# worker/tests/test_grounding.py
from app.grounding import EvidenceItem, validate_summary
from app.schemas import Claim, Summary

TEXT = ("Lab X said on Tuesday that Model Y is a new reasoning model. The company said it scored 87 percent "
        "on an internal benchmark and is available to developers through its API.")
EV = [EvidenceItem(0, "a1", "Lab X Blog", "https://labx.example/y", TEXT, True)]


def make(**kw):
    base = dict(sufficient_evidence=True, headline="Lab X releases Model Y reasoning model",
                card_summary="Lab X has released Model Y, a new reasoning model that developers can use through its API.",
                what_happened="Lab X said Model Y is a new reasoning model and is available to developers through its API.",
                why_it_matters="", uncertain="", conflicting_reports=False,
                claims=[Claim(text="Model Y is a reasoning model", source_index=0, quote="Model Y is a new reasoning model"),
                        Claim(text="Available via API", source_index=0, quote="available to developers through its API")])
    base.update(kw)
    return Summary(**base)


def test_valid_summary_passes():
    assert validate_summary(make(), EV, limited=False).ok


def test_invented_number_fails():
    r = validate_summary(make(what_happened=make().what_happened + " It scored 95 percent on the benchmark."), EV, limited=False)
    assert not r.ok and any("95" in p for p in r.problems)


def test_number_from_source_passes():
    assert validate_summary(make(what_happened=make().what_happened + " The company said it scored 87 percent."), EV, limited=False).ok


def test_fabricated_quote_in_claim_fails():
    bad = make(claims=[Claim(text="x", source_index=0, quote="Model Y will replace every human worker"),
                       Claim(text="y", source_index=0, quote="available to developers through its API")])
    assert not validate_summary(bad, EV, limited=False).ok


def test_invented_quotation_in_text_fails():
    r = validate_summary(make(card_summary='Lab X said Model Y is "the most powerful system ever built" and is now available to developers.'), EV, limited=False)
    assert not r.ok


def test_url_fails():
    assert not validate_summary(make(card_summary="Read more at https://evil.example about Model Y from Lab X today, available now."), EV, limited=False).ok