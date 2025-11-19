require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const consultationPublicRoutes = require('./routes/consultationRoutes');
const patientAIRoutes = require("./routes/patient_ai");

const app = express();
connectDB();

const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/api/consultations', consultationPublicRoutes);




// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
// after other routes
app.use('/api/hospital', require('./routes/hospitalRoutes'));
app.use('/api/nurse', require('./routes/nurseRoutes'));
app.use('/api/doctor', require('./routes/doctorRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/prescriptions', require('./routes/prescriptionRoutes'));
app.use('/api/nurse', require('./routes/nurseUploadRoutes')); // after other nurse routes
app.use("/api/patients/ai", patientAIRoutes);

app.use('/api/patients', require('./routes/patientRoutes'));

app.use('/api/rx', require('./routes/rxRoutes'));

app.use('/api', require('./routes/aiRoutes'));

app.use('/api', require('./routes/medicineRoutes'));







// Health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Errors
app.use(notFound);
app.use(errorHandler);



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
