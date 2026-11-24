"""Selects the active Django settings module.

Local development remains the default. Set ``DJANGO_ENV=prod`` to use
``config.settings.prod`` on Render.
"""

import os

if os.getenv('DJANGO_ENV', 'dev').strip().lower() in ('prod', 'production'):
    from .prod import *  # noqa: F401,F403
else:
    from .dev import *  # noqa: F401,F403
