import express from 'express';
import devicesRoutes from './routes/devices.routes.js';
import soilReadingsRoutes from './routes/soilReadings.routes.js';
import userRoutes from './routes/user.routes.js';

const app: express.Express = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json());

app.get('/', (req: express.Request, res: express.Response) => {
  res.json({ message: 'Earth Sense API online' });
});

app.use('/api/users', userRoutes);
app.use('/api/devices', devicesRoutes);
app.use('/api/soil-readings', soilReadingsRoutes);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});