class BrakeBanner {
	constructor(selector) {
		this.app = new PIXI.Application({
			width: window.innerWidth,
			height: window.innerHeight,
			backgroundColor: 0xffffff,
			// 铺满界面
			resizeTo: window
		})

		// 初始化背景
		document.querySelector(selector).appendChild(this.app.view)

		this.stage = this.app.stage

		// 创建加载器
		this.loader = new PIXI.Loader()


		this.loader.add('btn.png', 'images/btn.png')
		this.loader.add('btn_circle.png', 'images/btn_circle.png')
		this.loader.add('brake_lever.png', 'images/brake_lever.png')
		this.loader.add('brake_bike.png', 'images/brake_bike.png')
		this.loader.add('brake_handlerbar.png', 'images/brake_handlerbar.png')

		this.loader.load()

		this.loader.onComplete.add(() => {
			this.show()
		})
	}

	show() {
		this.createParticleAndLine()

		let actionButton = this.createActionButton()
		actionButton.x = actionButton.y = 500

		this.createBike(actionButton)
	}

	loadSprite(img) {
		return new PIXI.Sprite(this.loader.resources[img].texture)
	}

	createActionButton() {
		let actionButton = new PIXI.Container()

		let btnImage = this.loadSprite('btn.png')
		let btnCircle = this.loadSprite('btn_circle.png')
		let btnCircle2 = this.loadSprite('btn_circle.png')

		actionButton.addChild(btnImage)
		actionButton.addChild(btnCircle)
		actionButton.addChild(btnCircle2)

		btnImage.pivot.x = btnImage.pivot.y = btnImage.width / 2
		btnCircle.pivot.x = btnCircle.pivot.y = btnCircle.width / 2
		btnCircle2.pivot.x = btnCircle2.pivot.y = btnCircle2.width / 2

		// 放大动效
		btnCircle.scale.x = btnCircle.scale.y = 0.8
		gsap.to(btnCircle.scale, {
			duration: 1,
			x: 1.3,
			y: 1.3,
			repeat: -1
		})

		gsap.to(btnCircle, {
			duration: 1,
			alpha: 0,
			repeat: -1
		})

		return actionButton
	}


	createBike(actionButton) {
		let bikeContainer = new PIXI.Container()

		this.stage.addChild(bikeContainer)

		bikeContainer.scale.x = bikeContainer.scale.y = 0.3

		const bikeImage = this.loadSprite('brake_bike.png')
		const bikeHandlerImage = this.loadSprite('brake_handlerbar.png')
		const bikeLeverImage = this.loadSprite('brake_lever.png')

		bikeContainer.addChild(bikeImage)
		bikeContainer.addChild(bikeLeverImage)

		// 车把手的按下的旋转轴心及相对车把手的位置
		bikeLeverImage.pivot.x = 455
		bikeLeverImage.pivot.y = 455

		bikeLeverImage.x = 722
		bikeLeverImage.y = 900

		// 后添加的的层级在最上面
		bikeContainer.addChild(bikeHandlerImage)


		// 开启交互,及变成按钮(鼠标变成小手)
		actionButton.interactive = true
		actionButton.buttonMode = true

		actionButton.on('mousedown', () => {
			gsap.to(bikeLeverImage, {
				duration: 0.8,
				rotation: Math.PI / 180 * -30
			})

			this.pauseLineMove()

			gsap.to(bikeContainer, {
				duration: 0.8,
				y: bikeContainer.y + 20
			})
		})

		actionButton.on('mouseup', () => {
			gsap.to(bikeLeverImage, {
				duration: 0.5,
				rotation: 0
			})

			this.startLineMove()

			gsap.to(bikeContainer, {
				duration: 0.8,
				y: bikeContainer.y - 20
			})
		})


		this.stage.addChild(actionButton)

		let resize = () => {
			bikeContainer.x = window.innerWidth - bikeContainer.width
			bikeContainer.y = window.innerHeight - bikeContainer.height
		}

		window.addEventListener('resize', resize)

		resize()


		return bikeContainer
	}

	// 创建粒子和行走线
	createParticleAndLine() {
		// 粒子有多个颜色
		// 向某一个角度持续移动
		// 超出边界后顶部继续移动
		// 按住鼠标停止
		// 停止的时候还有回弹的效果
		// 松开鼠标继续
		let particleContainer = new PIXI.Container()
		this.stage.addChild(particleContainer)

		particleContainer.pivot.x = window.innerWidth / 2
		particleContainer.pivot.y = window.innerHeight / 2


		particleContainer.x = window.innerWidth / 2
		particleContainer.y = window.innerHeight / 2

		particleContainer.rotation = 35 * Math.PI / 180

		let particles = []

		const colors = [0xf1cf54, 0xb5cea8, 0xf1cf54, 0x818181, 0x000000]

		for (let i = 0; i < 15; i++) {
			let gr = new PIXI.Graphics()

			gr.beginFill(colors[Math.floor(Math.random() * colors.length)])

			gr.drawCircle(0, 0, 6)

			gr.endFill()

			let pItem = {
				sx: Math.random() * window.innerWidth,
				sy: Math.random() * window.innerWidth,
				gr: gr
			}

			gr.x = pItem.sx
			gr.y = pItem.sy

			particleContainer.addChild(gr)

			particles.push(pItem)
		}


		let speed = 0
		function loop() {
			speed += 0.5
			speed = Math.min(speed, 20)

			for (let pItem of particles) {
				pItem.gr.y += speed

				// 转换成线的流动感觉
				// 通过y放大，x缩小来达到像素点的效果
				pItem.gr.scale.y = 24
				pItem.gr.scale.x = 0.03

				if (pItem.gr.y > window.innerHeight) {
					pItem.gr.y = 0
				}
			}
		}

		function start() {
			speed = 0
			// 类似开启关键帧动画的监听事件
			gsap.ticker.add(loop)
		}

		function pause() {
			gsap.ticker.remove(loop)

			// 回归成原始的点
			for (let pItem of particles) {
				pItem.gr.scale.y = 1
				pItem.gr.scale.x = 1

				// 停下来的回弹动效
				gsap.to(pItem.gr, {
					duration: 0.6,
					x: pItem.sx,
					y: pItem.sy,
					// 缓动回弹效果
					easy: 'elastic.out'
				})
			}
		}

		start()

		this.startLineMove = start

		this.pauseLineMove = pause

	}
}
