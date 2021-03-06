const db = require("../db/database.js");
const hat = require("hat");
const validator = require("email-validator");

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

let config;

try {
    config = require('../config/config.json');
} catch (error) {
    console.error(error);
}

const jwtSecret = process.env.JWT_SECRET || config.secret;

const auth = {
    isValidAPIKey: function(apiKey, next, path, res) {
        db.get("SELECT email FROM apikeys WHERE key = ?", apiKey, (err, row) => {
            if (err) {
                return res.status(500).json({
                    errors: {
                        status: 500,
                        source: path,
                        title: "Database error",
                        detail: err.message
                    }
                });
            }

            if (row !== undefined) {
                return next();
            }

            return res.status(401).json({
                errors: {
                    status: 401,
                    source: path,
                    title: "Valid API key",
                    detail: "No valid API key provided."
                }
            });
        });
    },

    getNewAPIKey: function(res, path, email) {
        if (email === undefined || !validator.validate(email)) {
            return res.status(401).json({
                errors: {
                    status: 401,
                    source: path,
                    title: "Valid email",
                    detail: "A valid email address is required to obtain an API key."
                }
            });
        }

        db.get("SELECT email, key FROM apikeys WHERE email = ?", email, (err, row) => {
            if (err) {
                return res.status(500).json({
                    errors: {
                        status: 500,
                        source: path,
                        title: "Database error",
                        detail: err.message
                    }
                });
            }

            if (row !== undefined) {
                return res.json({
                    data: {
                        message: "Email address already used for api key.",
                        apiKey: row.key
                    }
                });
            }

            return auth.getUniqueAPIKey(res, path, email);
        });
    },

    getUniqueAPIKey: function(res, path, email) {
        const apiKey = hat();

        db.get("SELECT key FROM apikeys WHERE key = ?", apiKey, (err, row) => {
            if (err) {
                return res.status(401).json({
                    errors: {
                        status: 401,
                        source: path,
                        title: "Database error",
                        detail: err.message
                    }
                });
            }

            if (row === undefined) {
                db.run("INSERT INTO apikeys (key, email) VALUES (?, ?)",
                    apiKey,
                    email, (err) => {
                        if (err) {
                            return res.status(401).json({
                                errors: {
                                    status: 401,
                                    source: path,
                                    title: "Database error",
                                    detail: err.message
                                }
                            });
                        }

                        return res.json({ data: { key: apiKey }});
                    });
            } else {
                return auth.getUniqueAPIKey(res, email);
            }
        });
    },

    login: function(res, body) {
        const email = body.email;
        const password = body.password;
        const apiKey = body.api_key;

        if (!email || !password) {
            return res.status(401).json({
                errors: {
                    status: 401,
                    source: "/login",
                    title: "Email or password missing",
                    detail: "Email or password missing in request"
                }
            });
        }

        db.get("SELECT * FROM users WHERE apiKey = ? AND email = ?",
            apiKey,
            email,
            (err, rows) => {
                if (err) {
                    return res.status(500).json({
                        errors: {
                            status: 500,
                            source: "/login",
                            title: "Database error",
                            detail: err.message
                        }
                    });
                }

                if (rows === undefined) {
                    return res.status(401).json({
                        errors: {
                            status: 401,
                            source: "/login",
                            title: "User not found",
                            detail: "User with provided email not found."
                        }
                    });
                }

                const user = rows;

                bcrypt.compare(password, user.password, (err, result) => {
                    if (err) {
                        return res.status(500).json({
                            errors: {
                                status: 500,
                                source: "/login",
                                title: "bcrypt error",
                                detail: "bcrypt error"
                            }
                        });
                    }

                    if (result) {
                        let payload = { api_key: user.apiKey, email: user.email };
                        let jwtToken = jwt.sign(payload, jwtSecret, { expiresIn: '24h' });

                        return res.json({
                            data: {
                                type: "success",
                                message: "User logged in",
                                user: payload,
                                token: jwtToken
                            }
                        });
                    }

                    return res.status(401).json({
                        errors: {
                            status: 401,
                            source: "/login",
                            title: "Wrong password",
                            detail: "Password is incorrect."
                        }
                    });
                });
            });
    },

    register: function(res, body) {
        const email = body.email;
        const password = body.password;
        const apiKey = body.api_key;

        if (!email || !password) {
            return res.status(401).json({
                errors: {
                    status: 401,
                    source: "/register",
                    title: "Email or password missing",
                    detail: "Email or password missing in request"
                }
            });
        }

        bcrypt.hash(password, 10, function(err, hash) {
            if (err) {
                return res.status(500).json({
                    errors: {
                        status: 500,
                        source: "/register",
                        title: "bcrypt error",
                        detail: "bcrypt error"
                    }
                });
            }

            db.run("INSERT INTO users (apiKey, email, password) VALUES (?, ?, ?)",
                apiKey,
                email,
                hash, (err) => {
                    if (err) {
                        return res.status(500).json({
                            errors: {
                                status: 500,
                                source: "/register",
                                title: "Database error",
                                detail: err.message
                            }
                        });
                    }

                    return res.status(201).json({
                        data: {
                            message: "User successfully registered."
                        }
                    });
                });
        });
    },

    checkToken: function(req, res, next) {
        var token = req.headers['x-access-token'];

        if (token) {
            jwt.verify(token, jwtSecret, function(err, decoded) {
                if (err) {
                    return res.status(500).json({
                        errors: {
                            status: 500,
                            source: req.path,
                            title: "Failed authentication",
                            detail: err.message
                        }
                    });
                }

                req.user = {};
                req.user.api_key = decoded.api_key;
                req.user.email = decoded.email;

                next();

                return undefined;
            });
        } else {
            return res.status(401).json({
                errors: {
                    status: 401,
                    source: req.path,
                    title: "No token",
                    detail: "No token provided in request headers"
                }
            });
        }
    }
};

module.exports = auth;
