export const sendToken = (user, statusCode, res, message) => {
    const token = user.getToken();
    const options = {
        httpOnly: true,
        secure: true, //deploy
        sameSite: "None",//None for deploy,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    }
    res.status(statusCode).cookie("token", token, options).json({
        success: true,
        user,
        token,
        message
    })
}