import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserQueryDto } from './dto/user-query.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: [
        { email: createUserDto.email },
        { username: createUserDto.username },
      ],
    });

    if (existingUser) {
      throw new ConflictException('User with this email or username already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'username', 'email', 'firstName', 'lastName', 'isActive', 'createdAt'],
    });
  }

  async findAllWithPagination(page: number = 1, limit: number = 10, query?: UserQueryDto) {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (query?.search) {
      queryBuilder.andWhere(
        '(user.username LIKE :search OR user.email LIKE :search OR user.firstName LIKE :search OR user.lastName LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query?.status) {
      queryBuilder.andWhere('user.isActive = :isActive', {
        isActive: query.status === 'active',
      });
    }

    if (query?.role) {
      queryBuilder
        .leftJoin('user.roles', 'role')
        .andWhere('role.name = :roleName', { roleName: query.role });
    }

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [users, total] = await queryBuilder
      .select([
        'user.id',
        'user.username',
        'user.email',
        'user.firstName',
        'user.lastName',
        'user.isActive',
        'user.createdAt',
      ])
      .getManyAndCount();

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'username', 'email', 'firstName', 'lastName', 'isActive', 'createdAt'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['roles'],
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { username },
      relations: ['roles'],
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    if (updateUserDto.email) {
      const existingByEmail = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingByEmail && existingByEmail.id !== id) {
        throw new ConflictException('Email is already in use');
      }
    }

    if (updateUserDto.username) {
      const existingByUsername = await this.userRepository.findOne({
        where: { username: updateUserDto.username },
      });

      if (existingByUsername && existingByUsername.id !== id) {
        throw new ConflictException('Username is already in use');
      }
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async updateProfile(id: number, updateProfileDto: UpdateProfileDto): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, updateProfileDto);
    return this.userRepository.save(user);
  }

  async changePassword(id: number, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'password'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new ConflictException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    await this.userRepository.update(id, { password: hashedPassword });
  }

  async remove(id: number): Promise<void> {
    const user = await this.findById(id);
    await this.userRepository.remove(user);
  }

  async toggleStatus(id: number): Promise<User> {
    const user = await this.findById(id);
    user.isActive = !user.isActive;
    return this.userRepository.save(user);
  }

  async getTotalCount(): Promise<number> {
    return this.userRepository.count();
  }

  async getActiveUsersCount(): Promise<number> {
    return this.userRepository.count({ where: { isActive: true } });
  }

  async getInactiveUsersCount(): Promise<number> {
    return this.userRepository.count({ where: { isActive: false } });
  }

  async getRecentUsers(limit: number = 5): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'username', 'email', 'firstName', 'lastName', 'createdAt'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByRole(roleName: string): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.roles', 'role')
      .where('role.name = :roleName', { roleName })
      .select([
        'user.id',
        'user.username',
        'user.email',
        'user.firstName',
        'user.lastName',
        'user.isActive',
        'user.createdAt',
      ])
      .getMany();
  }

  async assignRole(userId: number, roleName: string): Promise<User> {
    return this.findById(userId);
  }

  async removeRole(userId: number, roleName: string): Promise<User> {
    return this.findById(userId);
  }
}
