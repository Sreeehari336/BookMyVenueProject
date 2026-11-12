# Backend setup

## Local development

Install the backend dependencies:

```powershell
python -m pip install -r backend/requirements.txt
```

Set `DATABASE_URL`, `SECRET_KEY`, and `ALGORITHM` in `backend/app/.env`, then
run the API from `backend/app`:

```powershell
python create_table.py
uvicorn main:app --reload
```

The local database URL defaults to
`mysql+pymysql://root:root@localhost:3306/bookmyvenue` when `DATABASE_URL` is
not set. Use a separate database and strong secrets for any hosted demo.

## Hosted demo configuration

Configure these environment variables on the API host:

- `DATABASE_URL`: Railway's MySQL connection URL. `mysql://` URLs are
  automatically adapted for PyMySQL.
- `SECRET_KEY`: a randomly generated signing key for login tokens.
- `ALGORITHM`: `HS256`.
- `CORS_ORIGINS`: comma-separated allowed frontend origins, including the
  deployed Vercel URL.

The existing Alembic history does not create the initial tables on a fresh
database. For a new demo database, run `python create_table.py` from
`backend/app` before starting the API. This creates missing tables from the
current models; it is a simple demo bootstrap, not a production migration
strategy.