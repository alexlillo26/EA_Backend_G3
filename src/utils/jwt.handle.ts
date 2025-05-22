import pkg from 'jsonwebtoken'; // 'pkg' es un alias común, pero 'jsonwebtoken' es más descriptivo
const { sign, verify } = pkg; // Desestructuras sign y verify desde jsonwebtoken

const JWT_SECRET = process.env.JWT_SECRET || 'token.0101010101'; // Clave secreta para JWT
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'refresh.0101'; // Clave secreta para Refresh Token

// --- MODIFICACIÓN AQUÍ ---
// Función para generar el token JWT principal
// DEBE incluir 'userId' en el payload para que el chat funcione correctamente
const generateToken = (id: string, email: string, username: string) => { // Añadimos 'username' como parámetro
    // El payload es la información que se guarda dentro del token
    // Es crucial que 'userId' (o como lo llames, aquí es 'id') esté presente
    // También añadimos 'username' para usarlo en el chat server-side
    const payload = {
        id,         // Este será tu 'userId' en el backend del chat.
        email,
        username // Añadimos el nombre de usuario al payload
    };
    // Firmamos el token con el payload, la clave secreta y un tiempo de expiración
    return sign(payload, JWT_SECRET, { expiresIn: '120s' });
};

// Función para generar el refresh token (parece estar bien, solo usa 'id')
const generateRefreshToken = (id: string) => {
    return sign({ id }, REFRESH_SECRET, { expiresIn: '7d' });
};

// --- MODIFICACIÓN AQUÍ ---
// Interfaz para el payload decodificado, para mejorar el tipado
interface DecodedJWTPayload {
    id: string;         // Este se convertirá en socket.user.userId
    email: string;
    username: string;   // Este se convertirá en socket.user.username
    iat?: number;       // Issued at (lo añade jsonwebtoken)
    exp?: number;       // Expiration time (lo añade jsonwebtoken)
}

// Función para verificar el token JWT principal
const verifyToken = (jwt: string): DecodedJWTPayload => { // Cambiamos el tipo de retorno a DecodedJWTPayload
    try {
        // Verificamos el token usando la clave secreta
        // Hacemos un type assertion a DecodedJWTPayload para que TypeScript sepa qué esperar
        const decoded = verify(jwt, JWT_SECRET) as DecodedJWTPayload;
        console.log("[jwt.handle.ts] Token decodificado en verifyToken:", decoded); // LOG para depuración
        return decoded;
    } catch (e: any) {
        if (e.name === 'TokenExpiredError') {
            console.error("[jwt.handle.ts] Token expirado:", e.message);
            throw new Error('Token expired');
        }
        console.error("[jwt.handle.ts] Token inválido:", e.message);
        throw new Error('Invalid token');
    }
};

// Función para verificar el refresh token (parece estar bien)
const verifyRefreshToken = (refreshToken: string) => {
    return verify(refreshToken, REFRESH_SECRET);
};

// Exportamos las funciones para que puedan ser usadas en otros módulos
export {
    generateToken,
    generateRefreshToken,
    verifyToken,
    verifyRefreshToken
};