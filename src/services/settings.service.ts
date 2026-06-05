import Settings from '../models/settings.model.js';
import type { ISettings } from '../types/index.js';

const GLOBAL_KEY = 'global';

export const settingsService = {
  // Get-or-create the singleton settings document.
  async getSettings(): Promise<ISettings> {
    let settings = await Settings.findOne({ key: GLOBAL_KEY });
    if (!settings) {
      settings = await Settings.create({ key: GLOBAL_KEY });
    }
    return settings;
  },

  async updateSettings(data: Partial<ISettings>): Promise<ISettings> {
    return Settings.findOneAndUpdate(
      { key: GLOBAL_KEY },
      { $set: data },
      { new: true, runValidators: true, upsert: true }
    );
  },
};
