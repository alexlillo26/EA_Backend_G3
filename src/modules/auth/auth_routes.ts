import { Router, Request, Response } from 'express';
import { verifyRefreshToken, generateToken } from '../../utils/jwt.handle.js';
import { googleAuthCtrl, googleAuthCallback, googleRegisterCtrl } from "../auth/auth_controller.js";

const router = Router();

/**
 * @openapi
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresca el token de acceso
 *     description: Genera un nuevo token de acceso usando el refresh token.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token válido
 *     responses:
 *       200:
 *         description: Token refrescado exitosamente
 *       401:
 *         description: Refresh token inválido o expirado
 *       500:
 *         description: Error interno del servidor
 */
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

        const newAccessToken = generateToken(decoded.id, decoded.email); // Added email argument

        return res.json({ token: newAccessToken });
    } catch (e: any) {
        if (e.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Refresh token expired' });
        }
        console.error('Error in /refresh-token:', e);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * @openapi
 * /api/auth/google:
 *   get:
 *     summary: Redirige al usuario a Google para autenticación
 *     description: Inicia el flujo de autenticación con Google OAuth.
 *     tags:
 *       - Auth
 *     responses:
 *       302:
 *         description: Redirección a Google para autenticación
 */
router.get('/google', googleAuthCtrl);

/**
 * @openapi
 * /api/auth/google/callback:
 *   get:
 *     summary: Callback de Google OAuth
 *     description: Maneja la respuesta de Google después de la autenticación.
 *     tags:
 *       - Auth
 *     parameters:
 *       - name: code
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Código de autorización proporcionado por Google
 *     responses:
 *       302:
 *         description: Redirección al dashboard del usuario o gimnasio
 *       400:
 *         description: Código de autorización faltante
 *       500:
 *         description: Error interno del servidor
 */
router.get('/google/callback', googleAuthCallback);

/**
 * @openapi
 * /api/auth/google/register:
 *   post:
 *     summary: Registra un usuario con Google
 *     description: Registra un usuario utilizando los datos de su cuenta de Google y una contraseña proporcionada.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: Código de autorización proporcionado por Google
 *               password:
 *                 type: string
 *                 description: Contraseña para el usuario
 *     responses:
 *       201:
 *         description: Registro completado exitosamente
 *       400:
 *         description: Código de autorización o contraseña faltante
 *       500:
 *         description: Error interno del servidor
 */
router.post('/google/register', googleRegisterCtrl);

export default router;
