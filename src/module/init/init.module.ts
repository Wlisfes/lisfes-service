import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'

//依赖模块挂载
import { AliyunModule } from '@/module/aliyun/aliyun.module'
import { BannerModule } from '@/module/banner/banner.module'
import { UserModule } from '@/module/user/user.module'

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		TypeOrmModule.forRoot(),
		AliyunModule.forRoot({
			accessKeyId: process.env.ALIYUN_ACCESSKEYID,
			accessKeySecret: process.env.ALIYUN_ACCESSKEYSECRET,
			endpoint: process.env.ALIYUN_ENDPOINT,
			apiVersion: process.env.ALIYUN_APIVERSION
		}),
		BannerModule,
		UserModule
	]
})
export class InitModule {}

export async function webSwagger(app) {
	const options = new DocumentBuilder()
		.setTitle('Cloud-Service')
		.setDescription('Cloud-Service Api Documentation')
		.setVersion('1.0')
		.build()
	const document = SwaggerModule.createDocument(app, options, {
		include: [AliyunModule, BannerModule, UserModule]
	})
	SwaggerModule.setup('api-desc', app, document)
	return this
}
