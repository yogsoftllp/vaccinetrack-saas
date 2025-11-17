"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateParent = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const supabase_js_1 = require("../lib/supabase.js");
const authenticateParent = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({
                error: 'Access denied',
                details: 'No token provided'
            });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (decoded.userType !== 'parent') {
            return res.status(403).json({
                error: 'Access denied',
                details: 'Invalid user type'
            });
        }
        const { data: parent, error } = await supabase_js_1.supabase
            .from('parents')
            .select('*')
            .eq('id', decoded.userId)
            .eq('is_active', true)
            .single();
        if (error || !parent) {
            return res.status(401).json({
                error: 'Access denied',
                details: 'Invalid token or user not found'
            });
        }
        req.parent = parent;
        req.user = {
            userId: parent.id,
            email: parent.email,
            userType: 'parent'
        };
        next();
        return;
    }
    catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({
            error: 'Access denied',
            details: 'Invalid token'
        });
        return;
    }
};
exports.authenticateParent = authenticateParent;
//# sourceMappingURL=parentAuth.js.map