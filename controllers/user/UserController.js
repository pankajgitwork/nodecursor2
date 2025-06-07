import UserModel from '../../models/UserModel.js';
import LinkModel from '../../models/LinkModel.js';
import UserDevice from '../../models/UserDevice.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { decodeJWT, getBaseUrl } from '../../helpers/helper.js';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween.js';
import { userPath } from '../../routes/paths/userPath.js';
class UserController {

    senderLoginPage(req, res) {
        res.render('user/pages/senderLogin');
    }

    recevierLoginPage(req, res) {
        res.render('user/pages/receiverLogin');
    }

    async senderLoginAttempt(req, res) {

        const { email, password, deviceId }=req.body;

        if (!email||!password) {
            return res.status(200).json({
                status: "error",
                msg: 'Invalid email or password'
            });
        }

        const user=await UserModel.findOne({
            where: { email },
            include: [
                { model: UserDevice, as: 'devices' },
                { model: LinkModel, as: 'link' }
            ]
        });

        if (!user) {
            return res.status(200).json({
                status: "error",
                msg: 'Invalid email or password'
            });
        }

        const match=await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(200).json({
                status: "error",
                msg: 'Invalid email or password'
            });
        }

        req.session.user=user;
        req.session.cookie.maxAge=10*365*24*60*60*1000; // in ms

        req.session.save(async (err) => {
            if (err) {
                return next(err);
            }

            return res.status(200).json({
                status: 'success',
                link: getBaseUrl(req)+userPath.sender.routePath
            });
        });
    }

    async receiverLoginAttempt(req, res) {

        const { email, password, deviceId }=req.body;

        if (!email||!password) {
            return res.status(200).json({
                status: "error",
                msg: 'Invalid email or password'
            });
        }

        const user=await UserModel.findOne({
            where: { email },
            include: [
                { model: UserDevice, as: 'devices' },
                { model: LinkModel, as: 'link' }
            ]
        });

        if (!user) {
            return res.status(200).json({
                status: "error",
                msg: 'Invalid email or password'
            });
        }

        const match=await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(200).json({
                status: "error",
                msg: 'Invalid email or password'
            });
        }

        const devices=user.devices.map(d => d.device_id);

        if (!devices.includes(deviceId)) {

            if (devices.length>=2) {
                return res.status(200).json({
                    status: "error",
                    msg: 'Maximum of 2 devices already registered.'
                });
            }

            await UserDevice.create({ user_id: user.id, device_id: deviceId });
        }

        req.session.user=user;
        req.session.cookie.maxAge=10*365*24*60*60*1000; // in ms
        req.session.isFirstLogin=true;
        req.session.save(async (err) => {
            if (err) {
                return next(err);
            }

            return res.status(200).json({
                status: 'success',
                link: user.link.token
            });
        });
    }

    async senderPage(req, res) {

        let link=await LinkModel.findOne({
            where: { user_id: req.session.user.id },
        });

        const token=link.token??null;

        if (!token) {
            return res.render('user/pages/404', { title: 'Token Not Found', pageTitle: 'Token Not Found' });
        }

        try {
            const decoded=decodeJWT(token);

            if (!decoded) {
                delete req.session.user;
                req.session.save(err => { });
                return res.render('user/pages/404', { title: 'Invalid Token', pageTitle: 'Invalid Token' });
            }

            dayjs.extend(isBetween);

            let expiry_from=dayjs(decoded.expiry_from);
            let expiry_to=dayjs(decoded.expiry_to);
            const now=dayjs();

            if (req.session.user.id!=decoded.id) {
                delete req.session.user;
                req.session.save(err => { });
                return res.render('user/pages/404', { title: 'Page Not Found' });
            }

            if (!now.isBetween(expiry_from, expiry_to, null, '[]')) {
                delete req.session.user;
                req.session.save(err => { });
                return res.render('user/pages/404', { title: 'Token Expired', pageTitle: 'Token Expired' });
            }

            let user_id=req.session.user.id
            let user=await UserModel.findByPk(user_id);
            if (user.status=='0') {
                delete req.session.user;
                req.session.save(err => { });
                return res.render('user/pages/404', { title: 'Contact Admin' });
            }

            return res.render('user/pages/sender', { token, title: 'Sender' });
        } catch (error) {
            delete req.session.user;
            req.session.save(err => { });
            return res.render('user/pages/404', { title: 'Page Not Found' });
        }
    }

    async receiverPage(req, res) {
        const token=req.params.token;

        try {
            const decoded=decodeJWT(token);

            if (!decoded) {
                delete req.session.user;
                req.session.save(err => { });
                return res.render('user/pages/404', { title: 'Invalid Token', pageTitle: 'Invalid Token' });
            }

            dayjs.extend(isBetween);

            let expiry_from=dayjs(decoded.expiry_from);
            let expiry_to=dayjs(decoded.expiry_to);
            const now=dayjs();

            if (req.session.user.id!=decoded.id) {
                delete req.session.user;
                req.session.save(err => { });
                return res.render('user/pages/404', { title: 'Page Not Found' });
            }

            if (!now.isBetween(expiry_from, expiry_to, null, '[]')) {
                delete req.session.user;
                req.session.save(err => { });
                return res.render('user/pages/404', { title: 'Token Expired', pageTitle: 'Token Expired' });
            }

            let firstLogin=req.session.isFirstLogin??false;

            delete req.session.isFirstLogin;

            req.session.save();

            let user_id=req.session.user.id
            let user=await UserModel.findByPk(user_id);
            if (user.status=='0') {
                delete req.session.user;
                req.session.save(err => { });
                return res.render('user/pages/404', { title: 'Contact Admin' });
            }

            return res.render('user/pages/receiver', { token, title: 'Receiver', firstLogin });

        } catch (error) {
            delete req.session.user;
            req.session.save(err => { });
            return res.render('user/pages/404', { title: 'Page Not Found' });
        }
    }
}

export default new UserController();
