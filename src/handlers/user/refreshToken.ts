import { RequestHandler } from 'express';
import * as axios from 'axios';
import * as dotenv from 'dotenv';

const env = dotenv.config();

export const refreshToken: RequestHandler = async (req, res) => {
  try {
    const tokenResponse = await axios.default.post(
      `https://securetoken.googleapis.com/v1/token?key=${env.parsed?.GOOGLE_API_KEY}`,
      `grant_type=refresh_token&refresh_token=${req.body.refreshToken}`,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    res.status(200).json({ newToken: tokenResponse.data.id_token });
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
};
