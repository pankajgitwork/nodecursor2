const prefix = '/user';

export const userPath =
{
    senderLogin: {
        routePath: prefix + '/sender/login'
    },
    senderLoginAttempt: {
        routePath: prefix + '/sender/login/attempt'
    },

    receiverLogin: {
        routePath: prefix + '/receiver/login'
    },
    receiverLoginAttempt: {
        routePath: prefix + '/receiver/login/attempt'
    },

    receiverLogout: {
        routePath: prefix + '/receiver/logout'
    },
    
    senderLogout: {
        routePath: prefix + '/sender/logout'
    },

    sender: {
        routePath: prefix + '/sender/dashboard'
    },
    receiver: {
        routePath: prefix + '/receiver/:token'
    }

}
