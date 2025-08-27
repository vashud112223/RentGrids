require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { connectDb } = require("./configuration/database");
const {router} = require("./routes/auth");
const {tenantRouter} = require("./routes/tenantRoutes");
const { ownerRouter } = require("./routes/ownerRoutes");
// const {propertyRouter} = require("./routes/propertyRoutes");
const propertyRouter = require("./routes/propertyRoutes");
const  featureRouter  = require("./routes/featureRoutes");
const { amenityRouter}  = require("./routes/amenityRoutes");
const scheduleRouter =require("./routes/scheduleRoutes");
const { tenantDashboardRouter } = require("./routes/tenant");
const { createServer } = require("http");
const { Server } = require("socket.io");
const path = require("path");
const chatRouter = require("./routes/chatRoutes");
const messageRouter = require("./routes/messageRoutes");
const { searchChats } = require("./controllers/chatController");
const {openairouter}=require("./routes/openaiRoutes");
const {preferredTenantRouter}=require("./routes/preferedTenantsRoutes");
// const {openairouter}=require("./routes/openaiRoutes");

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  })
);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/", router);
app.use("/",tenantRouter);
app.use("/",ownerRouter);
app.use("/",propertyRouter);
app.use("/",featureRouter);
app.use("/",amenityRouter);
app.use("/",tenantDashboardRouter);
app.use("/",chatRouter);
app.use("/",messageRouter);
app.use("/",openairouter);
app.use("/",preferredTenantRouter);
app.use("/",searchChats);
app.use("/",openairouter);
app.use("/",scheduleRouter);


const server = createServer(app);

// Socket setup
const io = new Server(server, {
  pingTimeout: 60000,
  cors: { origin: "*" },
});
require("./socket/socket")(io);

// Connect DB and Start Server
connectDb()
  .then(() => {
    console.log("Database connection established");
    app.listen(process.env.PORT, () => {
      console.log(`Server is successfully on port ${process.env.PORT}`);
    });
  })
  .catch(() => {
    console.error("Database connection cannot be established");
  });
