import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App.vue'
import PostComposer from '@/components/PostComposer.vue'
import { ApiError, createPost, deletePost, fetchPosts } from '@/api/posts'
import type { Post } from '@/types/post'
import { downloadJson } from '@/utils/download'

// 保留真实的 ApiError，只替换三个请求函数，便于用同一个类构造错误
vi.mock('@/api/posts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/posts')>()
  return {
    ...actual,
    fetchPosts: vi.fn(),
    createPost: vi.fn(),
    deletePost: vi.fn(),
  }
})

vi.mock('@/utils/download', () => ({ downloadJson: vi.fn() }))

const fetchPostsMock = vi.mocked(fetchPosts)
const createPostMock = vi.mocked(createPost)
const deletePostMock = vi.mocked(deletePost)

const feed: Post[] = [
  {
    id: '1794537613095c8f2',
    text: "k'm'k'l",
    time: '2026-11-13 10:40:13',
    ts: 1794537613095,
  },
  {
    id: '1794536394087e30e',
    text: '你今天心情如何',
    time: '2026-11-13 10:19:54',
    ts: 1794536394087,
  },
]

const created: Post = {
  id: '1794538000000abcd',
  text: '全新的动态',
  time: '2026-11-13 12:00:00',
  ts: 1794538000000,
}

function freshFeed(): Post[] {
  return feed.map((post) => ({ ...post }))
}

async function mountApp() {
  const wrapper = mount(App, { global: { plugins: [createPinia()] } })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  fetchPostsMock.mockResolvedValue(freshFeed())
  createPostMock.mockResolvedValue({ ...created })
  deletePostMock.mockResolvedValue(undefined)
})

describe('App 首屏', () => {
  it('挂载后从后端拉取动态并渲染', async () => {
    const wrapper = await mountApp()

    expect(fetchPostsMock).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('心情日志')
    expect(wrapper.findAll('[data-test="post-body"]')).toHaveLength(feed.length)
    expect(wrapper.text()).toContain(feed[0].text)
  })

  it('顶栏副标题描述后端存储而不是本地存储', async () => {
    const wrapper = await mountApp()
    const subtitle = wrapper.get('header p').text()

    expect(subtitle).toBe('极简心情记录 · 数据存于后端 · 实时同步')
    expect(subtitle).not.toContain('无需联网')
  })

  it('网络层失败时横幅展示真实原因并附带后端未启动的运维提示', async () => {
    fetchPostsMock.mockRejectedValue(new ApiError('无法连接后端服务', 0))
    const wrapper = await mountApp()

    const banner = wrapper.get('[data-test="storage-error"]')
    expect(banner.text()).toContain('无法连接后端服务，请确认后端已启动（npm run dev:api）')
    expect(wrapper.find('[data-test="retry"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-test="post-body"]')).toHaveLength(0)
  })

  it('服务端错误时横幅展示后端返回的真实 message，不出现连接失败提示', async () => {
    fetchPostsMock.mockRejectedValue(new ApiError('服务异常，请稍后重试', 500))
    const wrapper = await mountApp()

    const banner = wrapper.get('[data-test="storage-error"]')
    expect(banner.text()).toContain('服务异常，请稍后重试')
    expect(banner.text()).not.toContain('请确认后端已启动')
  })

  it('点击 retry 重新拉取数据', async () => {
    fetchPostsMock.mockRejectedValueOnce(new ApiError('无法连接后端服务', 0))
    const wrapper = await mountApp()

    await wrapper.get('[data-test="retry"]').trigger('click')
    await flushPromises()

    expect(fetchPostsMock).toHaveBeenCalledTimes(2)
    expect(wrapper.find('[data-test="storage-error"]').exists()).toBe(false)
    expect(wrapper.findAll('[data-test="post-body"]')).toHaveLength(feed.length)
  })

  it('页面挂载装饰层且对读屏隐藏', async () => {
    const wrapper = await mountApp()

    const decor = wrapper.find('[data-test="ambient-decor"]')
    expect(decor.exists()).toBe(true)
    expect(decor.attributes('aria-hidden')).toBe('true')
  })

  it('页脚说明数据来自后端服务', async () => {
    const wrapper = await mountApp()

    expect(wrapper.get('footer').text()).toContain('后端服务')
  })
})

describe('App 发布', () => {
  it('发布成功后清空输入并把新动态置顶', async () => {
    const wrapper = await mountApp()

    await wrapper.get('[data-test="composer-input"]').setValue('  全新的动态  ')
    await wrapper.get('[data-test="composer-submit"]').trigger('click')
    await flushPromises()

    expect(createPostMock).toHaveBeenCalledWith('全新的动态')
    const bodies = wrapper.findAll('[data-test="post-body"]')
    expect(bodies).toHaveLength(feed.length + 1)
    expect(bodies[0].text()).toBe('全新的动态')
    expect((wrapper.get('[data-test="composer-input"]').element as HTMLTextAreaElement).value).toBe(
      '',
    )
    expect(wrapper.get('[data-test="composer-count"]').text()).toBe('0 / 500')
  })

  it('发布请求进行中时发布按钮禁用', async () => {
    let resolveCreate!: (post: Post) => void
    createPostMock.mockReturnValue(
      new Promise<Post>((resolve) => {
        resolveCreate = resolve
      }),
    )
    const wrapper = await mountApp()

    await wrapper.get('[data-test="composer-input"]').setValue('正在提交')
    await wrapper.get('[data-test="composer-submit"]').trigger('click')

    expect(wrapper.get('[data-test="composer-submit"]').attributes('disabled')).toBeDefined()

    resolveCreate({ ...created })
    await flushPromises()

    expect(wrapper.findComponent(PostComposer).props('submitting')).toBe(false)
    await wrapper.get('[data-test="composer-input"]').setValue('再来一条')
    expect(wrapper.get('[data-test="composer-submit"]').attributes('disabled')).toBeUndefined()
  })

  it('发布失败时保留草稿并显示错误横幅', async () => {
    createPostMock.mockRejectedValue(new Error('无法连接后端服务'))
    const wrapper = await mountApp()

    await wrapper.get('[data-test="composer-input"]').setValue('发不出去的内容')
    await wrapper.get('[data-test="composer-submit"]').trigger('click')
    await flushPromises()

    expect(wrapper.findAll('[data-test="post-body"]')).toHaveLength(feed.length)
    expect((wrapper.get('[data-test="composer-input"]').element as HTMLTextAreaElement).value).toBe(
      '发不出去的内容',
    )
    expect(wrapper.find('[data-test="storage-error"]').exists()).toBe(true)
  })
})

describe('App 删除', () => {
  it('删除时调用后端 DELETE 并从列表移除', async () => {
    const wrapper = await mountApp()

    await wrapper.findAll('[data-test="post-delete"]')[0].trigger('click')
    await flushPromises()

    expect(deletePostMock).toHaveBeenCalledWith(feed[0].id)
    expect(wrapper.findAll('[data-test="post-body"]')).toHaveLength(feed.length - 1)
    expect(wrapper.text()).not.toContain(feed[0].text)
  })

  it('删除失败（404）时横幅展示真实原因而不是连接失败提示，列表保留', async () => {
    deletePostMock.mockRejectedValue(new ApiError('这条动态已不存在', 404, 'NOT_FOUND'))
    const wrapper = await mountApp()

    await wrapper.findAll('[data-test="post-delete"]')[0].trigger('click')
    await flushPromises()

    const banner = wrapper.get('[data-test="storage-error"]')
    expect(banner.text()).toContain('这条动态已不存在')
    expect(banner.text()).not.toContain('无法连接后端服务')
    expect(banner.text()).not.toContain('请确认后端已启动')
    expect(wrapper.findAll('[data-test="post-body"]')).toHaveLength(feed.length)
  })

  it('全部删除后展示空状态', async () => {
    const wrapper = await mountApp()

    for (let i = 0; i < feed.length; i += 1) {
      await wrapper.findAll('[data-test="post-delete"]')[0].trigger('click')
      await flushPromises()
    }

    expect(wrapper.find('[data-test="empty-state"]').exists()).toBe(true)
  })
})

describe('App 导出备份', () => {
  it('点击导出备份触发 JSON 下载，文件名带当天日期', async () => {
    vi.setSystemTime(new Date('2026-11-13T04:00:00Z'))
    const wrapper = await mountApp()

    await wrapper.get('[data-test="export"]').trigger('click')

    expect(downloadJson).toHaveBeenCalledTimes(1)
    expect(downloadJson).toHaveBeenCalledWith('posts-2026-11-13.json', freshFeed())
  })
})
