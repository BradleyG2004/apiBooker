import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../db';
import { dispSchemaReg } from '../validations/disponibility.validation';

export const registerDisp = async (req: Request, res: Response) => {
  const { error } = dispSchemaReg.validate(req.body)
  if (error) {
    return res.status(400).json({ message: 'Validation failed', detail: error.details[0].message })
  }

  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'Token manquant' })

  try {
    // 🔍 Récupération de l'user_id via la table user_tokens
    const tokenResult = await pool.query(
      'SELECT user_id FROM user_tokens WHERE token = $1 AND expires_at > NOW()',
      [token]
    )
    if (tokenResult.rowCount === 0) {
      return res.status(403).json({ message: 'Token invalide ou expiré' })
    }

    const userId = tokenResult.rows[0].user_id
    const disponibilites = req.body // tableau

    // 📝 Insertion des disponibilités
    const insertQuery = `
      INSERT INTO disponibilities (user_id, date, heure_debut, heure_fin)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, date, heure_debut) DO NOTHING
    `

    for (const dispo of disponibilites) {
      await pool.query(insertQuery, [userId, dispo.date, dispo.heure_debut, dispo.heure_fin])
    }

    return res.status(201).json({ message: 'Disponibilités enregistrées.' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Erreur serveur', error: err })
  }
}

export const listDisp = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, user_id, date, heure_debut, heure_fin FROM disponibilities ORDER BY date, heure_debut'
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

export const autoUpdt = async (req: Request, res: Response) => {
  try {
    // 🔁 Obtenir l'heure UTC actuelle
    const now = new Date();

    const currentDate = now.toISOString().split('T')[0]; // ex: "2025-07-20"
    const currentTime = now.toISOString().split('T')[1].slice(0, 8); // ex: "08:30:00"

    // 🧠 Mise à jour des disponibilités passées
    await pool.query(
      `UPDATE disponibilities 
       SET available = false 
       WHERE (date < $1 OR (date = $1 AND heure_fin < $2)) 
       AND available = true`,
      [currentDate, currentTime]
    );

    return res.status(200).json({ message: 'Disponibilités mises à jour automatiquement.' });
  } catch (err) {
    console.error('Erreur dans autoUpdt:', err);
    return res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};


