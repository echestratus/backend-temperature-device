const {pool} = require('../configs/db');
const createError = require('http-errors');

const selectAllUsers = (orderBy, order, limit, offset, search) => {
    return pool.query(`SELECT users.id, users.name, users.username, users.email, users.phone, users.role, users.created_at, users.updated_at FROM users WHERE (users.name ILIKE '%' || COALESCE(NULLIF($1, ''), '') || '%') ORDER BY ${orderBy} ${order} LIMIT $2 OFFSET $3`, [search, limit, offset]);
}

const insertUsers = ({id, name, username, email, phone, hashedPassword, role}) => {
    try {
        return pool.query("INSERT INTO users (id, name, username, email, phone, password_hash, role) VALUES($1, $2, $3, $4, $5, $6, $7)", [id, name, username, email, phone, hashedPassword, role]);
    } catch (err) {
        return next(err);
    }
}

const updateUser = ({id, name, username, email, phone, hashedPassword, role}) => {
    const fields = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) {
        fields.push(`name=$${idx++}`);
        values.push(name); 
    }
    if (username !== undefined) {
        fields.push(`username=$${idx++}`);
        values.push(username);
    }
    if (email !== undefined) {
        fields.push(`email=$${idx++}`);
        values.push(email);
    }
    if (phone !== undefined) {
        fields.push(`phone=$${idx++}`);
        values.push(phone);
    }
    if (hashedPassword !== undefined) {
        fields.push(`password_hash=$${idx++}`);
        values.push(hashedPassword);    
    }
    if (role !== undefined) {
        fields.push(`role=$${idx++}`);
        values.push(role);
    }

    if (fields.length === 0) {
        return next(createError(400, 'No fields to update'));
    }

    values.push(id);

    const query = `UPDATE users SET ${fields.join(', ')}, updated_at=CURRENT_TIMESTAMP WHERE id=$${idx} RETURNING id, name, username, email, phone, role, created_at, updated_at`;

    return pool.query(query, values); 
}

const selectUser = (username) => {
    return pool.query(`SELECT * FROM users WHERE username=$1`, [username]);
}

const selectUserById = (id) => {
    return pool.query(`SELECT * FROM users WHERE id=$1`, [id]);
}

const deleteUser = (id) => {
    return pool.query(`DELETE FROM users WHERE id=$1 RETURNING id, name, username, email, phone, role, created_at, updated_at`, [id]);
}

const totalUsers = () => {
    return pool.query("SELECT COUNT(*) FROM users");
}

module.exports = {
    selectAllUsers,
    insertUsers,
    selectUser,
    updateUser,
    deleteUser,
    selectUserById,
    totalUsers
}