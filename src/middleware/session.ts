import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.handle.js';
import { JwtPayload } from 'jsonwebtoken';

interface RequestExt extends Request {
    user?: any;
}

const checkJwt = (req: RequestExt, res: Response, next: NextFunction) => {
    try {
        console.log("Token recibido:", req.headers.authorization);

        const jwtByUser = req.headers.authorization || null;
        const jwt = jwtByUser?.split(' ').pop();

        if (!jwt) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decodedToken = verifyToken(jwt) as any;

        if (!decodedToken || !decodedToken.id || !decodedToken.email) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        // 统一设置 req.user 字段，便于后续控制器使用
        req.user = {
            id: decodedToken.id,
            email: decodedToken.email,
            name: decodedToken.username || decodedToken.name // 兼容 username 字段
        };

        console.log("Decoded user:", req.user);

        next();
    } catch (e: any) {
        if (e.message === 'Token expired') {
            return res.status(401).json({ message: 'Token expired' });
        }
        console.error('Error in checkJwt:', e);
        return res.status(401).json({ message: 'Unauthorized' });
    }
};

export { checkJwt };
