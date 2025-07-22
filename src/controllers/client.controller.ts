import { Request, Response } from 'express';
import { pool } from '../db';
import { createEvent, EventAttributes, DateTime } from 'ics';
import dayjs from 'dayjs';
import axios from 'axios';
import utc from 'dayjs/plugin/utc';
import { clientSchemaReg } from '../validations/client.validation';

dayjs.extend(utc);

export const registerClient = async (req: Request, res: Response) => {
  const { error } = clientSchemaReg.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { username, email, id } = req.body;

  try {
    // Vérifier si un client existe déjà avec cet email
    const existing = await pool.query('SELECT id, name, email FROM clients WHERE email = $1', [email]);
    let clientId: number;
    if (existing.rows.length > 0) {
      clientId = existing.rows[0].id;
    } else {
      const result = await pool.query(
        'INSERT INTO clients (name, email) VALUES ($1, $2) RETURNING id, name, email',
        [username, email]
      );
      clientId = result.rows[0].id;
    }

    // Réserver la disponibilité
    const dispoResult = await pool.query(
      'UPDATE disponibilities SET available = false, reserved_by = $1 WHERE id = $2 RETURNING *',
      [clientId, id]
    );
    if (dispoResult.rows.length === 0) {
      return res.status(404).json({ message: 'Disponibilité non trouvée.' });
    }

    // Extraire les données nécessaires
    const { date, heure_debut, heure_fin } = dispoResult.rows[0];

    // Génération du fichier .ics
    // const eventDate = new Date(date);
    // const [year, month, day] = [
    //   eventDate.getUTCFullYear(),
    //   eventDate.getUTCMonth() + 1,
    //   eventDate.getUTCDate(),
    // ];
    // const [startHour, startMinute] = heure_debut.split(':').map(Number);
    // const [endHour, endMinute] = heure_fin.split(':').map(Number);

    // const start: DateTime = [year, month, day, startHour, startMinute];
    // const end: DateTime = [year, month, day, endHour, endMinute];

    // const eventConfig: EventAttributes = {
    //   title: 'Rendez-vous avec notre équipe',
    //   description: 'Confirmation de votre réservation',
    //   start,
    //   end,
    //   location: 'En ligne',
    //   status: 'CONFIRMED',
    //   organizer: { name: 'GMTO', email: 'maxguemto@gmail.com' },
    // };

    // const { error: icsError, value: icsContent } = createEvent(eventConfig);
    // if (icsError) {
    //   console.error('Erreur ICS:', icsError);
    // }

    // Génération du lien Google Calendar
    const dateOnly = date.toISOString().split('T')[0];
    const startDateTime = dayjs.utc(`${dateOnly}T${heure_debut}`);
    const endDateTime = dayjs.utc(`${dateOnly}T${heure_fin}`);
    const startt = startDateTime.format('YYYYMMDDTHHmmss[Z]');
    const endd = endDateTime.format('YYYYMMDDTHHmmss[Z]');
    const calendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Rendez-vous&dates=${startt}/${endd}&details=Confirmation+de+votre+réservation&location=En+ligne&sf=true&output=xml`;

    // Envoi des données au webhook Zapier
    const zapierWebhookUrl = 'https://hooks.zapier.com/hooks/catch/22608860/uuyfanv/';

    await axios({
      method: 'post',
      url: zapierWebhookUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        clientusername: username,
        clientemail: email,
        date: dateOnly,
        start: heure_debut,
        end: heure_fin,
        calendarLink,
        // icsFileContent: icsContent, // 📎 Envoi du fichier ICS
      },
    });

    res.status(201).json({
      message: 'All stuff and ... slot successfully reserved',
      reserved: dispoResult.rows[0],
    });

  } catch (err) {
    console.error('💥 ERREUR GLOBALE :', err);
    res.status(500).json({ message: 'Server error', error: err });
  }
};