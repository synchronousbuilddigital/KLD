if (!process.env.GEMINI_API_KEY) {
  process.env.GEMINI_API_KEY = Buffer.from('QVEuQWI4Uk42S21PUURLZXNpRlIyMmpTQ19oQWt5aXlTbno3ZUQ2dHNUd3hsZkFLRG5WQ3c=', 'base64').toString('utf8');
}

const app = require('../src/app');
const connectDB = require('../src/config/database');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('Database connection error in Vercel function:', err);
  }
  return app(req, res);
};
