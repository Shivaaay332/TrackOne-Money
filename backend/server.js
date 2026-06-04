// ... existing imports in server.js ...
const expenseRoutes = require('./routes/expenseRoutes'); 
const incomeRoutes = require('./routes/incomeRoutes');   
const udhariRoutes = require('./routes/udhariRoutes');   
const goalRoutes = require('./routes/goalRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes'); 
const settingsRoutes = require('./routes/settingsRoutes'); 

// ... existing middleware ...

// Mount ALL Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/income', incomeRoutes);
app.use('/api/v1/udhari', udhariRoutes);
app.use('/api/v1/goals', goalRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/settings', settingsRoutes);

// ... rest of server.js (error handling & app.listen) ...

// Load Env
dotenv.config();

// Connect Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount Routes
app.use('/api/v1/auth', authRoutes);
// app.use('/api/v1/expenses', expenseRoutes);
// app.use('/api/v1/income', incomeRoutes);
// app.use('/api/v1/udhari', udhariRoutes);
// app.use('/api/v1/goals', goalRoutes);

// Base Route
app.get('/', (req, res) => {
  res.send('TrackOne-Money API is running...');
});

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  // Initialize Cron Jobs
  initScheduler();
});