import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import EmptyState from '@/components/EmptyState.vue'

describe('EmptyState', () => {
  it('默认展示空列表引导文案', () => {
    const wrapper = mount(EmptyState)

    expect(wrapper.get('[data-test="empty-state"]').text()).toContain('还没有动态，发布第一条吧～')
    expect(wrapper.get('[data-test="empty-icon"]').text()).toBe('🌱')
  })

  it('支持自定义图标与文案，便于错误态复用', () => {
    const wrapper = mount(EmptyState, {
      props: { icon: '⚠️', message: '本地存储不可用' },
    })

    expect(wrapper.get('[data-test="empty-icon"]').text()).toBe('⚠️')
    expect(wrapper.get('[data-test="empty-message"]').text()).toBe('本地存储不可用')
  })
})
