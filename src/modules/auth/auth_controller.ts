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
        const code = req.query.code as string;
        const origin = req.query.state as string || 'frontend'; // Cambiado a 'frontend' por defecto
        if (!code) {
            return res.status(400).json({ message: 'Código de autorización faltante' });
        }
        const authData = await googleAuth(code);
        if (!authData) {
            return res.redirect('/login?error=authentication_failed');
        }

        const { token, refreshToken } = authData; // Ensure refreshToken is included

        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'none',
            maxAge: 86400000, // 1 día
        });

        const redirectMap: Record<string, string> = {
            frontend: `http://localhost:4200/?token=${token}&refreshToken=${refreshToken}&type=user`, // Updated for Angular
            webreact: `http://localhost:3000/?token=${token}&refreshToken=${refreshToken}`, // No changes for React
        };

        const redirectUrl = redirectMap[origin] || redirectMap['frontend']; // Redirigir según el origen
        console.log(`Redirecting to: ${redirectUrl}`);
        res.redirect(redirectUrl);
    } catch (error: any) {
        console.error('Error en callback de Google:', error);
        res.redirect('http://localhost:4200/login?error=server_error');
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

export const googleRegisterGymCtrl = async (req: Request, res: Response) => {
    try {
        const { code, password } = req.body;
        if (!code || !password) {
            return res.status(400).json({ message: 'Código de autorización y contraseña son requeridos' });
        }
        // Lógica similar a googleRegister pero para Gym
        const { token, refreshToken, gym } = await googleRegister(code, password, true); // true indica gym
        res.status(201).json({
            message: 'Registro de gimnasio completado',
            token,
            refreshToken,
            gym,
        });
    } catch (error: any) {
        console.error('Error en googleRegisterGymCtrl:', error);
        res.status(500).json({ message: error.message });
    }
};
