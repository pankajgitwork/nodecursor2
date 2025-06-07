import { mysqlConn, sequelize } from '../../config/database.js';
import SSP from '../../helpers/datatableSSP.js';
import jwt from 'jsonwebtoken';
import { getBaseUrl } from '../../helpers/helper.js';
import AdminModel from '../../models/AdminModel.js';
import bcrypt from 'bcrypt';
import { adminPath } from '../../routes/paths/adminPath.js';

class AdminController {
  async listdata(req, res) {

    let column = [  //column to select database columns
      {
        'db': 'name', // column name in database
        'dt': 'name', //column name in datatable

      },
      {
        'db': 'email',
        'dt': 'email',

      },
      {
        'db': 'id',
        'dt': 'id',
      },
      {
        'db': 'id',
        'dt': 'action',
        'formatter': function (data, rowData) {    //optional
          let html = '';
          html += `<div class="dropdown">
                  <button class="btn btn-primary btn-sm dropdown-toggle" type="button" data-toggle="dropdown"
                      aria-expanded="false">
                      Action
                  </button>
                  <div class="dropdown-menu">
                      <button class="dropdown-item generate_link" data-link="${adminPath.userGenerateLink.routePath}/${data}">Generate Link</button>

                  </div>
              </div>`;
          return html;
        }
      }
    ];
    let result = await (SSP.getData(req, 'select * from users', column)).mysql(mysqlConn); // mysqlConn is mysql connection instance
    res.status(200).json(result);

  }

  async generateLink(req, res) {
    const { id, role } = req.params;

    const user = await sequelize.query('SELECT * FROM users WHERE id = ?', {
      replacements: [id],
      type: sequelize.QueryTypes.SELECT
    });

    const payload = {
      id: id
    };

    let token = jwt.sign(payload, process.env.LINK_JWT_SECRET);

    if (user.length > 0) {
      const now = new Date();
      // Check if a link already exists for this user
      const existingLink = await sequelize.query(
        'SELECT * FROM links WHERE user_id = ?',
        {
          replacements: [id],
          type: sequelize.QueryTypes.SELECT
        }
      );

      if (existingLink.length === 0) {
        await sequelize.query(
          'INSERT INTO links (user_id, token, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
          {
            replacements: [id, token, now, now],
            type: sequelize.QueryTypes.INSERT
          }
        );
      }

      let full_url = '';
      let baseurl = getBaseUrl(req);

      if (existingLink.length === 0) {
        full_url = `${baseurl}/user/sender/${token}`;
      } else {
        full_url = `${baseurl}/user/receiver/${existingLink[0].token}`;
      }

      res.status(200).json({
        message: 'Link generated successfully', link: full_url
      });

    } else {
      res.status(404).json({ message: 'User not found' });
    }
  }

  userList(req, res) {
    let userListRoute = adminPath.userListDatatable.routePath;
    return res.render('admin/pages/user/list', { userListRoute: userListRoute });
  }

  dashboard(req, res) {
    return res.render('admin/pages/dashboard');
  }

  loginPage(req, res) {
    return res.render('admin/pages/auth/login');
  }

  logout(req, res) {
    delete req.session.admin
    req.session.save(err => {
      if (err) console.error('session save error:', err);
      return res.redirect(adminPath.login.routePath)
    });
  }

  async loginAttempt(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(200).json({
        status: "error",
        msg: 'Invalid email or password'
      });
    }

    const admin = await AdminModel.findOne({
      where: { email }
    });

    if (!admin) {
      return res.status(200).json({
        status: "error",
        msg: 'Invalid email or password'
      });
    }

    const match = await bcrypt.compare(password, admin.password);

    if (!match) {
      return res.status(200).json({
        status: "error",
        msg: 'Invalid email or password'
      });
    }

    req.session.admin = admin;
    req.session.cookie.maxAge = 10 * 365 * 24 * 60 * 60 * 1000; // in ms

    req.session.save(async (err) => {
      if (err) {
        return next(err);
      }

      return res.status(200).json({
        status: 'success',
        link: adminPath.dashboard.routePath,
      });
    });

  }
}

export default new AdminController();
