import pkg from 'jsonwebtoken';
const { sign, verify } = pkg;

const JWT_SECRET = process.env.JWT_SECRET || 'token.010101010101';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'refresh.010101010101';

const generateToken = (id: string, email: string) => {
    const payload = { id, email };
    return sign(payload, JWT_SECRET, { expiresIn: '1h' });
};

const generateRefreshToken = (id: string) => {
    return sign({ id }, REFRESH_SECRET, { expiresIn: '7d' });
};

const verifyToken = (jwt: string) => {
    try {
        return verify(jwt, JWT_SECRET);
    } catch (e: any) {
        if (e.name === 'TokenExpiredError') {
            throw new Error('Token expired');
        }
        throw new Error('Invalid token');
    }
};

const verifyRefreshToken = (refreshToken: string) => {
    return verify(refreshToken, REFRESH_SECRET);
};

export { generateToken, generateRefreshToken, verifyToken, verifyRefreshToken };
