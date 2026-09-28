import express from "express";
import authRouter from "./Routes/auth.route.js";
import cookieParser from "cookie-parser";
import cors from "cors"
import interviewRouter from "./Routes/interview.route.js";
import resumeRouter from "./Routes/resume.route.js"
import companyRouter from "./Routes/company.route.js"
import jobRouter from "./Routes/job.route.js"
import applicationRouter from "./Routes/application.route.js"
import notificationRouter from "./Routes/notification.route.js";
import compression from "compression"
const app = express();


app.set("trust proxy", 1);
app.use(compression())

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

app.use(express.json());
app.use(cookieParser());

const allowedOrigins = process.env.NODE_ENV === "production" ? ["https://hireflow-dev.vercel.app"] : "http://localhost:5173";

app.use(cors({
    origin:allowedOrigins,
    credentials:true
}))

//for ping
app.get("/ping", (req, res) => {
  console.log("Ping..");
  
   res.send("Backend works");
});
//auth Router
app.use("/api/auth", authRouter);

//interview Router
app.use("/api/interview", interviewRouter);

//resume router
app.use("/api/resume", resumeRouter)

//company router
app.use("/api/company", companyRouter)

//job router
app.use("/api/job", jobRouter)

//application router
app.use("/api/application", applicationRouter)

//notification router
app.use("/api/notification", notificationRouter)


export default app;
