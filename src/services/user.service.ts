import User from '../models/user.model.js';
import Profile from '../models/profile.model.js';
import { deleteCloudinaryFile } from '../config/cloudinary.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import { buildSort, parsePagination, buildPaginationMeta } from '../utils/helpers.js';
import type { IProfile, IUser, PaginatedResult, UserQuery } from '../types/index.js';

export const userService = {
  async getUsers(query: UserQuery): Promise<PaginatedResult<IUser>> {
    const { page, limit, skip } = parsePagination(query as Record<string, unknown>);
    const sort = buildSort(query.sort, { createdAt: -1 });

    const filter: Record<string, unknown> = {};
    if (query.search) {
      filter.$or = [
        { name:  { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
      ];
    }
    if (query.role) filter.role = query.role;

    const [users, total] = await Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    return { data: users, meta: buildPaginationMeta({ total, page, limit }) };
  },

  async getUserById(id: string): Promise<IUser> {
    const user = await User.findById(id);
    if (!user) throw new NotFoundError('User');
    return user;
  },

  async updateUser(id: string, data: Partial<IUser>): Promise<IUser> {
    if (data.email) {
      const exists = await User.findOne({ email: data.email, _id: { $ne: id } });
      if (exists) throw new ConflictError('Email already in use.');
    }
    const user = await User.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!user) throw new NotFoundError('User');
    return user;
  },

  async deleteUser(id: string): Promise<void> {
    const user = await User.findById(id);
    if (!user) throw new NotFoundError('User');

    const profile = await Profile.findOne({ user: id });
    if (profile?.avatar?.publicId) {
      await deleteCloudinaryFile(profile.avatar.publicId);
    }
    if (profile?.resume?.publicId) {
      await deleteCloudinaryFile(profile.resume.publicId, 'raw');
    }
    await Profile.deleteOne({ user: id });
    await user.deleteOne();
  },

  async getMyProfile(userId: string): Promise<IProfile> {
    let profile = await Profile.findOne({ user: userId }).populate(
      'user',
      'name email role lastLogin'
    );
    // Auto-create an empty profile on first access so the dashboard always loads.
    if (!profile) {
      await Profile.create({ user: userId });
      profile = await Profile.findOne({ user: userId }).populate(
        'user',
        'name email role lastLogin'
      );
    }
    if (!profile) throw new NotFoundError('Profile');
    return profile;
  },

  async updateMyProfile(
    userId: string,
    data: Partial<IProfile>
  ): Promise<IProfile> {
    const profile = await Profile.findOneAndUpdate(
      { user: userId },
      { $set: data },
      { new: true, runValidators: true, upsert: true }
    ).populate('user', 'name email role');

    if (!profile) throw new NotFoundError('Profile');
    return profile;
  },

  async uploadAvatar(userId: string, file: Express.Multer.File): Promise<IProfile> {
    const profile = await Profile.findOne({ user: userId });
    if (!profile) throw new NotFoundError('Profile');

    if (profile.avatar?.publicId) {
      await deleteCloudinaryFile(profile.avatar.publicId);
    }

    profile.avatar = { url: file.path, publicId: file.filename };
    await profile.save();
    return profile;
  },

  async uploadResume(userId: string, file: Express.Multer.File): Promise<IProfile> {
    const profile = await Profile.findOne({ user: userId });
    if (!profile) throw new NotFoundError('Profile');

    if (profile.resume?.publicId) {
      await deleteCloudinaryFile(profile.resume.publicId, 'raw');
    }

    profile.resume = { url: file.path, publicId: file.filename };
    await profile.save();
    return profile;
  },

  async updateMe(
    userId: string,
    data: { name?: string; email?: string }
  ): Promise<IUser> {
    if (data.email) {
      const exists = await User.findOne({ email: data.email, _id: { $ne: userId } });
      if (exists) throw new ConflictError('Email already in use.');
    }
    const allowed = { name: data.name, email: data.email };
    const user = await User.findByIdAndUpdate(userId, allowed, {
      new: true,
      runValidators: true,
    });
    if (!user) throw new NotFoundError('User');
    return user;
  },
};
