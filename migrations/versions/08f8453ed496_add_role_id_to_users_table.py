"""Add role_id to users table

Revision ID: 08f8453ed496
Revises: 2dff4f9ffa8c
Create Date: 2025-12-18 13:25:20.299613

"""
from alembic import op
import sqlalchemy as sa
import uuid


revision = '08f8453ed496'
down_revision = '2dff4f9ffa8c'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    
    roles_exist = conn.execute(sa.text("SELECT COUNT(*) FROM roles")).scalar()
    
    if roles_exist == 0:
        roles_data = [
            {
                'id': str(uuid.uuid4()),
                'name': 'super_admin',
                'description': 'Super Administrator with full system access',
                'permissions': '{"users": ["create", "read", "update", "delete", "manage_roles"], "analyses": ["create", "read", "update", "delete", "view_all"], "payments": ["create", "read", "update", "delete", "approve"], "settings": ["read", "update"], "roles": ["create", "read", "update", "delete"], "system": ["full_access"]}'
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'admin',
                'description': 'Administrator with management access',
                'permissions': '{"users": ["read", "update"], "analyses": ["read", "view_all"], "payments": ["read", "approve"], "settings": ["read"], "roles": ["read"]}'
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'user',
                'description': 'Regular user with basic access',
                'permissions': '{"analyses": ["create", "read", "update", "delete"], "payments": ["create", "read"], "profile": ["read", "update"]}'
            }
        ]
        for role in roles_data:
            conn.execute(sa.text(
                "INSERT INTO roles (id, name, description, permissions, created_at) VALUES (:id, :name, :description, CAST(:permissions AS JSON), NOW())"
            ), role)
    
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('role_id', sa.String(length=36), nullable=True))
        batch_op.create_foreign_key('fk_users_role_id', 'roles', ['role_id'], ['id'])
    
    role_mappings = conn.execute(sa.text("SELECT id, name FROM roles")).fetchall()
    role_map = {row[1]: row[0] for row in role_mappings}
    
    for role_name, role_id in role_map.items():
        conn.execute(sa.text(
            "UPDATE users SET role_id = :role_id WHERE role = :role_name"
        ), {'role_id': role_id, 'role_name': role_name})
    
    default_role_id = role_map.get('user')
    if default_role_id:
        conn.execute(sa.text(
            "UPDATE users SET role_id = :role_id WHERE role_id IS NULL"
        ), {'role_id': default_role_id})
    
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('role')


def downgrade():
    conn = op.get_bind()
    
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('role', sa.VARCHAR(length=50), autoincrement=False, nullable=True))
    
    conn.execute(sa.text("""
        UPDATE users SET role = (SELECT name FROM roles WHERE roles.id = users.role_id)
    """))
    
    conn.execute(sa.text("UPDATE users SET role = 'user' WHERE role IS NULL"))
    
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_constraint('fk_users_role_id', type_='foreignkey')
        batch_op.drop_column('role_id')
