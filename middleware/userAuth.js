
// middlewares/userAuth.js
export default function userAuth(options = {}) {
    return function (req, res, next) {
        if (!req.session?.user) {
            return res.redirect(`/user/${options.role}/login`);
        }
        next();
    };
}
