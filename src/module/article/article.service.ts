import { Injectable, HttpException, HttpStatus } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In, Not, Like, Brackets } from 'typeorm'
import { isEmpty } from 'class-validator'
import { ArticleEntity } from '@/entity/article.entity'
import { SourceEntity } from '@/entity/source.entity'
import { UserEntity } from '@/entity/user.entity'
import * as DTO from './article.interface'

@Injectable()
export class ArticleService {
	constructor(
		@InjectRepository(ArticleEntity) private readonly articleModel: Repository<ArticleEntity>,
		@InjectRepository(SourceEntity) private readonly sourceModel: Repository<SourceEntity>,
		@InjectRepository(UserEntity) private readonly userModel: Repository<UserEntity>
	) {}

	/**创建文章**/
	public async nodeCreateArticle(props: DTO.NodeCreateArticleParameter, uid: number) {
		try {
			let source = []
			if (props.source?.length > 0) {
				source = await this.sourceModel.find({ where: { id: In(props.source) } })
				props.source.forEach(id => {
					const element = source.find(element => element.id === id)
					if (!element) {
						throw new HttpException(`标签id ${id} 不存在`, HttpStatus.BAD_REQUEST)
					} else if (element?.status === 0) {
						throw new HttpException(`标签 ${element.name} 已禁用`, HttpStatus.BAD_REQUEST)
					} else if (element?.status === 2) {
						throw new HttpException(`标签 ${element.name} 已删除`, HttpStatus.BAD_REQUEST)
					}
				})
			}

			const user = await this.userModel.findOne({ where: { uid } })
			const newArticle = await this.articleModel.create({
				title: props.title,
				cover: props.cover,
				content: props.content,
				url: props.url || null,
				status: isEmpty(props.status) ? 1 : props.status,
				order: props.order || 0,
				source,
				user
			})
			await this.articleModel.save(newArticle)

			return { message: '创建成功' }
		} catch (e) {
			throw new HttpException(e.message || e.toString(), HttpStatus.BAD_REQUEST)
		}
	}

	/**修改文章**/
	public async nodeUpdateArticle(props: DTO.NodeUpdateArticleParameter) {
		try {
			const article = await this.articleModel.findOne({ where: { id: props.id }, relations: ['source'] })
			if (!article) {
				throw new HttpException('文章不存在', HttpStatus.BAD_REQUEST)
			}

			if (props.source?.length > 0) {
				const source = await this.sourceModel.find({ where: { id: In(props.source) } })
				props.source.forEach(id => {
					const element = source.find(element => element.id === id)
					if (!element) {
						throw new HttpException(`标签id ${id} 不存在`, HttpStatus.BAD_REQUEST)
					} else if (element?.status === 0) {
						throw new HttpException(`标签 ${element.name} 已禁用`, HttpStatus.BAD_REQUEST)
					} else if (element?.status === 2) {
						throw new HttpException(`标签 ${element.name} 已删除`, HttpStatus.BAD_REQUEST)
					}
				})
			}

			//删除已有的标签
			await this.articleModel
				.createQueryBuilder()
				.relation('source')
				.of(article)
				.addAndRemove(
					props.source,
					article.source.map(k => k.id)
				)

			await this.articleModel.update(
				{ id: props.id },
				{
					title: props.title,
					cover: props.cover,
					content: props.content,
					url: props.url || null,
					status: isEmpty(props.status) ? article.status : props.status,
					order: props.order || 0
				}
			)

			return { message: '修改成功' }
		} catch (e) {
			throw new HttpException(e.message || e.toString(), HttpStatus.BAD_REQUEST)
		}
	}

	/**切换文章状态**/
	public async nodeArticleCutover(props: DTO.NodeArticleCutoverParameter) {
		try {
			const article = await this.articleModel.findOne({ where: { id: props.id } })
			if (!article) {
				throw new HttpException('文章不存在', HttpStatus.BAD_REQUEST)
			} else if (article.status === 2) {
				throw new HttpException('文章已删除', HttpStatus.BAD_REQUEST)
			}
			await this.articleModel.update(
				{ id: props.id },
				{
					status: article.status ? 0 : 1
				}
			)

			return { message: '修改成功' }
		} catch (e) {
			throw new HttpException(e.message || e.toString(), HttpStatus.BAD_REQUEST)
		}
	}

	/**文章信息**/
	public async nodeArticle(props: DTO.NodeArticleParameter) {
		try {
			const article = await this.articleModel.findOne({
				where: { id: props.id },
				relations: ['source', 'user']
			})
			if (!article) {
				throw new HttpException('文章不存在', HttpStatus.BAD_REQUEST)
			}
			return article
		} catch (e) {
			throw new HttpException(e.message || e.toString(), HttpStatus.BAD_REQUEST)
		}
	}

	/**文章列表**/
	public async nodeArticles(props: DTO.NodeArticlesParameter, uid: number) {
		try {
			const [list = [], total = 0] = await this.articleModel
				.createQueryBuilder('article')
				.leftJoinAndSelect('article.source', 'source')
				.leftJoinAndSelect('article.user', 'user')
				.where(
					new Brackets(Q => {
						Q.where('user.uid = :uid', { uid })

						if (isEmpty(props.status)) {
							Q.andWhere('article.status != :status', { status: 2 })
						} else {
							Q.andWhere('article.status = :status', { status: props.status })
						}

						if (props.title) {
							Q.andWhere('article.title LIKE :title', { title: `%${props.title}%` })
						}

						if (props.source) {
							Q.andWhere('source.id = :source', { source: props.source })
						}
					})
				)
				.skip((props.page - 1) * props.size)
				.take(props.size)
				.getManyAndCount()

			return {
				size: props.size,
				page: props.page,
				total,
				list
			}
		} catch (e) {
			throw new HttpException(e.message || e.toString(), HttpStatus.BAD_REQUEST)
		}
	}

	/**删除文章**/
	public async nodeDeleteArticle(props: DTO.NodeDeleteArticleParameter) {
		try {
			const article = await this.articleModel.findOne({ where: { id: props.id } })
			if (!article) {
				throw new HttpException('文章不存在', HttpStatus.BAD_REQUEST)
			} else if (article.status === 2) {
				throw new HttpException('文章已删除', HttpStatus.BAD_REQUEST)
			}
			await this.articleModel.update({ id: props.id }, { status: 2 })

			return { message: '删除成功' }
		} catch (e) {
			throw new HttpException(e.message || e.toString(), HttpStatus.BAD_REQUEST)
		}
	}
}
