import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import { connectToDb } from "./database/db.js";
import { errorMiddleware } from "./middleware/error.js";
import userRoute from "./routes/userRoute.js";
import jobRoute from "./routes/jobRoute.js"
import applicationRoute from "./routes/applicationRoute.js"

const app = express();

//config
dotenv.config()


//middlewares
app.use(cors({
    origin: [
        "http://localhost:5173", // Local frontend
        "https://careermateapp.netlify.app/register"// Deployed frontend
    ],
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
}));
// app.use(cors());
app.use(cookieParser());
app.use(express.json());


app.use(express.urlencoded({ extended: true }));

app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/"
}))

app.use(morgan());

connectToDb();


app.use("/api/v1/user", userRoute);
app.use("/api/v1/job", jobRoute);
app.use("/api/v1/application", applicationRoute);


app.use(errorMiddleware);

export default app;