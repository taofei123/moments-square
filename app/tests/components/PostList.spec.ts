import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PostItem from '@/components/PostItem.vue'
import PostList from '@/components/PostList.vue'
import type { Post } from '@/types/post'

const posts: Post[] = [
  { id: 'a1', text: '第一条', time: '2026-11-13 10:40:13', ts: 1794537613095 },
  { id: 'b2', text: '第二条', time: '2026-11-13 10:19:54', ts: 1794536394087 },
]

describe('PostList', () => {
  it('列表为空时展示空状态', () => {
    const wrapper = mount(PostList, { props: { posts: [] } })

    expect(wrapper.find('[data-test="empty-state"]').exists()).toBe(true)
    expect(wrapper.findAllComponents(PostItem)).toHaveLength(0)
  })

  it('按传入顺序渲染每条动态', () => {
    const wrapper = mount(PostList, { props: { posts } })

    const items = wrapper.findAllComponents(PostItem)
    expect(items).toHaveLength(2)
    expect(items[0].props('post')).toEqual(posts[0])
    expect(items[1].props('post')).toEqual(posts[1])
    expect(wrapper.find('[data-test="empty-state"]').exists()).toBe(false)
  })

  it('把子项的删除事件透传给父级', () => {
    const wrapper = mount(PostList, { props: { posts } })

    wrapper.findAllComponents(PostItem)[1].vm.$emit('delete', posts[1].id)

    expect(wrapper.emitted('delete')).toEqual([[posts[1].id]])
  })
})
