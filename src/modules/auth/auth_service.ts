import axios from 'axios';
import { generateToken, generateRefreshToken } from "../../utils/jwt.handle.js"; //
import User, { IUser } from "../users/user_models.js"; //
import Gym, { IGym } from "../gyms/gym_models.js";   //
import { encrypt } from "../../utils/bcrypt.handle.js"; //

// Asegúrate que tus interfaces IUser e IGym en los archivos de modelo
// tengan los campos como 'password', 'weight', 'city', etc., marcados como opcionales (con '?')
// si no siempre van a estar presentes, especialmente para usuarios de Google.

export const googleAuth = async (code: string): Promise<{ token: string; refreshToken: string; user?: IUser; gym?: IGym; isNewEntity?: boolean }> => {
    try {
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', { //
            code, //
            client_id: process.env.GOOGLE_CLIENT_ID, //
            client_secret: process.env.GOOGLE_CLIENT_SECRET, //
            redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URL, //
            grant_type: 'authorization_code', //
        });
        const access_token = tokenResponse.data.access_token; //
        const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', { //
            params: { access_token }, //
            headers: { Accept: 'application/json' }, //
        });
        const profile = profileResponse.data; //

        let userDoc = await User.findOne({ email: profile.email }); //
        let gymDoc = await Gym.findOne({ email: profile.email }); //
        let isNewEntity = false; // Renombrado de isNewUser

        if (!userDoc && !gymDoc) {
            isNewEntity = true;
            const isGymEmail = profile.email.endsWith('@gymdomain.com'); // Define tu lógica para identificar gyms

            if (isGymEmail) {
                const newGymData: Partial<IGym> = { /* ... */ }; // Como en tu código
                 // ... (definición de newGymData como la tenías, solo con campos de Google)
                 newGymData.name = profile.name || `Gimnasio ${profile.id}`; //
                 newGymData.email = profile.email; //
                 newGymData.googleId = profile.id; //
                gymDoc = await Gym.create(newGymData); //
            } else {
                const newUserProfileData: Partial<IUser> = { /* ... */ }; // Como en tu código
                 // ... (definición de newUserProfileData como la tenías, solo con campos de Google)
                 newUserProfileData.name = profile.name || `Usuario ${profile.id}`; //
                 newUserProfileData.email = profile.email; //
                 newUserProfileData.googleId = profile.id; //
                 newUserProfileData.profilePicture = profile.picture; //
                userDoc = await User.create(newUserProfileData); //
            }
        } else if (userDoc && !userDoc.googleId) { //
            userDoc.googleId = profile.id; //
            if (profile.picture && !userDoc.profilePicture) {  //
                 userDoc.profilePicture = profile.picture; //
            }
            await userDoc.save(); //
        } else if (gymDoc && !gymDoc.googleId) { //
            gymDoc.googleId = profile.id; //
            await gymDoc.save(); //
        }

        // Generación de tokens
        const token = userDoc ? generateToken(userDoc.id, userDoc.email, userDoc.name) : generateToken(gymDoc!.id, gymDoc!.email, gymDoc!.name); //
        const refreshToken = userDoc ? generateRefreshToken(userDoc.id) : generateRefreshToken(gymDoc!.id); //
        
        // CORRECCIÓN: Convertir a objeto plano antes de retornar
        const finalUser = userDoc ? userDoc.toObject<IUser>() : undefined;
        const finalGym = gymDoc ? gymDoc.toObject<IGym>() : undefined;

        return { token, refreshToken, user: finalUser, gym: finalGym, isNewEntity }; //

    } catch (error: any) { //
        console.error('Google Auth Error en googleAuth:', error.response?.data || error.message); //
        throw new Error('Error en autenticación con Google'); //
    }
};

export const googleRegister = async (code: string, passwordProvided: string): Promise<{ token: string; refreshToken: string; user: IUser }> => { //
    try {
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', { /* ...params como en googleAuth... */ }); //
        const access_token = tokenResponse.data.access_token; //
        const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', { params: { access_token }, headers: { Accept: 'application/json' }}); //
        const profile = profileResponse.data; //

        let existingUser = await User.findOne({ email: profile.email }); //
        if (existingUser) { //
            throw new Error('El usuario ya está registrado con este correo electrónico.');
        }

        const passHash = await encrypt(passwordProvided); //
        
        const newUserRegisterData: Partial<IUser> = { /* ...como lo tenías... */ }; //
        // ... (definición de newUserRegisterData como la tenías)
        newUserRegisterData.name = profile.name || `Usuario ${profile.id}`; //
        newUserRegisterData.email = profile.email; //
        newUserRegisterData.googleId = profile.id; //
        newUserRegisterData.password = passHash; //
        newUserRegisterData.profilePicture = profile.picture; //

        const newUserDoc = await User.create(newUserRegisterData as IUser); // Asegúrate que IUser permita campos opcionales o el schema tenga defaults

        const token = generateToken(newUserDoc.id, newUserDoc.email, newUserDoc.name); //
        const refreshToken = generateRefreshToken(newUserDoc.id); //
        
        // CORRECCIÓN: Convertir a objeto plano antes de retornar
        return { token, refreshToken, user: newUserDoc.toObject<IUser>() };

    } catch (error: any) { //
        console.error('Google Register Error:', error.response?.data || error.message); //
        throw new Error(error.message || 'Error en el registro con Google');
    }
};