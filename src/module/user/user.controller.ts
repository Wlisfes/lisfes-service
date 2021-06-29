import { Controller, Session, Post, Put, Get, Body, Query, Req, Response } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiConsumes, ApiProduces, ApiResponse, ApiHeader } from '@nestjs/swagger'
import { UserService } from './user.service'
import { AuthToken, APP_AUTH_TOKEN } from '@/guard/auth.guard'
import * as DTO from './user.interface'

@ApiTags('用户模块')
@Controller('user')
export class UserController {
	constructor(private readonly userService: UserService) {}

	@ApiOperation({ summary: '登录验证码' })
	@ApiResponse({ status: 200, description: 'OK' })
	@Get('code')
	public async svgCode(@Session() session: { code: string }, @Response() res) {
		const Code = await this.userService.createCode()
		session.code = Code.text.toUpperCase()
		res.type('svg')
		res.send(Code.data)
	}

	@ApiOperation({ summary: '创建用户' })
	@ApiConsumes('application/x-www-form-urlencoded', 'application/json')
	@ApiProduces('application/json', 'application/xml')
	@ApiResponse({ status: 200, description: 'OK', type: DTO.CreateUserResponse })
	@Post('create')
	async createUser(@Body() body: DTO.CreateUser, @Session() session: { code: number }) {
		return await this.userService.createUser(body, session.code)
	}

	@ApiOperation({ summary: '用户登录' })
	@ApiConsumes('application/x-www-form-urlencoded', 'application/json')
	@ApiProduces('application/json', 'application/xml')
	@ApiResponse({ status: 200, description: 'OK', type: DTO.LoginUserResponse })
	@Post('login')
	async loginUser(@Body() body: DTO.LoginUser) {
		return await this.userService.loginUser(body)
	}

	@ApiOperation({ summary: '更新用户信息' })
	@ApiHeader({ name: APP_AUTH_TOKEN, required: true })
	@ApiConsumes('application/x-www-form-urlencoded', 'application/json')
	@ApiProduces('application/json', 'application/xml')
	@ApiResponse({ status: 200, description: 'OK', type: DTO.UpdateUserResponse })
	@AuthToken({ login: true })
	@Put('update')
	async updateUser(@Body() body: DTO.UpdateUser, @Req() req: { user: { uid: number } }) {
		return await this.userService.updateUser(body, req.user.uid)
	}

	@ApiOperation({ summary: '更新用户邮箱' })
	@ApiHeader({ name: APP_AUTH_TOKEN, required: true })
	@ApiConsumes('application/x-www-form-urlencoded', 'application/json')
	@ApiProduces('application/json', 'application/xml')
	@ApiResponse({ status: 200, description: 'OK', type: DTO.UpdateUserEmailResponse })
	@AuthToken({ login: true })
	@Put('update-email')
	async updateUserEmail(
		@Body() body: DTO.UpdateUserEmail,
		@Req() req: { user: { uid: number } },
		@Session() session: { code: number }
	) {
		return await this.userService.updateUserEmail(body, req.user.uid, session.code)
	}

	@ApiOperation({ summary: '用户信息' })
	@ApiHeader({ name: APP_AUTH_TOKEN, required: true })
	@ApiResponse({ status: 200, description: 'OK', type: DTO.FindUserResponse })
	@AuthToken({ login: true, error: true })
	@Get('info')
	async findUser(@Req() req: { user: { uid: number } }) {
		return await this.userService.findUidUser(req.user.uid)
	}

	@ApiOperation({ summary: '用户列表' })
	@ApiConsumes('application/x-www-form-urlencoded', 'application/json')
	@ApiProduces('application/json', 'application/xml')
	@ApiResponse({ status: 200, description: 'OK', type: () => DTO.FindUsersResponse })
	@Get('list')
	async findUsers(@Query() query: DTO.FindUsers) {
		return await this.userService.findUsers(query)
	}
}
