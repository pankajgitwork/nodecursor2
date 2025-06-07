import { Sequelize } from 'sequelize';
import mysql from 'mysql2/promise';
import 'dotenv/config';

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: 'localhost',
    dialect: 'mysql',
    pool: {
        max: 10,
        min: 1,
        acquire: 60000,
        idle: 60000
    }
},

);

const mysqlConn = mysql.createPool({
    host: 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

export { sequelize, mysqlConn };
