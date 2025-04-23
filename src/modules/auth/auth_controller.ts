import { Request, Response } from "express";
import { googleAuth } from "../auth/auth_service.js";

export const googleAuthCtrl = async (req: Request, res: Response) => {
    console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID || "undefined");
    console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET || "undefined");
    console.log("GOOGLE_OAUTH_REDIRECT_URL:", process.env.GOOGLE_OAUTH_REDIRECT_URL || "undefined");

    const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URL;
    if (!redirectUri || !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.error("ERROR: Missing Google OAuth environment variables");
        return res.status(500).json({ message: "Error interno de configuración" });
    }

    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = new URLSearchParams({
        redirect_uri: redirectUri,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        access_type: 'offline',
        response_type: 'code',
        prompt: 'consent',
        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email openid',
    });

    const fullUrl = `${rootUrl}?${options.toString()}`;
    console.log("Redirecting to Google OAuth URL:", fullUrl);
    res.redirect(fullUrl);
};

export const googleAuthCallback = async (req: Request, res: Response) => {
    try {
        const code = req.query.code as string;
        if (!code) {
            return res.status(400).json({ message: 'Código de autorización faltante' });
        }
        const authData = await googleAuth(code);
        if (!authData) {
            return res.redirect('/login?error=authentication_failed');
        }

        const { token, user, gym } = authData;

        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'none',
            maxAge: 86400000, // 1 día
        });

        const redirectUrl = user
            ? `http://localhost:4200/user-dashboard?token=${token}`
            : `http://localhost:4200/gym-dashboard?token=${token}`;

        res.redirect(redirectUrl);
    } catch (error: any) {
        console.error('Error en callback de Google:', error);
        res.redirect('/login?error=server_error');
    }
};
