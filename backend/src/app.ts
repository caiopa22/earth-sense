import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import aiRoutes from './routes/ai.routes.js';
import devicesRoutes from './routes/devices.routes.js';
import soilReadingsRoutes from './routes/soilReadings.routes.js';
import userRoutes from './routes/user.routes.js';

dotenv.config();

const app: express.Express = express();
const port = Number(process.env.PORT || 3000);

app.use(cors());

app.use(express.json());

app.get('/', (req: express.Request, res: express.Response) => {
  res.json({ message: 'Earth Sense API online' });
});

app.use('/api/users', userRoutes);
app.use('/api/devices', devicesRoutes);
app.use('/api/soil-readings', soilReadingsRoutes);
app.use('/api/ai', aiRoutes);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});