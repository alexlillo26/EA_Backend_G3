export function routeNotFound(req, res, next) {
    const error = new Error('Route Not Found');
    console.log(error);
    return res.status(404).json({ error: error.message }); // Ensure return to stop further execution
}
