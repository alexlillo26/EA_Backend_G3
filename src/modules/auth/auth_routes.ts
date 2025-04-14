import { Router, Request, Response } from 'express';
import { verifyRefreshToken, generateToken } from '../../utils/jwt.handle.js';

const router = Router();

router.post('/refresh-token', (req: Request, res: Response) => {
    const { refreshToken } = req.body;
  
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }
  
    try {
      const decoded = verifyRefreshToken(refreshToken);
  
      if (!decoded || typeof decoded === 'string') {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }
  
      const newAccessToken = generateToken(decoded.id);
  
      return res.json({ token: newAccessToken });
    } catch (e: any) {
      if (e.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Refresh token expired' });
      }
      console.error('Error in /refresh-token:', e);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  

export default router;
