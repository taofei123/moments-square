// @vitest-environment node
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { loadSeed } from '../../server/seed'

const tempDir = mkdtempSync(join(tmpdir(), 'moments-seed-'))

afterAll(() => {
  rmSync(tempDir, { recursive: true, force: true })
})

let counter = 0
/** 在临时目录写一个种子文件，返回其绝对路径 */
function writeTemp(name: string, content: string): string {
  counter += 1
  const filePath = join(tempDir, `${counter}-${name}`)
  writeFileSync(filePath, content, 'utf8')
  return filePath
}

describe('server/seed', () => {
  it('默认路径能载入仓库根 posts.json 的全部条目', async () => {
    const expected = JSON.parse(
      readFileSync(new URL('../../../posts.json', import.meta.url), 'utf8'),
    ) as Array<{ id: string; text: string; time: string; ts: number }>

    const posts = await loadSeed()

    expect(expected.length).toBeGreaterThan(0)
    expect(posts).toHaveLength(expected.length)
    expect(posts).toEqual(expected)
  })

  it('文件缺失时降级为空数组', async () => {
    const missing = join(tempDir, 'does-not-exist.json')
    await expect(loadSeed(missing)).resolves.toEqual([])
  })

  it('JSON 非法时降级为空数组', async () => {
    const filePath = writeTemp('broken.json', '{ not json ]')
    await expect(loadSeed(filePath)).resolves.toEqual([])
  })

  it('内容不是数组时降级为空数组', async () => {
    const filePath = writeTemp('object.json', JSON.stringify({ posts: [] }))
    await expect(loadSeed(filePath)).resolves.toEqual([])
  })

  it('条目字段不合法时整体降级为空数组', async () => {
    const filePath = writeTemp(
      'invalid-item.json',
      JSON.stringify([
        { id: 'a', text: 'ok', time: '2026-11-13 00:00:00', ts: 1 },
        { id: 'b', text: '缺少 ts', time: '2026-11-13 00:00:00' },
      ]),
    )
    await expect(loadSeed(filePath)).resolves.toEqual([])
  })

  it('支持传入 URL 形式的种子路径', async () => {
    const filePath = writeTemp(
      'valid.json',
      JSON.stringify([{ id: 'a', text: 'ok', time: '2026-11-13 00:00:00', ts: 1 }]),
    )
    await expect(loadSeed(pathToFileURL(filePath))).resolves.toEqual([
      { id: 'a', text: 'ok', time: '2026-11-13 00:00:00', ts: 1 },
    ])
  })
})
