"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getProfile = exports.login = exports.register = void 0;
const User_1 = require("../models/User");
const jwt_1 = require("../utils/jwt");
const register = async (req, res) => {
    try {
        const userData = req.body;
        // Check if user already exists
        const existingUser = await User_1.UserModel.findByEmail(userData.email);
        if (existingUser) {
            res.status(409).json({ error: 'User already exists with this email' });
            return;
        }
        // Create new user
        const user = await User_1.UserModel.create(userData);
        // Generate tokens
        const tokens = (0, jwt_1.generateTokens)({
            userId: user.id,
            email: user.email,
            role: user.role
        });
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                company: user.company,
                role: user.role
            },
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Find user
        const user = await User_1.UserModel.findByEmail(email);
        if (!user || !user.password_hash) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        // Validate password
        const isValidPassword = await User_1.UserModel.validatePassword(password, user.password_hash);
        if (!isValidPassword) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        // Generate tokens
        const tokens = (0, jwt_1.generateTokens)({
            userId: user.id,
            email: user.email,
            role: user.role
        });
        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                company: user.company,
                role: user.role
            },
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};
exports.login = login;
const getProfile = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        res.json({
            user: {
                id: req.user.id,
                email: req.user.email,
                first_name: req.user.first_name,
                last_name: req.user.last_name,
                company: req.user.company,
                role: req.user.role
            }
        });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const updates = req.body;
        const updatedUser = await User_1.UserModel.updateProfile(req.user.id, updates);
        if (!updatedUser) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};
exports.updateProfile = updateProfile;
//# sourceMappingURL=authController.js.map