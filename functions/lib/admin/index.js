"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//@ts-nocheck
const cf_1 = require("../utils/cf");
const firebase_config_1 = require("../utils/firebase_config");
const userManagement_1 = require("./userManagement");
const get_new_doc = ({ email, displayName }) => {
    return {
        email,
        displayName,
        userType: "admin",
        createdAt: firebase_config_1.serverTimestamp(),
    };
};
const is_admin_email = cf_1.withCallable(async (config, { email }, context) => {
    var _a, _b;
    try {
        const user = await firebase_config_1.auth().getUserByEmail(email);
        return (((_a = user.customClaims) === null || _a === void 0 ? void 0 : _a.admin) === true ||
            ((_b = user.customClaims) === null || _b === void 0 ? void 0 : _b.superAdmin) === true);
    }
    catch (error) {
        if (error.code === "auth/user-not-found")
            throw cf_1.callable_error("not-found", "This email does not correspond to any user!");
        throw error;
    }
}, true);
const Admin = {
    get_new_doc,
    create_admin: userManagement_1.createAdmin,
    is_admin_email,
};
exports.default = Admin;
