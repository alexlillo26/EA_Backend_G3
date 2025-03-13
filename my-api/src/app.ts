import express from 'express';
import setUsersRoutes from './routes/usersRoutes';
import setGymsRoutes from './routes/gymsRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

setUsersRoutes(app);
setGymsRoutes(app);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});