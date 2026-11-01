import "dotenv/config"
import app from "./app.js";
import { connectToDB } from "./config/database.js";
import { startJobExpireCron } from "./services/cron.service.js";





const port = process.env.PORT ;


const startServer = async()=>{
  try {
    await connectToDB();

    await startJobExpireCron();

    app.listen(port, ()=>{
      console.log(`Server running on port: ${port}`);
      
    })
  } catch (error) {
    console.error("Server startup failed:", error.message);

    process.exit(1);
  }
}

startServer();