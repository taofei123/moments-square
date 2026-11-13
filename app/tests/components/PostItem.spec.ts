import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import PostItem from '@/components/PostItem.vue'
import type { Post } from '@/types/post'
import { AVATAR_GRADIENTS } from '@/utils/avatar'

const NOW = new Date(2026, 10, 13, 12, 0, 0).getTime()

const basePost: Post = {
  id: '1794537613095c8f2',
  text: '你今天心情如何',
  time: '2026-11-13 10:40:13',
  ts: NOW - 2 * 60 * 60 * 1000,
}

function mountItem(post: Post = basePost) {
  return mount(PostItem, { props: { post } })
}

describe('PostItem 内容渲染', () => {
  it('展示昵称、正文与渐变头像首字', () => {
    const wrapper = mountItem()

    expect(wrapper.get('[data-test="post-name"]').text()).toBe('动态用户')
    expect(wrapper.get('[data-test="post-body"]').text()).toBe('你今天心情如何')

    const avatar = wrapper.get('[data-test="post-avatar"]')
    expect(avatar.text()).toBe('你')
    expect(avatar.attributes('style')).toContain('linear-gradient')
    expect(AVATAR_GRADIENTS.join(' ')).toContain(
      avatar.attributes('style')?.match(/linear-gradient\([^)]*\)[^;]*/g)?.join('') ?? '',
    )
  })

  it('按当前时间显示相对时间', () => {
    vi.setSystemTime(NOW)

    expect(mountItem().get('[data-test="post-time"]').text()).toBe('2 小时前')
  })

  it('缺少 ts 时回退到原始时间文本', () => {
    const wrapper = mountItem({ ...basePost, ts: undefined as unknown as number })

    expect(wrapper.get('[data-test="post-time"]').text()).toBe('2026-11-13 10:40:13')
  })

  it('正文保留换行并按纯文本渲染', () => {
    const wrapper = mountItem({ ...basePost, text: '第一行\n第二行' })

    expect(wrapper.get('[data-test="post-body"]').text()).toBe('第一行\n第二行')
  })

  it('正文中的 HTML 不会被执行', () => {
    const wrapper = mountItem({ ...basePost, text: '<img src=x onerror="alert(1)">' })

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.get('[data-test="post-body"]').text()).toBe(
      '<img src=x onerror="alert(1)">',
    )
  })
})

describe('PostItem 删除', () => {
  it('点击删除抛出当前动态 id', async () => {
    const wrapper = mountItem()

    await wrapper.get('[data-test="post-delete"]').trigger('click')

    expect(wrapper.emitted('delete')).toEqual([[basePost.id]])
  })

  it('删除按钮文案与原页面一致', () => {
    expect(mountItem().get('[data-test="post-delete"]').text()).toBe('删除')
  })
})
