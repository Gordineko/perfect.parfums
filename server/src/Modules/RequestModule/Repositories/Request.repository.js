import { Request } from "../Models/Request.model.js";

export class RequestRepository {
  static async create(data) {
    return Request.create(data);
  }

  static async findAll(filter = {}) {
    return Request.find(filter).sort({ createdAt: -1 });
  }

  static async findById(id) {
    return Request.findById(id);
  }

  static async updateById(id, data) {
    return Request.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  static async deleteById(id) {
    return Request.findByIdAndDelete(id);
  }
}