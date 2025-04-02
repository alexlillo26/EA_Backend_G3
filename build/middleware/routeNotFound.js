export function routeNotFound(req, res, next) {
    const error = new Error('Route Not Found');
    console.log(error);
    res.status(404).json({ error: error.message }); // ojo aqui que si no posem error.message no s'envia l'error!!!
}
