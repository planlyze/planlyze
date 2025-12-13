#!/usr/bin/env python
"""
Database migration script using Flask-Migrate
Run this from the project root directory
"""
from flask_migrate import Migrate, MigrateCommand
from flask_script import Manager
from server.app import app
from server.models import db

migrate = Migrate(app, db)
manager = Manager(app)
manager.add_command('db', MigrateCommand)

if __name__ == '__main__':
    manager.run()
