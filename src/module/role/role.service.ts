import { Injectable, HttpException, HttpStatus } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In, IsNull, Not } from 'typeorm'
import { UtilsService } from '@/module/utils/utils.service'
import { UserEntity } from '@/entity/user.entity'
import { RoleEntity } from '@/entity/role.entity'
import { inteRole } from '@/utils/common'
import * as DTO from './role.interface'

@Injectable()
export class RoleService {
	constructor(
		@InjectRepository(UserEntity) private readonly userModel: Repository<UserEntity>,
		@InjectRepository(RoleEntity) private readonly roleModel: Repository<RoleEntity>,
		private readonly utilsService: UtilsService
	) {}

	/**角色列表-不包括子类**/
	public async nodeRoles(props: DTO.NodeRolesParameter) {
		try {
			const [list = [], total = 0] = await this.roleModel.findAndCount({
				where: {
					parent: IsNull(),
					user: IsNull()
				},
				skip: (props.page - 1) * props.size,
				take: props.size
			})
			return { total, size: props.size, page: props.page, list }
		} catch (e) {
			throw new HttpException(e.message || e.toString(), HttpStatus.BAD_REQUEST)
		}
	}

	/**角色列表-包括子类**/
	public async nodeRolesChild(props: DTO.NodeRolesParameter) {
		try {
			const [list = [], total = 0] = await this.roleModel.findAndCount({
				where: {
					parent: IsNull(),
					user: IsNull()
				},
				relations: ['children', 'children.children'],
				skip: (props.page - 1) * props.size,
				take: props.size
			})
			return { total, size: props.size, page: props.page, list }
		} catch (e) {
			throw new HttpException(e.message || e.toString(), HttpStatus.BAD_REQUEST)
		}
	}

	/**角色信息**/
	public async nodeRole(id: number) {
		try {
			const role = await this.roleModel.findOne({ where: { id } })
			if (!role) {
				throw new HttpException('角色不存在', HttpStatus.BAD_REQUEST)
			}
			return await this.roleModel.findOne({
				where: { id },
				relations: ['children', 'children.children']
			})
		} catch (e) {
			throw new HttpException(e.message || e.toString(), HttpStatus.BAD_REQUEST)
		}
	}

	/**用户角色信息**/
	public async nodeUserRole(uid: number) {
		try {
			const user = await this.userModel.findOne({ where: { uid } })
			return await this.roleModel.findOne({
				where: {
					parent: IsNull(),
					user
				},
				relations: ['user', 'children', 'children.children']
			})
		} catch (e) {
			throw new HttpException(e.message || e.toString(), HttpStatus.BAD_REQUEST)
		}
	}

	/**切换角色状态**/
	public async nodeRoleCutover(props: DTO.NodeRoleCutoverParameter) {
		try {
			const role = await this.roleModel.findOne({ where: { id: props.id } })
			if (!role) {
				throw new HttpException('角色不存在', HttpStatus.BAD_REQUEST)
			}
			if (role.status) {
				await this.roleModel.update({ id: props.id }, { status: 0 })
			} else {
				await this.roleModel.update({ id: props.id }, { status: 1 })
			}

			return { message: '修改成功' }
		} catch (e) {
			throw new HttpException(e.message || e.toString(), HttpStatus.BAD_REQUEST)
		}
	}

	/**修改角色权限**/
	public async updateNodeRole(props: DTO.UpdateNodeRoleParameter) {
		try {
			const role = await this.roleModel.findOne({
				where: { id: props.id },
				relations: ['children', 'children.children']
			})
			if (!role) {
				throw new HttpException('角色不存在', HttpStatus.BAD_REQUEST)
			}

			//更新角色
			await this.roleModel.update({ id: props.id }, { status: props.status, comment: props.comment })
			const { losence, resence } = inteRole(role.children, props.role)
			await this.roleModel.update({ id: In(losence) }, { status: 0 })
			await this.roleModel.update({ id: In(resence) }, { status: 1 })

			return { message: '修改成功' }
		} catch (e) {
			throw new HttpException(e.message || e.toString(), HttpStatus.BAD_REQUEST)
		}
	}

	/**修改用户角色权限**/
	public async updateNodeUserRole(props: DTO.UpdateNodeUserRoleParameter, uid: number) {
		try {
			const user = await this.userModel.findOne({ where: { uid } })

			return { message: '修改成功' }
		} catch (e) {
			throw new HttpException(e.message || e.toString(), HttpStatus.BAD_REQUEST)
		}
	}
}
