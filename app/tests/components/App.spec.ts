import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'
import App from '@/App.vue'
import { SEED_POSTS } from '@/data/seedPosts'
import { loadPosts } from '@/storage/postStorage'
import { downloadJson } from '@/utils/download'

vi.mock('@/utils/download', () => ({ downloadJson: vi.fn() }))

function mountApp() {
  return mount(App, { global: { plugins: [createPinia()] } })
}

describe('App 首屏', () => {
  it('展示品牌栏与首次进入的种子动态', () => {
    const wrapper = mountApp()

    expect(wrapper.text()).toContain('心情日志')
    expect(wrapper.findAll('[data-test="post-body"]')).toHaveLength(SEED_POSTS.length)
    expect(wrapper.text()).toContain(SEED_POSTS[0].text)
  })

  it('页面挂载装饰层且对读屏隐藏', () => {
    const wrapper = mountApp()

    const decor = wrapper.find('[data-test="ambient-decor"]')
    expect(decor.exists()).toBe(true)
    expect(decor.attributes('aria-hidden')).toBe('true')
  })

  it('页脚说明数据保存在 Local Storage', () => {
    const wrapper = mountApp()

    expect(wrapper.get('footer').text()).toContain('Local Storage')
  })
})

describe('App 发布与删除', () => {
  it('发布后新动态出现在列表最前面并落盘', async () => {
    const wrapper = mountApp()

    await wrapper.get('[data-test="composer-input"]').setValue('全新的动态')
    await wrapper.get('[data-test="composer-submit"]').trigger('click')

    const bodies = wrapper.findAll('[data-test="post-body"]')
    expect(bodies).toHaveLength(SEED_POSTS.length + 1)
    expect(bodies[0].text()).toBe('全新的动态')
    expect(loadPosts()[0].text).toBe('全新的动态')
  })

  it('删除后列表减少并落盘', async () => {
    const wrapper = mountApp()

    await wrapper.findAll('[data-test="post-delete"]')[0].trigger('click')

    expect(wrapper.findAll('[data-test="post-body"]')).toHaveLength(SEED_POSTS.length - 1)
    expect(loadPosts()).toHaveLength(SEED_POSTS.length - 1)
  })

  it('全部删除后展示空状态', async () => {
    const wrapper = mountApp()

    for (let i = 0; i < SEED_POSTS.length; i += 1) {
      await wrapper.findAll('[data-test="post-delete"]')[0].trigger('click')
    }

    expect(wrapper.find('[data-test="empty-state"]').exists()).toBe(true)
    expect(loadPosts()).toEqual([])
  })

  it('重新打开页面能读回已保存的数据', async () => {
    const first = mountApp()
    await first.get('[data-test="composer-input"]').setValue('跨会话内容')
    await first.get('[data-test="composer-submit"]').trigger('click')
    first.unmount()

    const second = mountApp()

    expect(second.findAll('[data-test="post-body"]')[0].text()).toBe('跨会话内容')
  })
})

describe('App 导出备份', () => {
  it('点击导出备份触发 JSON 下载，文件名带当天日期', async () => {
    vi.setSystemTime(new Date('2026-11-13T04:00:00Z'))
    const wrapper = mountApp()

    await wrapper.get('[data-test="export"]').trigger('click')

    expect(downloadJson).toHaveBeenCalledTimes(1)
    expect(downloadJson).toHaveBeenCalledWith('posts-2026-11-13.json', [
      ...SEED_POSTS.map((post) => ({ ...post })),
    ])
  })
})

describe('App 存储异常', () => {
  it('写入失败时给出降级提示，但内容仍在当前会话中可见', async () => {
    const wrapper = mountApp()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError')
    })

    await wrapper.get('[data-test="composer-input"]').setValue('写不进存储的内容')
    await wrapper.get('[data-test="composer-submit"]').trigger('click')

    expect(wrapper.find('[data-test="storage-error"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-test="post-body"]')[0].text()).toBe('写不进存储的内容')
  })
})
