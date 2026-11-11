"""merge duplicate migration heads

Revision ID: 54b61537948b
Revises: 82c136fb7997, 23a327e13d63
Create Date: 2026-10-29 12:05:43.241097

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '54b61537948b'
down_revision: Union[str, Sequence[str], None] = ('82c136fb7997', '23a327e13d63')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
