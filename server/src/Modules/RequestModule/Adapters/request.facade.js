import { RequestService } from "../Services/Request.service.js";

export function createRequestFacade({ bus } = {}) {
  return {
    async create(payload) {
      const request = await RequestService.createRequest(payload);

      // если есть event bus — можно триггерить
      if (bus) {
        await bus.emit?.("request.created", {
          requestId: request._id,
        });
      }

      return request;
    },

    async getAll(query) {
      return RequestService.getRequests(query);
    },

    async getById(id) {
      return RequestService.getRequestById(id);
    },

    async update(id, payload) {
      return RequestService.updateRequest(id, payload);
    },

    async delete(id) {
      return RequestService.deleteRequest(id);
    },
  };
}