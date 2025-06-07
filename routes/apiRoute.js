import express from 'express';
import UserController from '../controllers/admin/UserController.js';

const router = express.Router();

// switch to admin layout for all admin routes
router.use((req, res, next) => {
    next();
});
 
router.post('/datatable/users', UserController.listdata);
router.get('/generate_link/:id', UserController.generateLink);


// add more admin routes here...
// e.g. router.get('/users', …)

export default router;
