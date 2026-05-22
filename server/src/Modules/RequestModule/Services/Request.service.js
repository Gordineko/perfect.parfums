import { RequestRepository } from "../Repositories/Request.repository.js";

export class RequestService {
  static normalizePhone(phone = "") {
    return phone.replace(/[^\d+]/g, "").trim();
  }

  static async createRequest(payload) {
    const name = payload.name?.trim();
    const phone = this.normalizePhone(payload.phone);
    const message = payload.message?.trim() || "";
    const source = payload.source?.trim() || "site";


    if (!phone) {
      throw new Error("Телефон обязателен");
    }

    return RequestRepository.create({
      name,
      phone,
      message,
      source,
    });
  }

  static async getRequests(query) {
    const filter = {};

    if (query.status) {
      filter.status = query.status;
    }

    return RequestRepository.findAll(filter);
  }

  static async getRequestById(id) {
    const request = await RequestRepository.findById(id);

    if (!request) {
      throw new Error("Заявка не найдена");
    }

    return request;
  }

  static async updateRequest(id, payload) {
    const updated = await RequestRepository.updateById(id, payload);

    if (!updated) {
      throw new Error("Заявка не найдена");
    }

    return updated;
  }

  static async deleteRequest(id) {
    const deleted = await RequestRepository.deleteById(id);

    if (!deleted) {
      throw new Error("Заявка не найдена");
    }

    return deleted;
  }
}