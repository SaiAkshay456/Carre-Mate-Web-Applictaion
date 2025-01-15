export const catchAsyncError = (takeFunc) => {
    return (req, res, next) => {
        Promise.resolve(takeFunc(req, res, next)).catch(next);

    }
}