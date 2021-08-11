import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm'
import { DateEntity } from '@/entity/common.entity'

@Entity('menu')
export class MenuEntity extends DateEntity {
	@PrimaryGeneratedColumn({ comment: '自增长主键' })
	id: number

	@Column({ comment: '节点类型: 1.目录 2.菜单', default: 1, nullable: false })
	type: number

	@Column({ comment: '节点名称', nullable: false })
	name: string

	@Column({ comment: '节点路由', nullable: true })
	router: string

	@Column({ comment: '路由缓存: 0.关闭 1.开启', default: 1, nullable: false })
	keepAlive: number

	@Column({ comment: '是否可见: 0.隐藏 1.显示', default: 1, nullable: false })
	visible: number

	@Column({ comment: '状态: 0.禁用 1.启用 2.删除', default: 1, nullable: false })
	status: number

	@Column({ comment: '文件路径', nullable: true })
	path: string

	@Column({ comment: '节点图标', nullable: true })
	icon: string

	@Column({ comment: '排序号', default: 0, nullable: false })
	order: number

	@ManyToOne(
		type => MenuEntity,
		role => role.children
	)
	parent: MenuEntity

	@OneToMany(
		type => MenuEntity,
		role => role.parent
	)
	children: MenuEntity[]

	// @Column({ comment: '权限' })
	// permission: string
}
