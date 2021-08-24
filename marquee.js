import gsap from 'gsap'
import { debounce } from '../utils/utils'

/**
 * Marquee Class
 * @Class Marquee
 */
export default class Marquee {
  /**
   * Create a Marquee Slider
   * @param {Node} container - The x value.
   * @param {object} config - The y value.
   */
  constructor(container, config) {
    this.container = container

    this.setConfig(config)
    this.updating = true
    this.progress = 0
    this.animated = false
    const speedStart = this.config.direction
      ? -this.config.delta
      : this.config.delta
    this.speed = {
      init: speedStart,
      value: speedStart,
    }
    this.limits = {
      max: 0,
      min: 0,
    }

    this.element = this.container.querySelector(this.config.className)
    this.slides = []
    this.slides.push({
      el: this.element,
    })

    this.update = this.update.bind(this)
    this.debouncedResize = debounce(this.resize.bind(this), 1000)
    this.play = this.toggle.bind(this, true)
    this.pause = this.toggle.bind(this, false)
    this.mouseLeave = this.mouseToggle.bind(this, false)
    this.mouseEnter = this.mouseToggle.bind(this, true)

    this.init()
  }

  /**
   * Function to set basic configuration and add custom configuration
   *
   * @method setConfig
   * @access public
   * @param {object} config - user object passed to override default configuration
   * @returns {void}
   */
  setConfig(config) {
    this.config = {
      margin: 30,
      hover: false,
      className: '.js-infiniteScroll-line',
      autoPlay: false,
      delta: 1,
      easing: 0.55 + 0.065,
      friction: 0.09 + 0.5,
    }

    Object.keys(config).forEach((key) => {
      if (config[key]) {
        this.config[key] = config[key]
      }
    })

    this.config.direction =
      this.container.dataset.direction !== undefined || this.config.direction

    this.config.autoPlay =
      this.container.dataset.autoplay !== undefined || this.config.autoPlay
  }

  /**
   * Function to destroy all events and RequestAnimationFrame from MarqueeSlider
   *
   * @method destroy
   * @access public
   * @returns {void}
   */
  destroy() {
    window.removeEventListener('resize', this.debouncedResize)
    if (this.config.hover) {
      this.container.removeEventListener('mouseleave', this.mouseEnter)
      this.container.removeEventListener('mouseenter', this.mouseLeave)
    }
    this.pause()
  }

  /**
   * Function to Init the events and autoplay
   *
   * @method init
   * @access public
   * @returns {void}
   */
  init() {
    window.addEventListener('resize', this.debouncedResize)
    this.resize()
    if (this.config.hover) {
      this.container.addEventListener('mouseleave', this.mouseEnter)
      this.container.addEventListener('mouseenter', this.mouseLeave)
    }
    if (this.config.autoPlay) {
      this.play()
    }
  }

  /**
   * Function to toggle the mouse event
   *
   * @method mouseToggle
   * @access public
   * @param {boolean} state - true or false to update mouse stop
   * @returns {void}
   */
  mouseToggle(state) {
    if (this.updating === state) return
    this.updating = state
  }

  /**
   * Function to reorganize elements (remove elements if too large and add if too small)
   *
   * @method resize
   * @access public
   * @returns {void}
   */
  resetElements() {
    let width = 0
    const maxWidth = this.size.container.width + this.size.element.width
    const singleWidth = this.size.element.width + this.config.margin
    for (let i = this.slides.length - 1; i > 0; i -= 1) {
      const slide = this.slides[i]
      if (width > maxWidth) {
        slide.el.remove()
        this.slides.splice(i, 1)
      }
      width += singleWidth
    }

    const currentWidth = this.slides.length * singleWidth
    const deltaWidth = maxWidth - currentWidth
    const newElements = Math.ceil(deltaWidth / singleWidth)
    for (let i = 0; i < newElements; i += 1) {
      const newNode = this.element.cloneNode(true)
      this.container.appendChild(newNode)
      this.slides.push({
        el: newNode,
      })
    }
  }

  /**
   * Function to reset positions to 0
   *
   * @method resize
   * @access public
   * @returns {void}
   */
  resetPositions() {
    let position = this.config.direction ? 0 : this.size.container.width
    this.limits.max = 0
    this.slides.forEach((slide) => {
      const { width } = this.size.element
      const limit = width + this.config.margin
      this.limits.max += limit
      if (!this.config.direction) position -= limit
      slide.limit = limit
      slide.x = {
        delta: 0,
        position,
        target: position,
        v: 0,
      }
      if (this.config.direction) position += limit
    })

    this.slides.forEach((slide) => {
      slide.el.style.transform = `matrix(1, 0, 0, 1, ${slide.x.position}, 0)`
    })
  }

  /**
   * Function to rezize all elements
   *
   * @method resize
   * @access public
   * @returns {void}
   */
  resize() {
    this.size = {
      element: {
        height: this.element.offsetHeight,
        width: this.element.offsetWidth,
      },
      container: {
        offset: this.container.getBoundingClientRect().left,
        width: this.container.offsetWidth,
      },
    }
    this.resetElements()
    this.container.style.height = `${this.size.element.height}px`
    this.resetPositions()
    this.resetSpeed(false)
  }

  /**
   * Function to update spedd scroll position
   *
   * @method updateSpeed
   * @access public
   * @param {percent} progress - progress in percent to pass
   * @param {boolean} reset - if reset speed or not
   * @returns {void}
   */
  updateSpeed(progress, reset) {
    gsap.killTweensOf(this.speed)
    const progressDelta = Math.abs(this.progress - progress) * 100
    const newSpeed = this.delta + progressDelta * 2
    this.speed.value = this.direction ? -newSpeed : newSpeed
    this.progress = progress
    if (reset) this.resetSpeed(true)
  }

  /**
   * Function to reset speed
   *
   * @method resetSpeed
   * @access public
   * @param {boolean} animated - boolean to ease or not speed to init
   * @returns {void}
   */
  resetSpeed(animated) {
    const functionName = animated ? 'to' : 'set'
    gsap[functionName](this.speed, { duration: 0.3, value: this.speed.init })
  }

  /**
   * Function to toggle Animation Frame
   *
   * @method toggle
   * @access public
   * @param {boolean} state - boolean to update animation frame
   * @returns {void}
   */
  toggle(state) {
    if (state === this.animated) return
    this.animated = state
    if (this.animated) {
      this.update()
    } else {
      window.cancelAnimationFrame(this.animation)
    }
  }

  /**
   * Function to update frame
   *
   * @method update
   * @access public
   * @returns {void}
   */
  update() {
    if (this.updating) {
      this.updatePositions(this.speed.value, false)
    }
    this.setAnimationFrame()
  }

  /**
   * Function to update positions of elements
   *
   * @method updatePositions
   * @access public
   * @param {Number} delta - speed to update elements position
   * @param {boolean} force - if true go to position and if not only set target and ease position
   * @returns {void}
   */
  updatePositions(delta, force) {
    this.slides.forEach((element) => {
      element.x.target += delta
      this.ease(element.x)
      if (force) element.x.position = element.x.target
      this.checkExtremity(element)
      if (this.isElementInViewport(element) || force) {
        element.el.style.transform = `matrix(1, 0, 0, 1, ${element.x.position}, 0)`
      }
    })
  }

  /**
   * Function to check if element is outside extremity and put it on the other side
   *
   * @method checkExtremity
   * @access public
   * @param {{ el: Node, limit: Number, x: { delta: Number, position: Number, target: Number, v: Number } }} element - to check
   * @returns {void}
   */
  checkExtremity(element) {
    let extremityValue = 0
    if (element.x.position > this.size.container.width) {
      extremityValue = -this.limits.max
    }
    if (element.x.position <= -element.limit) {
      extremityValue = this.limits.max
    }
    if (extremityValue !== 0) {
      this.constructor.updateElementExtremity(element.x, extremityValue)
    }
  }

  /**
   * Function to launch animation frame
   *
   * @method setAnimationFrame
   * @access public
   * @returns {void}
   */
  setAnimationFrame() {
    this.animation = window.requestAnimationFrame(this.update)
  }

  /**
   * Function check if element is in viewport
   *
   * @method isElementInViewport
   * @access public
   * @param {{ el: Node, limit: Number, x: { delta: Number, position: Number, target: Number, v: Number } }} element to check
   * @returns boolean
   */
  isElementInViewport(element) {
    return (
      element.x.position <=
        this.size.container.width + this.size.container.offset &&
      element.x.position >=
        -this.size.element.width + this.size.container.offset
    )
  }

  /**
   * Function update element position with limits
   *
   * @method updateElementExtremity
   * @access public
   * @param {{ el: Node, limit: Number, x: { delta: Number, position: Number, target: Number, v: Number } }} element to update
   * @param {Number} value - value to add
   * @returns {void}
   */
  static updateElementExtremity(element, value) {
    element.position += value
    element.target += value
  }

  /**
   * Function to ease element position
   *
   * @method ease
   * @access public
   * @param {{ el: Node, limit: Number, x: { delta: Number, position: Number, target: Number, v: Number } }} element to ease position
   * @returns {void}
   */
  ease(element) {
    element.delta = element.target - element.position
    element.v += element.delta * this.config.easing
    element.v *= this.config.friction
    element.position += element.v
  }
}
