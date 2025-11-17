"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_js_1 = __importDefault(require("./routes/auth.js"));
const parent_auth_js_1 = __importDefault(require("./routes/parent-auth.js"));
const parent_dashboard_js_1 = __importDefault(require("./routes/parent-dashboard.js"));
const demo_setup_js_1 = __importDefault(require("./routes/demo-setup.js"));
const tenant_js_1 = __importDefault(require("./routes/tenant.js"));
const patients_js_1 = __importDefault(require("./routes/patients.js"));
const parent_children_js_1 = __importDefault(require("./routes/parent-children.js"));
const subscriptions_js_1 = __importDefault(require("./routes/subscriptions.js"));
const parent_subscriptions_js_1 = __importDefault(require("./routes/parent-subscriptions.js"));
const features_js_1 = __importDefault(require("./routes/features.js"));
const super_admin_js_1 = __importDefault(require("./routes/super-admin.js"));
const tenant_js_2 = require("./middleware/tenant.js");
const __dirname = path_1.default.resolve();
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((req, res, next) => {
    if (req.path.startsWith('/api/super-admin')) {
        return next();
    }
    (0, tenant_js_2.extractTenant)(req, res, next);
});
app.use('/api/auth', auth_js_1.default);
app.use('/api/parent-auth', parent_auth_js_1.default);
app.use('/api/parent-dashboard', parent_dashboard_js_1.default);
app.use('/api/demo', demo_setup_js_1.default);
app.use('/api/tenant', tenant_js_1.default);
app.use('/api/patients', patients_js_1.default);
app.use('/api/parent-children', parent_children_js_1.default);
app.use('/api/subscriptions', subscriptions_js_1.default);
app.use('/api/parent-subscriptions', parent_subscriptions_js_1.default);
app.use('/api', features_js_1.default);
app.use('/api/super-admin', super_admin_js_1.default);
const clientDir = path_1.default.resolve(__dirname, '../dist');
app.use(express_1.default.static(clientDir));
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/'))
        return next();
    return res.sendFile(path_1.default.join(clientDir, 'index.html'));
});
app.use('/api/health', (req, res, next) => {
    return res.status(200).json({
        success: true,
        message: 'ok',
        tenant: req.tenant || null,
    });
});
const errorHandler = (error, req, res, next) => {
    console.error('Server error:', error);
    return res.status(500).json({
        success: false,
        error: 'Server internal error',
    });
};
app.use(errorHandler);
const notFoundHandler = (req, res) => {
    return res.status(404).json({
        success: false,
        error: 'API not found',
    });
};
app.use(notFoundHandler);
exports.default = app;
//# sourceMappingURL=app.js.map