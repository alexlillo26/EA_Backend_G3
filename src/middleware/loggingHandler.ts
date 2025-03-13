import { Request, Response, NextFunction } from 'express';
export function loggingHandler(req: Request, res: Response, next: NextFunction) {
    console.log(`Incoming -Method: [${req.method}] -URL [${req.url}] - IP [${req.socket.remoteAddress}]`);

    res.on('finish', () => {
        console.log(`Incoming -Method: [${req.method}] -URL [${req.url}] - IP [${req.socket.remoteAddress}] -STATUS [${req.statusCode}]`);
    });

    next();
}
