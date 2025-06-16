import { Router, Request, Response } from 'express';
import { verifyRefreshToken, generateToken, generateRefreshToken } from '../../utils/jwt.handle.js';
import { googleAuthCtrl, googleAuthCallback, googleRegisterCtrl, googleRegisterGymCtrl } from "../auth/auth_controller.js";
import User from '../users/user_models.js'; // Add this import
import axios from 'axios';
import { encrypt } from '../../utils/bcrypt.handle.js';

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
router.post('/refresh-token', async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is required' });
    }

    try {
        const decoded = verifyRefreshToken(refreshToken);

        if (!decoded || typeof decoded === 'string') {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        const user = await User.findById(decoded.id); // Busca al usuario en la base de datos
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Genera un nuevo token con id, email y username
        const newAccessToken = generateToken(user.id, user.email, user.name);

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

/**
 * @openapi
 * /api/auth/google/register-gym:
 *   post:
 *     summary: Registra un gimnasio con Google
 *     description: Registra un gimnasio utilizando los datos de su cuenta de Google y una contraseña proporcionada.
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
 *                 description: Contraseña para el gimnasio
 *     responses:
 *       201:
 *         description: Registro completado exitosamente
 *       400:
 *         description: Código de autorización o contraseña faltante
 *       500:
 *         description: Error interno del servidor
 */
router.post('/google/register-gym', googleRegisterGymCtrl);

/**
 * @openapi
 * /api/auth/google/flutter-login:
 *   post:
 *     summary: Login directo desde Flutter usando el accessToken de Google
 *     description: Inicia sesión o registra un usuario utilizando el accessToken de Google proporcionado por la app de Flutter.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accessToken:
 *                 type: string
 *                 description: Token de acceso de Google
 *     responses:
 *       200:
 *         description: Login exitoso, devuelve tokens
 *       400:
 *         description: Token de acceso faltante
 *       500:
 *         description: Error interno del servidor
 */
router.post('/google/flutter-login', async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) return res.status(400).json({ message: 'Token requerido' });

  try {
    const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      params: { access_token: accessToken },
      headers: { Accept: 'application/json' },
    });
    const profile = profileResponse.data;

    let user = await User.findOne({ email: profile.email });
    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-8);
      const passHash = await encrypt(randomPassword);

      // Añade todos los campos obligatorios con valores por defecto
      user = await User.create({
        name:       profile.name,
        email:      profile.email,
        password:   passHash,
        googleId:   profile.id,
        birthDate:  new Date("2017-01-01T00:00:00.000Z"),
        weight:     "Peso medio",
        city:       "Sin definir",
        phone:      "000000000",
        gender:     "Hombre",
      });
    }

    const token = generateToken(user.id, user.email, user.name);
    const refreshToken = generateRefreshToken(user.id);

    res.json({ token, refreshToken });
  } catch (e) {
    console.error('Error en login Flutter Web:', e);
    res.status(500).json({ message: 'Error procesando login' });
  }
});

/**
 * @openapi
 * /api/auth/google/flutter-login-gym:
 *   post:
 *     summary: Login directo de gimnasio desde Flutter usando el accessToken de Google
 *     description: Inicia sesión o registra un gimnasio utilizando el accessToken de Google proporcionado por la app de Flutter.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accessToken:
 *                 type: string
 *                 description: Token de acceso de Google
 *     responses:
 *       200:
 *         description: Login exitoso, devuelve tokens
 *       400:
 *         description: Token de acceso faltante
 *       500:
 *         description: Error interno del servidor
 */
router.post('/google/flutter-login-gym', async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) return res.status(400).json({ message: 'Token requerido' });

  try {
    const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      params: { access_token: accessToken },
      headers: { Accept: 'application/json' },
    });

    const profile = profileResponse.data;

    // Busca el gimnasio por email, si no existe lo crea
    let Gym = (await import('../gyms/gym_models.js')).default;
    let gym = await Gym.findOne({ email: profile.email });
    if (!gym) {
      const randomPassword = Math.random().toString(36).slice(-8);
      const passHash = await encrypt(randomPassword);
      gym = await Gym.create({
        name: profile.name,
        email: profile.email,
        password: passHash,
        place: "Sin definir",
        price: 0,
        phone: "000000000",
      });
    }

    const token = generateToken(gym.id, gym.email, gym.name);
    const refreshToken = generateRefreshToken(gym.id);

    res.json({ token, refreshToken });
  } catch (e) {
    console.error('Error en login Flutter Web GYM:', e);
    res.status(500).json({ message: 'Error procesando login gym' });
  }
});

export default router;
