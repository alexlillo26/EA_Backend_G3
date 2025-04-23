import axios from 'axios';
import { encrypt } from "../../utils/bcrypt.handle.js";
import { generateToken } from "../../utils/jwt.handle.js";
import User from "../users/user_models.js";
import Gym from "../gyms/gym_models.js";

export const googleAuth = async (code: string) => {
    try {
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URL,
            grant_type: 'authorization_code',
        });

        const access_token = tokenResponse.data.access_token;
        const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
            params: { access_token },
            headers: { Accept: 'application/json' },
        });

        const profile = profileResponse.data;

        // Check if the email belongs to a user or gym
        let user = await User.findOne({ email: profile.email });
        let gym = await Gym.findOne({ email: profile.email });

        if (!user && !gym) {
            const randomPassword = Math.random().toString(36).slice(-8);
            const passHash = await encrypt(randomPassword);

            if (profile.email.includes('@gymdomain.com')) { // Example domain check for gyms
                gym = await Gym.create({
                    name: profile.name,
                    email: profile.email,
                    googleId: profile.id,
                    password: passHash,
                });
            } else {
                user = await User.create({
                    name: profile.name,
                    email: profile.email,
                    googleId: profile.id,
                    password: passHash,
                });
            }
        }

        const token = user
            ? generateToken(user.id, user.email)
            : generateToken(gym!.id, gym!.email);

        return { token, user, gym };
    } catch (error: any) {
        console.error('Google Auth Error:', error.response?.data || error.message);
        throw new Error('Error en autenticación con Google');
    }
};
