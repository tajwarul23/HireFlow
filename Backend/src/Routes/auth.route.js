import express from "express";
import { getMeController, loginUserController, logoutUserController, registerUserController,  firebaseAuthController, becomeCandidateController } from "../Controllers/Auth.controller.js";
import { verifyToken, authorizeRoles } from "../Middlewares/Auth.middleware.js";
import { googleAuthLimiter, loginLimiter, registerLimiter } from "../Middlewares/rateLimit.middleware.js";
const authRouter = express.Router();

/**
 * @route POST /api/auth/register
 * @description Register a new user
 * @access Public
 */
authRouter.post("/register",registerLimiter, registerUserController )
/**
 * @route POST /api/auth/login
 * @description Login a  user
 * @access Public
 */
authRouter.post("/login", loginLimiter, loginUserController )

/**
 * @route POST /api/auth/logout
 * @description clear token form user cookie and add token in blacklist
 * @access Public
 */
authRouter.post("/logout",verifyToken, logoutUserController)

/**
 * @route GET /api/auth/get-me
 * @description get the current logged in user details
 * @access Private
 */
authRouter.get("/get-me",verifyToken,getMeController)



/**
 * @route post /api/auth/firebase
 * @description firebase authentication
 * @access Public
 */
authRouter.post("/firebase",googleAuthLimiter, firebaseAuthController);

/**
 * @route POST /api/auth/become-candidate
 * @description let a pending_recruiter opt out and switch to a plain candidate
 * @access Private [only pending_recruiter]
 */
authRouter.post("/become-candidate", verifyToken, authorizeRoles("pending_recruiter", "company_admin", "recruiter"), becomeCandidateController);



export default authRouter;