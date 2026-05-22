import express from 'express';
import {
  IOrderAdminRepo,
  IOrderAdminService,
  IUserFacade,
  IUserAdminRepo,
  IUserAdminService,
} from '../../Common/DI/tokens.js';
import { iamService } from './Services/iam.service.js';
import { createOrderAdminRepo } from './Repositories/OrderAdmin.repo.js';
import { createUserAdminRepo } from './Repositories/AdminUser.repo.js';
import { createOrderAdminService } from './Services/OrderAdmin.service.js';
import { createUserAdminService } from './Services/AdminUser.service.js';
import { authController } from './Controllers/auth.controller.js';
import { iamController } from './Controllers/iam.controller.js';
import { userController } from './Controllers/user.controller.js';
import { createUserFacade } from './Adapters/user.facade.js';
import { wishlistController } from './Controllers/user.controller.js';
import { cartController } from './Controllers/user.controller.js';
import { checkoutController } from './Controllers/user.controller.js';
import { adminUserController } from './Controllers/AdminUser.controller.js';
import { orderAdminController } from './Controllers/OrderAdmin.controller.js';
import './Models/Role.model.js';
import './Models/User.model.js';

export function registerIAM(api, container) {
  const router = express.Router();
  const bus = container.get('bus');

  container.set(IUserAdminRepo, createUserAdminRepo());
  container.set(
    IUserAdminService,
    createUserAdminService({
      userRepo: container.get(IUserAdminRepo),
    })
  );

  container.set(IOrderAdminRepo, createOrderAdminRepo());
  container.set(
    IOrderAdminService,
    createOrderAdminService({
      orderAdminRepo: container.get(IOrderAdminRepo),
    })
  );

  container.set(IUserFacade, createUserFacade());

  authController(router);
  userController(router)
  wishlistController(router)
  cartController(router)
  checkoutController(router)
  adminUserController(router, { container });
  orderAdminController(router, { container });
  iamController(router, { iamService, bus });

  api.use('/iam', router);
}