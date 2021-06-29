import { Injectable, HttpException, HttpStatus } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserEntity } from '@/entity/user.entity'
import { JwtAuthService } from '@/module/jwt/jwt.service'
import { compareSync } from 'bcryptjs'
import { create } from 'svg-captcha'
import * as DTO from './user.interface'

@Injectable()
export class UserService {
	constructor(
		@InjectRepository(UserEntity) private readonly userModel: Repository<UserEntity>,
		private readonly jwtAuthService: JwtAuthService
	) {}

	//验证码
	async createCode(): Promise<DTO.CreateCode> {
		return create({
			fontSize: 36,
			noise: 2,
			width: 125,
			height: 32,
			inverse: true,
			background: '#cc9966'
		})
	}

	//创建用户
	async createUser(props: DTO.CreateUser, code: number): Promise<UserEntity> {
		try {
			if (code !== props.code) {
				throw new HttpException('验证码错误', HttpStatus.BAD_REQUEST)
			}
			if (await this.userModel.findOne({ username: props.username })) {
				throw new HttpException('用户名已存在', HttpStatus.BAD_REQUEST)
			}
			const newUser = await this.userModel.create({
				...props,
				email: '876451336@qq.com',
				mobile: 18676361342
			})
			const { uid } = await this.userModel.save(newUser)
			return await this.findUidUser(uid)

			// Object.keys([...Array(35)]).forEach(async k => {
			// 	const newUser = await this.userModel.create({
			// 		...props,
			// 		email: '876451336@qq.com',
			// 		mobile: 18676361342
			// 	})
			// 	await this.userModel.save(newUser)
			// })
		} catch (e) {
			throw new HttpException(e.message || e.toString(), HttpStatus.BAD_REQUEST)
		}
	}

	//用户登录
	async loginUser(props: DTO.LoginUser) {
		try {
			const user = await this.userModel
				.createQueryBuilder('user')
				.orWhere('user.username = :username', { username: props.username })
				.orWhere('user.email = :email', { email: props.username })
				.orWhere('user.mobile = :mobile', { mobile: props.username })
				.getOne()

			if (!user) {
				throw new HttpException('用户名错误', HttpStatus.BAD_REQUEST)
			}
			if (user.status !== 1) {
				throw new HttpException('账户已被禁用', HttpStatus.BAD_REQUEST)
			}
			if (!compareSync(props.password, user.password)) {
				throw new HttpException('密码错误', HttpStatus.BAD_REQUEST)
			}
			return await this.jwtAuthService.signature({
				uid: user.uid,
				password: user.password
			})
		} catch (e) {
			throw new HttpException(e.message || e.toString(), HttpStatus.BAD_REQUEST)
		}
	}

	//修改用户
	async updateUser(props: DTO.UpdateUser, uid: number): Promise<UserEntity> {
		try {
			await this.userModel.update({ uid }, { ...props })
			return await this.findUidUser(uid)
		} catch (e) {
			throw new HttpException(e.message || e.toString(), HttpStatus.BAD_REQUEST)
		}
	}

	//修改用户邮箱
	async updateUserEmail(props: DTO.UpdateUserEmail, uid: number, code: number): Promise<UserEntity> {
		try {
			if (code !== props.code) {
				throw new HttpException('验证码错误', HttpStatus.BAD_REQUEST)
			}

			await this.userModel.update({ uid }, { email: props.email })
			return await this.findUidUser(uid)
		} catch (e) {
			throw new HttpException(e.message || e.toString(), HttpStatus.BAD_REQUEST)
		}
	}

	//uid获取用户信息
	async findUidUser(uid: number): Promise<UserEntity> {
		try {
			const user = await this.userModel.findOne({ uid })
			if (user) {
				return user
			}
			throw new HttpException('uid 错误', HttpStatus.BAD_REQUEST)
		} catch (e) {
			throw new HttpException(e.message || e.toString(), HttpStatus.BAD_REQUEST)
		}
	}

	//用户列表
	async findUsers(props: DTO.FindUsers) {
		try {
			const [list = [], total] = await this.userModel.findAndCount({
				order: { uid: 'DESC' },
				skip: (props.page - 1) * props.size,
				take: props.size
			})

			return { total, size: props.size, page: props.page, list }
		} catch (e) {
			throw new HttpException(e.message || e.toString(), HttpStatus.BAD_REQUEST)
		}
	}
}
