
import express from 'express';
import UserController from '../controllers/user/UserController.js';
import multer from 'multer';
import userAuth from '../middleware/userAuth.js';
import { userPath } from './paths/userPath.js';

const upload = multer();

const router = express.Router();

// (Optional) ensure user layout is used:
router.use((req, res, next) => {
    res.locals.layout = 'user/pages/layout/layout';
    next();
});

router.get(userPath.receiverLogout.routePath, UserController.receiverLogout);
router.get(userPath.senderLogout.routePath, UserController.senderLogout);

router.get(userPath.senderLogin.routePath, UserController.senderLoginPage);
router.post(userPath.senderLoginAttempt.routePath, upload.none(), UserController.senderLoginAttempt);


router.get(userPath.receiverLogin.routePath, UserController.recevierLoginPage);
router.post(userPath.receiverLoginAttempt.routePath, upload.none(), UserController.receiverLoginAttempt);


router.get(userPath.sender.routePath, userAuth({ role: 'sender' }), UserController.senderPage);
router.get(userPath.receiver.routePath, userAuth({ role: 'receiver' }), UserController.receiverPage);



export default router;
