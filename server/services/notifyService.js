import axios from 'axios';

/**
 * Pings the central admin dashboard's /api/notify endpoint so it
 * refetches its summary/transactions data in real time, instead of
 * waiting for a manual page refresh.
 *
 * Safe to call anywhere — swallows its own errors so a notification
 * failure never breaks the calling request.
 */
export const notifyAdmin = async () => {
  try {
    await axios.post(`${process.env.ADMIN_URL}/api/notify`, {
      system: 'transportation'
    });
  } catch (err) {
    console.error('Failed to send admin notification:', err.message);
  }
};

export default notifyAdmin;