import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import PostComposer from '@/components/PostComposer.vue'

function mountComposer() {
  const wrapper = mount(PostComposer)
  return {
    wrapper,
    input: () => wrapper.get('[data-test="composer-input"]'),
    counter: () => wrapper.get('[data-test="composer-count"]'),
    submit: () => wrapper.get('[data-test="composer-submit"]'),
  }
}

describe('PostComposer 初始状态', () => {
  it('计数为 0 / 500，发布按钮禁用', () => {
    const { counter, submit } = mountComposer()

    expect(counter().text()).toBe('0 / 500')
    expect(submit().attributes('disabled')).toBeDefined()
  })

  it('输入框限制最多 500 字', () => {
    const { input } = mountComposer()

    expect(input().attributes('maxlength')).toBe('500')
    expect(input().attributes('placeholder')).toBe('此刻想说点什么？')
  })
})

describe('PostComposer 字数统计', () => {
  it('随输入实时更新计数', async () => {
    const { input, counter, submit } = mountComposer()

    await input().setValue('你好')

    expect(counter().text()).toBe('2 / 500')
    expect(submit().attributes('disabled')).toBeUndefined()
  })

  it('达到 450 字时切换为 near 提示', async () => {
    const { input, counter } = mountComposer()

    await input().setValue('字'.repeat(450))
    expect(counter().classes()).toContain('near')
    expect(counter().classes()).not.toContain('over')

    await input().setValue('字'.repeat(449))
    expect(counter().classes()).not.toContain('near')
  })

  it('超过 500 字时切换为 over 提示并禁止发布', async () => {
    const { input, counter, submit } = mountComposer()

    await input().setValue('字'.repeat(501))

    expect(counter().text()).toBe('501 / 500')
    expect(counter().classes()).toContain('over')
    expect(submit().attributes('disabled')).toBeDefined()
  })
})

describe('PostComposer 数字跳动', () => {
  it('输入时计数轻弹一下，320ms 后复位', async () => {
    vi.useFakeTimers()
    const { input, counter } = mountComposer()

    await input().setValue('嗨')
    expect(counter().classes()).toContain('bump')

    vi.advanceTimersByTime(320)
    await nextTick()
    expect(counter().classes()).not.toContain('bump')
  })

  it('初始挂载不弹跳', () => {
    const { counter } = mountComposer()

    expect(counter().classes()).not.toContain('bump')
  })
})

describe('PostComposer 发布', () => {
  it('点击发布抛出 submit 事件并清空输入', async () => {
    const { wrapper, input, counter, submit } = mountComposer()
    await input().setValue('  今天心情不错  ')

    await submit().trigger('click')

    expect(wrapper.emitted('submit')).toEqual([['  今天心情不错  ']])
    expect((input().element as HTMLTextAreaElement).value).toBe('')
    expect(counter().text()).toBe('0 / 500')
  })

  it('纯空白内容不会触发发布', async () => {
    const { wrapper, input, submit } = mountComposer()
    await input().setValue('    ')

    await submit().trigger('click')

    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('Ctrl + Enter 快捷发布', async () => {
    const { wrapper, input } = mountComposer()
    await input().setValue('快捷键发布')

    await input().trigger('keydown', { key: 'Enter', ctrlKey: true })

    expect(wrapper.emitted('submit')).toEqual([['快捷键发布']])
  })

  it('⌘ + Enter 也能发布', async () => {
    const { wrapper, input } = mountComposer()
    await input().setValue('mac 快捷键')

    await input().trigger('keydown', { key: 'Enter', metaKey: true })

    expect(wrapper.emitted('submit')).toHaveLength(1)
  })

  it('单独按 Enter 不发布，保留草稿以便换行', async () => {
    const { wrapper, input } = mountComposer()
    await input().setValue('第一行')

    await input().trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('submit')).toBeUndefined()
    expect((input().element as HTMLTextAreaElement).value).toBe('第一行')
  })
})
