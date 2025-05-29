import { Request, Response } from "express";
import { googleAuth, googleRegister } from "../auth/auth_service.js";

export const googleAuthCtrl = async (req: Request, res: Response) => {
    console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID || "undefined");
    console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET || "undefined");
    console.log("GOOGLE_OAUTH_REDIRECT_URL:", process.env.GOOGLE_OAUTH_REDIRECT_URL || "undefined");

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_OAUTH_REDIRECT_URL) {
        console.error("ERROR: Missing Google OAuth environment variables");
        return res.status(500).json({ message: "Error interno de configuración" });
    }

    const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URL;
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const origin = req.query.origin || 'frontend'; 

    const options = new URLSearchParams({
        redirect_uri: redirectUri,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        access_type: 'offline',
        response_type: 'code',
        prompt: 'consent',
        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email openid',
        state: typeof origin === 'string' ? origin : String(origin), // Ensure state is a string 
    });

    const fullUrl = `${rootUrl}?${options.toString()}`;
    console.log("Redirecting to Google OAuth URL:", fullUrl);
    res.redirect(fullUrl);
};

export const googleAuthCallback = async (req: Request, res: Response) => {
    try {
        const code = req.query.code as string; //
        const origin = req.query.state as string || 'frontend'; //
        
        const flutterErrorRedirectBase = 'http://localhost:54385/login'; // Asumimos que esta es la URL de tu Flutter web local para errores
        const defaultErrorRedirectBase = 'http://localhost:4200/login'; //
        const errorRedirectBase = origin === 'flutter_local_web' ? flutterErrorRedirectBase : defaultErrorRedirectBase;


        if (!code) { //
            return res.status(400).json({ message: 'Código de autorización faltante' }); //
        }
        const authData = await googleAuth(code); //
        if (!authData) { //
            return res.redirect(`${errorRedirectBase}?error=authentication_failed`);
        }

        const { token, refreshToken, user, gym } = authData; //

        // No modificamos el manejo de cookies, ya que es general.
        res.cookie('token', token, { //
            httpOnly: true, //
            secure: false, // En desarrollo; debería ser true en producción con HTTPS //
            sameSite: 'none', // Ajustar según necesidades de producción, 'lax' o 'strict' son más seguros //
            maxAge: 86400000, // 1 día //
        });

        // Preparamos datos adicionales para la redirección de Flutter
        const userIdForRedirect = user ? user._id : (gym ? gym._id : '');
        const usernameForRedirect = user ? user.name : (gym ? gym.name : '');
        const accountTypeForRedirect = user ? 'user' : (gym ? 'gym' : 'unknown');

        const redirectMap: Record<string, string> = { //
            // Mantenemos las redirecciones existentes sin cambios en sus parámetros
            frontend: `http://localhost:4200/?token=${token}&refreshToken=${refreshToken}&type=user`, //
            webreact: `http://localhost:3000/?token=${token}&refreshToken=${refreshToken}`, //
            // Nueva entrada para Flutter Web Local
            flutter_local_web: `http://localhost:54385/?token=${token}&refreshToken=${refreshToken}&userId=${userIdForRedirect}&username=${usernameForRedirect}&type=${accountTypeForRedirect}`
        };

        const redirectUrl = redirectMap[origin] || redirectMap['frontend']; //
        console.log(`Redirecting to: ${redirectUrl} for origin: ${origin}`); //
        res.redirect(redirectUrl); //
    } catch (error: any) { //
        console.error('Error en callback de Google:', error); //
        // Determinar la URL de redirección de error basada en el origin si es posible
        const originFromError = (error.request && error.request.query && error.request.query.state) 
                               ? error.request.query.state as string 
                               : 'frontend';
        const flutterErrorRedirectBase = 'http://localhost:54385/login';
        const defaultErrorRedirectBase = 'http://localhost:4200/login'; //
        const errorRedirectBase = originFromError === 'flutter_local_web' ? flutterErrorRedirectBase : defaultErrorRedirectBase;
        
        res.redirect(`${errorRedirectBase}?error=server_error`);
    }
};

export const googleRegisterCtrl = async (req: Request, res: Response) => {
    try {
        const { code, password } = req.body;

        if (!code || !password) {
            return res.status(400).json({ message: 'Código de autorización y contraseña son requeridos' });
        }

        const { token, refreshToken, user } = await googleRegister(code, password);

        res.status(201).json({
            message: 'Registro completado',
            token,
            refreshToken,
            user,
        });
    } catch (error: any) {
        console.error('Error en googleRegisterCtrl:', error);
        if (error.message.includes('birthdays')) {
            res.status(400).json({ message: 'No se pudo obtener la fecha de nacimiento del usuario' });
        } else {
            res.status(500).json({ message: error.message });
        }
    }
};
