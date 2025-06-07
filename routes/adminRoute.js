import express from 'express';
import AdminController from '../controllers/admin/AdminController.js';
import UserController from '../controllers/admin/UserController.js';
import adminAuth from '../middleware/adminAuth.js';
import multer from 'multer';
import { adminPath } from './paths/adminPath.js';

const router = express.Router();
const upload = multer();

/* router.use((req, res, next) => {
    res.locals.layout = 'admin/pages/layout/layout';
    next();
}); */

const props = {
    auth: {
        layout: 'admin/pages/layout/layout'
    },
    nonAuth: {
        layout: 'admin/pages/auth/layout/layout'
    }
}

router.get(adminPath.login.routePath, adminAuth({ props: props, userType: 'nonAuth' }), AdminController.loginPage);
router.post(adminPath.loginAttempt.routePath, adminAuth({ props: props, userType: 'nonAuth' }), upload.none(), AdminController.loginAttempt);
router.get(adminPath.logout.routePath, AdminController.logout);


router.get(adminPath.dashboard.routePath, adminAuth({ props: props, userType: 'auth' }), AdminController.dashboard);
router.get(adminPath.userList.routePath, adminAuth({ props: props, userType: 'auth' }), AdminController.userList);

/* Save User */
router.post(adminPath.userSave.routePath, adminAuth({ props: props, userType: 'auth' }), upload.none(), UserController.userSave);
/* Save User */


router.post(adminPath.userListDatatable.routePath, UserController.listdata);
router.post(adminPath.userGenerateLink.routePath, upload.none(), UserController.generateLink);

router.get(adminPath.genearteLinkModal.routePath, UserController.generateLinkModal);

export default router;
