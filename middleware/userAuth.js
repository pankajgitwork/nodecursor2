import { userPath } from "../routes/paths/userPath.js";

// middlewares/userAuth.js
export default function userAuth(options = {}) {
    return function (req, res, next) {
        if (!req.session?.user) {
            res.locals.routes = userPath;
            return res.redirect(`/user/${options.role}/login`);
        }
        res.locals.routes = userPath;
        next();
    };
}
