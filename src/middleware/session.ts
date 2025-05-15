import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.handle.js';
import { JwtPayload } from 'jsonwebtoken';

interface RequestExt extends Request {
    user?: JwtPayload; // Ensure correct typing
}

const checkJwt = (req: RequestExt, res: Response, next: NextFunction) => {
    try {
        console.log("Token recibido:", req.headers.authorization); // Log for debugging

        const jwtByUser = req.headers.authorization || null;
        const jwt = jwtByUser?.split(' ').pop();

        if (!jwt) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const isUser = verifyToken(jwt) as JwtPayload;

        if (!isUser || !isUser.id || !isUser.email) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        req.user = isUser; // Attach user to request
        next(); // Proceed if token is valid
    } catch (e: any) {
        if (e.message === 'Token expired') {
            return res.status(401).json({ message: 'Token expired' });
        }
        console.error('Error in checkJwt:', e);
        return res.status(401).json({ message: 'Unauthorized' });
    }
};

export { checkJwt };
