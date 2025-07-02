const {v4:uuidv4} = require('uuid');
const { selectAllUsers, insertUsers, selectUser, updateUser, deleteUser, totalUsers, selectUserById } = require("../models/users")
const { response } = require("../helper/response");
const createError = require('http-errors');
const bcrypt = require('bcrypt');
const { generateToken, generateRefreshToken } = require('../helper/auth');
const saltRounds = 10;

const getAllUsers = async (req, res, next) => {
    try {
        const adminRole = req.decoded.data.role; // From auth middleware
        if (adminRole !== 'admin') {
            return next(new createError.Unauthorized());
        }

        const orderBy = req.query.orderBy || 'created_at';
        const order = req.query.order || 'DESC';
        const limit = req.query.limit || 2;
        const page = req.query.page || 1;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const totalData = parseInt((await totalUsers()).rows[0].count);
        const totalPage = Math.ceil(totalData / limit);
        const {rows} = await selectAllUsers(orderBy, order, limit, offset, search);
        const pagination = {
            orderBy,
            order,
            limit,
            page,
            offset,
            search,
            totalData,
            totalPage
        }
        return response(res, "success", 200, "Data fetched Successfully", rows, pagination);
    } catch (err) {
        console.error('Error to fetch users: ', err);
        return next(createError.InternalServerError());
    }
}

const getUser = async (req, res, next) => {
    try {
        const adminRole = req.decoded.data.role; // From auth middleware
        if (adminRole !== 'admin') {
            return next(new createError.Unauthorized());
        }
        
        const id = req.params.id;
        const {rows} = await selectUserById(id);
        if (rows.length === 0) {
            return next(createError.NotFound("Users Not Found!"));
        }
        const user = rows[0];
        return response(res, "success", 200, "Data fetched successfully", user)
    } catch (err) {
        console.error('Error to fetch user: ', err);
        return next(createError.InternalServerError());
    }
}

const registerUser = async (req, res, next) => {
    try {    
        const { name, email, phone, username, password, role } = req.body;
        
        // Validate name
        if (!name) {
            return next(createError(400, 'Name is required'));
        }
        if (typeof name !== 'string' || name.length < 2 || name.length > 50) {
            return next(createError(400, 'Name must be a string between 2 and 50 characters'));
        }
        
        // Validate email
        if (!email) {
            return next(createError(400, 'Email is required'));
        }
        const emailRegex = /^[^\s@]+@[^\s@]+.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return next(createError(400, 'Invalid email format'));
        }
        
        // Validate username
        if (!username) {
            return next(createError(400, 'Username is required'));
        }
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(username)) {
            return next(createError(400, 'Username must be 3-20 characters and contain only letters, numbers, and underscores'));
        }
        
        // Validate password
        if (!password) {
            return next(createError(400, 'Password is required'));
        }
        if (password.length < 8) {
            return next(createError(400, 'Password must be at least 8 characters long'));
        }
        
        // Validate phone
        if (!phone) {
            return next(createError(400, 'Phone number is required'));
        }
        // Simple phone regex to allow digits, spaces, dashes, parentheses, plus sign
        const phoneRegex = /^[+\d]?(?:[\d\s-().]*)$/;
        if (!phoneRegex.test(phone)) {
            return next(createError(400, 'Invalid phone number format'));
        }
        if (phone.length < 8) {
            return next(createError(400, 'phone number must be at least 8 characters long'));
        }
        
        // Validate role
        if (!role) {
            return res.status(400).json({ error: 'Role is required' });
        }
        const allowedRoles = ['admin', 'engineer', 'visitor'];
        if (!allowedRoles.includes(role)) {
            return next(createError(400, `Role must be one of the following: ${allowedRoles.join(', ')}`));
        }

        const hashedPassword = bcrypt.hashSync(password, saltRounds);
        const data = {
            id: uuidv4(),
            name: name,
            email: email,
            phone: phone,
            username: username,
            hashedPassword: hashedPassword,
            role: role
        }

        await insertUsers(data);
        return response(res, "success", 200, "Registered successfully");
    } catch(err) {
        return next(new createError.InternalServerError());
    }

}

const loginUser = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return response(res, "failed", 400, "username and password are required"); 
        }
    
        const {rows:[data]} = await selectUser(username);
        
        if (!data) {
            return response(res, "failed", 404, "No user found with that username");
        }
        
        const isPasswordCorrect = bcrypt.compareSync(password, data.password_hash);
    
        if (password.length < 8) {
            return response(res, "failed", 400, "Password must be at least 8 characters long");
        }
        if (!isPasswordCorrect) {
            return response(res, "failed", 404, "Username or Password Incorrect");
        }
    
        const payload = {
            id: data.id,
            name: data.name,
            email: data.email,
            role: data.role
        }
    
        const token = generateToken(payload);
        const refreshToken = generateRefreshToken(payload);
    
        const responseData = {
            email: data.email,
            role: data.role,
            token: token,
            refreshToken: refreshToken
        }
        
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
            secure: false,
            sameSite: 'lax'
        });
        return response(res, "success", 200, "Login Succeed", responseData);
    } catch (err) {
        console.log(err);
        next(new createError.InternalServerError());
    }
}

const editUserProfile = async (req, res, next) => {
    try {
        const id = req.decoded.data.id; // From auth middleware
        const {name, username, email, password, phone, role} = req.body;
    
        // Basic validation
        if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
            return next(createError(400, 'Name must be a non-empty string if provided.'));
        }
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(username) && username !== undefined && typeof username !== 'string') {
            return next(createError(400, 'Username must be 3-20 characters and contain only letters, numbers, and underscores if provided.'));
        }
        const emailRegex = /^[^\s@]+@[^\s@]+.[^\s@]+$/;
        if (!emailRegex.test(email) && email !== undefined && typeof email !== 'string') {
            return next(createError(400, 'Email must be a string and with email format if provided.'));
        }
        if (password !== undefined && password.length < 8  && typeof password !== 'string') {
            return next(createError(400, 'Password must be atleast 8 characters if provided.'));
        }
        if (phone !== undefined && typeof phone !== 'string') {
            return next(createError(400, 'Phone must be a string if provided.'));
        }
        const allowedRoles = ['admin', 'engineer', 'visitor'];
        if (role !== undefined && !allowedRoles.includes(role)) {
            return next(createError(400, `Role must be one of the following: ${allowedRoles.join(', ')}`));
        }
    
        const updateData = {
            id: id,
            name: name ? name.trim() : undefined,
            username: username ? username.trim() : undefined,
            email: email ? email.trim() : undefined,
            phone: phone ? phone.trim() : undefined,
            hashedPassword: password ? bcrypt.hashSync(password, saltRounds) : undefined,
            role: role ? role.trim() : undefined
        };
    
        const updatedUser = await updateUser(updateData);
    
        if (!updatedUser) {
          return res.status(404).json({ message: 'User not found.' });
        }
    
        return res.status(200).json({
          message: 'Profile updated successfully.',
          user: updatedUser.rows[0],
        });
      } catch (error) {
        console.error('Error updating user profile:', error);
        return res.status(500).json({ message: 'Server error. Please try again later.' });
      }
}

const adminEditUserProfile = async (req, res, next) => {
    try {
        const adminRole = req.decoded.data.role; // From auth middleware
        if (adminRole !== 'admin') {
            return next(new createError.Unauthorized());
        }

        const userId = req.params.id;
        // const {rows:[user]} = await selectUserById(userId) || undefined;   
        // if (user === undefined) {
        //     return next(createError.NotFound('User Not Found'));
        // }
        
        const {name, username, email, password, phone, role} = req.body;

        // Basic validation
        if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
            return next(createError(400, 'Name must be a non-empty string if provided.'));
        }
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(username) && username !== undefined && typeof username !== 'string') {
            return next(createError(400, 'Username must be 3-20 characters and contain only letters, numbers, and underscores if provided.'));
        }
        const emailRegex = /^[^\s@]+@[^\s@]+.[^\s@]+$/;
        if (!emailRegex.test(email) && email !== undefined && typeof email !== 'string') {
            return next(createError(400, 'Email must be a string and with email format if provided.'));
        }
        if (password !== undefined && password.length < 8 && typeof password !== 'string') {
            return next(createError(400, 'Password must be atleast 8 characters if provided.'));
        }
        if (phone !== undefined && typeof phone !== 'string') {
            return next(createError(400, 'Phone must be a string if provided.'));
        }
        const allowedRoles = ['admin', 'engineer', 'visitor'];
        if (role !== undefined && !allowedRoles.includes(role)) {
            return next(createError(400, `Role must be one of the following: ${allowedRoles.join(', ')}`));
        }
    
        const updateData = {
            id: userId,
            name: name ? name.trim() : undefined,
            username: username ? username.trim() : undefined,
            email: email ? email.trim() : undefined,
            phone: phone ? phone.trim() : undefined,
            hashedPassword: password ? bcrypt.hashSync(password, saltRounds) : undefined,
            role: role ? role.trim() : undefined
        };
    
        const updatedUser = await updateUser(updateData);
    
        if (!updatedUser) {
          return res.status(404).json({ message: 'User not found.' });
        }
    
        return res.status(200).json({
          message: 'Profile updated successfully.',
          user: updatedUser.rows[0],
        });
      } catch (error) {
        console.error('Error updating user profile:', error);
        return res.status(500).json({ message: 'Server error. Please try again later.' });
      }
}

const deleteUserbyId = async(req, res, next) => {
    try {
        const adminRole = req.decoded.data.role;
        if (adminRole !== 'admin') {
            return next(new createError.Unauthorized());
        }
        const userId = req.params.id;

        const deletedUser = await deleteUser(userId);

        if (!deletedUser) {
            return next(createError.NotFound('User Not Found'));
        }
      
          return res.status(200).json({
            message: 'User deleted successfully',
            user: deletedUser,
          });

    } catch (err) {
        console.error('Error deleting user:', err);
        return next(createError.NotFound());
    }
}



module.exports = {
    getAllUsers,
    registerUser,
    loginUser,
    editUserProfile,
    adminEditUserProfile,
    deleteUserbyId,
    getUser
}
