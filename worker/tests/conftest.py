# worker/tests/conftest.py
import os
import pathlib

import psycopg
import pytest
from psycopg.rows import dict_row

MIGRATIONS = sorted((pathlib.Path(__file__).parents[2] / "db" / "migrations").glob("*.sql"))


@pytest.fixture(scope="session")
def test_db_url():
    url = os.environ.get("TEST_DATABASE_URL")
    if not url:
        pytest.skip("TEST_DATABASE_URL not set")
    if "test" not in url.rsplit("/", 1)[-1]:
        pytest.fail("Refusing to run: the database name must contain 'test' (the fixture drops the schema)")
    return url


@pytest.fixture()
def conn(test_db_url):
    c = psycopg.connect(test_db_url, autocommit=True, row_factory=dict_row)
    c.execute("drop schema public cascade; create schema public;")
    for m in MIGRATIONS:
        c.execute(m.read_text())
    yield c
    c.close()