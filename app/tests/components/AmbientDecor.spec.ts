import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AmbientDecor from '@/components/AmbientDecor.vue'

describe('AmbientDecor', () => {
  it('根节点对读屏软件隐藏', () => {
    const wrapper = mount(AmbientDecor)

    const root = wrapper.get('[data-test="ambient-decor"]')
    expect(root.attributes('aria-hidden')).toBe('true')
    expect(root.classes()).toContain('ambient')
  })

  it('渲染 3 个光斑与 4 个星点', () => {
    const wrapper = mount(AmbientDecor)

    expect(wrapper.findAll('[data-test="glow-blob"]')).toHaveLength(3)
    expect(wrapper.findAll('[data-test="sparkle"]')).toHaveLength(4)
  })

  it('星点各有独立动画延迟，避免同步闪烁', () => {
    const wrapper = mount(AmbientDecor)

    const delays = wrapper
      .findAll('[data-test="sparkle"]')
      .map((sparkle) => sparkle.attributes('style'))

    expect(new Set(delays).size).toBe(4)
    delays.forEach((style) => expect(style).toContain('animation-delay'))
  })

  it('光斑带有不同位置与尺寸', () => {
    const wrapper = mount(AmbientDecor)

    const styles = wrapper
      .findAll('[data-test="glow-blob"]')
      .map((blob) => blob.attributes('style'))

    expect(new Set(styles).size).toBe(3)
  })

  it('装饰层内不含任何可交互元素', () => {
    const wrapper = mount(AmbientDecor)

    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.find('a').exists()).toBe(false)
    expect(wrapper.find('input').exists()).toBe(false)
    expect(wrapper.find('textarea').exists()).toBe(false)
  })
})
