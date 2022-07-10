# 使用PIXI和GSAP实现自行车刹车动效 | 猿创营

## 1. PIXI和GSAP

 **在理解中：**

- PIXI执行的是对于canvas的封装
- GSAP执行的是在canvas的一些动画

## 2. 初始化依赖

```html
<script src="https://pixijs.download/release/pixi.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.10.4/gsap.min.js"></script>
<script src="./js/brakebanner.js"></script>
<script>
    window.onload = init;

    function init() {
        let banner = new BrakeBanner("#brakebanner");
    }
</script>
```

## 3.初始化

### 3.1 画布

**在类的构造函数中**

```js
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
```

### 3.2 加载器

```js
// 创建加载器
this.loader = new PIXI.Loader()

// add(key,资源)  这里的key是为了后面在界面上加载指定元素的时候使用的
this.loader.add('btn.png', 'images/btn.png')
this.loader.add('btn_circle.png', 'images/btn_circle.png')
this.loader.add('brake_lever.png', 'images/brake_lever.png')
this.loader.add('brake_bike.png', 'images/brake_bike.png')
this.loader.add('brake_handlerbar.png', 'images/brake_handlerbar.png')

this.loader.load()

this.loader.onComplete.add(() => {
  this.show()
})
```

## 4. 添加元素至画布

> **先被添加到画布的元素，会至于底层，可以理解为，后面的添加到画布的z-index自动加一**

**加载方法**

```js
loadSprite(img) {
  // 这里的img就是我们在上面通过加载注册的key值
  // 如果没有.texture的话界面上就不会先显示
  return new PIXI.Sprite(this.loader.resources[img].texture)
}
```

## 5. 实现加载点击按钮

```js
createActionButton() {
  // 通过容器饿形式，将我们的按钮定在一个容器里，可以理解为包裹元素的大div
  let actionButton = new PIXI.Container()

  let btnImage = this.loadSprite('btn.png')
  let btnCircle = this.loadSprite('btn_circle.png')
  let btnCircle2 = this.loadSprite('btn_circle.png')

  actionButton.addChild(btnImage)
  actionButton.addChild(btnCircle)
  actionButton.addChild(btnCircle2)

  // 这边是设置圆心，注意单词是pivot不是point
  // 当时写了半天没效果，发现是api写错了
  btnImage.pivot.x = btnImage.pivot.y = btnImage.width / 2
  btnCircle.pivot.x = btnCircle.pivot.y = btnCircle.width / 2
  btnCircle2.pivot.x = btnCircle2.pivot.y = btnCircle2.width / 2

  // 放大动效
  btnCircle.scale.x = btnCircle.scale.y = 0.8

  // 这里就是使用了gsap来进行动画效果，第一个参数是修改的元素，第二个参数是配置项
  // 这里实现的效果是内圆放大， repeat表示重复
  gsap.to(btnCircle.scale, {
    duration: 1,
    x: 1.3,
    y: 1.3,
    repeat: -1
  })

  // 这里实现的效果是内圆的透明度变化
  gsap.to(btnCircle, {
    duration: 1,
    alpha: 0,
    repeat: -1
  })

  return actionButton
}
```

**主加载方法**

```js
show() {
  let actionButton = this.createActionButton()

  // 在这里将按钮容器定位到合适的位置
  actionButton.x = actionButton.y = 500
}
```

## 6.实现自行车的加载

```js
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
  // 这些尺寸拿的是视频中量好的点
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
    // 旋转角度
    rotation: Math.PI / 180 * -30 
   })

    // 后面会定义，这是按住按钮暂停线的流动
   this.pauseLineMove()

    // 实现自行车停下的线性停止
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

    // 后面会定义，松开按钮，开始线的流动
   this.startLineMove()

    // 实现还原到自行车线性停止前的位置
   gsap.to(bikeContainer, {
    duration: 0.8,
    y: bikeContainer.y - 20
   })
  })


  this.stage.addChild(actionButton)

  // 自适应伸缩
  let resize = () => {
   bikeContainer.x = window.innerWidth - bikeContainer.width
   bikeContainer.y = window.innerHeight - bikeContainer.height
  }

  window.addEventListener('resize', resize)

  resize()


  return bikeContainer
 }
```

**主函数**

```js
 show() {
  let actionButton = this.createActionButton()
  actionButton.x = actionButton.y = 500

  this.createBike(actionButton)
 }
```

## 7. 实现行进线的交互

```js
 // 创建粒子和行走线
 createParticleAndLine() {
  // 需要实现的效果
  //  粒子有多个颜色
  //  向某一个角度持续移动
  //  超出边界后顶部继续移动
  //  按住鼠标停止
  //  停止的时候还有回弹的效果
  //  松开鼠标继续
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

```

**这里实现的思路是**:

  1. 加载一个装行进线的容器
  2. 随机生成一些像素点
  3. 将像素点随机颜色
  4. 记录像素点的初始位置及绘图元素，并添加到粒子数组particles中，并且添加到1的容器中，显示于界面上
  5. 通过gsap的ticker，定义循环的帧动画，然后慢慢叠加下落速度，并判断超出可视区域，重新开始下落
  6. 然后将1的容器旋转角度，达到倾斜的下落，通过调整粒子画布元素的x,y放大比例来实现点状线型的行进感觉
  7. 定义开始和暂停函数
      - 7.1 开始初始化速度，添加ticker事件
      - 7.2 删除ticker事件，并将所有粒子的画布元素的缩放调整为1(及点4中初始化的情况)，并通过gsap达到一个线性暂停的效果
  8. 将开始和暂停函数分别添加给按钮的按下和松开

**主函数**

```js
 show() {
  this.createParticleAndLine()


  let actionButton = this.createActionButton()
  actionButton.x = actionButton.y = 500

  this.createBike(actionButton)
 }
```

---

这只是特效中的一部分。加入我们一起搞事情。

在**公众号**里搜 **`大帅老猿`**，他做技术外包很靠谱
