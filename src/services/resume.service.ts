import Experience from '../models/experience.model.js';
import Education from '../models/education.model.js';
import { NotFoundError } from '../utils/errors.js';
import type { IExperience, IEducation } from '../types/index.js';

export const resumeService = {
  // ─── Experience ───────────────────────────────────────────────────────────
  async listExperience(): Promise<IExperience[]> {
    return Experience.find().sort({ order: 1, startDate: -1 });
  },

  async createExperience(
    userId: string,
    data: Partial<IExperience>
  ): Promise<IExperience> {
    return Experience.create({ ...data, user: userId });
  },

  async updateExperience(
    id: string,
    data: Partial<IExperience>
  ): Promise<IExperience> {
    const exp = await Experience.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!exp) throw new NotFoundError('Experience');
    return exp;
  },

  async deleteExperience(id: string): Promise<void> {
    const exp = await Experience.findByIdAndDelete(id);
    if (!exp) throw new NotFoundError('Experience');
  },

  // ─── Education ────────────────────────────────────────────────────────────
  async listEducation(): Promise<IEducation[]> {
    return Education.find().sort({ order: 1, startDate: -1 });
  },

  async createEducation(
    userId: string,
    data: Partial<IEducation>
  ): Promise<IEducation> {
    return Education.create({ ...data, user: userId });
  },

  async updateEducation(
    id: string,
    data: Partial<IEducation>
  ): Promise<IEducation> {
    const edu = await Education.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!edu) throw new NotFoundError('Education');
    return edu;
  },

  async deleteEducation(id: string): Promise<void> {
    const edu = await Education.findByIdAndDelete(id);
    if (!edu) throw new NotFoundError('Education');
  },
};
