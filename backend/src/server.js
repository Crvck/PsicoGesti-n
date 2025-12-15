const cors = require('cors');

// Enable CORS for React
app.use(cors({
  origin: 'http://localhost:3000', // Replace with your React app's URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));