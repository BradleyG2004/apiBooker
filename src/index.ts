import express from 'express';
import userRoutes from './routes/user';
import clientRoutes from './routes/client';
import authRoutes from './routes/auth';
import dispRoutes from './routes/disponibilities';
import cors from 'cors';
import cron from 'node-cron';


const app = express();
app.use(express.json());

app.use(cors({
  origin: ['http://localhost:3000', 'https://booker-plum.vercel.app',],
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/disponibilities', dispRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// const cron = require('node-cron');

cron.schedule('*/30 * * * *', async () => {
  console.log('🕒 Cron job déclenché - auto-updt');
  try {
    const response = await fetch('https://apibooker.onrender.com/api/disponibilities/auto-updt', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const text = await response.text(); // Pour voir le contenu d'erreur
      console.error('❌ auto-updt a échoué:', response.status, text);
      return;
    }

    const data = await response.json();
    console.log('✅ Réponse auto-updt:', data);
  } catch (err) {
    console.error('Erreur lors de l’appel à auto-updt:', err);
  }
});




