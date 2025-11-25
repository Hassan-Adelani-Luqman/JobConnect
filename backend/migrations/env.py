from __future__ import with_statement

import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# Add the src directory to the path so we can import models
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

# Import the db and models
from models.user import db
from models.job import Job, Application, SavedJob  # Import all models
from models.user import User

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    try:
        fileConfig(config.config_file_name)
    except Exception:
        # Ignore logging config errors (some ini files may not include
        # all expected logger sections in this repository layout).
        pass

# If your models' MetaData is available, import it here
# and set target_metadata = mymodel.Base.metadata
target_metadata = db.metadata


def get_sqlalchemy_url():
    # Default to the sqlalchemy.url in alembic.ini; if not set, derive from app
    url = config.get_main_option('sqlalchemy.url')
    if url:
        return url
    # Fallback: derive from application config (assumes standard layout)
    here = os.path.dirname(os.path.dirname(__file__))
    db_path = os.path.join(here, 'src', 'database', 'app.db')
    return f"sqlite:///{db_path}"


def run_migrations_offline():
    url = get_sqlalchemy_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    configuration = config.get_section(config.config_ini_section)
    configuration['sqlalchemy.url'] = get_sqlalchemy_url()
    connectable = engine_from_config(
        configuration,
        prefix='sqlalchemy.',
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
