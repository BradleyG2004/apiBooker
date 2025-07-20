import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../db';
import { MailtrapClient } from "mailtrap"
import { clientSchemaReg } from '../validations/client.validation';

export const registerClient = async (req: Request, res: Response) => {
  const { error } = clientSchemaReg.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { username, email, id } = req.body;

  try {
    // Vérifier si un client existe déjà avec cet email
    const existing = await pool.query('SELECT id, name, email FROM clients WHERE email = $1', [email]);
    let clientId: number;
    if (existing.rows.length > 0) {
      // Client existe déjà
      clientId = existing.rows[0].id;
    } else {
      // Nouveau client
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

    res.status(201).json({
      message: 'Client registered and slot reserved',
      reserved: dispoResult.rows[0],
    });

    // const TOKEN = "<YOUR-TOKEN-HERE>";
    // const SENDER_EMAIL = process.env.SENDER_EMAIL;
    // const RECIPIENT_EMAIL = email;

    // const client = new MailtrapClient({ token: TOKEN });

    // const sender = { name: "Booker test", email: SENDER_EMAIL };

    // client
    //   .send({
    //     from: sender,
    //     to: [{ email: RECIPIENT_EMAIL }],
    //     subject: "GMTO - Booker confirmation 🔗",
    //     text: "Welcome to Mailtrap Sending!",
    //   })
    //   .then(console.log)
    //   .catch(console.error);

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};