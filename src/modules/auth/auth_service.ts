import axios from 'axios';
import { encrypt } from "../../utils/bcrypt.handle.js";
import { generateToken, generateRefreshToken } from "../../utils/jwt.handle.js";
import User from "../users/user_models.js";
import Gym from "../gyms/gym_models.js";

export const googleAuth = async (code: string): Promise<{ token: string; refreshToken: string; user?: any; gym?: any }> => {
    try {
        console.log("Sending token request to Google with:", {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URL,
            grant_type: 'authorization_code',
        });

        // Request access token from Google
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URL,
            grant_type: 'authorization_code',
        });

        const access_token = tokenResponse.data.access_token;

        // Fetch user profile from Google
        const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
            params: { access_token },
            headers: { Accept: 'application/json' },
        });

        const profile = profileResponse.data;

        // Check if the email belongs to a user or gym
        let user = await User.findOne({ email: profile.email });
        let gym = await Gym.findOne({ email: profile.email });

        if (!user && !gym) {
            const randomPassword = Math.random().toString(36).slice(-8); // Genera una contraseña aleatoria de 8 caracteres
            const passHash = await encrypt(randomPassword); // Encripta la contraseña generada

            if (profile.email.includes('@gymdomain.com')) { // Example domain check for gyms
                gym = await Gym.create({
                    name: profile.name,
                    email: profile.email,
                    googleId: profile.id,
                    password: passHash, // Se almacena la contraseña encriptada
                });
            } else {
                user = await User.create({
                    name: profile.name,
                    email: profile.email,
                    googleId: profile.id,
                    password: passHash, // Se almacena la contraseña encriptada
                });
            }
        }

        // Generate tokens
        const token = user
            ? generateToken(user.id, user.email, user.name)
            : generateToken(gym!.id, gym!.email, gym!.name);

        const refreshToken = user
            ? generateRefreshToken(user.id)
            : generateRefreshToken(gym!.id); // Ensure refreshToken is generated

        console.log("Generated refresh token for Google user:", refreshToken); // Debugging log

        return { token, refreshToken, user, gym }; // Ensure refreshToken is returned
    } catch (error: any) {
        console.error('Google Auth Error:', error.response?.data || error.message);
        throw new Error('Error en autenticación con Google');
    }
};

export const googleRegister = async (
    code: string,
    password: string,
    isGym: boolean = false
): Promise<{ token: string; refreshToken: string; user?: any; gym?: any }> => {
    try {
        // Request access token from Google
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URL,
            grant_type: 'authorization_code',
        });

        const access_token = tokenResponse.data.access_token;

        // Fetch user profile from Google
        const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
            params: { access_token },
            headers: { Accept: 'application/json' },
        });

        const profile = profileResponse.data;
        // Asignar fecha de nacimiento predeterminada
        const birthDate = new Date("2017-01-01T00:00:00.000Z");

        if (isGym) {
            let gym = await Gym.findOne({ email: profile.email });
            if (gym) throw new Error('El gimnasio ya está registrado');
            const passHash = await encrypt(password);
            gym = await Gym.create({
                name: profile.name,
                email: profile.email,
                password: passHash,
                place: "Sin definir",
                price: 0,
                phone: "000000000",
                googleId: profile.id,
            });
            const token = generateToken(gym.id, gym.email, gym.name);
            const refreshToken = generateRefreshToken(gym.id);
            return { token, refreshToken, gym };
        } else {
            let user = await User.findOne({ email: profile.email });
            if (user) throw new Error('El usuario ya está registrado');
            const passHash = await encrypt(password);
            user = await User.create({
                name: profile.name,
                email: profile.email,
                birthDate,
                password: passHash,
                googleId: profile.id,
            });
            const token = generateToken(user.id, user.email, user.name);
            const refreshToken = generateRefreshToken(user.id);
            return { token, refreshToken, user };
        }
    } catch (error: any) {
        console.error('Google Register Error:', error.response?.data || error.message);
        throw new Error('Error en el registro con Google');
    }
};
