import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../user/role.entity';
import { Permission } from '../user/permission.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}

  async createRole(name: string, description?: string): Promise<Role> {
    const existingRole = await this.roleRepository.findOne({ where: { name } });
    if (existingRole) {
      throw new ConflictException('Role already exists');
    }

    const role = this.roleRepository.create({ name, description });
    return this.roleRepository.save(role);
  }

  async findAllRoles(): Promise<Role[]> {
    return this.roleRepository.find({ relations: ['permissions'] });
  }

  async createPermission(name: string, resource: string, action: string, description?: string): Promise<Permission> {
    const existingPermission = await this.permissionRepository.findOne({ where: { name } });
    if (existingPermission) {
      throw new ConflictException('Permission already exists');
    }

    const permission = this.permissionRepository.create({ name, resource, action, description });
    return this.permissionRepository.save(permission);
  }

  async findAllPermissions(): Promise<Permission[]> {
    return this.permissionRepository.find();
  }

  async assignPermissionToRole(roleId: number, permissionId: number): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions']
    });
    
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const permission = await this.permissionRepository.findOne({ where: { id: permissionId } });
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    const hasPermission = role.permissions.some(p => p.id === permission.id);
    if (!hasPermission) {
      role.permissions.push(permission);
      await this.roleRepository.save(role);
    }

    return role;
  }
}