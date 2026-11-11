"""support multi day bookings

Revision ID: ad3b2c94fae6
Revises: 54b61537948b
Create Date: 2026-10-29 12:15:44.725566

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = 'ad3b2c94fae6'
down_revision: Union[str, Sequence[str], None] = '54b61537948b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Preserve existing booking dates by renaming the column.
    op.alter_column(
        "booking",
        "booking_date",
        new_column_name="check_in_date",
        existing_type=sa.Date(),
        existing_nullable=False,
    )

    # Add checkout date as nullable first so existing rows remain valid.
    op.add_column(
        "booking",
        sa.Column("check_out_date", sa.Date(), nullable=True),
    )

    # For existing bookings, use the original date as checkout date.
    op.execute(
        "UPDATE booking "
        "SET check_out_date = check_in_date "
        "WHERE check_out_date IS NULL"
    )

    # Require checkout dates after populating existing records.
    op.alter_column(
        "booking",
        "check_out_date",
        existing_type=sa.Date(),
        existing_nullable=True,
        nullable=False,
    )


def downgrade() -> None:
    # Remove the new checkout date.
    op.drop_column("booking", "check_out_date")

    # Restore the original column name.
    op.alter_column(
        "booking",
        "check_in_date",
        new_column_name="booking_date",
        existing_type=sa.Date(),
        existing_nullable=False,
    )
