import { mysqlConn, sequelize } from '../../config/database.js';
import SSP from '../../helpers/datatableSSP.js';
import jwt from 'jsonwebtoken';
import { getBaseUrl, view } from '../../helpers/helper.js';
import { adminPath } from '../../routes/paths/adminPath.js';
import LinkModel from '../../models/LinkModel.js'; // Assuming you have a LinkModel defined for Sequelize
import UserModel from '../../models/UserModel.js';
import bcrypt from 'bcrypt';

class UserController {
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
                      <button class="dropdown-item generate_link_modal" data-link="${adminPath.genearteLinkModal.setParam({ id: data })}">Generate Link</button>

                  </div>
              </div>`;
					return html;
				}
			}
		];
		let result = await (SSP.getData(req, 'select * from users', column)).mysql(mysqlConn); // mysqlConn is mysql connection instance
		res.status(200).json(result);

	}

	async generateLinkModal(req, res) {
		const { id } = req.params;
		let html = await view('admin/pages/user/dynamic-section/generate-link-modal', { id: id });
		return res.status(200).json({
			message: 'Modal generated successfully',
			html: html
		});
	}

	async generateLink(req, res) {
		const { id } = req.params;
		const { from, to, generate_new } = req.body;


		/* ========== Check Existing Link ========== */
		const existingLink = await LinkModel.findOne({
			where: { user_id: id }
		});
		/* ========== Check Existing Link End ========== */


		if (!existingLink || generate_new == '1') {
			if (from == '') {
				return res.status(200).json({ status: 'error', msg: 'From date is required' });
			}
			if (to == '') {
				return res.status(200).json({ status: 'error', msg: 'To date is required' });
			}
		}

		let final_token = '';
		let baseurl = getBaseUrl(req);


		if (!existingLink) {

			const payload = {
				id: id,
				expiry_from: from,
				expiry_to: to,
			};

			let token = jwt.sign(payload, process.env.LINK_JWT_SECRET);

			await LinkModel.create({
				user_id: id,
				token,
				expiry_from: from,
				expiry_to: to
			});

			final_token = token

		} else {
			if (generate_new == '1') {

				const payload = {
					id: id,
					expiry_from: from,
					expiry_to: to,
				};

				let token = jwt.sign(payload, process.env.LINK_JWT_SECRET);

				await LinkModel.update({
					token: token,
					expiry_from: from,
					expiry_to: to
				}, { where: { user_id: id } });
				
				final_token = token;

			} else {
				final_token = existingLink.token;
			}
		}

		let full_url = `${baseurl}/user/receiver/${final_token}`;

		return res.status(200).json({
			status: 'success',
			message: 'Link generated successfully', link: full_url
		});

	}

	async userSave(req, res) {
		const { name, email, password } = req.body;

		if (!name || name == '') {
			return res.status(200).json({
				status: 'error',
				msg: 'Enter Name'
			});
		}

		if (!email || email == '') {
			return res.status(200).json({
				status: 'error',
				msg: 'Enter Email'
			});
		}

		if (!password || password == '') {
			return res.status(200).json({
				status: 'error',
				msg: 'Enter Password'
			});
		}


		let passHash = await bcrypt.hash(password, 10);

		let status = await UserModel.create({
			name: name,
			email: email,
			password: passHash,
			password_raw: password
		});

		if (status) {
			return res.status(200).json({
				status: 'success',
				msg: 'User Added'
			});
		}
	}
}

export default new UserController();
