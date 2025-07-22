import express from 'express';
import userRoutes from './routes/user';
import clientRoutes from './routes/client';
import authRoutes from './routes/auth';
import dispRoutes from './routes/disponibilities';
import cors from 'cors';
import axios from 'axios';
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
  // auto-updt des disp expirees 
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

  // Msg de rappels
  try {
    const dispResponse = await fetch('https://apibooker.onrender.com/api/disponibilities');
    const disps = await dispResponse.json();

    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const matchingDisps = disps.filter((disp: any) => {
      if (!disp.reserved_by || disp.available !== false) return false;

      const dispDate = new Date(disp.date);
      const [hours, minutes, seconds] = disp.heure_debut.split(':');
      dispDate.setUTCHours(+hours, +minutes, +seconds || 0, 0);

      const dispTime = dispDate.getTime();

      const isInOneHour = Math.abs(dispTime - oneHourLater.getTime()) < 60 * 1000;
      const isInOneDay = Math.abs(dispTime - oneDayLater.getTime()) < 60 * 1000;

      return isInOneHour || isInOneDay;
    });

    for (const disp of matchingDisps) {
      try {
        // Reconstruct UTC date-times for Google Calendar link
        const date = new Date(disp.date);
        const [startH, startM] = disp.heure_debut.split(':');
        const [endH, endM] = disp.heure_fin.split(':');

        const startDate = new Date(date);
        startDate.setUTCHours(+startH, +startM, 0, 0);

        const endDate = new Date(date);
        endDate.setUTCHours(+endH, +endM, 0, 0);

        const formatForGCal = (d: Date) =>
          d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

        const calendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Rendez-vous&dates=${formatForGCal(startDate)}/${formatForGCal(endDate)}&details=Confirmation+de+votre+réservation&location=En+ligne&sf=true&output=xml`;

        // Format payload pour Zapier
        const payload = {
          clientusername: disp.client_name,
          clientemail: disp.client_email,
          date: disp.date.split('T')[0],
          start: disp.heure_debut,
          end: disp.heure_fin,
          calendarLink
        };

        await axios.post('https://hooks.zapier.com/hooks/catch/22608860/uu4fnrk/', payload);
        console.log(`📧 Mail envoyé pour ${disp.client_email} (${disp.date} ${disp.heure_debut})`);
      } catch (err) {
        console.error(`❌ Erreur envoi mail pour ${disp.client_email}:`, err);
      }
    }
  } catch (err) {
    console.error('Erreur lors de la récupération des disponibilités:', err);
  }
});




