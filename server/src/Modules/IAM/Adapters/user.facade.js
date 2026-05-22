import { iamService } from '../Services/iam.service.js';

export function createUserFacade() {
  return {
    async getStatus(userId) {
      return iamService.getStatus(userId);
    }
  };
}
