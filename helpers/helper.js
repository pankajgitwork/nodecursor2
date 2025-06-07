import path from 'path';
import { fileURLToPath } from 'url';
import ejs from 'ejs';
import { log } from 'console';
import { adminPath } from '../routes/paths/adminPath.js';
import dayjs from 'dayjs';
import jwt from 'jsonwebtoken';

export function getBaseUrl(req) {
    const protocol=req.protocol;
    const host=req.get('host');            // includes hostname + optional port
    return `${protocol}://${host}`;
}

export async function generatePassword(password, round=10) {
    const hash=await bcrypt.hash(password, round);
    return hash;
}


export async function view(paramPath, data={}) {
    // Determine __dirname in ES module context
    const __filename=fileURLToPath(import.meta.url);
    const __dirname=path.dirname(__filename);

    const templatePath=path.join(__dirname, `../views/${paramPath}.ejs`);
    const mergedData={
        adminPath: { ...adminPath },
        ...data
    };

    return new Promise((resolve, reject) => {
        ejs.renderFile(templatePath, mergedData, (err, htmlString) => {
            if (err) return reject(err);
            resolve(htmlString);
        });
    });
}

export function decodeJWT(token) {
    try {
        const decoded = jwt.verify(token, process.env.LINK_JWT_SECRET);
        return decoded;
    } catch (err) {
        return null;
    }
}