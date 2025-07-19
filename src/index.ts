import express from 'express';
import userRoutes from './routes/user';
import authRoutes from './routes/auth';
import dispRoutes from './routes/disponibilities';


const app = express();
const cors = require('cors');
app.use(express.json());

app.use(cors({
  origin: ['http://localhost:3000', 'https://booker-plum.vercel.app'],
  methods: ['GET', 'POST', 'OPTIONS','PUT','PATCH','DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/disponibilities', dispRoutes);


const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



