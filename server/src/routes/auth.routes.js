const {Router}=require('express');
const authController=require('../controller/auth.controller')
const authRouter=Router();
const authMiddleware=require("../middleware/auth.middleware")
/***
 * @route /api/auth/register
 */

authRouter.post('/register',authController.registerController);
authRouter.post("/login",authController.loginController)
authRouter.get("/logout",authController.logoutController)
authRouter.get("/get-me",authMiddleware.authUser,authController.getmeController);

module.exports=authRouter;

