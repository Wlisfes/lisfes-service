import { ApiProperty, PickType, OmitType, IntersectionType } from '@nestjs/swagger'
import { IsNotEmpty, IsEmail, Length, IsOptional, IsNumber, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { JwtInterface } from '@/module/jwt/jwt.interface'

export class UserInterface {
	@ApiProperty({ required: false, description: '主键id', example: 1 })
	id: number

	@ApiProperty({ required: false, description: 'uid', example: 1624521523438 })
	uid: number

	@ApiProperty({ required: false, description: '账户', example: 88888888 })
	account: number

	@ApiProperty({ required: false, description: '昵称', example: '妖雨纯' })
	nickname: string

	@ApiProperty({ required: false, description: '邮箱', example: '876451336@qq.com' })
	email: string

	@ApiProperty({ required: false, description: '密码', example: '****************' })
	password: string | null

	@ApiProperty({ required: false, description: '头像', example: 'https://oss.lisfes.cn/xxx/xxx.png' })
	@IsOptional()
	avatar: string | null

	@ApiProperty({ required: false, description: '手机号', example: 18888888888 })
	mobile: number | null

	@ApiProperty({ description: '状态', enum: [0, 1], example: 0 | 1 })
	status: 1 | 0

	@ApiProperty({ description: '总数', example: 0 })
	total: number

	@ApiProperty({ description: '备注', example: '备注' })
	comment: string
}

class UserParameter {
	@ApiProperty({ description: 'uid', example: 1624521523438 })
	@IsNotEmpty({ message: 'uid 必填' })
	@Length(13, 13, { message: 'uid 格式错误' })
	@Type(type => Number)
	uid: number

	@ApiProperty({ description: '邮箱验证码', example: 599348 })
	@IsNotEmpty({ message: '邮箱验证码 必填' })
	@Type(type => Number)
	code: number

	@ApiProperty({ description: '账户', example: 88888888 })
	@IsNotEmpty({ message: '账户 必填' })
	@Type(type => Number)
	account: number

	@ApiProperty({ description: '昵称', example: '妖雨纯' })
	@IsNotEmpty({ message: '昵称 必填' })
	nickname: string

	@ApiProperty({ description: '邮箱', example: '876451336@qq.com' })
	@IsNotEmpty({ message: '邮箱 必填' })
	@IsEmail()
	email: string

	@ApiProperty({ description: '密码', example: '888888' })
	@IsNotEmpty({ message: '密码 必填' })
	@Length(6, 16, { message: '密码长度必须6~16位' })
	password: string

	@ApiProperty({ description: '头像', example: 'https://oss.lisfes.cn/xxx/xxx.png' })
	@IsNotEmpty({ message: '头像 必填' })
	avatar: string

	@ApiProperty({ description: '状态', enum: [0, 1], example: 0 | 1 })
	@IsNotEmpty({ message: '状态 必填' })
	@Type(type => Number)
	status: 1 | 0

	@ApiProperty({ description: '分页', example: 1 })
	@IsNotEmpty({ message: 'page 必填' })
	@IsNumber({}, { message: 'page必须是数字' })
	@Min(1, { message: 'page不能小于1' })
	@Type(type => Number)
	page: number

	@ApiProperty({ description: '分页数量', example: 10 })
	@IsNotEmpty({ message: 'size 必填' })
	@IsNumber({}, { message: 'size必须是数字' })
	@Min(1, { message: 'size不能小于1' })
	@Type(type => Number)
	size: number
}

export class CreateCode {
	@ApiProperty({ description: 'text', example: 3045 })
	text: string
	@ApiProperty({ description: 'text', example: 3045 })
	data: string
}

/**创建用户-Parameter******************************************************************************/
export class CreateUserParameter extends PickType(UserParameter, ['nickname', 'password', 'email', 'code']) {}
/**创建用户-Response**/
export class CreateUserResponse {
	@ApiProperty({ description: 'message', example: '注册成功' })
	message: string
}

/**用户登录-Parameter******************************************************************************/
export class LoginUserParameter extends PickType(UserParameter, ['account', 'password']) {
	@ApiProperty({ description: '验证码', example: 'hj56' })
	@IsNotEmpty({ message: '验证码 必填' })
	@Type(type => String)
	code: string
}
/**用户登录-Response**/
export class LoginUserResponse extends PickType(JwtInterface, ['token']) {}

/**用户信息-Response******************************************************************************/
export class NodeUserResponse extends OmitType(UserInterface, ['total']) {}

/**用户列表-Parameter******************************************************************************/
export class NodeUsersParameter extends PickType(UserParameter, ['page', 'size']) {}
/**用户列表-Response**/
export class NodeUsersResponse extends PickType(UserInterface, ['total']) {
	@ApiProperty({ description: '用户列表', type: [OmitType(UserInterface, ['total'])], example: [] })
	list: UserInterface[]
}

/**更新用户信息-Parameter******************************************************************************/
export class UpdateNodeUserParameter extends IntersectionType(
	PickType(UserParameter, ['nickname', 'status']),
	PickType(UserInterface, ['avatar'])
) {}
/**更新用户信息-Response**/
export class UpdateNodeUserResponse extends OmitType(UserInterface, ['total']) {}

/**修改用户邮箱-Parameter******************************************************************************/
export class UpdateNodeUserEmailParameter extends PickType(UserParameter, ['email', 'code']) {}
/**修改用户邮箱-Response**/
export class UpdateNodeUserEmailResponse extends OmitType(UserInterface, ['total']) {}
