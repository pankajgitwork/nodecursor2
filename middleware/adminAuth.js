import { adminPath } from "../routes/paths/adminPath.js";

export default function adminAuth(options = {}) {
    return function (req, res, next) {

        if (options.userType === 'nonAuth') {
            res.locals.layout = options.props.nonAuth.layout;
            res.locals.routes = adminPath;
            next();
        }

        if (options.userType === 'auth') {
            res.locals.layout = options.props.auth.layout;
            res.locals.routes = adminPath;
            if (!req.session?.admin) {
                return res.redirect(adminPath.login.routePath);
            }
            next();
        }

    };
}
