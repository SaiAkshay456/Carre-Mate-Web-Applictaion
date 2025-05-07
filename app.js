import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
// import fileUpload from "express-fileupload";
import { connectToDb } from "./database/db.js";
import { errorMiddleware } from "./middleware/error.js";
import userRoute from "./routes/userRoute.js";
import jobRoute from "./routes/jobRoute.js"
import applicationRoute from "./routes/applicationRoute.js"
import interviewRoute from "./routes/interviewRoute.js"
import path from "path";
import { fileURLToPath } from "url";


const app = express();

//config
dotenv.config()



//middlewares
// Local frontend
// "https://careermateapp.netlify.app"// Deployed frontend
app.use(cors({
    origin: ["https://careermateai.netlify.app", "https://careermateai.netlify.app/"],
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
}));
// app.use(cors());
app.use(cookieParser());
app.use(express.json());


app.use(express.urlencoded({ extended: true }));


app.use(morgan());

connectToDb();


app.use("/api/v1/user", userRoute);
app.use("/api/v1/job", jobRoute);
app.use("/api/v1/application", applicationRoute);
app.use("/api/v1/interview", interviewRoute);

// const frontendPath = path.resolve(__dirname, "../frontend/dist"); // Adjust based on your build location
// app.use(express.static(frontendPath));

// // Handle React frontend routes (Fix for broken URL on reload)
// app.get("*", (req, res) => {
//     res.sendFile(path.join(frontendPath, "index.html"));
// });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.resolve(__dirname, "../frontend/dist");

if (process.env.NODE_ENV === "production") {
    app.use(express.static(frontendPath));

    app.get("*", (req, res) => {
        res.sendFile(path.join(frontendPath, "index.html"));
    });
}

app.use(errorMiddleware);

export default app;