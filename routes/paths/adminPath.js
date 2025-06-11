const prefix='/admin';

export const adminPath=
{
    login: {
        routePath: prefix+'/login'
    },
    loginAttempt: {
        routePath: prefix+'/login/attempt'
    },
    logout: {
        routePath: prefix+'/logout'
    },
    dashboard: {
        routePath: prefix+'/'
    },
    userList: {
        routePath: prefix+'/user/list'
    },
    userListDatatable: {
        routePath: prefix+'/datatable/users'
    },
    userSave: {
        routePath: prefix+'/user/save'
    },
    userUpdateStatus: {
        routePath: prefix+'/user/update_status',
    },
    genearteLinkModal: {
        routePath: prefix+'/generatelink_modal/:id',
        setParam(params={}) {
            let path=this.routePath;
            for (const [key, value] of Object.entries(params)) {
                path=path.replace(`:${key}`, value);
            }
            return path;
        }
    },
    userGenerateLink: {
        routePath: prefix+'/generate_link/:id',
        setParam(params={}) {
            let path=this.routePath;
            for (const [key, value] of Object.entries(params)) {
                path=path.replace(`:${key}`, value);
            }
            return path;
        }
    },

    changePassword: {
        routePath: prefix+'/change_password',
        setParam(params={}) {
            let path=this.routePath;
            for (const [key, value] of Object.entries(params)) {
                path=path.replace(`:${key}`, value);
            }
            return path;
        }
    },

    changePasswordAttempt: {
        routePath: prefix+'/change_password/attempt',
        setParam(params={}) {
            let path=this.routePath;
            for (const [key, value] of Object.entries(params)) {
                path=path.replace(`:${key}`, value);
            }
            return path;
        }
    }
}
