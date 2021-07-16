import { CanActivate, SetMetadata, ExecutionContext, Injectable, HttpException, HttpStatus } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtAuthService } from '@/module/jwt/jwt.service'
import { RedisService } from '@/module/redis/redis.service'
import { UserService } from '@/module/user/user.service'
import { RoleService } from '@/module/role/role.service'
import { RoleEnum, RoleModuleEnum, RoleActionEnum } from '@/config/role.config'

export const APP_AUTH = Symbol('APP_AUTH')
export const APP_AUTH_ROLE = Symbol('APP_AUTH_ROLE')
export const APP_AUTH_TOKEN = 'app-token'

export class AuthTokenInterface {
	login: boolean /**是否验证登录**/
	error?: boolean /**未登录是否抛出异常**/
}

export class AuthRoleInterface {
	role: RoleEnum[] /**所需角色**/
	module: RoleModuleEnum /**所需功能模块**/
	action: RoleActionEnum /**所需操作权限**/
	error?: boolean /**未通过是否抛出异常**/
}

const useThrow = (message: string, code: number, error: boolean) => {
	if (error) {
		return true
	}
	throw new HttpException(message, code)
}

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		private readonly jwtAuthService: JwtAuthService,
		private readonly redisService: RedisService,
		private readonly userService: UserService,
		private readonly roleService: RoleService
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest()
		const props = this.reflector.get<AuthTokenInterface>(APP_AUTH, context.getHandler())
		const petence = this.reflector.get<AuthRoleInterface>(APP_AUTH_ROLE, context.getHandler())

		if (props?.login) {
			//验证是否需要登录
			const token = request.headers[APP_AUTH_TOKEN]
			if (!token) {
				//未携带token、props.error等于true、不需要抛出异常、可继续执行
				return useThrow('未登陆', HttpStatus.UNAUTHORIZED, props.error)
			}

			//token解密
			const { uid } = await this.jwtAuthService.signverify(token)
			const store = await this.redisService.getStore(`user-${uid}`)
			if (store) {
				request.user = store
			} else {
				const user = await this.userService.nodeUidUser(uid)
				if (!user) {
					return useThrow('账户不存在', HttpStatus.FORBIDDEN, props.error)
				} else if (!props.error && user.status !== 1) {
					return useThrow('账户已被禁用', HttpStatus.FORBIDDEN, props.error)
				}
				await this.redisService.setStore(`user-${uid}`, user, 24 * 60 * 60)
				request.user = user
			}
		}

		if (petence?.role?.length > 0) {
			//验证用户权限
			const role = await this.roleService.nodeUserRole(request.user.uid)
			if (!petence.role.includes(role.primary as RoleEnum)) {
				return useThrow('角色不符', HttpStatus.FORBIDDEN, petence.error)
			} else if (role.status === 0) {
				return useThrow('角色已禁用', HttpStatus.FORBIDDEN, petence.error)
			} else if (!role.children.find(k => k.primary === petence.module)) {
				return useThrow('角色功能不足', HttpStatus.FORBIDDEN, petence.error)
			} else if (!role.children.find(k => k.primary === petence.module).status) {
				return useThrow('角色功能已禁用', HttpStatus.FORBIDDEN, petence.error)
			} else {
				const { children } = role.children.find(k => k.primary === petence.module)
				if (!children.find(k => k.primary === petence.action)) {
					return useThrow('角色功能已权限不足', HttpStatus.FORBIDDEN, petence.error)
				} else if (!children.find(k => k.primary === petence.action).status) {
					return useThrow('角色功能已权限已禁用', HttpStatus.FORBIDDEN, petence.error)
				} else {
					//验证通过
					return true
				}
			}
		}

		return true
	}
}

//用户登录守卫  使用AuthToken守卫的接口会验证用户登录
export const AuthToken = (props: AuthTokenInterface) => SetMetadata(APP_AUTH, props)

/**用户角色守卫  使用AuthRole守卫的接口会验证用户权限**/
export const AuthRole = (props: AuthRoleInterface) => SetMetadata(APP_AUTH_ROLE, props)
